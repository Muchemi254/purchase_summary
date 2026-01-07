import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PurchaseRecord } from '../../types/index';

export class PDFService {
  /** Helper to safely convert any value to number */
  private static num(value: any): number {
    return Number(value || 0);
  }

  static generateRecordPDF(record: PurchaseRecord): Blob {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('PURCHASE RECORD', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Date: ${record.date}`, 20, 35);
    doc.text(`Record ID: ${record.id}`, 20, 42);

    // Summary
    doc.setFontSize(14);
    doc.text('FINANCIAL SUMMARY', 20, 55);

    doc.setFontSize(11);
    const summaryY = 65;
    doc.text(`Cash Received: KSh ${this.num(record.cashReceived).toFixed(2)}`, 20, summaryY);
    doc.text(`Balance B/F: KSh ${this.num(record.balanceBF).toFixed(2)}`, 20, summaryY + 7);
    doc.text(`Cash Available: KSh ${this.num(record.cashAvailable).toFixed(2)}`, 20, summaryY + 14);
    doc.text(`Cash Spent: KSh ${this.num(record.cashTotal).toFixed(2)}`, 20, summaryY + 21);
    doc.text(`Cash Balance: KSh ${this.num(record.cashBalance).toFixed(2)}`, 20, summaryY + 28);

    if (record.totalBudget) {
      doc.text(`Total Budget: KSh ${this.num(record.totalBudget).toFixed(2)}`, 120, summaryY);
      doc.text(`Budget Used: KSh ${this.num(record.totalBudgetUsed).toFixed(2)}`, 120, summaryY + 7);
      doc.text(`Budget Remaining: KSh ${this.num(record.budgetRemaining).toFixed(2)}`, 120, summaryY + 14);
    }

    // Receipts Table
    doc.setFontSize(14);
    doc.text('RECEIPTS', 20, summaryY + 45);

    const tableData = (record.receipts || []).map((receipt, index) => [
      index + 1,
      receipt.supplier || '-',
      (receipt.paymentMode || '-').toUpperCase(),
      `KSh ${this.num(receipt.amount).toFixed(2)}`,
      receipt.description || '-'
    ]);

    autoTable(doc, {
      startY: summaryY + 50,
      head: [['#', 'Supplier', 'Payment Mode', 'Amount', 'Description']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`,
        105,
        287,
        { align: 'center' }
      );
    }

    return doc.output('blob');
  }

  static generateMultipleRecordsPDF(records: PurchaseRecord[]): Blob {
    const doc = new jsPDF();

    // Cover Page
    doc.setFontSize(24);
    doc.text('PURCHASE RECORDS REPORT', 105, 50, { align: 'center' });

    doc.setFontSize(12);
    doc.text(
      `Period: ${records[0]?.date || '-'} to ${records[records.length - 1]?.date || '-'}`,
      105,
      70,
      { align: 'center' }
    );

    doc.text(`Total Records: ${records.length}`, 105, 80, { align: 'center' });

    const totals = records.reduce(
      (acc, record) => {
        acc.totalCashReceived += this.num(record.cashReceived);
        acc.totalExpenditure += this.num(record.totalExpenditure);
        acc.totalCashBalance += this.num(record.cashBalance);
        return acc;
      },
      { totalCashReceived: 0, totalExpenditure: 0, totalCashBalance: 0 }
    );

    doc.text(`Total Cash Received: KSh ${totals.totalCashReceived.toFixed(2)}`, 105, 100, { align: 'center' });
    doc.text(`Total Expenditure: KSh ${totals.totalExpenditure.toFixed(2)}`, 105, 110, { align: 'center' });
    doc.text(`Net Cash Balance: KSh ${totals.totalCashBalance.toFixed(2)}`, 105, 120, { align: 'center' });

    // Add a new page for each record
    records.forEach((record, index) => {
      if (index > 0) doc.addPage();

      doc.setFontSize(16);
      doc.text(`Record: ${record.date || '-'}`, 20, 20);

      // Summary for this record
      const tableData = [
        ['Cash Received', `KSh ${this.num(record.cashReceived).toFixed(2)}`],
        ['Balance B/F', `KSh ${this.num(record.balanceBF).toFixed(2)}`],
        ['Cash Available', `KSh ${this.num(record.cashAvailable).toFixed(2)}`],
        ['Cash Spent', `KSh ${this.num(record.cashTotal).toFixed(2)}`],
        ['Cash Balance', `KSh ${this.num(record.cashBalance).toFixed(2)}`],
        ['M-Pesa', `KSh ${this.num(record.mpesaTotal).toFixed(2)}`],
        ['Cheque', `KSh ${this.num(record.chequeTotal).toFixed(2)}`],
        ['Bank Transfer', `KSh ${this.num(record.bankTotal).toFixed(2)}`],
        ['Total Expenditure', `KSh ${this.num(record.totalExpenditure).toFixed(2)}`]
      ];

      if (record.totalBudget) {
        tableData.push(
          ['Total Budget', `KSh ${this.num(record.totalBudget).toFixed(2)}`],
          ['Budget Used', `KSh ${this.num(record.totalBudgetUsed).toFixed(2)}`],
          ['Budget Remaining', `KSh ${this.num(record.budgetRemaining).toFixed(2)}`]
        );
      }

      autoTable(doc, {
        startY: 30,
        head: [['Item', 'Amount']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 }
      });

      // Receipts for this record
      const receiptData = (record.receipts || []).map((receipt, idx) => [
        idx + 1,
        receipt.supplier || '-',
        (receipt.paymentMode || '-').toUpperCase(),
        `KSh ${this.num(receipt.amount).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['#', 'Supplier', 'Payment Mode', 'Amount']],
        body: receiptData,
        theme: 'grid',
        styles: { fontSize: 9 }
      });
    });

    return doc.output('blob');
  }

  static async generateFinancialReport(records: PurchaseRecord[]): Promise<Blob> {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('FINANCIAL ANALYSIS REPORT', 105, 20, { align: 'center' });

    // Period
    doc.setFontSize(12);
    doc.text(
      `Analysis Period: ${records[0]?.date || '-'} to ${records[records.length - 1]?.date || '-'}`,
      105,
      30,
      { align: 'center' }
    );

    // Summary Statistics
    const summary = {
      totalRecords: records.length,
      totalCashReceived: records.reduce((sum, r) => sum + this.num(r.cashReceived), 0),
      totalExpenditure: records.reduce((sum, r) => sum + this.num(r.totalExpenditure), 0),
      avgDailyExpenditure: 0,
      cashEfficiency: 0
    };

    const uniqueDays = new Set(records.map(r => r.date)).size || 1;
    summary.avgDailyExpenditure = summary.totalExpenditure / uniqueDays;
    summary.cashEfficiency =
      summary.totalCashReceived > 0 ? (summary.totalExpenditure / summary.totalCashReceived) * 100 : 0;

    const summaryData = [
      ['Total Records', summary.totalRecords.toString()],
      ['Total Cash Received', `KSh ${summary.totalCashReceived.toFixed(2)}`],
      ['Total Expenditure', `KSh ${summary.totalExpenditure.toFixed(2)}`],
      ['Average Daily Expenditure', `KSh ${summary.avgDailyExpenditure.toFixed(2)}`],
      ['Cash Efficiency', `${summary.cashEfficiency.toFixed(1)}%`]
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 11 }
    });

    // Payment Method Breakdown
    const paymentBreakdown = records.reduce(
      (acc, r) => {
        acc.cash += this.num(r.cashTotal);
        acc.mpesa += this.num(r.mpesaTotal);
        acc.cheque += this.num(r.chequeTotal);
        acc.bank += this.num(r.bankTotal);
        return acc;
      },
      { cash: 0, mpesa: 0, cheque: 0, bank: 0 }
    );

    const paymentData = [
      [
        'Cash',
        `KSh ${paymentBreakdown.cash.toFixed(2)}`,
        `${((paymentBreakdown.cash / summary.totalExpenditure) * 100 || 0).toFixed(1)}%`
      ],
      [
        'M-Pesa',
        `KSh ${paymentBreakdown.mpesa.toFixed(2)}`,
        `${((paymentBreakdown.mpesa / summary.totalExpenditure) * 100 || 0).toFixed(1)}%`
      ],
      [
        'Cheque',
        `KSh ${paymentBreakdown.cheque.toFixed(2)}`,
        `${((paymentBreakdown.cheque / summary.totalExpenditure) * 100 || 0).toFixed(1)}%`
      ],
      [
        'Bank Transfer',
        `KSh ${paymentBreakdown.bank.toFixed(2)}`,
        `${((paymentBreakdown.bank / summary.totalExpenditure) * 100 || 0).toFixed(1)}%`
      ]
    ];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 10 || 50,
      head: [['Payment Method', 'Total Amount', 'Percentage']],
      body: paymentData,
      theme: 'grid',
      styles: { fontSize: 11 }
    });

    // Monthly Trend
    const monthlyData = records.reduce((acc: Record<string, { expenditure: number; records: number }>, r) => {
      const month = (r.date || '').substring(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = { expenditure: 0, records: 0 };
      acc[month].expenditure += this.num(r.totalExpenditure);
      acc[month].records += 1;
      return acc;
    }, {});

    const monthlyTableData = Object.entries(monthlyData).map(([month, data]) => [
      month || '-',
      data.records.toString(),
      `KSh ${data.expenditure.toFixed(2)}`,
      `KSh ${(data.expenditure / (data.records || 1)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable?.finalY + 10 || 80,
      head: [['Month', 'Records', 'Total Expenditure', 'Average per Record']],
      body: monthlyTableData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    return doc.output('blob');
  }
}
