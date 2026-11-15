/** Mirrors the API's normalizeTanzanianPhone so mistakes are caught before a payment request is sent. */
export function normalizeTanzanianPhone(input: string): string | null {
  const digits = input.replace(/[\s()+-]/g, "");
  if (/^0[67]\d{8}$/.test(digits)) return `255${digits.slice(1)}`;
  if (/^[67]\d{8}$/.test(digits)) return `255${digits}`;
  if (/^255[67]\d{8}$/.test(digits)) return digits;
  return null;
}

/** 255712345678 -> "0712 345 678" */
export function formatLocalPhone(normalized: string): string {
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** 255712345678 -> "0712 *** 678" */
export function maskPhone(normalized: string): string {
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} *** ${local.slice(7)}`;
}
