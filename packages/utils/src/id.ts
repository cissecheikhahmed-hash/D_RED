/** Identifiant simulé — aucune garantie de collision cryptographique nécessaire, prototype uniquement. */
export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
