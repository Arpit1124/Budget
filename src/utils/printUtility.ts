/**
 * Government of India • Public Financial Management System (PFMS)
 * Print-friendly utility to generate a formatted PDF of the current view,
 * utilizing the existing print CSS styles (@media print).
 */

export interface PrintReportOptions {
  viewName?: string;
  financialYear?: string;
  departmentScope?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

/**
 * Generates an official, print-friendly PDF of the current active view.
 * Utilizes the comprehensive @media print stylesheet in index.css:
 * - Formats typography and margins for standard A4 portrait output
 * - Strips interactive web chrome (navigation, buttons, modals, alerts)
 * - Enhances contrast for monochrome and laser print compliance
 * - Sets the default PDF download document title to an official nomenclature
 */
export function downloadCurrentViewReport(options: PrintReportOptions = {}): void {
  const {
    viewName = 'Executive_Fiscal_Report',
    financialYear = '2026-27',
    departmentScope = 'All_Departments',
    onBeforePrint,
    onAfterPrint,
  } = options;

  // Clean formatted file name for browser's "Save as PDF" dialog
  const sanitizedView = viewName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedFY = financialYear.replace(/[^a-zA-Z0-9_-]/g, '-');
  const originalTitle = document.title;
  const pdfFileName = `PFMS_Report_${sanitizedView}_FY${sanitizedFY}`;

  try {
    // 1. Set document title so the browser defaults the PDF filename to the official report name
    document.title = pdfFileName;

    if (onBeforePrint) {
      onBeforePrint();
    }

    // 2. Set up listener to cleanly restore original title once print/PDF dialog concludes
    const handleAfterPrint = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', handleAfterPrint);
      if (onAfterPrint) {
        onAfterPrint();
      }
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // 3. Fallback timer in case afterprint does not fire in certain iframe environments
    setTimeout(() => {
      if (document.title === pdfFileName) {
        document.title = originalTitle;
      }
    }, 4000);

    // 4. Trigger print engine (browser renders using @media print in index.css)
    window.print();
  } catch (err) {
    console.error('Print-friendly PDF generation error:', err);
    document.title = originalTitle;
    throw err;
  }
}
