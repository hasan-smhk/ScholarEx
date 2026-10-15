export function formatSlotDate(
  value: string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  let date: Date;

  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    date = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      date = new Date(value);
    }
  } else {
    date = new Date(value);
  }

  return date.toLocaleDateString(locale, options);
}
