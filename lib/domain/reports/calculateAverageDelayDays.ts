export interface DeliveryTransaction {
    agreed_delivery_date: string;
    actual_delivery_date?: string | null;
}

const MS_PER_DAY = 1000 * 60 * 60 *24;

export function calculateAverageDelayDays(
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

    const lateDelays = completed
        .map((transaction) => {
            const agreedDate = new Date(transaction.agreed_delivery_date);
            const actualDate = new Date(transaction.actual_delivery_date as string);
            return (actualDate.getTime() - agreedDate.getTime()) / MS_PER_DAY;
        })
        .filter((delayDays) => delayDays > 0);

        if (lateDelays.length === 0) {
            return 0;
        }

    const total = lateDelays.reduce((sum, days) => sum + days, 0);
    const average = total / lateDelays.length;
    return Math.round(average * 100)/ 100;
}