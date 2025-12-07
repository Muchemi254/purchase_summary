import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Printer, X, Edit2, Save, XCircle, 
  Filter, Calendar, ArrowUpDown, Download, Upload 
} from 'lucide-react';
import StorageService from './components/services/StorageService';
import CalculationService from './components/services/CalculationService';
import RecordForm from './components/ui/RecordForm';
import RecordListItem from './components/ui/RecordListItem';
import PrintPreviewModal from './components/ui/PrintPreviewModal';
import PrintLayout from './components/ui/PrintLayout';
import { FileDown } from 'lucide-react';

export default function PurchaseTracker() {
  // Data State
  const [records, setRecords] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // UI/Form State
  const [currentRecord, setCurrentRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);

  // Filter & Sort State
  const [filter, setFilter] = useState({
    mode: 'all', // 'all', 'specific', 'range'
    sort: 'desc', // 'asc', 'desc'
    specificDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedRecords = await StorageService.loadRecords();
    const loadedSuppliers = await StorageService.loadSuppliers();
    setRecords(loadedRecords);
    setSuppliers(loadedSuppliers);
  };

  const saveData = async (newRecords, newSuppliers) => {
    await StorageService.save(newRecords, newSuppliers);
  };

  // --- Filtering & Sorting Logic ---
// --- Filtering & Sorting Logic ---
const getFilteredAndSortedRecords = () => {
  let result = [...records];

  // 1. Filter
  if (filter.mode === 'specific' && filter.specificDate) {
    result = result.filter(r => r.date === filter.specificDate);
  } else if (filter.mode === 'range' && filter.startDate && filter.endDate) {
    result = result.filter(r => r.date >= filter.startDate && r.date <= filter.endDate);
  }

  // 2. Sort (MATCH CalculationService)
  result.sort((a, b) => {
    const dA = new Date(a.date).getTime();
    const dB = new Date(b.date).getTime();

    // primary sort: date
    if (dA !== dB) {
      return filter.sort === 'desc'
        ? dB - dA
        : dA - dB;
    }

    // secondary sort: id (tie breaker)
    return filter.sort === 'desc'
      ? String(b.id).localeCompare(String(a.id))
      : String(a.id).localeCompare(String(b.id));
  });

  return result;
};

  // --- Record Management ---
  const startNewRecord = () => {
    const lastRecord = records[records.length - 1];
    const carryOver = lastRecord && !lastRecord.stopCarryOver ? lastRecord.cashBalance : 0;
    
    setCurrentRecord({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      totalBudget: '',
      cashReceived: '',
      balanceBF: carryOver,
      receipts: [],
      stopCarryOver: false
    });
    setEditingId(null);
  };

  const editRecord = (record) => {
    const recordIndex = records.findIndex(r => r.id === record.id);
    const previousRecord = recordIndex > 0 ? records[recordIndex - 1] : null;
    const correctBalanceBF = previousRecord && !previousRecord.stopCarryOver ? previousRecord.cashBalance : 0;
    
    setCurrentRecord({
      ...record,
      balanceBF: correctBalanceBF,
      receipts: record.receipts.map(r => ({ ...r, supplierSuggestions: [] }))
    });
    setEditingId(record.id);
    
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addReceipt = () => {
    setCurrentRecord({
      ...currentRecord,
      receipts: [...currentRecord.receipts, { 
        id: Date.now(), 
        supplier: '', 
        amount: '', 
        paymentMode: 'cash',
        supplierSuggestions: []
      }]
    });
  };

  const updateReceipt = (id, field, value) => {
    const updatedReceipts = currentRecord.receipts.map(r => {
      if (r.id === id) {
        if (field === 'supplier') {
          const suggestions = suppliers.filter(s => 
            s.toLowerCase().includes(value.toLowerCase())
          );
          return { ...r, [field]: value, supplierSuggestions: suggestions };
        }
        return { ...r, [field]: value };
      }
      return r;
    });
    setCurrentRecord({ ...currentRecord, receipts: updatedReceipts });
  };

  const selectSupplier = (receiptId, supplier) => {
    const updatedReceipts = currentRecord.receipts.map(r => {
      if (r.id === receiptId) {
        return { ...r, supplier, supplierSuggestions: [] };
      }
      return r;
    });
    setCurrentRecord({ ...currentRecord, receipts: updatedReceipts });
  };

  const removeReceipt = (id) => {
    setCurrentRecord({
      ...currentRecord,
      receipts: currentRecord.receipts.filter(r => r.id !== id)
    });
  };

const exportSelectedToPDF = async () => {
  const recordsToExport = selectedRecords.map(id =>
    displayedRecords.find(r => r.id === id)
  );

  if (!recordsToExport.length) return;

  // Determine earliest and latest dates
  const dates = recordsToExport.map(r => new Date(r.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  // Format dates as YYYY-MM-DD
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;

  const filename = `Purchases_${formatDate(minDate)}_to_${formatDate(maxDate)}.pdf`;

  const payload = { records: recordsToExport };

  const response = await fetch("http://localhost:8000/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) return alert("Failed to generate PDF");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // Use the dynamic filename
  a.click();
  URL.revokeObjectURL(url);
};

  const saveRecord = () => {
    const totals = CalculationService.calculateTotals(currentRecord);
    const recordToSave = { ...currentRecord, ...totals };
    
    const newSuppliers = [...suppliers];
    currentRecord.receipts.forEach(r => {
      if (r.supplier && !newSuppliers.includes(r.supplier)) {
        newSuppliers.push(r.supplier);
      }
    });
    
    let newRecords;
    if (editingId) {
      newRecords = records.map(r => r.id === editingId ? recordToSave : r);
      newRecords = CalculationService.recalculateBalances(newRecords);
    } else {
      newRecords = [...records, recordToSave];
    }
    
    setRecords(newRecords);
    setSuppliers(newSuppliers);
    saveData(newRecords, newSuppliers);
    setCurrentRecord(null);
    setEditingId(null);
  };

  const deleteRecord = (id) => {
    if(!window.confirm("Are you sure you want to delete this record?")) return;
    let newRecords = records.filter(r => r.id !== id);
    newRecords = CalculationService.recalculateBalances(newRecords);
    setRecords(newRecords);
    saveData(newRecords, suppliers);
  };

  const toggleRecordSelection = (id) => {
    setSelectedRecords(prev => 
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  // --- Export/Import/Print ---
  const printRecord = (id) => {
    setSelectedRecords([id]);
    setShowPrintPreview(true);
  };

  const printSummary = () => {
    window.print();
  };

  const exportData = () => {
    const data = { records, suppliers, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-records-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.records && data.suppliers) {
            setRecords(data.records);
            setSuppliers(data.suppliers);
            saveData(data.records, data.suppliers);
            alert('Data imported successfully!');
          }
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const displayedRecords = getFilteredAndSortedRecords();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
          <h1 className="text-2xl font-bold text-gray-800">Purchase Summary Tracker</h1>
          <div className="flex gap-2">
            <button onClick={exportData} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded hover:bg-purple-200 text-sm font-medium">
              <Download size={16} /> Export
            </button>
            <label className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm font-medium cursor-pointer transition-colors">
              <Upload size={16} /> Import
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Main Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:hidden">
          
          {/* LEFT COLUMN: Add/Edit Form (Span 5) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sticky top-4">
            <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-blue-500">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Edit2 size={20} className="text-blue-500"/> 
                {editingId ? 'Edit Record' : 'Record Entry'}
              </h2>

              {!currentRecord ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 mb-4">No record currently active.</p>
                  <button
                    onClick={startNewRecord}
                    className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto font-medium"
                  >
                    <Plus size={20} /> Create New Record
                  </button>
                </div>
              ) : (
                <RecordForm
                  record={currentRecord}
                  isEditing={!!editingId}
                  onUpdate={setCurrentRecord}
                  onSave={saveRecord}
                  onCancel={() => {
                    setCurrentRecord(null);
                    setEditingId(null);
                  }}
                  onAddReceipt={addReceipt}
                  onUpdateReceipt={updateReceipt}
                  onSelectSupplier={selectSupplier}
                  onRemoveReceipt={removeReceipt}
                />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Records List (Span 7) */}
          <div className="lg:col-span-7 flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-2">
            
            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 border-b border-gray-100">
              <div className="flex flex-col gap-4">
                
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Filter size={20} className="text-gray-500"/> 
                    Records ({displayedRecords.length})
                  </h2>

                  <div className="flex gap-2">
                    {selectedRecords.length > 0 && (
                      <button
                            onClick={() => setShowPrintPreview(true)}
                            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 flex items-center gap-1"
                          >
                            <Printer size={16} /> Print ({selectedRecords.length})
                          </button>
                        )}
                        {selectedRecords.length > 0 && (
  <button
    onClick={exportSelectedToPDF}
    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
  >
    <FileDown size={16} /> PDF ({selectedRecords.length})
  </button>
)}


  {/* Select All / Deselect All Button */}
  {displayedRecords.length > 0 && (
    <button
      onClick={() => {
        const allIds = displayedRecords.map(r => r.id);
        const allSelected = allIds.every(id => selectedRecords.includes(id));
        setSelectedRecords(allSelected ? [] : allIds);
      }}
      className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-300 flex items-center gap-1"
    >
      {displayedRecords.length === selectedRecords.length ? 'Deselect All' : 'Select All'}
    </button>
  )}
</div>

                 
                </div>

                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  
                  {/* Mode Selector */}
                  <select 
                    value={filter.mode}
                    onChange={(e) => setFilter({...filter, mode: e.target.value})}
                    className="p-2 border rounded text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Show All Dates</option>
                    <option value="specific">Specific Date</option>
                    <option value="range">Date Range</option>
                  </select>

                  {/* Date Inputs based on Mode */}
                  {filter.mode === 'specific' && (
                    <input 
                      type="date" 
                      value={filter.specificDate}
                      onChange={(e) => setFilter({...filter, specificDate: e.target.value})}
                      className="p-2 border rounded text-sm"
                    />
                  )}

                  {filter.mode === 'range' && (
                    <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-2">
                      <input 
                        type="date" 
                        placeholder="Start"
                        value={filter.startDate}
                        onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                        className="p-2 border rounded text-sm w-full"
                      />
                      <span className="self-center text-gray-400">-</span>
                      <input 
                        type="date" 
                        placeholder="End"
                        value={filter.endDate}
                        onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                        className="p-2 border rounded text-sm w-full"
                      />
                    </div>
                  )}

                  {/* Sort Toggle */}
                  <button 
                    onClick={() => setFilter(prev => ({...prev, sort: prev.sort === 'asc' ? 'desc' : 'asc'}))}
                    className="flex items-center justify-center gap-2 p-2 border rounded text-sm hover:bg-gray-50"
                  >
                    <ArrowUpDown size={14} />
                    {filter.sort === 'desc' ? 'Newest First' : 'Oldest First'}
                  </button>
                </div>
              </div>
            </div>

            {/* Records List Area */}
            <div className="space-y-4">
              {displayedRecords.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-lg">
                  No records match your filters.
                </div>
              ) : (
                displayedRecords.map(record => (
                  <RecordListItem
                    key={record.id}
                    record={record}
                    isSelected={selectedRecords.includes(record.id)}
                    onToggleSelect={toggleRecordSelection}
                    onEdit={editRecord}
                    onDelete={deleteRecord}
                    onPrint={printRecord}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Modals */}
      {showPrintPreview && (
        <PrintPreviewModal
          records={records.filter(r => selectedRecords.includes(r.id))}
          onClose={() => setShowPrintPreview(false)}
          onPrint={printSummary}
        />
      )}

      <div className="hidden print:block">
        <PrintLayout records={records.filter(r => selectedRecords.includes(r.id))} />
      </div>
    </div>
  );
}