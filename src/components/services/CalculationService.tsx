// Calculation utilities
const CalculationService = {
  calculateTotals(record: { receipts: any[]; cashReceived: string; balanceBF: string; }) {
    const cashTotal = record.receipts
      .filter(r => r.paymentMode === 'cash')
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    
    const mpesaTotal = record.receipts
      .filter(r => r.paymentMode === 'mpesa')
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    
    const chequeTotal = record.receipts
      .filter(r => r.paymentMode === 'cheque')
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    
    const totalExpenditure = cashTotal + mpesaTotal + chequeTotal;
    const cashAvailable = (parseFloat(record.cashReceived) || 0) + (parseFloat(record.balanceBF) || 0);
    const cashBalance = cashAvailable - cashTotal;
    
    return { cashTotal, mpesaTotal, chequeTotal, totalExpenditure, cashBalance, cashAvailable };
  },

  recalculateBalances(recordsList: any[]) {
    if (!recordsList || recordsList.length === 0) return recordsList;

    // -----------------------------------------
    // FIX: sort BY DATE FIRST, then BY ID
    // -----------------------------------------
    const sorted = [...recordsList].sort((a, b) => {
      const dA = new Date(a.date).getTime();
      const dB = new Date(b.date).getTime();

      if (dA !== dB) return dA - dB;   // primary sort by date
      return String(a.id).localeCompare(String(b.id)); // secondary sort by id
    });

    // -----------------------------------------
    // Apply carry forward on sorted order
    // -----------------------------------------
    return sorted.map((record, index) => {
      if (index === 0) {
        const totals = this.calculateTotals(record);
        return { ...record, ...totals };
      }

      const previousRecord = sorted[index - 1];
      const newBalanceBF = previousRecord.stopCarryOver ? 0 : previousRecord.cashBalance;

      const updatedRecord = { ...record, balanceBF: newBalanceBF };
      const totals = this.calculateTotals(updatedRecord);

      return { ...updatedRecord, ...totals };
    });
  }
};

export default CalculationService;
