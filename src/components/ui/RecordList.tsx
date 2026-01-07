import React from 'react';
import { 
  Filter, Calendar, ArrowUpDown, Printer, FileDown, 
  CheckSquare, Square, Edit2, Trash2, Eye, Download
} from 'lucide-react';
import type { PurchaseRecord, FilterState } from '../../types';
import RecordListItem from './RecordListItem';

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
  onPrintSelected
}) => {
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

        {/* Filter Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filter Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter By
              </label>
              <select
                value={filter.mode}
                onChange={(e) => onFilterChange({...filter, mode: e.target.value as any})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Dates</option>
                <option value="specific">Specific Date</option>
                <option value="range">Date Range</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Date Inputs */}
            {filter.mode === 'specific' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={filter.specificDate}
                  onChange={(e) => onFilterChange({...filter, specificDate: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {filter.mode === 'range' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => onFilterChange({...filter, startDate: e.target.value})}
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="self-center text-gray-400">to</span>
                  <input
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => onFilterChange({...filter, endDate: e.target.value})}
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {filter.mode === 'month' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <input
                  type="month"
                  value={filter.month}
                  onChange={(e) => onFilterChange({...filter, month: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {filter.mode === 'year' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={filter.year}
                  onChange={(e) => onFilterChange({...filter, year: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filter.sort}
                onChange={(e) => onFilterChange({...filter, sort: e.target.value as any})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date_desc">Date (Newest First)</option>
                <option value="date_asc">Date (Oldest First)</option>
                <option value="amount_desc">Amount (Highest First)</option>
                <option value="amount_asc">Amount (Lowest First)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Mode
              </label>
              <select
                value={filter.paymentMode || ''}
                onChange={(e) => onFilterChange({...filter, paymentMode: e.target.value || undefined})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modes</option>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={filter.supplier || ''}
                onChange={(e) => onFilterChange({...filter, supplier: e.target.value || undefined})}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Filter by supplier"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="space-y-4">
        {records.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 mb-4">
              <Calendar size={48} className="mx-auto" />
            </div>
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
              onPrint={onPrint}
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
            <div className="flex gap-2 mt-2 md:mt-0">
              <button
                onClick={() => {
                  const selected = records.filter(r => selectedRecords.includes(r.id));
                  const totalExpenditure = selected.reduce((sum, r) => sum + r.totalExpenditure, 0);
                  alert(`Total expenditure for selected records: KSh ${totalExpenditure.toFixed(2)}`);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Selected Summary
              </button>
              <button
                onClick={() => {
                  // Export selected as CSV
                  const csv = selectedRecords.map(id => {
                    const record = records.find(r => r.id === id);
                    return record ? `${record.date},${record.totalExpenditure},${record.cashBalance}` : '';
                  }).join('\n');
                  
                  const blob = new Blob([`Date,Total Expenditure,Cash Balance\n${csv}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `selected_records_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Export Selected as CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordList;