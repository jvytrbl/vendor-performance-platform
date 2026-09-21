export interface PricedTransaction {
    agreed_price: number;
    actual_price?: number | null;
  }
  
  export function calculateAverageOverchargePct(
    transactions: PricedTransaction[]
  ): number | null {
    const priced = transactions.filter(
      (transaction) =>
        transaction.actual_price !== null &&
        transaction.actual_price !== undefined
    );
  
    if (priced.length === 0) {
      return null;
    }
  
    const overchargePcts = priced
      .filter(
        (transaction) => (transaction.actual_price as number) > transaction.agreed_price
      )
      .map((transaction) => {
        const actual = transaction.actual_price as number;
        return ((actual - transaction.agreed_price) / transaction.agreed_price) * 100;
      });
  
    if (overchargePcts.length === 0) {
      return 0;
    }
  
    const total = overchargePcts.reduce((sum, pct) => sum + pct, 0);
    const average = total / overchargePcts.length;
    return Math.round(average * 100) / 100;
  }