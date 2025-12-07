// ReceiptInput.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';

export interface Receipt {
  id: string;
  supplier: string;
  supplierSuggestions?: string[];
  amount?: string | number;
  paymentMode: string;
}

interface ReceiptInputProps {
  receipt: Receipt;
  allSuppliers: string[];
  onUpdateReceipt: (id: string, field: string, value: string | number) => void;
  onUpdateSuggestions: (id: string, suggestions: string[]) => void;
  onSelectSupplier: (id: string, supplier: string) => void;
  onRemove: (id: string) => void;
}

const ReceiptInput: React.FC<ReceiptInputProps> = ({
  receipt,
  allSuppliers,
  onUpdateReceipt,
  onUpdateSuggestions,
  onSelectSupplier,
  onRemove
}) => {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setHighlightIndex(0), [receipt.supplierSuggestions?.length]);

  const handleSupplierChange = (value: string) => {
    onUpdateReceipt(receipt.id, 'supplier', value);

    const suggestions = allSuppliers.filter(s =>
      s.toLowerCase().includes(value.toLowerCase())
    );
    onUpdateSuggestions(receipt.id, suggestions);
    setHighlightIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!receipt.supplierSuggestions || receipt.supplierSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % receipt.supplierSuggestions!.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev === 0 ? receipt.supplierSuggestions!.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSelectSupplier(receipt.id, receipt.supplierSuggestions[highlightIndex]);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      onUpdateSuggestions(receipt.id, [...allSuppliers]);
    }
  };

  return (
    <div className="border rounded p-3 bg-gray-50">
      <div className="grid grid-cols-12 gap-2">
        {/* Supplier */}
        <div className="col-span-5 relative">
          <input
            ref={supplierInputRef}
            type="text"
            value={receipt.supplier}
            onChange={(e) => handleSupplierChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Supplier name"
            className="w-full border rounded px-2 py-1 text-sm"
            autoFocus
          />
          {receipt.supplierSuggestions && receipt.supplierSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg max-h-40 overflow-y-auto">
              {receipt.supplierSuggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => onSelectSupplier(receipt.id, s)}
                  className={`px-2 py-1 cursor-pointer text-sm ${
                    i === highlightIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="col-span-3">
          <input
            type="number"
            value={receipt.amount}
            onChange={(e) => onUpdateReceipt(receipt.id, 'amount', e.target.value)}
            placeholder="Amount"
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {/* Payment Mode */}
        <div className="col-span-3">
          <select
            value={receipt.paymentMode}
            onChange={(e) => onUpdateReceipt(receipt.id, 'paymentMode', e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>

        {/* Remove */}
        <div className="col-span-1 flex justify-center items-center">
          <button onClick={() => onRemove(receipt.id)} className="text-red-600 hover:text-red-800">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptInput;
