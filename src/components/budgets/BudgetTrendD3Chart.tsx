import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Play, RotateCcw, TrendingUp, Sparkles, Filter, Calendar, BarChart2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DataPoint {
  period: string;
  monthIndex: number;
  allocated: number;
  expenditure: number;
  projected: number;
  burnRate: number;
}

export const BudgetTrendD3Chart: React.FC = () => {
  const { departments } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [metricMode, setMetricMode] = useState<'CUMULATIVE' | 'MONTHLY'>('CUMULATIVE');
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [animKey, setAnimKey] = useState<number>(0);

  // Generate monthly progression data for fiscal year 2025-26
  const chartData = useMemo<DataPoint[]>(() => {
    const months = [
      'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'
    ];

    let totalAlloc = departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
    let totalUtil = departments.reduce((acc, d) => acc + d.utilizedBudget, 0);

    if (selectedDept !== 'ALL') {
      const dept = departments.find(d => d.id === selectedDept);
      if (dept) {
        totalAlloc = dept.allocatedBudget;
        totalUtil = dept.utilizedBudget;
      }
    }

    // Monthly expenditure weights (March rush curve)
    const monthlyWeights = [
      0.05, 0.06, 0.07, 0.08, 0.075, 0.09, 0.085, 0.095, 0.11, 0.11, 0.12, 0.15
    ];

    let cumulativeExp = 0;
    let cumulativeAlloc = 0;
    const monthlyTarget = totalAlloc / 12;

    return months.map((month, idx) => {
      const monthExp = Number((totalUtil * monthlyWeights[idx]).toFixed(1));
      cumulativeExp = Number((cumulativeExp + monthExp).toFixed(1));
      cumulativeAlloc = Number(((idx + 1) * monthlyTarget).toFixed(1));

      // Projection for Q4 months
      const isProjectedMonth = idx >= 10;
      const projected = isProjectedMonth
        ? Number((cumulativeExp * (1 + (idx - 9) * 0.06)).toFixed(1))
        : cumulativeExp;

      return {
        period: month,
        monthIndex: idx,
        allocated: metricMode === 'CUMULATIVE' ? cumulativeAlloc : monthlyTarget,
        expenditure: metricMode === 'CUMULATIVE' ? cumulativeExp : monthExp,
        projected: metricMode === 'CUMULATIVE' ? projected : monthExp * 1.08,
        burnRate: Number((monthExp / 30).toFixed(2)),
      };
    });
  }, [departments, selectedDept, metricMode]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = container.clientWidth;
    const height = 360;
    const margin = { top: 30, right: 40, bottom: 45, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define Gradients & Dropshadows
    const defs = svg.append('defs');

    // Area Fill Gradient for Actual Outlay
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'budget-trend-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.45);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#6366f1')
      .attr('stop-opacity', 0.0);

    // X and Y Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(chartData.map(d => d.period))
      .range([0, innerWidth])
      .padding(0.2);

    const maxVal = Math.max(
      ...chartData.map(d => Math.max(d.allocated, d.expenditure, d.projected))
    );
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([innerHeight, 0])
      .nice();

    // Subtle Horizontal Gridlines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => '')
      .ticks(5);

    g.append('g')
      .attr('class', 'grid-lines opacity-15')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#71717a')
      .attr('stroke-dasharray', '3,3');

    // Area Generator
    const areaGen = d3
      .area<DataPoint>()
      .x(d => xScale(d.period) ?? 0)
      .y0(innerHeight)
      .y1(d => yScale(d.expenditure))
      .curve(d3.curveMonotoneX);

    // Line Generator for Expenditure
    const lineExpGen = d3
      .line<DataPoint>()
      .x(d => xScale(d.period) ?? 0)
      .y(d => yScale(d.expenditure))
      .curve(d3.curveMonotoneX);

    // Line Generator for Target Ceiling
    const lineAllocGen = d3
      .line<DataPoint>()
      .x(d => xScale(d.period) ?? 0)
      .y(d => yScale(d.allocated))
      .curve(d3.curveMonotoneX);

    // Add Area Path with Fade Entrance Animation
    const areaPath = g
      .append('path')
      .datum(chartData)
      .attr('class', 'trend-area')
      .attr('fill', 'url(#budget-trend-area-grad)')
      .attr('d', areaGen)
      .attr('opacity', 0);

    areaPath
      .transition()
      .duration(1200)
      .delay(400)
      .attr('opacity', 1);

    // Add Allocated Target Line (Dashed) with Entrance Draw
    const allocPath = g
      .append('path')
      .datum(chartData)
      .attr('class', 'alloc-target-line')
      .attr('fill', 'none')
      .attr('stroke', '#a1a1aa')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.7)
      .attr('d', lineAllocGen);

    const allocTotalLength = (allocPath.node() as SVGPathElement)?.getTotalLength() || 1000;
    allocPath
      .attr('stroke-dasharray', `${allocTotalLength} ${allocTotalLength}`)
      .attr('stroke-dashoffset', allocTotalLength)
      .transition()
      .duration(1400)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0)
      .on('end', function () {
        d3.select(this).attr('stroke-dasharray', '5,5');
      });

    // Add Actual Expenditure Line with Entrance Draw Animation
    const expPath = g
      .append('path')
      .datum(chartData)
      .attr('class', 'actual-exp-line')
      .attr('fill', 'none')
      .attr('stroke', '#818cf8')
      .attr('stroke-width', 3.5)
      .attr('stroke-linecap', 'round')
      .attr('d', lineExpGen);

    const expTotalLength = (expPath.node() as SVGPathElement)?.getTotalLength() || 1000;
    expPath
      .attr('stroke-dasharray', `${expTotalLength} ${expTotalLength}`)
      .attr('stroke-dashoffset', expTotalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Entrance Dots Animation
    const dotsGroup = g.append('g').attr('class', 'data-dots');

    const dots = dotsGroup
      .selectAll<SVGCircleElement, DataPoint>('.data-dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'data-dot')
      .attr('cx', (d: DataPoint) => xScale(d.period) ?? 0)
      .attr('cy', (d: DataPoint) => yScale(d.expenditure))
      .attr('r', 0)
      .attr('fill', '#4f46e5')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    dots
      .transition()
      .duration(600)
      .delay((_, i) => 600 + i * 80)
      .ease(d3.easeBackOut.overshoot(2.5))
      .attr('r', 5);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickSize(0);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d => `₹${d} Cr`);

    const xAxisGroup = g
      .append('g')
      .attr('class', 'x-axis text-zinc-400 text-xs font-mono')
      .attr('transform', `translate(0,${innerHeight + 12})`)
      .call(xAxis);

    xAxisGroup.select('.domain').remove();

    const yAxisGroup = g
      .append('g')
      .attr('class', 'y-axis text-zinc-400 text-xs font-mono')
      .call(yAxis);

    yAxisGroup.select('.domain').remove();

    // Interactive Hover Vertical Guideline
    const guideline = g
      .append('line')
      .attr('class', 'hover-guideline')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#a5b4fc')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0);

    // Active Hover Ripple Ring
    const activeRing = g
      .append('circle')
      .attr('class', 'hover-ring')
      .attr('r', 10)
      .attr('fill', 'none')
      .attr('stroke', '#818cf8')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Active Hover Glow Center Dot
    const activeDot = g
      .append('circle')
      .attr('class', 'hover-active-dot')
      .attr('r', 7)
      .attr('fill', '#ffffff')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 3.5)
      .attr('opacity', 0);

    // Overlay for Mouse Interactions
    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay.on('mousemove', function (event) {
      const [mouseX] = d3.pointer(event);

      // Find nearest point
      let nearestPoint = chartData[0];
      let minDistance = Infinity;

      chartData.forEach(d => {
        const xPos = xScale(d.period) ?? 0;
        const dist = Math.abs(xPos - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          nearestPoint = d;
        }
      });

      const targetX = xScale(nearestPoint.period) ?? 0;
      const targetY = yScale(nearestPoint.expenditure);

      // Smooth Guideline Transition
      guideline
        .attr('x1', targetX)
        .attr('x2', targetX)
        .attr('opacity', 0.85);

      // Active Target Highlights
      activeDot
        .attr('cx', targetX)
        .attr('cy', targetY)
        .attr('opacity', 1);

      activeRing
        .attr('cx', targetX)
        .attr('cy', targetY)
        .attr('opacity', 0.9)
        .transition()
        .duration(600)
        .ease(d3.easeCircleOut)
        .attr('r', 14)
        .attr('opacity', 0);

      // Enlarge active point and dim others
      dots.transition().duration(150).attr('r', d => (d === nearestPoint ? 8 : 4));

      // Calculate Tooltip position relative to container
      const rect = container.getBoundingClientRect();
      setTooltipPos({
        x: targetX + margin.left,
        y: targetY + margin.top,
      });
      setHoveredPoint(nearestPoint);
    });

    overlay.on('mouseleave', function () {
      guideline.attr('opacity', 0);
      activeDot.attr('opacity', 0);
      activeRing.attr('opacity', 0);
      dots.transition().duration(250).attr('r', 5);
      setHoveredPoint(null);
      setTooltipPos(null);
    });
  }, [chartData, animKey]);

  return (
    <div
      ref={containerRef}
      className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4 relative"
    >
      {/* Header & Interactive Story Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
              D3 Animated Expenditure Trajectory
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Storytelling View
            </span>
          </div>
          <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
            Macro Budget Absorption & Run-Rate Velocity
          </h3>
          <p className="text-xs text-zinc-400">
            Interactive D3 animated timeline comparing actual outlay against sanctioned ceilings and burn rate thresholds.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => {
              setSelectedDept(e.target.value);
              setAnimKey(prev => prev + 1);
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Union Ministries</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Metric Mode Switcher */}
          <div className="p-1 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center text-xs">
            <button
              onClick={() => {
                setMetricMode('CUMULATIVE');
                setAnimKey(prev => prev + 1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                metricMode === 'CUMULATIVE'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cumulative Outlay
            </button>
            <button
              onClick={() => {
                setMetricMode('MONTHLY');
                setAnimKey(prev => prev + 1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                metricMode === 'MONTHLY'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly Burn
            </button>
          </div>

          {/* Replay Story Animation Button */}
          <button
            onClick={() => setAnimKey(prev => prev + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
            title="Re-trigger D3 entrance and path draw animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Story</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-zinc-400 flex-wrap pt-1">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 rounded-full bg-indigo-500" />
          <span className="font-medium text-zinc-300">Actual Expenditure Outlay</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-0.5 border-b-2 border-dashed border-zinc-400" />
          <span>Sanctioned Target Ceiling</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400/40" />
          <span>Absorption Area</span>
        </div>
        <span className="text-[11px] text-zinc-500 ml-auto">
          Hover over data points for micro-analysis
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full select-none" />

        {/* Floating Rich Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-zinc-950 border border-indigo-500/40 shadow-2xl text-xs space-y-2 text-left w-64 backdrop-blur-md"
            style={{
              left: Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 600) - 270),
              top: Math.max(10, tooltipPos.y - 70),
            }}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span className="font-bold text-white text-sm">
                {hoveredPoint.period} 2025-26
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {metricMode === 'CUMULATIVE' ? 'Cumulative' : 'Monthly'}
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Actual Outlay:</span>
                <span className="font-extrabold text-indigo-400 font-mono text-xs">
                  ₹{hoveredPoint.expenditure.toLocaleString('en-IN')} Cr
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Sanctioned Ceiling:</span>
                <span className="font-mono text-zinc-300">
                  ₹{hoveredPoint.allocated.toLocaleString('en-IN')} Cr
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Absorption Trajectory:</span>
                <span
                  className={`font-mono font-bold ${
                    hoveredPoint.expenditure > hoveredPoint.allocated
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {((hoveredPoint.expenditure / Math.max(1, hoveredPoint.allocated)) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-500">Daily Burn Velocity:</span>
                <span className="font-mono text-zinc-300">
                  ₹{hoveredPoint.burnRate} Cr/day
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
