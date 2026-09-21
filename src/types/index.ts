export type UserRole =
  | 'SUPER_ADMIN'
  | 'MINISTER'
  | 'GOVERNMENT_ADMIN'
  | 'DEPARTMENT_OFFICER'
  | 'FINANCE_OFFICER'
  | 'DEPARTMENT_CLERK'
  | 'AUDITOR'
  | 'PROJECT_MANAGER'
  | 'VIEW_ONLY_OFFICER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  avatarUrl?: string;
  designation: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  sector: string;
  headOfficer: string;
  contactEmail: string;
  allocatedBudget: number; // in Crores (₹ Cr)
  releasedBudget: number;  // in Crores (₹ Cr)
  utilizedBudget: number;  // in Crores (₹ Cr)
  committedBudget: number; // in Crores (₹ Cr)
  remainingBudget: number; // in Crores (₹ Cr)
  utilizationPercentage: number;
  projectCount: number;
  schemeCount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'NEEDS_ATTENTION' | 'CRITICAL';
  quarterlyUtilization: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  allocatedBudget: number; // in Cr
  releasedBudget: number;
  utilizedBudget: number;
  utilizationPercentage: number;
  beneficiariesCount: string;
  projectCount: number;
  status: 'ACTIVE' | 'ON_TRACK' | 'UNDER_REVIEW' | 'FLAGGED';
  category: 'CENTRALLY_SPONSORED' | 'CENTRAL_SECTOR' | 'STATE_SPECIFIC';
  type?: 'CENTRALLY_SPONSORED' | 'CENTRAL_SECTOR' | 'STATE_SPECIFIC' | string;
  launchYear: string;
  objective: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'DELAYED' | 'COMPLETED' | 'SUSPENDED' | 'CANCELLED';

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completedDate?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'DELAYED';
  weightagePercentage: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  schemeId: string;
  schemeName: string;
  location: string;
  state: string;
  projectManager: string;
  allocatedBudget: number; // in Cr
  releasedBudget: number;
  expenditure: number;
  remainingBudget: number;
  physicalProgress: number;  // 0-100%
  financialProgress: number; // 0-100%
  startDate: string;
  expectedCompletion: string;
  status: ProjectStatus;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  hasMismatch: boolean;
  mismatchDescription?: string;
  milestones: Milestone[];
}

export type BudgetApprovalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'CLOSED';

export interface Budget {
  id: string;
  budgetId: string;
  financialYear: string;
  departmentId: string;
  departmentName: string;
  schemeId?: string;
  schemeName?: string;
  allocatedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  approvalStatus: BudgetApprovalStatus;
  submittedBy: string;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  isFrozen?: boolean;
}

export type FundReleaseStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RELEASED' | 'REJECTED';

export interface FundRelease {
  id: string;
  releaseId: string;
  departmentId: string;
  departmentName: string;
  schemeId: string;
  schemeName: string;
  projectId?: string;
  projectName?: string;
  requestedAmount: number;
  approvedAmount: number;
  releasedAmount: number;
  requestDate: string;
  releaseDate?: string;
  approvalAuthority: string;
  status: FundReleaseStatus;
  purpose: string;
  trancheNumber: number;
}

export interface Expenditure {
  id: string;
  transactionId: string;
  date: string;
  departmentId: string;
  departmentName: string;
  schemeId: string;
  schemeName: string;
  projectId: string;
  projectName: string;
  category: 'CAPITAL' | 'REVENUE' | 'PROCUREMENT' | 'CIVIL_WORKS' | 'CONSULTING' | 'GRANTS' | 'EQUIPMENT';
  amount: number; // in Cr or Lakhs
  vendorAgency: string;
  paymentStatus: 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'HELD';
  verificationStatus: 'VERIFIED' | 'UNDER_AUDIT' | 'FLAGGED' | 'PENDING';
  invoiceNumber: string;
}

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AIAnomaly {
  id: string;
  anomalyId: string;
  departmentId: string;
  departmentName: string;
  projectId?: string;
  projectName?: string;
  type:
    | 'SPENDING_SPIKE'
    | 'PROGRESS_MISMATCH'
    | 'RAPID_DEPLETION'
    | 'MONTH_END_RUSH'
    | 'UNDER_UTILIZATION'
    | 'DUPLICATE_PATTERN'
    | 'REPEATED_DELAY';
  amount: number;
  detectedDate: string;
  severity: AnomalySeverity;
  aiConfidence: number; // percentage 0-100
  reason: string;
  recommendedAction: string;
  status: 'ACTIVE' | 'UNDER_INVESTIGATION' | 'RESOLVED' | 'DISMISSED';
}

