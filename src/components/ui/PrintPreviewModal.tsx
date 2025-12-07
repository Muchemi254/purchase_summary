// Print Preview Modal Component

import { X } from 'lucide-react';
import PrintLayout from './PrintLayout';

interface PrintPreviewModalProps {
  records: any[];
  onClose: () => void;
  onPrint: () => void;
}

function PrintPreviewModal({ records, onClose, onPrint }: PrintPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Print Preview</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="mb-4">
          <button
            onClick={onPrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Print
          </button>
        </div>
        <div className="border p-4">
          <PrintLayout records={records} />
        </div>
      </div>
    </div>
  );
}

export default PrintPreviewModal;