export function dhakaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function validPreferredDate(value: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00+06:00`);
  return (
    Number.isFinite(date.getTime()) &&
    dhakaToday(date) === value &&
    value >= dhakaToday(now)
  );
}
export function validPhone(value: string) {
  return (
    /^[+\d\s().-]+$/.test(value) && /^\d{8,15}$/.test(value.replace(/\D/g, ""))
  );
}
