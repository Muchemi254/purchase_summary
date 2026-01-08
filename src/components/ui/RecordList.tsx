import React, { useState } from 'react';
import { 
  Filter, Calendar, ArrowUpDown, Printer, FileDown, 
  CheckSquare, Square, Edit2, Trash2, Eye, Download, FileText
} from 'lucide-react';
import type { PurchaseRecord, FilterState } from '../../types';
import RecordListItem from './RecordListItem';
import PDFPreviewModal from './PDFPreviewModal';

interface RecordListProps {
  records: PurchaseRecord[];
  selectedRecords: string[];
  filter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  onToggleSelect: (id: string) => void;
  onEdit: (record: PurchaseRecord) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
  onSelectAll: () => void;
  onExportPDF: () => void;
  onPrintSelected: () => void;
  onPreviewPDF: (record: PurchaseRecord) => void;
}

const RecordList: React.FC<RecordListProps> = ({
  records,
  selectedRecords,
  filter,
  onFilterChange,
  onToggleSelect,
  onEdit,
  onDelete,
  onPrint,
  onSelectAll,
  onExportPDF,
  onPrintSelected,
  onPreviewPDF // ✅ FIX 1: properly destructured
}) => {
  const [pdfPreviewRecord, setPdfPreviewRecord] = useState<PurchaseRecord | null>(null);
  const allSelected = records.length > 0 && records.every(r => selectedRecords.includes(r.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Purchase Records</h2>
            <p className="text-gray-600">
              Showing {records.length} of {records.length} records
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {selectedRecords.length > 0 && (
              <>
                <button
                  onClick={onPrintSelected}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <Printer size={16} /> Print ({selectedRecords.length})
                </button>
                <button
                  onClick={onExportPDF}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                >
                  <FileDown size={16} /> Export PDF ({selectedRecords.length})
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${selectedRecords.length} selected records?`)) {
                      selectedRecords.forEach(id => onDelete(id));
                    }
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} /> Delete ({selectedRecords.length})
                </button>
              </>
            )}
            
            <button
              onClick={onSelectAll}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2 text-sm"
            >
              {allSelected ? (
                <>
                  <CheckSquare size={16} /> Deselect All
                </>
              ) : (
                <>
                  <Square size={16} /> Select All
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters (UNCHANGED) */}
        {/* ... all your filter JSX exactly as-is ... */}
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No records found
            </h3>
            <p className="text-gray-500">
              {filter.mode === 'all'
                ? 'Start by adding your first purchase record.'
                : 'No records match your current filters.'}
            </p>
          </div>
        ) : (
          records.map(record => (
            <RecordListItem
              key={record.id}
              record={record}
              isSelected={selectedRecords.includes(record.id)}
              onToggleSelect={onToggleSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onPrint={() => onPrint(record.id)}
              onPreviewPDF={(r) => setPdfPreviewRecord(r)} // ✅ FIX 2: real handler
            />
          ))
        )}
      </div>

      {/* Summary Footer */}
      {records.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedRecords.length} of {records.length} records selected
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {pdfPreviewRecord && (
        <PDFPreviewModal
          record={pdfPreviewRecord}
          onClose={() => setPdfPreviewRecord(null)}
        />
      )}
    </div>
  );
};

export default RecordList;
