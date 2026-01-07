import React, { useState, useEffect } from 'react';
import { Plus, Save, XCircle, Calculator, History } from 'lucide-react';
import type { PurchaseRecord } from '../../types';
import CalculationService from '../services/CalculationService';

interface ReceiptInput {
  id: string;
  supplier: string;
  amount: number;
  paymentMode: 'cash' | 'mpesa' | 'cheque' | 'bank_transfer';
  description: string;
}

interface RecordFormProps {
  record: PurchaseRecord;
  isEditing: boolean;
  suppliers: any[];
  onUpdate: (record: PurchaseRecord) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddReceipt: () => void;
  onUpdateReceipt: (id: string, field: string, value: any) => void;
  onRemoveReceipt: (id: string) => void;
}

const RecordForm: React.FC<RecordFormProps> = ({
  record,
  isEditing,
  suppliers,
  onUpdate,
  onSave,
  onCancel,
  onAddReceipt,
  onUpdateReceipt,
  onRemoveReceipt
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<string[]>([]);
  const [activeReceiptIndex, setActiveReceiptIndex] = useState<number>(-1);

  const totals = CalculationService.calculateRecord(record);

  // Validate form
  const validateForm = () => {
    const validation = CalculationService.validateRecord(record);
    setErrors(validation.errors);
    return validation.isValid;
  };

  // Handle save
  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  // Get supplier suggestions
  const getSupplierSuggestions = (input: string) => {
    if (!input.trim()) {
      setSuggestedSuppliers([]);
      return;
    }
    
    const suggestions = suppliers
      .filter(s => 
        s.name.toLowerCase().includes(input.toLowerCase())
      )
      .map(s => s.name)
      .slice(0, 5);
    
    setSuggestedSuppliers(suggestions);
  };

  // Auto-suggest payment mode based on supplier
  const suggestPaymentMode = (supplierName: string, receiptId: string) => {
    const supplier = suppliers.find(s => s.name === supplierName);
    if (supplier && supplier.paymentPreferences?.length > 0) {
      // Use the most common payment mode for this supplier
      const preferredMode = supplier.paymentPreferences[0];
      onUpdateReceipt(receiptId, 'paymentMode', preferredMode);
    }
  };

  // Handle supplier input change
  const handleSupplierChange = (receiptId: string, value: string) => {
    onUpdateReceipt(receiptId, 'supplier', value);
    getSupplierSuggestions(value);
    
    // Suggest payment mode after a short delay
    setTimeout(() => {
      suggestPaymentMode(value, receiptId);
    }, 300);
  };

  // Calculate totals for display
  const calculateTotals = () => {
    return {
      cashTotal: totals.cashTotal,
      mpesaTotal: totals.mpesaTotal,
      chequeTotal: totals.chequeTotal,
      bankTotal: totals.bankTotal || 0,
      totalExpenditure: totals.totalExpenditure,
      cashAvailable: totals.cashAvailable,
      cashBalance: totals.cashBalance,
      budgetUsed: totals.totalBudgetUsed || 0,
      budgetRemaining: totals.budgetRemaining || 0
    };
  };

  const formTotals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Purchase Record' : 'New Purchase Record'}
          </h2>
          <p className="text-gray-600 text-sm">
            {record.date} • {record.receipts.length} receipts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={20} /> {isEditing ? 'Update' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 flex items-center gap-2"
          >
            <XCircle size={20} /> Cancel
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside text-red-600">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={record.date}
              onChange={(e) => onUpdate({ ...record, date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Budget (Optional)
            </label>
            <input
              type="number"
              value={record.totalBudget || ''}
              onChange={(e) => onUpdate({ ...record, totalBudget: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash Received *
            </label>
            <input
              type="number"
              value={record.cashReceived}
              onChange={(e) => onUpdate({ ...record, cashReceived: Number(e.target.value) || 0 })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Balance Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Balance Brought Forward
            </label>
            <input
              type="number"
              value={record.balanceBF}
              readOnly
              className="w-full border rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              id="stopCarryOver"
              checked={record.stopCarryOver}
              onChange={(e) => onUpdate({ ...record, stopCarryOver: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="stopCarryOver" className="ml-2 text-sm text-gray-700">
              Stop balance carry-over (handed back to accounting)
            </label>
          </div>
        </div>
      </div>

      {/* Receipts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Receipts</h3>
          <button
            onClick={onAddReceipt}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={20} /> Add Receipt
          </button>
        </div>

        {record.receipts.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 mb-4">No receipts added yet</p>
            <button
              onClick={onAddReceipt}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Add First Receipt
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {record.receipts.map((receipt, index) => (
              <div
                key={receipt.id}
                className={`border rounded-lg p-4 ${
                  activeReceiptIndex === index ? 'border-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setActiveReceiptIndex(index)}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Supplier */}
                  <div className="md:col-span-5 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier *
                    </label>
                    <input
                      type="text"
                      value={receipt.supplier}
                      onChange={(e) => handleSupplierChange(receipt.id, e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter supplier name"
                      required
                    />
                    {suggestedSuppliers.length > 0 && activeReceiptIndex === index && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                        {suggestedSuppliers.map((supplier, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              onUpdateReceipt(receipt.id, 'supplier', supplier);
                              setSuggestedSuppliers([]);
                            }}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          >
                            {supplier}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={receipt.amount || ''}
                      onChange={(e) => onUpdateReceipt(receipt.id, 'amount', Number(e.target.value) || 0)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Payment Mode */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={receipt.paymentMode}
                      onChange={(e) => onUpdateReceipt(receipt.id, 'paymentMode', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* Remove */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      onClick={() => onRemoveReceipt(receipt.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Remove receipt"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-12">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={receipt.description || ''}
                      onChange={(e) => onUpdateReceipt(receipt.id, 'description', e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of purchase"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator size={20} /> Financial Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cash Flow */}
          <div className="space-y-3">
            <h4 className="font-medium text-blue-800">Cash Flow</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Received:</span>
                <span className="font-medium">KSh {record.cashReceived.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Balance B/F:</span>
                <span className="font-medium">KSh {record.balanceBF.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Cash Available:</span>
                <span>KSh {formTotals.cashAvailable.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Spent:</span>
                <span className="font-medium">KSh {formTotals.cashTotal.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between text-lg font-bold ${
                formTotals.cashBalance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>Cash Balance:</span>
                <span>KSh {formTotals.cashBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h4 className="font-medium text-blue-800">Payment Methods</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cash Total:</span>
                <span>KSh {formTotals.cashTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">M-Pesa Total:</span>
                <span>KSh {formTotals.mpesaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cheque Total:</span>
                <span>KSh {formTotals.chequeTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bank Total:</span>
                <span>KSh {formTotals.bankTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-3">
            <h4 className="font-medium text-blue-800">Totals</h4>
            <div className="space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Total Expenditure:</span>
                <span>KSh {formTotals.totalExpenditure.toFixed(2)}</span>
              </div>
              
              {record.totalBudget > 0 && (
                <>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Budget:</span>
                      <span>KSh {record.totalBudget.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget Used:</span>
                      <span>KSh {formTotals.budgetUsed.toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between font-semibold ${
                      formTotals.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span>Budget Remaining:</span>
                      <span>KSh {formTotals.budgetRemaining.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          <button
            onClick={onCancel}
            className="bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 flex items-center gap-2"
          >
            <XCircle size={20} /> Cancel
          </button>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onAddReceipt}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={20} /> Add Another Receipt
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={20} /> {isEditing ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordForm;