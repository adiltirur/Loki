export const USER_ROLES = ["super_admin", "member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORG_ROLES = ["admin", "member"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export function isOrgRole(value: unknown): value is OrgRole {
  return typeof value === "string" && (ORG_ROLES as readonly string[]).includes(value);
}
