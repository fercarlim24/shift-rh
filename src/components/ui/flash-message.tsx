import { decodeFieldErrors } from "@/lib/validation";

const successMessages: Record<string, string> = {
  created: "Registro criado com sucesso.",
  updated: "Registro atualizado com sucesso.",
  archived: "Registro arquivado com sucesso.",
  deleted: "Registro removido com sucesso.",
  moved: "Candidato movido com sucesso.",
  sent: "Documento enviado para assinatura (simulação).",
  success: "Operação realizada com sucesso.",
};

const errorMessages: Record<string, string> = {
  not_found: "Registro não encontrado.",
  forbidden: "Você não tem permissão para esta ação.",
  validation: "Verifique os campos do formulário.",
  error: "Não foi possível concluir a operação.",
};

const alertBase =
  "ui-flash-enter rounded-[var(--radius)] border px-4 py-3 text-sm";

export function FlashMessage({
  success,
  error,
  errors,
}: {
  success?: string;
  error?: string;
  errors?: string;
}) {
  const fieldErrors = errors ? decodeFieldErrors(errors) : {};
  const fieldErrorList = Object.values(fieldErrors);

  if (!success && !error && fieldErrorList.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {success ? (
        <div className={`${alertBase} border-emerald-200/80 bg-emerald-50 text-emerald-800`}>
          {successMessages[success] ?? successMessages.success}
        </div>
      ) : null}
      {error ? (
        <div className={`${alertBase} border-red-200/80 bg-red-50 text-red-700`}>
          {errorMessages[error] ?? error}
        </div>
      ) : null}
      {fieldErrorList.length > 0 ? (
        <div className={`${alertBase} border-amber-200/80 bg-amber-50 text-amber-900`}>
          <ul className="list-inside list-disc">
            {fieldErrorList.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
