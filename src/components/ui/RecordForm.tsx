// RecordForm.tsx
import React, { useEffect, useRef } from 'react';
import { Plus, Save, XCircle } from 'lucide-react';
import ReceiptInput, { type Receipt } from './ReceiptInput';
import CalculationService from '../services/CalculationService';

interface Record {
  date: string;
  totalBudget: number;
  cashReceived: number;
  balanceBF: number;
  stopCarryOver: boolean;
  receipts: Receipt[];
}

interface RecordFormProps {
  record: Record;
  allSuppliers: string[];
  previousRecords: Record[]; // for intelligent payment mode
  isEditing: boolean;
  onUpdate: (updatedRecord: Record) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddReceipt: () => void;
  onUpdateReceipt: (id: string, field: string, value: string | number) => void;
  onUpdateSuggestions: (id: string, suggestions: string[]) => void;
  onSelectSupplier: (id: string, supplier: string) => void;
  onRemoveReceipt: (id: string) => void;
}

const RecordForm: React.FC<RecordFormProps> = ({
  record,
  allSuppliers,
  previousRecords,
  isEditing,
  onUpdate,
  onSave,
  onCancel,
  onAddReceipt,
  onUpdateReceipt,
  onUpdateSuggestions,
  onSelectSupplier,
  onRemoveReceipt
}) => {
  const totals = CalculationService.calculateTotals({
    ...record,
    cashReceived: String(record.cashReceived),
    balanceBF: String(record.balanceBF)
  });

  const formRef = useRef<HTMLDivElement>(null);

  // Normalize date
  useEffect(() => {
    if (!record.date) return;
    const normalizedDate = new Date(record.date).toISOString().split('T')[0];
    if (normalizedDate !== record.date) {
      onUpdate({ ...record, date: normalizedDate });
    }
  }, [record.date, onUpdate]);

  // Override default browser shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onAddReceipt();
        setTimeout(() => {
          const lastInput = formRef.current?.querySelector<HTMLInputElement>('input[placeholder="Supplier name"]:last-of-type');
          lastInput?.focus();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAddReceipt]);

  // Intelligent default payment mode based on previous records
  useEffect(() => {
    record.receipts.forEach((r) => {
      if (!r.paymentMode && r.supplier) {
        const recentMethods: string[] = [];
        previousRecords.forEach(pr =>
          pr.receipts.forEach(rec => {
            if (rec.supplier === r.supplier && rec.paymentMode) recentMethods.push(rec.paymentMode);
          })
        );
        if (recentMethods.length > 0) {
          const counts = recentMethods.reduce<Record<string, number>>((acc, m) => {
            acc[m] = (acc[m] || 0) + 1;
            return acc;
          }, {});
          const maxMethod = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
          onUpdateReceipt(r.id, 'paymentMode', maxMethod);
        }
      }
    });
  }, [record.receipts, previousRecords, onUpdateReceipt]);

  return (
    <div ref={formRef}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{isEditing ? 'Edit Record' : 'New Record'}</h2>
        {isEditing && <span className="text-sm text-gray-600">Editing record from {record.date}</span>}
        <button onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center gap-2">
          <XCircle size={18} /> Cancel
        </button>
      </div>

      {/* Date / Budget / Cash */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={record.date}
            onChange={(e) => onUpdate({ ...record, date: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Total Budget (Optional)</label>
          <input
            type="number"
            value={record.totalBudget}
            onChange={(e) => onUpdate({ ...record, totalBudget: Number(e.target.value) })}
            className="w-full border rounded px-3 py-2"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cash Received</label>
          <input
            type="number"
            value={record.cashReceived}
            onChange={(e) => onUpdate({ ...record, cashReceived: Number(e.target.value) })}
            className="w-full border rounded px-3 py-2"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Balance B/F</label>
          <input
            type="number"
            value={record.balanceBF}
            readOnly
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
      </div>

      {/* Stop Carry-over */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={record.stopCarryOver}
          onChange={(e) => onUpdate({ ...record, stopCarryOver: e.target.checked })}
          className="w-4 h-4"
        />
        <label className="text-sm">Stop balance carry-over (handed back to accounting)</label>
      </div>

      {/* Receipts */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Receipts</h3>
          <button onClick={onAddReceipt} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1 text-sm">
            <Plus size={16} /> Add Receipt
          </button>
        </div>

        <div className="space-y-3">
          {record.receipts.map((receipt) => (
            <ReceiptInput
              key={receipt.id}
              receipt={receipt}
              allSuppliers={allSuppliers}
              onUpdateReceipt={onUpdateReceipt}
              onUpdateSuggestions={onUpdateSuggestions}
              onSelectSupplier={onSelectSupplier}
              onRemove={onRemoveReceipt}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
          <button onClick={onAddReceipt} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1 text-sm">
            <Plus size={16} /> Add Receipt
          </button>
        </div>
        <h3 className="font-semibold mb-2">Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Cash Available: KSh {totals.cashAvailable.toFixed(2)}</div>
          <div>Cash Spent: KSh {totals.cashTotal.toFixed(2)}</div>
          <div className={totals.cashBalance >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
            Cash Balance: KSh {totals.cashBalance.toFixed(2)}
          </div>
          <div>M-Pesa: KSh {totals.mpesaTotal.toFixed(2)}</div>
          <div>Cheque: KSh {totals.chequeTotal.toFixed(2)}</div>
          <div className="font-semibold">Total Expenditure: KSh {totals.totalExpenditure.toFixed(2)}</div>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-2">
        <button onClick={onSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2">
          <Save size={18} /> {isEditing ? 'Update Record' : 'Save Record'}
        </button>
        <button onClick={onCancel} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 flex items-center gap-2">
          <XCircle size={18} /> Cancel
        </button>
      </div>
    </div>
  );
};

export default RecordForm;
