import React, { useState } from 'react';
import { X, Download, Printer, FileText, Calendar, DollarSign, Users, Loader } from 'lucide-react';
import type { PurchaseRecord } from '../../types';
import { PDFService } from '../services/PDFService'

interface PDFPreviewModalProps {
  record: PurchaseRecord;
  onClose: () => void;
}

const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  record,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Use your existing PDFService
  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const blob = PDFService.generateRecordPDF(record);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Purchase_Record_${record.date}_${String(record.id).substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show success message
      setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow z-50';
        successMsg.textContent = 'PDF downloaded successfully!';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 3000);
      }, 100);
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate summary using your existing logic
  const totals = {
    cashTotal: record.receipts
      .filter(r => r.paymentMode === 'cash')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    mpesaTotal: record.receipts
      .filter(r => r.paymentMode === 'mpesa')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    chequeTotal: record.receipts
      .filter(r => r.paymentMode === 'cheque')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    bankTotal: record.receipts
      .filter(r => r.paymentMode === 'bank_transfer')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0)
  };

  const cashAvailable = Number(record.cashReceived || 0) + Number(record.balanceBF || 0);
  const cashBalance = cashAvailable - totals.cashTotal;
  const totalExpenditure = totals.cashTotal + totals.mpesaTotal + totals.chequeTotal + totals.bankTotal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-blue-600" />
              PDF Preview
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Record from {record.date} • {record.receipts.length} receipts
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preview simulating PDF layout */}
          <div className="border border-gray-300 bg-white p-6 mb-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg">
                <h1 className="text-xl font-bold">PURCHASE RECORD</h1>
              </div>
            </div>
            
            {/* Date and Summary */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar size={16} />
                  <span className="font-medium">Date:</span>
                </div>
                <p className="text-lg font-semibold">{record.date}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <DollarSign size={16} />
                  <span className="font-medium">Total Expenditure:</span>
                </div>
                <p className="text-lg font-semibold">KSh {totalExpenditure.toFixed(2)}</p>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Financial Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Cash Received:</span>
                    <span className="font-medium">KSh {Number(record.cashReceived || 0).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Balance B/F:</span>
                    <span className="font-medium">KSh {Number(record.balanceBF || 0).toFixed(2)}</span>
                  </p>
                  <p className="flex justify-between font-bold mt-2 pt-2 border-t">
                    <span>Cash Available:</span>
                    <span>KSh {cashAvailable.toFixed(2)}</span>
                  </p>
                </div>
                <div>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Cash Spent:</span>
                    <span className="font-medium">KSh {totals.cashTotal.toFixed(2)}</span>
                  </p>
                  <p className={`flex justify-between font-bold mt-2 pt-2 border-t ${
                    cashBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>Cash Balance:</span>
                    <span>KSh {cashBalance.toFixed(2)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-300">Payment Methods</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">Cash</div>
                  <div className="font-bold">KSh {totals.cashTotal.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">M-Pesa</div>
                  <div className="font-bold">KSh {totals.mpesaTotal.toFixed(2)}</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">Cheque</div>
                  <div className="font-bold">KSh {totals.chequeTotal.toFixed(2)}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded text-center">
                  <div className="text-sm text-gray-600">Bank Transfer</div>
                  <div className="font-bold">KSh {totals.bankTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Receipts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Receipts</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} />
                  <span>{record.receipts.length} receipt{record.receipts.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {record.receipts.map((receipt, index) => (
                        <tr key={receipt.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{index + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">{receipt.supplier || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              receipt.paymentMode === 'cash' ? 'bg-blue-100 text-blue-800' :
                              receipt.paymentMode === 'mpesa' ? 'bg-green-100 text-green-800' :
                              receipt.paymentMode === 'cheque' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {receipt.paymentMode?.toUpperCase() || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            KSh {Number(receipt.amount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">
                          Total Expenditure:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          KSh {totalExpenditure.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Budget Section (if exists) */}
            {record.totalBudget && Number(record.totalBudget) > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-3">Budget Overview</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Budget</div>
                    <div className="font-bold">KSh {Number(record.totalBudget).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Budget Used</div>
                    <div className="font-bold">KSh {totalExpenditure.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Budget Remaining</div>
                    <div className={`font-bold ${
                      (Number(record.totalBudget) - totalExpenditure) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      KSh {(Number(record.totalBudget) - totalExpenditure).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This preview shows how the PDF will look. The actual PDF generated will have a professional layout suitable for printing and sharing.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
            >
              <X size={18} /> Close Preview
            </button>
            
            <button
              onClick={handlePrint}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Printer size={18} /> Print Preview
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download size={18} /> Download PDF
                </>
              )}
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>The downloaded PDF will be formatted exactly like your existing PDF exports.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFPreviewModal;