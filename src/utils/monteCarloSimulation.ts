import { Department, MonteCarloSimulationResult } from '../types';

interface SimulationOptions {
  iterations: number; // e.g. 1000, 2500, 5000, 10000
  volatilityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  marchRushMultiplier: number; // 1.0 (Strict), 1.35 (Normal), 1.65 (Aggressive)
  departmentScope: string; // 'ALL' or department ID
  departments: Department[];
  burnRateMultiplier?: number; // 0.85 to 1.15
}

// Pseudo-random Gaussian using Box-Muller transform
function generateGaussian(mean = 0, stdev = 1): number {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export function runMonteCarloBudgetSimulation(options: SimulationOptions): MonteCarloSimulationResult {
  const {
    iterations,
    volatilityLevel,
    marchRushMultiplier,
    departmentScope,
    departments,
    burnRateMultiplier = 1.0,
  } = options;

  // Filter department scope
  const targetDepartments =
    departmentScope === 'ALL'
      ? departments
      : departments.filter(d => d.id === departmentScope);

  const totalAllocated = targetDepartments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  const totalUtilized = targetDepartments.reduce((acc, d) => acc + d.utilizedBudget, 0);

  // Volatility scale factor based on level
  let baseVolatilityCoeff = 0.12;
  if (volatilityLevel === 'LOW') baseVolatilityCoeff = 0.08;
  if (volatilityLevel === 'MODERATE') baseVolatilityCoeff = 0.15;
  if (volatilityLevel === 'HIGH') baseVolatilityCoeff = 0.24;
  if (volatilityLevel === 'EXTREME') baseVolatilityCoeff = 0.35;

  // Months of Indian fiscal year (Apr to Mar)
  const MONTHS = [
    { name: 'Apr', quarter: 'Q1', weight: 0.065, vol: 0.09, actualFraction: 0.068 },
    { name: 'May', quarter: 'Q1', weight: 0.075, vol: 0.08, actualFraction: 0.076 },
    { name: 'Jun', quarter: 'Q1', weight: 0.085, vol: 0.10, actualFraction: 0.084 },
    { name: 'Jul', quarter: 'Q2', weight: 0.070, vol: 0.22, actualFraction: 0.069 }, // Monsoon dip
    { name: 'Aug', quarter: 'Q2', weight: 0.075, vol: 0.24, actualFraction: 0.075 }, // Monsoon dip
    { name: 'Sep', quarter: 'Q2', weight: 0.080, vol: 0.18, actualFraction: null },
    { name: 'Oct', quarter: 'Q3', weight: 0.090, vol: 0.16, actualFraction: null }, // Post-monsoon rebound
    { name: 'Nov', quarter: 'Q3', weight: 0.095, vol: 0.15, actualFraction: null },
    { name: 'Dec', quarter: 'Q3', weight: 0.100, vol: 0.16, actualFraction: null },
    { name: 'Jan', quarter: 'Q4', weight: 0.105, vol: 0.18, actualFraction: null },
    { name: 'Feb', quarter: 'Q4', weight: 0.110, vol: 0.20, actualFraction: null },
    { name: 'Mar', quarter: 'Q4', weight: 0.145, vol: 0.32, actualFraction: null }, // March rush
  ];

  // We assume current time is at month index 5 (late August / early September, ~5 months actual recorded)
  const CURRENT_MONTH_INDEX = 5;

  // Calculate actual historical base up to month 5
  const actualSpentToDate = totalUtilized;

  // Array to collect simulated total end-of-year expenditures
  const simulatedYearEndSpends: number[] = new Array(iterations);
  // Matrix to collect monthly trajectories: [monthIndex][iteration]
  const trajectorySpends: number[][] = Array.from({ length: 12 }, () => new Array(iterations));

  // Determine baseline monthly mean spending for remaining months
  const remainingWeightSum = MONTHS.slice(CURRENT_MONTH_INDEX).reduce((acc, m) => acc + m.weight, 0);
  const remainingBudgetToDisburse = Math.max(0, totalAllocated - actualSpentToDate);

  for (let iter = 0; iter < iterations; iter++) {
    let cumulativeSpend = 0;

    for (let m = 0; m < 12; m++) {
      const monthDef = MONTHS[m];

      if (m < CURRENT_MONTH_INDEX) {
        // Known verified historical actual spending for the month
        const monthlyActual = actualSpentToDate * (monthDef.weight / 0.37);
        cumulativeSpend += monthlyActual;
        trajectorySpends[m][iter] = cumulativeSpend;
      } else {
        // Stochastic simulated spending for future months
        const monthWeightRatio = monthDef.weight / remainingWeightSum;
        let expectedMonthlySpend = remainingBudgetToDisburse * monthWeightRatio * burnRateMultiplier;

        // Apply March rush multiplier if in Q4
        if (monthDef.name === 'Mar') {
          expectedMonthlySpend *= marchRushMultiplier;
        } else if (monthDef.name === 'Feb') {
          expectedMonthlySpend *= 1 + (marchRushMultiplier - 1) * 0.4;
        }

        // Apply seasonal volatility standard deviation
        const monthlyVol = monthDef.vol * (baseVolatilityCoeff / 0.15);
        const randomShock = generateGaussian(0, monthlyVol);

        // Simulated spend bounded reasonably
        const stochasticSpend = Math.max(
          expectedMonthlySpend * 0.25,
          expectedMonthlySpend * (1.0 + randomShock)
        );

        cumulativeSpend += stochasticSpend;
        trajectorySpends[m][iter] = cumulativeSpend;
      }
    }

    simulatedYearEndSpends[iter] = cumulativeSpend;
  }

  // Sort simulated year-end spends for percentile calculations
  simulatedYearEndSpends.sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number): number => {
    const idx = Math.min(arr.length - 1, Math.max(0, Math.floor((p / 100) * arr.length)));
    return arr[idx];
  };

  const percentileP10Spend = Math.round(getPercentile(simulatedYearEndSpends, 10));
  const percentileP25Spend = Math.round(getPercentile(simulatedYearEndSpends, 25));
  const percentileP50Spend = Math.round(getPercentile(simulatedYearEndSpends, 50));
  const percentileP75Spend = Math.round(getPercentile(simulatedYearEndSpends, 75));
  const percentileP90Spend = Math.round(getPercentile(simulatedYearEndSpends, 90));

  const expectedYearEndSpend = percentileP50Spend;
  const expectedGap = Math.round(totalAllocated - expectedYearEndSpend);

  // Gaps at percentiles (Gap = Allocated - Spend)
  // Lower spend = Higher unspent surrender gap
  const gapP10 = Math.round(totalAllocated - percentileP90Spend); // Deficit or smallest surrender
  const gapP50 = expectedGap;
  const gapP90 = Math.round(totalAllocated - percentileP10Spend); // Largest unspent surrender

  // Probabilities
  const surrenderCount = simulatedYearEndSpends.filter(s => s < totalAllocated).length;
  const probSurrenderLapse = Math.round((surrenderCount / iterations) * 1000) / 10;
  const probDeficitGap = Math.round((100 - probSurrenderLapse) * 10) / 10;

  // 95% Value at Risk (VaR): 95th percentile worst unspent surrender or shortfall
  const p95Spend = getPercentile(simulatedYearEndSpends, 95);
  const p05Spend = getPercentile(simulatedYearEndSpends, 5);
  const valueAtRisk95 = Math.round(Math.max(Math.abs(totalAllocated - p05Spend), Math.abs(p95Spend - totalAllocated)));

  // Binned Frequency Histogram for Year-End Gap / Spend
  const minSpend = simulatedYearEndSpends[0];
  const maxSpend = simulatedYearEndSpends[simulatedYearEndSpends.length - 1];
  const binCount = 18;
  const binWidth = Math.max(1, (maxSpend - minSpend) / binCount);

  const distributionHistogram = [];
  let runningCount = 0;

  for (let b = 0; b < binCount; b++) {
    const binStart = Math.round(minSpend + b * binWidth);
    const binEnd = Math.round(minSpend + (b + 1) * binWidth);
    const inBinCount = simulatedYearEndSpends.filter(s => s >= binStart && (b === binCount - 1 ? s <= binEnd : s < binEnd)).length;
    runningCount += inBinCount;

    // Categorize: is this bin in Surrender zone, Target Corridor, or Deficit zone?
    let category: 'SURRENDER' | 'CORRIDOR' | 'DEFICIT' = 'SURRENDER';
    const midPoint = (binStart + binEnd) / 2;
    if (midPoint > totalAllocated * 1.01) {
      category = 'DEFICIT';
    } else if (midPoint >= totalAllocated * 0.98 && midPoint <= totalAllocated * 1.01) {
      category = 'CORRIDOR';
    } else {
      category = 'SURRENDER';
    }

    distributionHistogram.push({
      binStart,
      binEnd,
      binLabel: `₹${binStart.toLocaleString('en-IN')}–${binEnd.toLocaleString('en-IN')}`,
      frequency: inBinCount,
      cumulativeProb: Math.round((runningCount / iterations) * 100),
      category,
    });
  }

  // Monthly Trajectory Bands
  const monthlyTrajectoryBands = MONTHS.map((m, idx) => {
    const spendsForMonth = trajectorySpends[idx].slice().sort((a, b) => a - b);
    const p10 = Math.round(getPercentile(spendsForMonth, 10));
    const p25 = Math.round(getPercentile(spendsForMonth, 25));
    const p50 = Math.round(getPercentile(spendsForMonth, 50));
    const p75 = Math.round(getPercentile(spendsForMonth, 75));
    const p90 = Math.round(getPercentile(spendsForMonth, 90));

    // Cumulative target guideline
    const cumulativeWeight = MONTHS.slice(0, idx + 1).reduce((acc, curr) => acc + curr.weight, 0);
    const targetGuideline = Math.round(totalAllocated * cumulativeWeight);

    return {
      month: m.name,
      actual: idx < CURRENT_MONTH_INDEX ? p50 : null,
      p10,
      p25,
      p50,
      p75,
      p90,
      targetGuideline,
    };
  });

  // Department-Level Sensitivity Analysis
  const departmentSensitivity = targetDepartments.map(dept => {
    const allocated = dept.allocatedBudget;
    const currentRate = dept.utilizedBudget / allocated;
    const remainingFraction = Math.max(0, 1 - currentRate);

    // Predict spend with departmental volatility profile
    const isCapexHeavy = dept.sector.toLowerCase().includes('infra') || dept.name.includes('Road') || dept.name.includes('Railways');
    const deptVol = isCapexHeavy ? baseVolatilityCoeff * 1.3 : baseVolatilityCoeff * 0.9;
    const predictedSpend = Math.round(allocated * (currentRate + remainingFraction * (0.88 + (marchRushMultiplier - 1) * 0.2)));
    const medianGap = Math.round(allocated - predictedSpend);
    const lapseProb = medianGap > 0 ? Math.min(95, Math.round((medianGap / allocated) * 120)) : Math.max(5, 100 - Math.round((Math.abs(medianGap) / allocated) * 120));

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      allocated,
      meanPredictedSpend: predictedSpend,
      medianGap,
      lapseRiskProb: lapseProb,
      volatilityRank: (isCapexHeavy ? 'HIGH' : deptVol > 0.15 ? 'MODERATE' : 'LOW') as 'HIGH' | 'MODERATE' | 'LOW',
    };
  }).sort((a, b) => Math.abs(b.medianGap) - Math.abs(a.medianGap));

  // Statutory recommendations
  const statutoryRecommendations = [];

  if (probSurrenderLapse > 65) {
    statutoryRecommendations.push({
      severity: 'WARNING' as const,
      title: 'High Probability of Year-End Unspent Surrender (GFR Rule 63)',
      description: `Monte Carlo simulation indicates a ${probSurrenderLapse}% likelihood of unspent funds totaling ₹${gapP50.toLocaleString('en-IN')} Cr. Line ministries should finalize surrender notifications before the statutory February 15 cutoff to prevent lapsing to the Consolidated Fund.`,
      statutoryRule: 'GFR 2017 Rule 63 (Surrender of Anticipated Savings)',
    });
  }

  if (probDeficitGap > 30) {
    statutoryRecommendations.push({
      severity: 'CRITICAL' as const,
      title: 'Deficit Risk Corridor: Supplementary Grants Advised',
      description: `There is a ${probDeficitGap}% probability of capital demand exceeding the budgeted outlay by up to ₹${Math.abs(gapP10).toLocaleString('en-IN')} Cr in high-momentum sectors. The Budget Division should formulate Batches for Supplementary Demands for Grants.`,
      statutoryRule: 'Constitution of India Article 115(1)(a) & GFR Rule 61',
    });
  }

  if (marchRushMultiplier > 1.25) {
    statutoryRecommendations.push({
      severity: 'INFO' as const,
      title: 'March Rush Warning: Rule 62(3) Ceiling Surveillance',
      description: `Aggressive Q4 acceleration yields up to 34% of disbursements concentrated in the final quarter. Public Financial Management System (PFMS) gates should enforce the 33% Q4 expenditure ceiling and 15% March ceiling under Rule 62(3).`,
      statutoryRule: 'GFR 2017 Rule 62(3) & Ministry of Finance Anti-Rush Directives',
    });
  }

  return {
    iterations,
    volatilityLevel,
    marchRushMultiplier,
    departmentScope,
    allocatedBudget: totalAllocated,
    currentActualSpent: actualSpentToDate,
    expectedYearEndSpend,
    expectedGap,
    percentileP10Spend,
    percentileP50Spend,
    percentileP90Spend,
    gapP10,
    gapP50,
    gapP90,
    probSurrenderLapse,
    probDeficitGap,
    valueAtRisk95,
    distributionHistogram,
    monthlyTrajectoryBands,
    departmentSensitivity,
    statutoryRecommendations,
  };
}
