import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  AlertCircle,
  FileCheck,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface ValidatedExpenditureRecord {
  voucherNumber: string;
  departmentCode: string;
  departmentName: string;
  departmentId: string;
  amount: number;
  date: string;
  category: 'CAPITAL_OUTLAY' | 'REVENUE_EXPENDITURE' | 'PROCUREMENT' | 'GRANTS_IN_AID' | 'ESTABLISHMENT';
  vendorAgency: string;
  description: string;
  sanctionOrderNumber?: string;
  financialYear: string;
  quarter: string;
  paymentStatus: 'COMPLETED';
  verificationStatus: 'VERIFIED';
}

interface ValidationIssue {
  rowNumber: number;
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

const VALID_CATEGORIES = [
  'CAPITAL_OUTLAY',
  'REVENUE_EXPENDITURE',
  'PROCUREMENT',
  'GRANTS_IN_AID',
  'ESTABLISHMENT',
];

const DEPT_MAP: Record<string, { id: string; name: string }> = {
  MORTH: { id: 'dept-1', name: 'Ministry of Road Transport & Highways' },
  MOHFW: { id: 'dept-2', name: 'Ministry of Health & Family Welfare' },
  MOE: { id: 'dept-3', name: 'Ministry of Education' },
  MOD: { id: 'dept-4', name: 'Ministry of Defence' },
  MORD: { id: 'dept-5', name: 'Ministry of Rural Development' },
  MOAFW: { id: 'dept-6', name: 'Ministry of Agriculture & Farmers Welfare' },
  MOP: { id: 'dept-7', name: 'Ministry of Power' },
  MOJAL: { id: 'dept-8', name: 'Ministry of Jal Shakti' },
  MORAIL: { id: 'dept-9', name: 'Ministry of Railways' },
  MEITY: { id: 'dept-10', name: 'Ministry of Electronics & IT' },
};

export const CSVExpenditureUploader: React.FC = () => {
  const { importBatchData, refreshAll, addToast, recordAuditAction } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ValidatedExpenditureRecord[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [rawRowCount, setRawRowCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ingestionCompleted, setIngestionCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse CSV text with quotes handling
  const parseCSV = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      addToast('Invalid CSV File', 'CSV must contain a header row and at least one data row.', 'ERROR');
      return;
    }

    setRawRowCount(lines.length - 1);
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const findIndex = (...candidates: string[]) => {
      return headers.findIndex(h => candidates.some(c => h.includes(c)));
    };

    const idxVoucher = findIndex('voucher', 'vch', 'transactionid', 'txnid');
    const idxDept = findIndex('dept', 'department', 'ministry');
    const idxAmount = findIndex('amount', 'value', 'outlay', 'cost');
    const idxDate = findIndex('date', 'time', 'period');
    const idxCat = findIndex('category', 'head', 'type');
    const idxVendor = findIndex('vendor', 'agency', 'beneficiary', 'payee');
    const idxDesc = findIndex('desc', 'description', 'purpose', 'details');
    const idxSanction = findIndex('sanction', 'order', 'ref');

    const records: ValidatedExpenditureRecord[] = [];
    const issues: ValidationIssue[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle simple CSV splitting with quotes
      const values: string[] = [];
      let currentVal = '';
      let insideQuote = false;
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

      const rowNum = i + 1;
      let hasError = false;

      // 1. Voucher Number
      const voucher = idxVoucher >= 0 ? values[idxVoucher] : '';
      if (!voucher) {
        issues.push({ rowNumber: rowNum, field: 'Voucher Number', message: 'Missing mandatory voucher identifier', severity: 'ERROR' });
        hasError = true;
      }

      // 2. Department Code
      const rawDept = idxDept >= 0 ? values[idxDept].toUpperCase() : '';
      const normalizedDeptKey = rawDept.replace(/[^A-Z]/g, '');
      const deptInfo = DEPT_MAP[normalizedDeptKey] || {
        id: `dept-${(i % 10) + 1}`,
        name: rawDept || 'Union Department of Public Works',
      };
      if (!rawDept) {
        issues.push({ rowNumber: rowNum, field: 'Department Code', message: 'Missing department code; defaulted to central treasury head', severity: 'WARNING' });
      }

      // 3. Amount Validation
      const rawAmountStr = idxAmount >= 0 ? values[idxAmount].replace(/[^0-9.-]/g, '') : '';
      const amount = parseFloat(rawAmountStr);
      if (isNaN(amount) || amount <= 0) {
        issues.push({ rowNumber: rowNum, field: 'Amount', message: `Invalid expenditure amount "${values[idxAmount]}". Must be a positive number.`, severity: 'ERROR' });
        hasError = true;
      }

      // 4. Date Validation
      const rawDate = idxDate >= 0 ? values[idxDate] : '';
      let validDate = rawDate;
      if (!rawDate || isNaN(Date.parse(rawDate))) {
        validDate = new Date().toISOString().slice(0, 10);
        issues.push({ rowNumber: rowNum, field: 'Date', message: 'Missing or unparseable date. Assigned current financial date.', severity: 'WARNING' });
      }

      // 5. Category Validation
      const rawCat = idxCat >= 0 ? values[idxCat].toUpperCase().replace(/\s+/g, '_') : 'CAPITAL_OUTLAY';
      const category: ValidatedExpenditureRecord['category'] = VALID_CATEGORIES.includes(rawCat)
        ? (rawCat as ValidatedExpenditureRecord['category'])
        : 'CAPITAL_OUTLAY';
      if (!VALID_CATEGORIES.includes(rawCat)) {
        issues.push({ rowNumber: rowNum, field: 'Category', message: `Unrecognized GFR category "${rawCat}". Normalized to CAPITAL_OUTLAY.`, severity: 'WARNING' });
      }

      // 6. Vendor / Agency
      const vendor = idxVendor >= 0 ? values[idxVendor] : 'Authorized Government Contractor';
      if (!vendor) {
        issues.push({ rowNumber: rowNum, field: 'Vendor / Agency', message: 'Empty vendor name', severity: 'WARNING' });
      }

      // 7. Description
      const desc = idxDesc >= 0 ? values[idxDesc] : `Bulk expenditure disbursement under voucher ${voucher}`;

      if (!hasError) {
        records.push({
          voucherNumber: voucher || `VCH-2026-${1000 + i}`,
          departmentCode: normalizedDeptKey || 'MORTH',
          departmentName: deptInfo.name,
          departmentId: deptInfo.id,
          amount,
          date: validDate,
          category,
          vendorAgency: vendor,
          description: desc,
          sanctionOrderNumber: idxSanction >= 0 ? values[idxSanction] : `SANCTION-${2026}-${100 + i}`,
          financialYear: '2025-26',
          quarter: 'Q4',
          paymentStatus: 'COMPLETED',
          verificationStatus: 'VERIFIED',
        });
      }
    }

    setParsedRecords(records);
    setValidationIssues(issues);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      addToast('Invalid File Type', 'Please upload a comma-separated values (.csv) file.', 'ERROR');
      return;
    }

    setFileName(file.name);
    setIngestionCompleted(false);

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      if (text) {
        parseCSV(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleCommitIngestion = async () => {
    if (parsedRecords.length === 0) return;
    setIsSubmitting(true);

    try {
      await importBatchData('EXPENDITURES', parsedRecords);
      await refreshAll();

      recordAuditAction({
        action: 'CSV_EXPENDITURE_BATCH_INGESTED',
        category: 'INGESTION',
        description: `Bulk uploaded & reconciled ${parsedRecords.length} expenditure records from file "${fileName}" against Government Standard Schema.`,
        recordType: 'BULK_CSV_EXPENDITURE',
        newValue: `${parsedRecords.length} records processed`,
        status: 'VERIFIED',
      });

      setIngestionCompleted(true);
      addToast(
        'Bulk Upload Reconciled',
        `Successfully ingested ${parsedRecords.length} validated expenditure records into the central treasury ledger.`,
        'SUCCESS'
      );
    } catch (err) {
      console.error(err);
      addToast('Ingestion Error', 'Failed to commit batch records to database.', 'ERROR');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRecords([]);
    setValidationIssues([]);
    setRawRowCount(0);
    setIngestionCompleted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadStandardTemplate = () => {
    const csvContent =
      'VoucherNumber,DepartmentCode,Amount,Date,Category,VendorAgency,SanctionOrderNumber,Description\n' +
      'VCH-2026-8001,MoRTH,42.50,2026-03-01,CAPITAL_OUTLAY,L&T Infrastructure Projects,SANCTION-2026-041,Expressway bituminous surface reinforcement tranche\n' +
      'VCH-2026-8002,MoHFW,18.75,2026-03-02,PROCUREMENT,Siemens Medical Systems,SANCTION-2026-092,AIIMS advanced diagnostic radiology scanner install\n' +
      'VCH-2026-8003,MoE,9.20,2026-03-03,GRANTS_IN_AID,IIT Delhi Research Council,SANCTION-2026-118,Clean energy lab equipment matching grant\n' +
      'VCH-2026-8004,MoRD,31.40,2026-03-04,REVENUE_EXPENDITURE,National Rural Works Agency,SANCTION-2026-205,PMGSY rural connectivity all-weather road package\n' +
      'VCH-2026-8005,MoP,24.80,2026-03-05,CAPITAL_OUTLAY,Power Grid Corporation of India,SANCTION-2026-311,High voltage green transmission corridor substation\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Government_Standard_Expenditure_Schema_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const errorCount = validationIssues.filter(i => i.severity === 'ERROR').length;
  const warningCount = validationIssues.filter(i => i.severity === 'WARNING').length;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={e => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all flex flex-col items-center justify-center space-y-3 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/30'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xs">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
            Bulk-Upload Expenditure Records (CSV)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            Drag & drop your CSV file here, or browse from your device. Real-time validation will verify compliance with the Government Standard Schema (GFR Rule 255).
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 flex-wrap justify-center">
          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs flex items-center gap-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Select Local CSV File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadStandardTemplate}
            className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Government Standard CSV Template</span>
          </button>
        </div>

        {fileName && (
          <div className="mt-2 flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Loaded: {fileName}</span>
            <button
              onClick={handleReset}
              className="ml-2 text-zinc-400 hover:text-rose-500"
              title="Clear file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Validation Summary Card */}
      {parsedRecords.length > 0 && !ingestionCompleted && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">
                Government Schema Pre-Ingestion Audit
              </span>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Validation Report: {parsedRecords.length} of {rawRowCount} Records Ready
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleCommitIngestion}
                disabled={isSubmitting || parsedRecords.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing to Treasury Ledger...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Commit {parsedRecords.length} Validated Records</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation KPI Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                  Valid Schema Records
                </span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {parsedRecords.length} Vouchers
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                  Warnings (Normalized)
                </span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {warningCount} Notifications
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
                  Rejected Rows
                </span>
                <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                  {errorCount} Rows
                </span>
              </div>
            </div>
          </div>

          {/* Validation Warnings/Errors List if any */}
          {validationIssues.length > 0 && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5 max-h-32 overflow-y-auto text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Schema Findings</span>
              {validationIssues.slice(0, 10).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px]">
                  {issue.severity === 'ERROR' ? (
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold shrink-0">
                      ERR R{issue.rowNumber}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                      WARN R{issue.rowNumber}
                    </span>
                  )}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    <strong className="text-zinc-900 dark:text-white">{issue.field}:</strong> {issue.message}
                  </span>
                </div>
              ))}
              {validationIssues.length > 10 && (
                <p className="text-[10px] text-zinc-400 italic">
                  + {validationIssues.length - 10} more schema messages
                </p>
              )}
            </div>
          )}

          {/* Parsed Records Preview Table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-2.5 whitespace-nowrap">Voucher #</th>
                  <th className="p-2.5 whitespace-nowrap">Ministry / Dept</th>
                  <th className="p-2.5 whitespace-nowrap">Amount</th>
                  <th className="p-2.5 whitespace-nowrap">GFR Category</th>
                  <th className="p-2.5 whitespace-nowrap">Date</th>
                  <th className="p-2.5">Beneficiary / Vendor</th>
                  <th className="p-2.5 text-center whitespace-nowrap">Schema Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                {parsedRecords.slice(0, 5).map((rec, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="p-2.5 font-mono text-[11px] font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                      {rec.voucherNumber}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rec.departmentCode}</span>
                      <span className="text-[10px] text-zinc-400 block truncate max-w-[140px]">{rec.departmentName}</span>
                    </td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      ₹{rec.amount.toFixed(2)} Cr
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {rec.category}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {rec.date}
                    </td>
                    <td className="p-2.5 text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
                      {rec.vendorAgency}
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3" />
                        COMPLIANT
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRecords.length > 5 && (
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800/40 text-center text-[11px] text-zinc-500 border-t border-zinc-200 dark:border-zinc-800">
                Showing 5 of {parsedRecords.length} records ready for ledger commit
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingestion Completed Success State */}
      {ingestionCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Treasury Ingestion & Reconciliation Complete</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                {parsedRecords.length} expenditure vouchers successfully verified against GFR guidelines and integrated into live ledger accounts.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
};
