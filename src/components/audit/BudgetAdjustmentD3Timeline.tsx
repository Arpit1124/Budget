import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Calendar,
  AlertTriangle,
  Flame,
  Clock,
  Filter,
  Layers,
  ChevronRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import { BudgetAdjustment } from '../../types';

interface BudgetAdjustmentD3TimelineProps {
  adjustments: BudgetAdjustment[];
  onSelectAdjustment?: (adjustment: BudgetAdjustment) => void;
  onFilterDateRange?: (startDate: string | null, endDate: string | null) => void;
}

interface TimelineItem {
  id: string;
  date: Date;
  dateStr: string;
  referenceNumber: string;
  title: string;
  amount: number;
  status: string;
  type: string;
  sourceDepartment: string;
  targetDepartment: string;
}

interface DayCluster {
  dateStr: string;
  date: Date;
  count: number;
  totalAmount: number;
  items: TimelineItem[];
  isCluster: boolean;
}

export const BudgetAdjustmentD3Timeline: React.FC<BudgetAdjustmentD3TimelineProps> = ({
  adjustments,
  onSelectAdjustment,
  onFilterDateRange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCluster, setSelectedCluster] = useState<DayCluster | null>(null);
  const [metricMode, setMetricMode] = useState<'COUNT' | 'AMOUNT'>('COUNT');
  const [hoveredItem, setHoveredItem] = useState<{
    item: TimelineItem | DayCluster;
    x: number;
    y: number;
  } | null>(null);

  // Normalize data with reliable dates
  const timelineData = useMemo(() => {
    // Current base year
    const now = new Date();
    const currentYear = now.getFullYear();

    return adjustments.map((adj, index) => {
      // Parse initiatedDate or generate spaced dates if format varies
      let d = new Date(adj.initiatedDate);
      if (isNaN(d.getTime())) {
        // Fallback: spread across recent months for demo robustness
        const dayOffset = (index * 7) % 60;
        d = new Date(currentYear, now.getMonth() - 2, 1 + dayOffset);
      }
      const dateStr = d.toISOString().split('T')[0];

      return {
        id: adj.id,
        date: d,
        dateStr,
        referenceNumber: adj.referenceNumber,
        title: adj.title,
        amount: adj.amount,
        status: adj.status,
        type: adj.type,
        sourceDepartment: adj.sourceDepartment,
        targetDepartment: adj.targetDepartment,
      } as TimelineItem;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [adjustments]);

  // Aggregate by date to calculate clusters
  const aggregatedClusters = useMemo(() => {
    const map = new Map<string, DayCluster>();

    timelineData.forEach((item) => {
      const existing = map.get(item.dateStr);
      if (existing) {
        existing.count += 1;
        existing.totalAmount += item.amount;
        existing.items.push(item);
      } else {
        map.set(item.dateStr, {
          dateStr: item.dateStr,
          date: item.date,
          count: 1,
          totalAmount: item.amount,
          items: [item],
          isCluster: false,
        });
      }
    });

    const clusters = Array.from(map.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    // Compute average frequency
    const avgCount = clusters.reduce((acc, c) => acc + c.count, 0) / (clusters.length || 1);
    // Mark clusters: day with count >= 2 or amount >= 150 Cr
    clusters.forEach((c) => {
      if (c.count >= Math.max(2, avgCount * 1.5) || c.totalAmount >= 150) {
        c.isCluster = true;
      }
    });

    return clusters;
  }, [timelineData]);

  // D3 Render Effect using ResizeObserver for responsive drawing
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || timelineData.length === 0) return;

    const svgElement = svgRef.current;
    const container = containerRef.current;

    const renderChart = () => {
      const width = container.clientWidth || 800;
      const height = 220;
      const margin = { top: 25, right: 30, bottom: 45, left: 50 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = d3.select(svgElement);
      svg.selectAll('*').remove(); // Clear previous drawings

      svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      // Defs: Gradients & Shadows
      const defs = svg.append('defs');
      
      const clusterGradient = defs.append('linearGradient')
        .attr('id', 'cluster-bar-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      clusterGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.9);
      clusterGradient.append('stop').attr('offset', '100%').attr('stop-color', '#be123c').attr('stop-opacity', 0.5);

      const normalGradient = defs.append('linearGradient')
        .attr('id', 'normal-bar-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      normalGradient.append('stop').attr('offset', '0%').attr('stop-color', '#6366f1').attr('stop-opacity', 0.85);
      normalGradient.append('stop').attr('offset', '100%').attr('stop-color', '#4338ca').attr('stop-opacity', 0.4);

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

      // Time Scale (X-axis)
      const minDate: Date = d3.min(timelineData, (d: TimelineItem) => d.date) || new Date();
      const maxDate: Date = d3.max(timelineData, (d: TimelineItem) => d.date) || new Date();
      // Add padding to time domain
      const paddedMin = new Date(minDate.getTime() - 2 * 24 * 60 * 60 * 1000);
      const paddedMax = new Date(maxDate.getTime() + 2 * 24 * 60 * 60 * 1000);

      const xScale = d3.scaleTime().domain([paddedMin, paddedMax]).range([0, innerWidth]);

      // Y Scale based on Metric Mode (Count of adjustments or Amount in Cr)
      const maxVal: number =
        metricMode === 'COUNT'
          ? Math.max(3, d3.max(aggregatedClusters, (d: DayCluster) => d.count) ?? 3)
          : Math.max(100, d3.max(aggregatedClusters, (d: DayCluster) => d.totalAmount) ?? 100);

      const yScale = d3.scaleLinear().domain([0, maxVal * 1.15]).nice().range([innerHeight, 0]);

      // Gridlines
      const yAxisGrid = d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => '').ticks(4);
      g.append('g')
        .attr('class', 'grid-lines')
        .call(yAxisGrid)
        .selectAll('line')
        .attr('stroke', '#27272a')
        .attr('stroke-dasharray', '3 3')
        .attr('stroke-opacity', 0.6);
      g.select('.grid-lines .domain').remove();

      // High-Frequency Cluster Zones (Subtle background highlight)
      aggregatedClusters
        .filter((c) => c.isCluster)
        .forEach((cluster) => {
          const cx = xScale(cluster.date);
          const zoneWidth = Math.max(36, innerWidth / (aggregatedClusters.length || 1) * 1.3);

          g.append('rect')
            .attr('x', cx - zoneWidth / 2)
            .attr('y', 0)
            .attr('width', zoneWidth)
            .attr('height', innerHeight)
            .attr('fill', '#f43f5e')
            .attr('fill-opacity', 0.08)
            .attr('rx', 8)
            .attr('pointer-events', 'none');

          // Cluster Flag Marker at top
          g.append('text')
            .attr('x', cx)
            .attr('y', -6)
            .attr('text-anchor', 'middle')
            .attr('fill', '#fb7185')
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'monospace')
            .text('⚡ CLUSTER');
        });

      // Frequency Histogram Bars
      const barWidth = Math.max(14, Math.min(32, innerWidth / (aggregatedClusters.length * 1.6 || 1)));

      g.selectAll<SVGRectElement, DayCluster>('.freq-bar')
        .data(aggregatedClusters)
        .enter()
        .append('rect')
        .attr('class', 'freq-bar')
        .attr('x', (d: DayCluster) => xScale(d.date) - barWidth / 2)
        .attr('y', (d: DayCluster) => yScale(metricMode === 'COUNT' ? d.count : d.totalAmount))
        .attr('width', barWidth)
        .attr('height', (d: DayCluster) => innerHeight - yScale(metricMode === 'COUNT' ? d.count : d.totalAmount))
        .attr('fill', (d: DayCluster) => (d.isCluster ? 'url(#cluster-bar-gradient)' : 'url(#normal-bar-gradient)'))
        .attr('rx', 4)
        .attr('cursor', 'pointer')
        .attr('stroke', (d: DayCluster) => (d.isCluster ? '#f43f5e' : '#6366f1'))
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.4)
        .on('mouseenter', (event: MouseEvent, d: DayCluster) => {
          const rect = container.getBoundingClientRect();
          setHoveredItem({
            item: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        })
        .on('mouseleave', () => setHoveredItem(null))
        .on('click', (_event: MouseEvent, d: DayCluster) => {
          setSelectedCluster((prev) => (prev?.dateStr === d.dateStr ? null : d));
        });

      // Overlay Line for Frequency Smoothing
      const lineGen = d3
        .line<DayCluster>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(metricMode === 'COUNT' ? d.count : d.totalAmount))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(aggregatedClusters)
        .attr('fill', 'none')
        .attr('stroke', '#a5b4fc')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4 4')
        .attr('stroke-opacity', 0.5)
        .attr('d', lineGen)
        .attr('pointer-events', 'none');

      // Individual Adjustment Nodes (Circles along the line/bars)
      const maxAmount: number = d3.max(timelineData, (d: TimelineItem) => d.amount) ?? 100;
      const radiusScale = d3
        .scaleSqrt()
        .domain([0, maxAmount])
        .range([4, 9]);

      g.selectAll<SVGCircleElement, TimelineItem>('.adj-dot')
        .data(timelineData)
        .enter()
        .append('circle')
        .attr('class', 'adj-dot')
        .attr('cx', (d: TimelineItem) => xScale(d.date))
        .attr('cy', (d: TimelineItem) => {
          // Cluster position offset slightly if multiple
          const cluster = aggregatedClusters.find((c) => c.dateStr === d.dateStr);
          const barTop = yScale(metricMode === 'COUNT' ? cluster?.count || 1 : cluster?.totalAmount || d.amount);
          return barTop;
        })
        .attr('r', (d: TimelineItem) => radiusScale(d.amount))
        .attr('fill', (d: TimelineItem) => {
          if (d.status === 'Approved') return '#10b981';
          if (d.status === 'Rejected') return '#f43f5e';
          if (d.status === 'Pending Approval') return '#f59e0b';
          return '#6366f1';
        })
        .attr('stroke', '#09090b')
        .attr('stroke-width', 2)
        .attr('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent, d: TimelineItem) => {
          const rect = container.getBoundingClientRect();
          setHoveredItem({
            item: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        })
        .on('mouseleave', () => setHoveredItem(null))
        .on('click', (_event: MouseEvent, d: TimelineItem) => {
          const orig = adjustments.find((a) => a.id === d.id);
          if (orig && onSelectAdjustment) onSelectAdjustment(orig);
        });

      // X Axis
      const xAxis = d3
        .axisBottom(xScale)
        .ticks(Math.min(7, Math.floor(innerWidth / 90)))
        .tickFormat((d) => d3.timeFormat('%b %d')(d as Date));

      const xAxisG = g
        .append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis);

      xAxisG.select('.domain').attr('stroke', '#3f3f46');
      xAxisG
        .selectAll('text')
        .attr('fill', '#a1a1aa')
        .attr('font-size', '10px')
        .attr('font-family', 'inherit')
        .attr('dy', '12px');

      // Y Axis
      const yAxis = d3
        .axisLeft(yScale)
        .ticks(4)
        .tickFormat((d) => (metricMode === 'COUNT' ? `${d}` : `₹${d}Cr`));

      const yAxisG = g.append('g').call(yAxis);
      yAxisG.select('.domain').attr('stroke', '#3f3f46');
      yAxisG
        .selectAll('text')
        .attr('fill', '#a1a1aa')
        .attr('font-size', '10px')
        .attr('font-family', 'inherit');
    };

    renderChart();

    // ResizeObserver
    const observer = new ResizeObserver(() => {
      renderChart();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [timelineData, aggregatedClusters, metricMode, adjustments, onSelectAdjustment]);

  const clusterCount = aggregatedClusters.filter((c) => c.isCluster).length;
  const peakCluster = [...aggregatedClusters].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white tracking-tight">
                Budget Adjustment Temporal Frequency & Cluster Analysis
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                D3 Visualization Engine
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Visualizing the velocity and clustering of virement authorizations over time to detect March Rush anomalies and end-of-quarter surges.
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setMetricMode('COUNT')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                metricMode === 'COUNT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Frequency (Count)
            </button>
            <button
              onClick={() => setMetricMode('AMOUNT')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                metricMode === 'AMOUNT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Outlay Volume (₹ Cr)
            </button>
          </div>
        </div>
      </div>

      {/* Analytical Quick Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Total In-Scope Adjustments
          </div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            {adjustments.length}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Across all Demands</div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>High-Density Clusters</span>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">
            {clusterCount}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Sudden activity spikes</div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
            Peak Day Activity
          </div>
          <div className="text-lg font-extrabold text-indigo-400 mt-1 truncate font-mono">
            {peakCluster ? `${peakCluster.count} Entries (${peakCluster.dateStr})` : 'N/A'}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">
            ₹{peakCluster?.totalAmount.toFixed(1) || 0} Cr involved
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            Temporal Baseline
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            {(timelineData.length / (aggregatedClusters.length || 1)).toFixed(1)}/day
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Normal operational rate</div>
        </div>
      </div>

      {/* D3 Render Stage */}
      <div ref={containerRef} className="relative w-full my-2 bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Hover Tooltip Card */}
        {hoveredItem && (
          <div
            className="absolute z-30 pointer-events-none p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl text-xs text-white max-w-xs transition-all duration-75"
            style={{
              left: `${Math.min(hoveredItem.x + 15, (containerRef.current?.clientWidth || 400) - 220)}px`,
              top: `${Math.max(10, hoveredItem.y - 65)}px`,
            }}
          >
            {'items' in hoveredItem.item ? (
              // It's a Day Cluster
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1 mb-1">
                  <span className="font-bold text-indigo-300 font-mono">
                    {hoveredItem.item.dateStr}
                  </span>
                  {hoveredItem.item.isCluster && (
                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded text-[9px] font-bold">
                      CLUSTER SPIKE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-300">
                  <strong>{hoveredItem.item.count}</strong> adjustments totaling{' '}
                  <strong className="text-emerald-400">₹{hoveredItem.item.totalAmount} Cr</strong>.
                </p>
                <span className="text-[10px] text-zinc-500 block mt-1">Click bar to view transactions</span>
              </div>
            ) : (
              // It's an individual adjustment node
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-1 mb-1">
                  <span className="font-bold text-white font-mono">
                    {hoveredItem.item.referenceNumber}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      hoveredItem.item.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : hoveredItem.item.status === 'Rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {hoveredItem.item.status}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-300 truncate font-semibold">
                  {hoveredItem.item.title}
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  Amount: <strong className="text-white">₹{hoveredItem.item.amount} Cr</strong>
                </p>
                <p className="text-[10px] text-zinc-400">
                  {hoveredItem.item.sourceDepartment} → {hoveredItem.item.targetDepartment}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-zinc-800 text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
            <span>Normal Velocity</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-600 inline-block" />
            <span>High Activity Cluster (&gt; 1.5x avg)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Approved Virement</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Pending Vetting</span>
          </span>
        </div>

        <div className="text-[11px] text-zinc-500 flex items-center gap-1">
          <Info className="w-3 h-3 text-zinc-400" />
          <span>Auditors: Cluster spikes often indicate fiscal year-end March Rush or sudden program revisions.</span>
        </div>
      </div>

      {/* Selected Cluster Details Drawer / Modal */}
      {selectedCluster && (
        <div className="mt-4 p-4 rounded-2xl bg-zinc-950 border border-indigo-500/40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Cluster Focus: {selectedCluster.dateStr}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                {selectedCluster.count} Adjustments (₹{selectedCluster.totalAmount.toFixed(1)} Cr)
              </span>
            </div>
            <button
              onClick={() => setSelectedCluster(null)}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1"
            >
              ✕ Close Cluster
            </button>
          </div>

          <div className="divide-y divide-zinc-800/80 mt-2 max-h-48 overflow-y-auto">
            {selectedCluster.items.map((item) => (
              <div
                key={item.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-zinc-900/60 px-2 rounded-lg cursor-pointer transition-colors"
                onClick={() => {
                  const orig = adjustments.find((a) => a.id === item.id);
                  if (orig && onSelectAdjustment) onSelectAdjustment(orig);
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400">{item.referenceNumber}</span>
                    <span className="font-medium text-white">{item.title}</span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {item.sourceDepartment} → {item.targetDepartment}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-white font-mono">₹{item.amount} Cr</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.status === 'Rejected'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
