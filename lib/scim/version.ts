export const SCIM_SCHEMA_VERSION = "0.2" as const;

export function shortCommitSha(value?: string): string {
  return value?.slice(0, 7) || "local";
}
