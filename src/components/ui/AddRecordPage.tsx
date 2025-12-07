// components/pages/AddRecordPage.jsx
import React from 'react';
import RecordForm from '../ui/RecordForm';

export default function AddRecordPage({
  currentRecord,
  editingId,
  records,
  startNewRecord,
  saveRecord,
  updateReceipt,
  addReceipt,
  selectSupplier,
  removeReceipt,
  suppliers
}) {

  const recent = [...records].slice(-4).reverse();

  return (
    <div className="bg-white p-6 rounded shadow">
      {!currentRecord && (
        <>
          <button
            onClick={startNewRecord}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New Record
          </button>

          {recent.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Recent Records</h2>
              <div className="space-y-3">
                {recent.map(r => (
                  <div key={r.id} className="border rounded p-3 bg-gray-50">
                    <div><strong>Date:</strong> {r.date}</div>
                    <div><strong>Balance:</strong> {r.cashBalance}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {currentRecord && (
        <RecordForm
          record={currentRecord}
          isEditing={!!editingId}
          onUpdate={() => {}} // handled by parent
          onSave={saveRecord}
          onCancel={() => window.location.reload()}
          onAddReceipt={addReceipt}
          onUpdateReceipt={updateReceipt}
          onSelectSupplier={selectSupplier}
          onRemoveReceipt={removeReceipt}
        />
      )}
    </div>
  );
}
