import CalculationService from '../services/CalculationService';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, X, Edit2, Save, XCircle } from 'lucide-react';

type Receipt = {
  // Define the structure of a receipt as needed
};

type RecordType = {
  id: string | number;
  date: string;
  receipts: Receipt[];
  // Add other fields as needed
};

type RecordListItemProps = {
  record: RecordType;
  isSelected: boolean;
  onToggleSelect: (id: string | number) => void;
  onEdit: (record: RecordType) => void;
  onDelete: (id: string | number) => void;
  onPrint: (id: string | number) => void;
};

function RecordListItem({
  record,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
  onPrint,
}: RecordListItemProps) {
  const totals = CalculationService.calculateTotals({
    ...record,
    cashReceived: String((record as any).cashReceived ?? '0'),
    balanceBF: String((record as any).balanceBF ?? '0'),
  });

  return (
    <div className="border rounded p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(record.id)}
            className="w-5 h-5"
          />
          <div>
            <div className="font-semibold">{record.date}</div>
            <div className="text-sm text-gray-600">
              Total Expenditure: KSh {totals.totalExpenditure.toFixed(2)}
              {' | '}
              Cash Balance:{' '}
<span
  className={
    totals.cashBalance === 0
      ? 'text-green-600'
      : totals.cashBalance < 0
      ? 'text-red-600'
      : 'text-blue-600'
  }
>
  KSh {totals.cashBalance.toFixed(2)}
</span>

              
              
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {record.receipts.length} receipt{record.receipts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPrint(record.id)}
            className="text-green-600 hover:text-green-800"
            title="Print"
          >
            <Printer size={20} />
          </button>
          <button
            onClick={() => onEdit(record)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit"
          >
            <Edit2 size={20} />
          </button>
          <button
            onClick={() => onDelete(record.id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default RecordListItem;