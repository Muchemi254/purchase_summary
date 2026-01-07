import React from 'react';
import { 
  Printer, Edit2, Trash2, CheckSquare, Square, 
  TrendingUp, TrendingDown
} from 'lucide-react';
import type { PurchaseRecord } from '../../types';

interface RecordListItemProps {
  record: PurchaseRecord;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (record: PurchaseRecord) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
}

// Helper to safely format numbers
const fmt = (value: any, digits = 2) => Number(value || 0).toFixed(digits);

const RecordListItem: React.FC<RecordListItemProps> = ({
  record,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPrint
}) => {
  const formattedDate = record.date
    ? new Date(record.date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'N/A';

  const paymentBreakdown = [
    { mode: 'cash', amount: record.cashTotal },
    { mode: 'mpesa', amount: record.mpesaTotal },
    { mode: 'cheque', amount: record.chequeTotal },
    { mode: 'bank', amount: record.bankTotal || 0 }
  ].filter(p => Number(p.amount) > 0);

  return (
    <div className={`bg-white rounded-lg shadow border-l-4 ${
      (Number(record.cashBalance) || 0) >= 0 
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
                Record ID: <span className="font-mono">{String(record.id).substring(0, 8)}...</span>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">
                KSh {fmt(record.totalExpenditure)}
              </div>
              <div className={`text-sm ${
                (Number(record.cashBalance) || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(Number(record.cashBalance) || 0) >= 0 ? (
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    KSh {fmt(record.cashBalance)} balance
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <TrendingDown size={14} />
                    KSh {fmt(Math.abs(record.cashBalance))} deficit
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => onPrint(String(record.id))}
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                title="Print"
              >
                <Printer size={18} />
              </button>
              <button
                onClick={() => onEdit(record)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
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
              <div className="font-medium text-right">KSh {fmt(record.cashReceived)}</div>
              
              <div className="text-gray-600">B/F:</div>
              <div className="font-medium text-right">KSh {fmt(record.balanceBF)}</div>
              
              <div className="text-gray-600">Available:</div>
              <div className="font-medium text-right">KSh {fmt(record.cashAvailable)}</div>
              
              <div className="text-gray-600">Spent:</div>
              <div className="font-medium text-right">KSh {fmt(record.cashTotal)}</div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Payment Methods</h4>
            <div className="space-y-1">
              {paymentBreakdown.map(payment => (
                <div key={payment.mode} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{payment.mode}:</span>
                  <span>KSh {fmt(payment.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget & Suppliers */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Details</h4>
            {Number(record.totalBudget) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget:</span>
                <span>
                  KSh {fmt(record.totalBudget)}
                  <span className={`ml-2 text-xs ${
                    (Number(record.budgetRemaining) || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ({(Number(record.budgetRemaining) || 0) >= 0 ? '+' : ''}
                    {((Number(record.budgetRemaining) || 0) / Number(record.totalBudget) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Suppliers:</span>
              <span className="text-right">
                {[...new Set((record.receipts || []).map(r => r.supplier))].join(', ')}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span>
                {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : 'N/A'}
                <span className="text-xs text-gray-500 ml-1">
                  v{record.version || 0}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Receipts Preview */}
        {record.receipts?.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Receipts Preview</h4>
            <div className="flex flex-wrap gap-2">
              {record.receipts.slice(0, 3).map((receipt) => (
                <div
                  key={String(receipt.id)}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  <span className="font-medium">{receipt.supplier}</span>
                  <span className="mx-1 text-gray-500">•</span>
                  <span className="text-gray-600">KSh {fmt(receipt.amount)}</span>
                  <span className="ml-1 text-xs text-gray-500 capitalize">
                    ({receipt.paymentMode})
                  </span>
                </div>
              ))}
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
