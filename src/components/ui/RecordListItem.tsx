import React from 'react';
import { 
  Printer, Edit2, Trash2, FileText, CheckSquare, Square, 
  TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import type { PurchaseRecord } from '../../types';

interface RecordListItemProps {
  record: PurchaseRecord;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (record: PurchaseRecord) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void; // Existing print functionality
  onPreviewPDF: (record: PurchaseRecord) => void; // New: PDF preview
}

// Helper function to safely display ID
const getShortId = (id: string | number): string => {
  try {
    const idStr = String(id);
    return idStr.length > 8 ? `${idStr.substring(0, 8)}...` : idStr;
  } catch (error) {
    return 'N/A';
  }
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return dateString || 'Invalid Date';
  }
};

// Helper to safely calculate values
const safeNumber = (value: any): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const RecordListItem: React.FC<RecordListItemProps> = ({
  record,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPrint,
  onPreviewPDF
}) => {
  // Format date safely
  const formattedDate = formatDate(record.date);

  // Get payment method breakdown safely
  const paymentBreakdown = [
    { mode: 'cash', amount: safeNumber(record.cashTotal) },
    { mode: 'mpesa', amount: safeNumber(record.mpesaTotal) },
    { mode: 'cheque', amount: safeNumber(record.chequeTotal) },
    { mode: 'bank', amount: safeNumber(record.bankTotal || 0) }
  ].filter(p => p.amount > 0);

  // Calculate values safely
  const cashBalance = safeNumber(record.cashBalance);
  const totalExpenditure = safeNumber(record.totalExpenditure);
  const cashReceived = safeNumber(record.cashReceived);
  const balanceBF = safeNumber(record.balanceBF);
  const cashAvailable = safeNumber(record.cashAvailable);
  const cashTotal = safeNumber(record.cashTotal);
  const totalBudget = safeNumber(record.totalBudget || 0);
  const budgetRemaining = safeNumber(record.budgetRemaining || 0);

  // Get unique suppliers safely
  const uniqueSuppliers = record.receipts
    .map(r => r.supplier)
    .filter((supplier, index, self) => 
      supplier && self.indexOf(supplier) === index
    );

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${
      cashBalance >= 0 
        ? 'border-l-green-500' 
        : 'border-l-red-500'
    } hover:shadow-lg transition-shadow`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              onClick={() => onToggleSelect(String(record.id))}
              className="mt-1 text-gray-400 hover:text-blue-600"
            >
              {isSelected ? (
                <CheckSquare size={20} className="text-blue-600" />
              ) : (
                <Square size={20} />
              )}
            </button>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {formattedDate}
                </h3>
                {record.stopCarryOver && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    No Carry-over
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {record.receipts?.length || 0} receipt{(record.receipts?.length || 0) !== 1 ? 's' : ''} • 
                <span className="ml-1 inline-flex items-center gap-1">
                  ID: <span className="font-mono">{getShortId(record.id)}</span>
                </span>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                KSh {totalExpenditure.toFixed(2)}
              </div>
              <div className={`text-sm flex items-center justify-end gap-1 ${
                cashBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {cashBalance >= 0 ? (
                  <>
                    <TrendingUp size={14} />
                    <span>KSh {cashBalance.toFixed(2)} balance</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} />
                    <span>KSh {Math.abs(cashBalance).toFixed(2)} deficit</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions - Updated with both Print and PDF Preview */}
            <div className="flex gap-1">
              {/* PDF Preview Button (New) */}
              <button
                onClick={() => onPreviewPDF(record)}
                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                title="Preview PDF"
              >
                <FileText size={18} />
              </button>
              
              {/* Print Button (Keep existing functionality) */}
              <button
                onClick={() => onPrint(String(record.id))}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                title="Print"
              >
                <Printer size={18} />
              </button>
              
              {/* Edit Button */}
              <button
                onClick={() => onEdit(record)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              
              {/* Delete Button */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this record?')) {
                    onDelete(String(record.id));
                  }
                }}
                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cash Flow */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Cash Flow</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Received:</div>
              <div className="font-medium text-right">KSh {cashReceived.toFixed(2)}</div>
              
              <div className="text-gray-600">B/F:</div>
              <div className="font-medium text-right">KSh {balanceBF.toFixed(2)}</div>
              
              <div className="text-gray-600">Available:</div>
              <div className="font-medium text-right">KSh {cashAvailable.toFixed(2)}</div>
              
              <div className="text-gray-600">Spent:</div>
              <div className="font-medium text-right">KSh {cashTotal.toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Payment Methods</h4>
            <div className="space-y-1">
              {paymentBreakdown.map(payment => (
                <div key={payment.mode} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{payment.mode}:</span>
                  <span>KSh {payment.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget & Suppliers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Details</h4>
            {totalBudget > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget:</span>
                <span>
                  KSh {totalBudget.toFixed(2)}
                  <span className={`ml-2 text-xs ${
                    budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({budgetRemaining >= 0 ? '+' : ''}
                    {((budgetRemaining / totalBudget) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Suppliers:</span>
              <span className="text-right max-w-[150px] truncate" title={uniqueSuppliers.join(', ')}>
                {uniqueSuppliers.join(', ')}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span>
                {new Date(record.updatedAt).toLocaleDateString()}
                <span className="text-xs text-gray-500 ml-1">
                  v{record.version || 1}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Receipts Preview */}
        {record.receipts && record.receipts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Receipts Preview</h4>
            <div className="flex flex-wrap gap-2">
              {record.receipts.slice(0, 3).map((receipt, index) => {
                const amount = safeNumber(receipt.amount);
                return (
                  <div
                    key={receipt.id || index}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    title={`${receipt.supplier || 'Unknown'} - KSh ${amount.toFixed(2)} (${receipt.paymentMode})`}
                  >
                    <span className="font-medium">{receipt.supplier || 'Unknown'}</span>
                    <span className="mx-1 text-gray-500">•</span>
                    <span className="text-gray-600">KSh {amount.toFixed(2)}</span>
                    <span className="ml-1 text-xs text-gray-500 capitalize">
                      ({receipt.paymentMode || 'unknown'})
                    </span>
                  </div>
                );
              })}
              {record.receipts.length > 3 && (
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  +{record.receipts.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordListItem;