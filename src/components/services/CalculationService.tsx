import type { PurchaseRecord, CalculationResult } from '../../types/index';

export class CalculationService {
  static calculateReceiptTotals(receipts: any[]): {
    cashTotal: number;
    mpesaTotal: number;
    chequeTotal: number;
    bankTotal: number;
    totalExpenditure: number;
  } {
    const totals = {
      cashTotal: 0,
      mpesaTotal: 0,
      chequeTotal: 0,
      bankTotal: 0,
      totalExpenditure: 0
    };

    receipts.forEach(receipt => {
      const amount = Number(receipt.amount) || 0;
      
      switch (receipt.paymentMode) {
        case 'cash':
          totals.cashTotal += amount;
          break;
        case 'mpesa':
          totals.mpesaTotal += amount;
          break;
        case 'cheque':
          totals.chequeTotal += amount;
          break;
        case 'bank_transfer':
          totals.bankTotal += amount;
          break;
      }
    });

    totals.totalExpenditure = totals.cashTotal + totals.mpesaTotal + totals.chequeTotal + totals.bankTotal;
    return totals;
  }

  static calculateRecord(record: any): CalculationResult {
    const receiptTotals = this.calculateReceiptTotals(record.receipts || []);
    
    const cashReceived = Number(record.cashReceived) || 0;
    const balanceBF = Number(record.balanceBF) || 0;
    const cashAvailable = cashReceived + balanceBF;
    const cashBalance = cashAvailable - receiptTotals.cashTotal;
    
    const result: CalculationResult = {
      ...receiptTotals,
      cashAvailable,
      cashBalance
    };

    // Budget calculations if totalBudget exists
    if (record.totalBudget !== undefined && record.totalBudget !== null) {
      const totalBudget = Number(record.totalBudget) || 0;
      result.totalBudgetUsed = receiptTotals.totalExpenditure;
      result.budgetRemaining = totalBudget - receiptTotals.totalExpenditure;
    }

    return result;
  }

  static recalculateAllBalances(records: PurchaseRecord[]): PurchaseRecord[] {
    if (!records.length) return [];

    // Sort by date then by creation time for consistent ordering
    const sortedRecords = [...records].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.createdAt - b.createdAt;
    });

    const recalculated: PurchaseRecord[] = [];
    let runningBalance = 0;

    sortedRecords.forEach((record, index) => {
      // Determine balance brought forward
      let balanceBF = 0;
      if (index > 0) {
        const prevRecord = recalculated[index - 1];
        balanceBF = prevRecord.stopCarryOver ? 0 : prevRecord.cashBalance;
      } else {
        balanceBF = record.balanceBF || 0; // Use existing for first record
      }

      // Create record with correct balanceBF
      const recordWithBF = {
        ...record,
        balanceBF
      };

      // Calculate totals
      const totals = this.calculateRecord(recordWithBF);
      
      // Update running balance for next iteration
      runningBalance = totals.cashBalance;

      recalculated.push({
        ...recordWithBF,
        ...totals
      });
    });

    return recalculated;
  }

  static getFinancialSummary(records: PurchaseRecord[]) {
    const summary = {
      totalCashReceived: 0,
      totalExpenditure: 0,
      totalCashBalance: 0,
      totalMpesa: 0,
      totalCheque: 0,
      totalBank: 0,
      averageDailyExpenditure: 0,
      budgetUtilization: 0,
      topSuppliers: [] as Array<{name: string, total: number, count: number}>
    };

    const supplierMap = new Map<string, {total: number, count: number}>();

    records.forEach(record => {
      summary.totalCashReceived += record.cashReceived;
      summary.totalExpenditure += record.totalExpenditure;
      summary.totalCashBalance += record.cashBalance;
      summary.totalMpesa += record.mpesaTotal;
      summary.totalCheque += record.chequeTotal;
      summary.totalBank += record.bankTotal || 0;

      // Track suppliers - ADD TYPE SAFETY
    record.receipts.forEach(receipt => {
      if (!receipt.supplier) return; // Skip if no supplier
      
      const existing = supplierMap.get(receipt.supplier);
      const amount = Number(receipt.amount) || 0; // Ensure it's a number
      
      if (existing) {
        existing.total += amount;
        existing.count += 1;
      } else {
        supplierMap.set(receipt.supplier, {
          total: amount,
          count: 1
        });
      }
    });
  });

  // Get top 5 suppliers with proper type checking
  summary.topSuppliers = Array.from(supplierMap.entries())
    .map(([name, data]) => ({ 
      name, 
      total: Number(data.total) || 0, // Ensure it's a number
      count: Number(data.count) || 0 
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return summary;
}
  static validateRecord(record: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!record.date) errors.push('Date is required');
    if (record.cashReceived === undefined || record.cashReceived === null) {
      errors.push('Cash received is required');
    }
    if (isNaN(Number(record.cashReceived))) errors.push('Cash received must be a number');
    if (record.balanceBF === undefined || record.balanceBF === null) {
      errors.push('Balance brought forward is required');
    }
    if (isNaN(Number(record.balanceBF))) errors.push('Balance BF must be a number');

    // Validate receipts
    record.receipts?.forEach((receipt: any, index: number) => {
      if (!receipt.supplier?.trim()) errors.push(`Receipt ${index + 1}: Supplier is required`);
      if (!receipt.amount || isNaN(Number(receipt.amount))) {
        errors.push(`Receipt ${index + 1}: Valid amount is required`);
      }
      if (!['cash', 'mpesa', 'cheque', 'bank_transfer'].includes(receipt.paymentMode)) {
        errors.push(`Receipt ${index + 1}: Invalid payment mode`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default CalculationService;