export interface AIInsight {
  id: string;
  category: 'UTILIZATION' | 'EFFICIENCY' | 'FORECAST' | 'ANOMALY' | 'COMPLIANCE';
  headline: string;
  summary: string;
  impactAmount?: number;
  metricChange?: string;
  departmentName?: string;
  recommendedAction: string;
  generatedDate: string;
  confidence: number;
}

export interface RiskScore {
  id: string;
  departmentId: string;
  departmentName: string;
  overallScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: {
    category: string;
    score: number;
    description: string;
  }[];
  recommendedAction: string;
  updatedAt: string;
}

export interface AlertItem {
  id: string;
  alertCode: string;
  title: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'ATTENTION' | 'INFO';
  departmentId?: string;
  departmentName?: string;
  projectId?: string;
  projectName?: string;
  timestamp: string;
  isRead: boolean;
  status: 'ACTIVE' | 'ASSIGNED' | 'RESOLVED' | 'DISMISSED';
  assignedTo?: string;
  comments?: { user: string; text: string; date: string }[];
}

export interface AuditLog {
  id: string;
  user: string;
  userName?: string;
  userRole: string;
  action: string;
  category?: 'MODIFICATION' | 'APPROVAL' | 'EXPORT' | 'SECURITY' | 'INGESTION';
  timestamp: string;
  recordType?: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FLAGGED' | 'FAILED' | 'VERIFIED';
  integrityHash?: string;
  metadata?: Record<string, any>;
}

export interface ReportItem {
  id: string;
  title: string;
  reportType:
    | 'BUDGET_UTILIZATION'
    | 'DEPARTMENT_PERFORMANCE'
    | 'SCHEME_PERFORMANCE'
    | 'PROJECT_FINANCIAL'
    | 'EXPENDITURE_SUMMARY'
    | 'AI_RISK_AUDIT'
    | 'MONTHLY_FINANCIAL'
    | 'QUARTERLY_EXPENDITURE'
    | 'ANNUAL_COMPREHENSIVE'
    | 'STATUTORY_AUDIT';
  financialYear: string;
  departmentName: string;
  generatedBy: string;
  generatedAt: string;
  aiExecutiveSummary: string;
  fileSize: string;
  status: 'READY' | 'GENERATING';
}

export type ApprovalStatus = BudgetApprovalStatus;
export type ExpenditureCategory = Expenditure['category'];
export type VerificationStatus = Expenditure['verificationStatus'];
export type ReportType = ReportItem['reportType'];

export interface DataQualitySummary {

  overallScore: number; // e.g. 94%
  totalRecordsChecked: number;
  cleanRecordsCount: number;
  issuesCount: number;
  issues: {
    id: string;
    type: 'MISSING_VALUE' | 'DUPLICATE' | 'INVALID_AMOUNT' | 'INVALID_DATE' | 'NAME_INCONSISTENCY' | 'UNMATCHED_PROJECT';
    description: string;
    affectedTable: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    suggestedFix: string;
  }[];
  lastChecked: string;
}

export interface SpendingForecast {
  financialYear: string;
  totalAllocated: number;
  currentUtilized: number;
  currentUtilizationPercentage: number;
  projectedYearEndExpenditure: number;
  projectedYearEndPercentage: number;
  potentialUnspentAmount: number;
  potentialOverspendAmount: number;
  confidenceScore: number;
  riskSummary: string;
  monthlyProjections: {
    month: string;
    actual: number | null;
    projected: number;
    upperBound: number;
    lowerBound: number;
  }[];
}

export interface AnomalySmartInsight {
  explanation: string;
  riskFactors: string[];
  statutoryRule: string;
  auditChecklist: string[];
  confidenceScore: number;
  source: 'GEMINI_LIVE' | 'DEMO_AI_ENGINE';
}

export type AdjustmentStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface ApprovalStep {
  level: number;
  role: string;
  officerName: string;
  status: 'COMPLETED' | 'IN_REVIEW' | 'WAITING' | 'REJECTED';
  timestamp?: string;
  comments?: string;
}

