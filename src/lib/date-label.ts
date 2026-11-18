// The format must use timeZone UTC, or the day can shift a day back
export function utcDateLabel(
  format: Intl.DateTimeFormat,
  isoDate: string,
): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return format.format(Date.UTC(year, month - 1, day));
}
