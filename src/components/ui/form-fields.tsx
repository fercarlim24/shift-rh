import {
  btnDangerSolid,
  btnLink,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/lib/ui-classes";

export { btnLink, btnPrimary, btnSecondary };

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  error,
  as = "input",
  options,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  error?: string;
  as?: "input" | "textarea" | "select";
  options?: { value: string; label: string }[];
}) {
  const value = defaultValue ?? "";

  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {as === "textarea" ? (
        <textarea
          id={name}
          name={name}
          rows={4}
          required={required}
          placeholder={placeholder}
          defaultValue={String(value)}
          className={inputClass}
        />
      ) : as === "select" ? (
        <select
          id={name}
          name={name}
          required={required}
          defaultValue={String(value)}
          className={inputClass}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={String(value)}
          className={inputClass}
        />
      )}
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function FormActions({
  cancelHref,
  submitLabel = "Salvar",
  danger,
}: {
  cancelHref: string;
  submitLabel?: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <button type="submit" className={danger ? btnDangerSolid : btnPrimary}>
        {submitLabel}
      </button>
      <a href={cancelHref} className={btnSecondary}>
        Cancelar
      </a>
    </div>
  );
}
