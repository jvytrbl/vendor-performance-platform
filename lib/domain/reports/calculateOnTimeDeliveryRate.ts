export interface DeliveryTransaction {
    agreed_delivery_date: string;
    actual_delivery_date?: string | null;
  }
  
  export function calculateOnTimeDeliveryRate(
    transactions: DeliveryTransaction[]
  ): number | null {
    const completed = transactions.filter(
      (transaction) =>
        transaction.actual_delivery_date !== null &&
        transaction.actual_delivery_date !== undefined
    );
  
    if (completed.length === 0) {
      return null;
    }
  
    const onTimeCount = completed.filter((transaction) => {
      const agreedDate = new Date(transaction.agreed_delivery_date);
      const actualDate = new Date(transaction.actual_delivery_date as string);
      return actualDate <= agreedDate;
    }).length;
  
    const rate = (onTimeCount / completed.length) * 100;
    return Math.round(rate * 100) / 100;
  }