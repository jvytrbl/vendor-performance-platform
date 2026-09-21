export interface PricedTransaction {
    agreed_price: number;
    actual_price?: number | null;
  }
  
  export function calculateUnderchargeRate(
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
  
    const underchargedCount = priced.filter(
      (transaction) => (transaction.actual_price as number) < transaction.agreed_price
    ).length;
  
    const rate = (underchargedCount / priced.length) * 100;
    return Math.round(rate * 100) / 100;
  }