// Print Layout Component
interface Receipt {
  paymentMode: string;
  amount?: string | number;
}

interface PurchaseRecord {
  receipts: Receipt[];
  cashReceived?: string | number;
  balanceBF?: string | number;
  totalBudget?: string | number;
  date?: string;
}

import PrintSummary from './PrintSummary';

// Print Layout Component
type PrintLayoutProps = {
  records: Array<PurchaseRecord & { id: string | number }>;
};

function PrintLayout({ records }: PrintLayoutProps) {
  // Group records into pages of 10
  const pages: Array<Array<PurchaseRecord & { id: string | number }>> = [];
  for (let i = 0; i < records.length; i += 10) {
    pages.push(records.slice(i, i + 10));
  }

  return (
    <>
      {pages.map((pageRecords, pageIndex) => (
        <div
          key={pageIndex}
          className="relative"
          style={{
            width: '210mm',
            height: '297mm',
            pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
            padding: '10mm',
            boxSizing: 'border-box'
          }}
        >
          <div className="grid grid-cols-2 gap-3 h-full">
            {/* Left column - 5 records */}
            <div className="grid grid-rows-5 gap-2">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div key={idx} className="h-full">
                  {pageRecords[idx] ? (
                    <PrintSummary record={pageRecords[idx]} />
                  ) : (
                    <div className="h-full" /> // Empty space to maintain position
                  )}
                </div>
              ))}
            </div>
            
            {/* Right column - 5 records */}
            <div className="grid grid-rows-5 gap-2">
              {[5, 6, 7, 8, 9].map((idx) => (
                <div key={idx} className="h-full">
                  {pageRecords[idx] ? (
                    <PrintSummary record={pageRecords[idx]} />
                  ) : (
                    <div className="h-full" /> // Empty space to maintain position
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}


export default PrintLayout;