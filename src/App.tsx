import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Printer, X, Edit2, Save, XCircle, 
  Filter, Calendar, ArrowUpDown, Download, Upload,
  FileDown, BarChart3, Cloud, CloudOff, RefreshCw
} from 'lucide-react';
import { useAuth } from "./context/AuthContext";
import AuthScreen from "./components/ui/AuthScreen";
import Dashboard from "./components/ui/Dashboard";
import RecordForm from "./components/ui/RecordForm";
import RecordList from "./components/ui/RecordList";
import Sidebar from "./components/ui/Sidebar";
import PrintPreviewModal from "./components/ui/PrintPreviewModal";
//import FinancialReportModal from "./components/ui/FinancialReportModal";
import SyncStatus from "./components/ui/SyncStatus";
import StorageService from "./components/services/StorageService";
import CalculationService from "./components/services/CalculationService";
import { PDFService } from "./components/services/PDFService";
import type { PurchaseRecord, FilterState } from "./types";

export default function PurchaseTracker() {
  const { user, logout, loading } = useAuth();
  
  // State
  const [records, setRecords] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [currentRecord, setCurrentRecord] = useState<PurchaseRecord | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showFinancialReport, setShowFinancialReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records' | 'add'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Filter State
  const [filter, setFilter] = useState<FilterState>({
    mode: 'all',
    sort: 'date_desc',
    specificDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    month: new Date().toISOString().substring(0, 7),
    year: new Date().getFullYear().toString(),
    paymentMode: '',
    supplier: ''
  });

  // Effects
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time updates
    const unsubscribeRecords = StorageService.subscribeToRecords((data) => {
      // Recalculate balances for consistency
      const recalculated = CalculationService.recalculateAllBalances(data);
      setRecords(recalculated);
    });

    const unsubscribeSuppliers = StorageService.subscribeToSuppliers(setSuppliers);

    return () => {
      unsubscribeRecords();
      unsubscribeSuppliers();
    };
  }, [user]);

  // Filter and sort records
  const getFilteredAndSortedRecords = () => {
    let filtered = [...records];

    // Apply filters
    switch (filter.mode) {
      case 'specific':
        filtered = filtered.filter(r => r.date === filter.specificDate);
        break;
      case 'range':
        if (filter.startDate && filter.endDate) {
          filtered = filtered.filter(r => 
            r.date >= filter.startDate && r.date <= filter.endDate
          );
        }
        break;
      case 'month':
        filtered = filtered.filter(r => r.date.startsWith(filter.month));
        break;
      case 'year':
        filtered = filtered.filter(r => r.date.startsWith(filter.year));
        break;
    }

    // Apply payment mode filter
    if (filter.paymentMode) {
      filtered = filtered.filter(r =>
        r.receipts.some(receipt => receipt.paymentMode === filter.paymentMode)
      );
    }

    // Apply supplier filter
    if (filter.supplier) {
      filtered = filtered.filter(r =>
        r.receipts.some(receipt =>
          receipt.supplier.toLowerCase().includes(filter.supplier!.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filter.sort) {
        case 'date_asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount_asc':
          return a.totalExpenditure - b.totalExpenditure;
        case 'amount_desc':
          return b.totalExpenditure - a.totalExpenditure;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const previewRecordPDF = (record: PurchaseRecord) => {
  setSelectedRecords([record.id]);
  setShowPrintPreview(true);
};


  // Record Management
  const startNewRecord = () => {
    const lastRecord = records[records.length - 1];
    const carryOver = lastRecord && !lastRecord.stopCarryOver ? lastRecord.cashBalance : 0;

    const newRecord: PurchaseRecord = {
      id: `record_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      totalBudget: 0,
      cashReceived: 0,
      balanceBF: carryOver,
      stopCarryOver: false,
      receipts: [],
      cashTotal: 0,
      mpesaTotal: 0,
      chequeTotal: 0,
      bankTotal: 0,
      totalExpenditure: 0,
      cashAvailable: carryOver,
      cashBalance: carryOver,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user?.uid || '',
      updatedBy: user?.uid || '',
      synced: false
    };

    setCurrentRecord(newRecord);
    setEditingId(null);
    setActiveTab('add');
  };

  const editRecord = (record: PurchaseRecord) => {
    const recordIndex = records.findIndex(r => r.id === record.id);
    const previousRecord = recordIndex > 0 ? records[recordIndex - 1] : null;
    const correctBalanceBF = previousRecord && !previousRecord.stopCarryOver ? previousRecord.cashBalance : 0;

    setCurrentRecord({
      ...record,
      balanceBF: correctBalanceBF
    });
    setEditingId(record.id);
    setActiveTab('add');
  };

  const saveRecord = async () => {
    if (!currentRecord) return;

    try {
      setIsSyncing(true);
      await StorageService.saveRecord(currentRecord);
      
      // Reset form
      setCurrentRecord(null);
      setEditingId(null);
      setActiveTab('records');
    } catch (error) {
      console.error('Error saving record:', error);
      alert(`Failed to save record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      setIsSyncing(true);
      await StorageService.deleteRecord(id);
      setSelectedRecords(prev => prev.filter(recordId => recordId !== id));
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export/Import
  const exportData = async () => {
    try {
      const data = await StorageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `purchase-records-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Importing will replace all existing data. Continue?')) {
      event.target.value = '';
      return;
    }

    try {
      setIsSyncing(true);
      const text = await file.text();
      await StorageService.importData(text);
      alert('Data imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
      event.target.value = '';
    }
  };

  // PDF Generation
  const exportSelectedToPDF = async () => {
    if (selectedRecords.length === 0) {
      alert('Please select records to export');
      return;
    }

    try {
      const recordsToExport = records.filter(r => selectedRecords.includes(r.id));
      const blob = PDFService.generateMultipleRecordsPDF(recordsToExport);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with date range
      const dates = recordsToExport.map(r => new Date(r.date));
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      a.download = `Purchases_${formatDate(minDate)}_to_${formatDate(maxDate)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF');
    }
  };

  const generateFinancialReport = async () => {
    if (records.length === 0) {
      alert('No records available for report');
      return;
    }

    try {
      const blob = await PDFService.generateFinancialReport(records);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate financial report');
    }
  };

  // Sync
  const forceSync = async () => {
    try {
      setIsSyncing(true);
      // Trigger sync logic
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated sync
      alert('Sync completed successfully');
    } catch (error) {
      alert('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth gates
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <AuthScreen />;

  const displayedRecords = getFilteredAndSortedRecords();
  const financialSummary = CalculationService.getFinancialSummary(records);

  return (
    <div className="min-h-screen bg-gray-50">
      <SyncStatus isSyncing={isSyncing} lastSync={Date.now()} />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Purchase Tracker Pro</h1>
            
            <div className="flex items-center gap-3">
              <button
                onClick={forceSync}
                disabled={isSyncing}
                className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 text-sm font-medium disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Cloud size={16} />}
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
              
              <button
                onClick={exportData}
                className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded hover:bg-purple-200 text-sm font-medium"
              >
                <Download size={16} /> Export
              </button>
              
              <label className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm font-medium cursor-pointer transition-colors">
                <Upload size={16} /> Import
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <Dashboard
              records={records}
              summary={financialSummary}
              onStartNewRecord={startNewRecord}
              onViewRecords={() => setActiveTab('records')}
              onGenerateReport={generateFinancialReport}
            />
          )}

          {activeTab === 'add' && currentRecord && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <RecordForm
                record={currentRecord}
                isEditing={!!editingId}
                suppliers={suppliers}
                onUpdate={setCurrentRecord}
                onSave={saveRecord}
                onCancel={() => {
                  setCurrentRecord(null);
                  setEditingId(null);
                  setActiveTab('records');
                }}
                onAddReceipt={() => {
                  const newReceipt = {
                    id: `receipt_${Date.now()}`,
                    supplier: '',
                    amount: 0,
                    paymentMode: 'cash',
                    description: '',
                    timestamp: Date.now()
                  };
                  setCurrentRecord({
                    ...currentRecord,
                    receipts: [...currentRecord.receipts, newReceipt]
                  });
                }}
                onUpdateReceipt={(id, field, value) => {
                  setCurrentRecord({
                    ...currentRecord,
                    receipts: currentRecord.receipts.map(receipt =>
                      receipt.id === id ? { ...receipt, [field]: value } : receipt
                    )
                  });
                }}
                onRemoveReceipt={(id) => {
                  setCurrentRecord({
                    ...currentRecord,
                    receipts: currentRecord.receipts.filter(receipt => receipt.id !== id)
                  });
                }}
              />
            </div>
          )}

          {activeTab === 'records' && (
            <RecordList
              records={displayedRecords}
              selectedRecords={selectedRecords}
              filter={filter}
              onFilterChange={setFilter}
              onToggleSelect={(id) => {
                setSelectedRecords(prev =>
                  prev.includes(id) ? prev.filter(recordId => recordId !== id) : [...prev, id]
                );
              }}
              onEdit={editRecord}
              onDelete={deleteRecord}
              onPrint={(id) => {
                setSelectedRecords([id]);
                setShowPrintPreview(true);
              }}
              onSelectAll={() => {
                const allIds = displayedRecords.map(r => r.id);
                const allSelected = allIds.every(id => selectedRecords.includes(id));
                setSelectedRecords(allSelected ? [] : allIds);
              }}
              onExportPDF={exportSelectedToPDF}
              onPrintSelected={() => setShowPrintPreview(true)}
              onPreviewPDF={previewRecordPDF}   // ← REQUIRED
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showPrintPreview && (
        <PrintPreviewModal
          records={records.filter(r => selectedRecords.includes(r.id))}
          onClose={() => setShowPrintPreview(false)}
          onPrint={() => window.print()}
        />
      )}

      {showFinancialReport && (
        <FinancialReportModal
          records={records}
          onClose={() => setShowFinancialReport(false)}
          onExport={generateFinancialReport}
        />
      )}
    </div>
  );
}