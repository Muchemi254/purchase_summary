// components/pages/ViewRecordsPage.jsx
import React, { useState, useMemo } from 'react';
import RecordListItem from '../ui/RecordListItem';

export default function ViewRecordsPage({
  records,
  selectedRecords,
  toggleRecordSelection,
  onEdit,
  onDelete,
  onPrint,
  setShowPrintPreview
}) {
  const [filterPeriod, setFilterPeriod] = useState({ start: '', end: '' });
  const [sortOption, setSortOption] = useState('date'); // date | month | year

  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    const { start, end } = filterPeriod;

    if (start) filtered = filtered.filter(r => new Date(r.date) >= new Date(start));
    if (end) filtered = filtered.filter(r => new Date(r.date) <= new Date(end));

    return filtered;
  }, [records, filterPeriod]);

  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords];
    if (sortOption === 'date') {
      sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === 'month') {
      sorted.sort((a, b) => {
        const da = new Date(a.date), db = new Date(b.date);
        return da.getMonth() - db.getMonth() || da.getFullYear() - db.getFullYear();
      });
    } else if (sortOption === 'year') {
      sorted.sort((a, b) => new Date(b.date).getFullYear() - new Date(a.date).getFullYear());
    }
    return sorted;
  }, [filteredRecords, sortOption]);

  const groupedRecords = useMemo(() => {
    return sortedRecords.reduce((acc, r) => {
      const d = new Date(r.date);
      const year = d.getFullYear();
      const month = d.toLocaleString('default', { month: 'long' });

      if (!acc[year]) acc[year] = {};
      if (!acc[year][month]) acc[year][month] = [];
      acc[year][month].push(r);
      return acc;
    }, {});
  }, [sortedRecords]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex gap-2">
          <label>
            Start Date: 
            <input
              type="date"
              value={filterPeriod.start}
              onChange={e => setFilterPeriod({...filterPeriod, start: e.target.value})}
              className="ml-1 border rounded px-2 py-1"
            />
          </label>
          <label>
            End Date: 
            <input
              type="date"
              value={filterPeriod.end}
              onChange={e => setFilterPeriod({...filterPeriod, end: e.target.value})}
              className="ml-1 border rounded px-2 py-1"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <label>
            Sort By: 
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="ml-1 border rounded px-2 py-1"
            >
              <option value="date">Date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </label>
          {selectedRecords.length > 0 && (
            <button
              onClick={() => setShowPrintPreview(true)}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              Print Selected ({selectedRecords.length})
            </button>
          )}
        </div>
      </div>

      {Object.keys(groupedRecords).length === 0 ? (
        <div className="text-gray-600">No records available.</div>
      ) : (
        Object.keys(groupedRecords).sort((a, b) => b - a).map(year => (
          <div key={year} className="mb-6">
            <h2 className="text-2xl font-bold mb-3">{year}</h2>
            {Object.keys(groupedRecords[year]).map(month => (
              <div key={month} className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{month}</h3>
                <div className="space-y-3">
                  {groupedRecords[year][month].map(record => (
                    <RecordListItem
                      key={record.id}
                      record={record}
                      isSelected={selectedRecords.includes(record.id)}
                      onToggleSelect={toggleRecordSelection}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onPrint={onPrint}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
