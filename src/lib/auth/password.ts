import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith("$2")) {
    return bcrypt.compare(password, stored);
  }
  return stored === password;
}
