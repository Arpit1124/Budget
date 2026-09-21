import {
  DEPARTMENTS,
  SCHEMES,
  getAllProjects,
  generateExpenditures,
  AI_ANOMALIES,
  AI_INSIGHTS,
  RISK_SCORES,
  SYSTEM_ALERTS,
  AUDIT_LOGS,
  BUDGETS,
  FUND_RELEASES,
  SPENDING_FORECAST,
  DATA_QUALITY_SUMMARY,
  MOCK_REPORTS,
  DEMO_USERS,
} from '../src/data/mockData';
import {
  Department,
  Scheme,
  Project,
  Budget,
  FundRelease,
  Expenditure,
  AIAnomaly,
  AIInsight,
  RiskScore,
  AlertItem,
  AuditLog,
  ReportItem,
  DataQualitySummary,
  SpendingForecast,
  User,
} from '../src/types';

class GovernmentDataStore {
  public departments: Department[] = [];
  public schemes: Scheme[] = [];
  public projects: Project[] = [];
  public expenditures: Expenditure[] = [];
  public anomalies: AIAnomaly[] = [];
  public insights: AIInsight[] = [];
  public riskScores: RiskScore[] = [];
  public alerts: AlertItem[] = [];
  public auditLogs: AuditLog[] = [];
  public budgets: Budget[] = [];
  public fundReleases: FundRelease[] = [];
  public forecast: SpendingForecast = SPENDING_FORECAST;
  public dataQuality: DataQualitySummary = DATA_QUALITY_SUMMARY;
  public reports: ReportItem[] = [];
  public users: User[] = [];
  public currentScenario: string = 'NORMAL';

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults() {
    this.departments = JSON.parse(JSON.stringify(DEPARTMENTS));
    this.schemes = JSON.parse(JSON.stringify(SCHEMES));
    this.projects = getAllProjects();
    this.expenditures = generateExpenditures();
    this.anomalies = JSON.parse(JSON.stringify(AI_ANOMALIES));
    this.insights = JSON.parse(JSON.stringify(AI_INSIGHTS));
    this.riskScores = JSON.parse(JSON.stringify(RISK_SCORES));
    this.alerts = JSON.parse(JSON.stringify(SYSTEM_ALERTS));
    this.auditLogs = JSON.parse(JSON.stringify(AUDIT_LOGS));
    this.budgets = JSON.parse(JSON.stringify(BUDGETS));
    this.fundReleases = JSON.parse(JSON.stringify(FUND_RELEASES));
    this.forecast = JSON.parse(JSON.stringify(SPENDING_FORECAST));
    this.dataQuality = JSON.parse(JSON.stringify(DATA_QUALITY_SUMMARY));
    this.reports = JSON.parse(JSON.stringify(MOCK_REPORTS));
    this.users = JSON.parse(JSON.stringify(DEMO_USERS));
    this.currentScenario = 'NORMAL';
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      ...log,
    };
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  public applyScenario(scenarioId: string) {
    this.currentScenario = scenarioId;
    switch (scenarioId) {
      case 'SCENARIO_1_LOW_UTILIZATION': {
        const jal = this.departments.find(d => d.id === 'dept-05');
        if (jal) {
          jal.utilizedBudget = 420;
          jal.remainingBudget = 830;
          jal.utilizationPercentage = 33.6;
          jal.status = 'CRITICAL';
          jal.riskLevel = 'CRITICAL';
        }
        this.addAuditLog({
          user: 'System Demo Engine',
          userRole: 'DEMO_CONTROLLER',
          action: 'Activated Demo Scenario 1: Low Budget Utilization Warning',
          recordType: 'SCENARIO',
          recordId: 'SCENARIO_1',
          oldValue: 'Default Department Allocations',
          newValue: 'Jal Shakti Utilization Adjusted to 33.6%',
          ipAddress: '127.0.0.1 (Demo Engine)',
          status: 'SUCCESS',
        });
        break;
      }
      case 'SCENARIO_2_OVERSPENDING_ALERT': {
        const rth = this.departments.find(d => d.id === 'dept-03');
        if (rth) {
          rth.utilizedBudget = 2780;
          rth.remainingBudget = 70;
          rth.utilizationPercentage = 97.5;
          rth.status = 'CRITICAL';
        }
        this.addAuditLog({
          user: 'System Demo Engine',
          userRole: 'DEMO_CONTROLLER',
          action: 'Activated Demo Scenario 2: Overspending Trajectory Alert',
          recordType: 'SCENARIO',
          recordId: 'SCENARIO_2',
          oldValue: 'MORTH 61.1% Utilization',
          newValue: 'MORTH 97.5% Accelerated Outlay with Pending Commitments',
          ipAddress: '127.0.0.1 (Demo Engine)',
          status: 'SUCCESS',
        });
        break;
      }
      case 'SCENARIO_3_PROGRESS_MISMATCH': {
        const nh44 = this.projects.find(p => p.id === 'prj-101');
        if (nh44) {
          nh44.physicalProgress = 32;
          nh44.financialProgress = 89.5;
          nh44.hasMismatch = true;
          nh44.mismatchDescription = 'Extreme Divergence: Financial outlay is 89.5% against physical completion of 32.0%. Investigation underway.';
        }
        break;
      }
      case 'SCENARIO_4_AI_ANOMALY': {
        // Boost critical anomaly count
        this.alerts.unshift({
          id: `alt-scenario-4`,
          alertCode: 'ALT-ANOM-909',
          title: 'High-Risk Surge in Procurement Invoices Cleared',
          message: 'Multiple consecutive capital invoices cleared under non-competitive quotation bypass.',
          severity: 'CRITICAL',
          timestamp: 'Just now',
          isRead: false,
          status: 'ACTIVE',
        });
        break;
      }
      default:
        this.resetToDefaults();
        break;
    }
  }
}

export const dataStore = new GovernmentDataStore();
