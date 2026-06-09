"use client";

import { btnDanger } from "@/lib/ui-classes";

export function ConfirmForm({
  action,
  id,
  confirmMessage,
  label = "Arquivar",
  hiddenFields,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  confirmMessage: string;
  label?: string;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {hiddenFields
        ? Object.entries(hiddenFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))
        : null}
      <button type="submit" className={btnDanger}>
        {label}
      </button>
    </form>
  );
}
