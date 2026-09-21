export interface ReportPeriod {
  periodStart: string;
  periodEnd: string;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseUtcDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getPriorPeriod(period: ReportPeriod): ReportPeriod {
  const start = parseUtcDate(period.periodStart);
  const end = parseUtcDate(period.periodEnd);
  const lengthDays =
    Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

  const priorEnd = new Date(start.getTime() - MS_PER_DAY);
  const priorStart = new Date(
    priorEnd.getTime() - (lengthDays - 1) * MS_PER_DAY
  );

  return {
    periodStart: formatUtcDate(priorStart),
    periodEnd: formatUtcDate(priorEnd),
  };
}