export interface BudgetAdjustment {
  id: string;
  referenceNumber: string;
  title: string;
  type: 'VIREMENT_INTERNAL' | 'RE_APPROPRIATION' | 'SUPPLEMENTARY_DEMAND';
  sourceDepartment: string;
  targetDepartment: string;
  amount: number; // in ₹ Cr
  initiatedDate: string;
  status: AdjustmentStatus;
  currentLevel: number; // 1: Desk Officer, 2: Joint Secretary, 3: Finance Secretary
  justification: string;
  steps: ApprovalStep[];
  lastUpdated?: string;
}

export interface WorkflowActivityLog {
  id: string;
  adjustmentId: string;
  referenceNumber: string;
  title: string;
  action: 'CREATED' | 'SUBMITTED' | 'ADVANCED' | 'APPROVED' | 'REJECTED' | 'BULK_APPROVED' | 'BULK_REJECTED';
  fromStatus?: AdjustmentStatus;
  toStatus: AdjustmentStatus;
  user: string;
  userRole: string;
  timestamp: string;
  notes: string;
  amount: number;
}

export type AuthorizationFlowType =
  | 'VIREMENT_INTERNAL'
  | 'RE_APPROPRIATION'
  | 'SUPPLEMENTARY_DEMAND'
  | 'EXECUTIVE_CONTINGENCY'
  | 'TECHNICAL_REALLOCATION';

export interface DepartmentAllocationChange {
  id: string;
  referenceNumber: string;
  sourceDepartmentId: string;
  sourceDepartmentName: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  changeType: AuthorizationFlowType;
  flowName: string;
  amount: number; // in ₹ Cr
  previousSourceAllocation: number;
  newSourceAllocation: number;
  previousTargetAllocation: number;
  newTargetAllocation: number;
  initiatedDate: string;
  approvedDate?: string;
  effectiveQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  authorizationFlow: {
    currentStep: number;
    totalSteps: number;
    steps: {
      stage: string;
      authority: string;
      officer: string;
      status: 'APPROVED' | 'IN_REVIEW' | 'PENDING' | 'REJECTED';
      timestamp?: string;
      remarks?: string;
    }[];
  };
  sanctionOrderNumber: string;
  statutoryBasis: string;
  integrityChecksum: string;
  justification: string;
}

export interface MonteCarloSimulationResult {
  iterations: number;
  volatilityLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  marchRushMultiplier: number;
  departmentScope: string;
  allocatedBudget: number;
  currentActualSpent: number;
  expectedYearEndSpend: number;
  expectedGap: number;
  percentileP10Spend: number;
  percentileP50Spend: number;
  percentileP90Spend: number;
  gapP10: number;
  gapP50: number;
  gapP90: number;
  probSurrenderLapse: number;
  probDeficitGap: number;
  valueAtRisk95: number;
  distributionHistogram: {
    binStart: number;
    binEnd: number;
    binLabel: string;
    frequency: number;
    cumulativeProb: number;
    category: 'SURRENDER' | 'CORRIDOR' | 'DEFICIT';
  }[];
  monthlyTrajectoryBands: {
    month: string;
    actual: number | null;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    targetGuideline: number;
  }[];
  departmentSensitivity: {
    departmentId: string;
    departmentName: string;
    allocated: number;
    meanPredictedSpend: number;
    medianGap: number;
    lapseRiskProb: number;
    volatilityRank: 'HIGH' | 'MODERATE' | 'LOW';
  }[];
  statutoryRecommendations: {
    severity: 'WARNING' | 'CRITICAL' | 'INFO';
    title: string;
    description: string;
    statutoryRule: string;
  }[];
}

export interface AIExecutiveSummaryResult {
  summary: string;
  sentences: string[];
  source: 'GEMINI_LIVE' | 'DEMO_AI_ENGINE';
  promptUsed: string;
  generatedAt: string;
  kpiSnapshot: {
    totalAllocated: number;
    totalExpenditure: number;
    budgetVariance: number;
    utilizationRate: number;
  };
}

export interface DepartmentComparisonDataPoint {
  metric: string;
  deptAValue: number;
  deptBValue: number;
  delta: number;
  unit: '%' | '₹ Cr';
}



