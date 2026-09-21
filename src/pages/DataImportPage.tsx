import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AIBatchTaggingPipeline } from '../components/import/AIBatchTaggingPipeline';
import { AIVoucherOCRUploader } from '../components/import/AIVoucherOCRUploader';
import { CSVExpenditureUploader } from '../components/import/CSVExpenditureUploader';
import { BulkAuditExportInterface } from '../components/import/BulkAuditExportInterface';
import { ExportHistoryTab } from '../components/import/ExportHistoryTab';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  ArrowRight,
  History,
  FileDown,
} from 'lucide-react';

export const DataImportPage: React.FC = () => {
  const { importBatchData, refreshAll, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'INGESTION' | 'BULK_EXPORT' | 'EXPORT_HISTORY'>('INGESTION');
  const [selectedSchema, setSelectedSchema] = useState<'EXPENDITURE' | 'BUDGET' | 'PROJECT'>('EXPENDITURE');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);

  const handleSimulateBatch = async () => {
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Simulate real ingestion batch payload
      const mockBatch = [
        {
          departmentId: 'dept-1',
          departmentName: 'Ministry of Road Transport & Highways',
          projectId: 'prj-1',
          projectName: 'National Express Corridor Phase 4',
          amount: 45.2,
          date: '2026-03-01',
          financialYear: '2025-26',
          quarter: 'Q4',
          category: 'CAPITAL_OUTLAY',
          vendorAgency: 'Hindustan Construction Co.',
          voucherNumber: `VCH-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
          paymentStatus: 'COMPLETED',
          verificationStatus: 'VERIFIED',
          description: 'Batch Ingestion: Sub-base pavement concrete tranche',
        },
        {
          departmentId: 'dept-2',
          departmentName: 'Ministry of Health & Family Welfare',
          projectId: 'prj-2',
          projectName: 'AIIMS Regional Super-Specialty Hospital',
          amount: 18.5,
          date: '2026-03-02',
          financialYear: '2025-26',
          quarter: 'Q4',
          category: 'PROCUREMENT',
          vendorAgency: 'Siemens Healthcare Diagnostics',
          voucherNumber: `VCH-BATCH-${Math.floor(1000 + Math.random() * 9000)}`,
          paymentStatus: 'COMPLETED',
          verificationStatus: 'VERIFIED',
          description: 'Batch Ingestion: MRI imaging diagnostic installation',
        },
      ];

      await importBatchData('EXPENDITURES', mockBatch);
      setImportCount(mockBatch.length);
      setUploadSuccess(true);
      await refreshAll();
      addToast(
        'Data Import Completed',
        `Ingested and reconciled ${mockBatch.length} treasury vouchers with live ledger.`,
        'SUCCESS'
      );
    } catch (e) {
      console.warn('Batch import error:', e);
      addToast('Import Failed', 'Encountered error during batch ingestion.', 'ERROR');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadSample = () => {
    const csvHeader = 'TransactionId,VoucherNumber,Date,DepartmentCode,Amount,Category,VendorName,Description\n';
    const sampleRow = 'TXN-901,VCH-2026-901,2026-03-01,MoRTH,35.40,CAPITAL_OUTLAY,L&T Construction,Highway asphalt laying\n';
    const blob = new Blob([csvHeader + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_${selectedSchema.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Treasury & PFMS Data Ingestion Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated batch ingestion of Public Financial Management System (PFMS) vouchers, sanction orders, and GeM procurements.
          </p>
        </div>

        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Download Sample CSV Template</span>
        </button>
      </div>

      {/* Primary Module Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('INGESTION')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'INGESTION'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Voucher Ingestion & AI OCR</span>
        </button>

        <button
          onClick={() => setActiveTab('BULK_EXPORT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'BULK_EXPORT'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileDown className="w-4 h-4" />
          <span>Bulk Audit Export</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPORT_HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'EXPORT_HISTORY'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Export History</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
            Signed JSON
          </span>
        </button>
      </div>

      {activeTab === 'INGESTION' && (
        <>
          {/* Schema selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedSchema('EXPENDITURE')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedSchema === 'EXPENDITURE'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                1. Expenditure Vouchers (PFMS)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Disbursement logs, vendor receipts, and beneficiary payments.
              </span>
            </button>

            <button
              onClick={() => setSelectedSchema('BUDGET')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedSchema === 'BUDGET'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                2. Budget Allocations (Union Budget)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                GFR Major/Minor Heads, BE, RE, and Supplementary Grants.
              </span>
            </button>

            <button
              onClick={() => setSelectedSchema('PROJECT')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedSchema === 'PROJECT'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <span className="font-bold text-xs text-slate-900 dark:text-white block">
                3. Project Physical Milestones
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Geotagged site inspection progress and technical certifications.
              </span>
            </button>
          </div>

          {/* AI Automated Batch Tagging & Categorization Pipeline */}
          <AIBatchTaggingPipeline />

          {/* AI-Powered Physical Voucher OCR Processing Utility */}
          <AIVoucherOCRUploader />

          {/* Real CSV File Upload & Parsing Utility with Government Schema Validation */}
          <CSVExpenditureUploader />

          {/* Simulated Live Treasury Feed Ingestion */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Government PFMS Integration Gateway
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                Real-Time Gateway Sync & Simulation
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Test automated end-to-end reconciliation with simulated multi-department PFMS voucher data.
              </p>
            </div>

            <button
              onClick={handleSimulateBatch}
              disabled={isUploading}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors shrink-0 disabled:opacity-50"
            >
              {isUploading ? 'Parsing & Ingesting...' : 'Simulate Direct PFMS Feed Sync'}
            </button>
          </div>

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-bold">Batch Ingestion Reconciled Successfully</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {importCount} voucher items verified against GFR guidelines and integrated into the live ledger.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">
                AUDIT_LOG_RECORDED
              </span>
            </div>
          )}
        </>
      )}

      {activeTab === 'BULK_EXPORT' && (
        <BulkAuditExportInterface />
      )}

      {activeTab === 'EXPORT_HISTORY' && (
        <ExportHistoryTab />
      )}
    </div>
  );
};
