import { redirect } from "next/navigation";
import type { FieldErrors } from "@/lib/validation";
import { encodeFieldErrors } from "@/lib/validation";

export function redirectWithSuccess(path: string, message = "success"): never {
  redirect(`${path}?success=${message}`);
}

export function redirectWithError(path: string, error = "error"): never {
  redirect(`${path}?error=${error}`);
}

export function redirectWithValidationErrors(path: string, errors: FieldErrors): never {
  redirect(`${path}?errors=${encodeFieldErrors(errors)}`);
}
