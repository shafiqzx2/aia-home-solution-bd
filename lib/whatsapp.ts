/** E.164-style international number; never guess a country code or number. */
export function whatsappUrl(
  number: string | null,
  message: string,
): string | null {
  if (!number || !/^[+\d ().-]+$/.test(number)) return null;
  const digits = number.replace(/\D/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?${new URLSearchParams({ text: message })}`;
}
