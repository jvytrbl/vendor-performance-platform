export interface FinalizedReportLock {
    id: number;
    reference_number: string;
    period_start: string;
    period_end: string;
    vendor_ids: number[];
}

export type ReportLockResult =
    | { locked: false }
    | { locked: true; referenceNumber: string };

export function isReportLocked(
    vendorId: number,
    transactionDate: string,
    finalizedReports: FinalizedReportLock[]
): ReportLockResult {
    const date = new Date(transactionDate);

    const lockingReport = finalizedReports.find((report) => {
        const periodStart = new Date(report.period_start);
        const periodEnd = new Date(report.period_end);

        const withinRange = date >= periodStart && date <= periodEnd;
        const vendorIncluded = report.vendor_ids.includes(vendorId);

        return withinRange && vendorIncluded;
    });

    if (!lockingReport) {
        return { locked: false };
    }

    return { locked: true, referenceNumber: lockingReport.reference_number };
}