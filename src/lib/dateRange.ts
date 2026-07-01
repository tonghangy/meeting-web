export type DatePreset = 'week' | 'month' | 'year' | 'custom';

type DateRange = {
  startFrom: string;
  startTo: string;
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shiftedDate(amount: number, unit: 'day' | 'month' | 'year'): Date {
  const date = new Date();
  if (unit === 'day') date.setDate(date.getDate() + amount);
  if (unit === 'month') date.setMonth(date.getMonth() + amount);
  if (unit === 'year') date.setFullYear(date.getFullYear() + amount);
  return date;
}

export function rangeForPreset(preset: Exclude<DatePreset, 'custom'>): DateRange {
  const start =
    preset === 'week'
      ? shiftedDate(-7, 'day')
      : preset === 'year'
        ? shiftedDate(-1, 'year')
        : shiftedDate(-1, 'month');

  return {
    startFrom: formatDate(start),
    startTo: formatDate(new Date()),
  };
}

export function resolveDateRange(
  preset: DatePreset,
  customStartFrom: string | null,
  customStartTo: string | null,
): DateRange {
  if (preset === 'custom' && customStartFrom && customStartTo && customStartFrom <= customStartTo) {
    return {
      startFrom: customStartFrom,
      startTo: customStartTo,
    };
  }

  if (preset === 'week' || preset === 'month' || preset === 'year') {
    return rangeForPreset(preset);
  }

  return rangeForPreset('month');
}
