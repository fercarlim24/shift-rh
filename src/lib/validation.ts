export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

export function required(value: string, field: string): string | null {
  if (!value.trim()) return `${field} é obrigatório`;
  return null;
}

export function email(value: string): string | null {
  if (!value.trim()) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "E-mail inválido";
  return null;
}

export function parseString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function parseOptionalString(formData: FormData, key: string): string | null {
  const value = parseString(formData, key);
  return value || null;
}

export function parseIntField(
  formData: FormData,
  key: string,
  field: string,
): ValidationResult<number> {
  const raw = parseString(formData, key);
  const num = Number(raw);
  if (!raw || Number.isNaN(num) || num < 1) {
    return { ok: false, errors: { [key]: `${field} inválido` } };
  }
  return { ok: true, data: num };
}

export function parseDateField(
  formData: FormData,
  key: string,
): Date | null {
  const raw = parseString(formData, key);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function encodeFieldErrors(errors: FieldErrors): string {
  return Buffer.from(JSON.stringify(errors)).toString("base64url");
}

export function decodeFieldErrors(encoded: string): FieldErrors {
  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString()) as FieldErrors;
  } catch {
    return {};
  }
}
