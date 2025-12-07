
import React from 'react';
import { X } from 'lucide-react';

// Print Summary Component
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

function PrintSummary({ record }: { record: PurchaseRecord }) {
  const toNum = (v?: string | number) => {
    if (typeof v === 'number') return v;
    return parseFloat(v || '0') || 0;
  };

  const totals = {
    cashTotal: record.receipts
      .filter(r => r.paymentMode === 'cash')
      .reduce((s, r) => s + toNum(r.amount), 0),
    mpesaTotal: record.receipts
      .filter(r => r.paymentMode === 'mpesa')
      .reduce((s, r) => s + toNum(r.amount), 0),
    chequeTotal: record.receipts
      .filter(r => r.paymentMode === 'cheque')
      .reduce((s, r) => s + toNum(r.amount), 0)
  };
  const cashAvailable = toNum(record.cashReceived) + toNum(record.balanceBF);
  const cashBalance = cashAvailable - totals.cashTotal;
  const totalExpenditure = totals.cashTotal + totals.mpesaTotal + totals.chequeTotal;

  return (
    <div className="border border-gray-800 p-2 text-[9px] leading-tight" style={{ pageBreakInside: 'avoid', height: '100%' }}>
      <div className="font-bold text-center mb-1 text-[10px]">PURCHASE SUMMARY</div>
      <div className="mb-1">
        <div className="flex justify-between">
          <span>Date:</span>
          <span className="font-semibold">{record.date}</span>
        </div>
        {record.totalBudget && (
          <div className="flex justify-between">
            <span>Total Budget:</span>
            <span>KSh {toNum(record.totalBudget).toFixed(2)}</span>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-400 pt-1 mb-1">
        <div className="flex justify-between">
          <span>Cash Received:</span>
          <span>KSh {toNum(record.cashReceived).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Balance B/F:</span>
          <span>KSh {toNum(record.balanceBF).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Cash Available:</span>
          <span>KSh {cashAvailable.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-gray-400 pt-1 mb-1">
        <div className="flex justify-between">
          <span>Cash Spent:</span>
          <span>KSh {totals.cashTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Cash Balance:</span>
          <span className={cashBalance >= 0 ? '' : 'text-red-600'}>
            KSh {cashBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-400 pt-1 mb-1">
        <div className="font-semibold mb-0.5">Other Payment Methods:</div>
        <div className="flex justify-between">
          <span>M-Pesa:</span>
          <span>KSh {totals.mpesaTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cheque:</span>
          <span>KSh {totals.chequeTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-1 font-bold">
        <div className="flex justify-between">
          <span>TOTAL EXPENDITURE:</span>
          <span>KSh {totalExpenditure.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default PrintSummary;