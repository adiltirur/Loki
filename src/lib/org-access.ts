import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { OrgRole, UserRole } from "@/lib/roles";

export interface AuthedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface OrgContext {
  user: AuthedUser;
  orgId: string;
  orgRole: OrgRole | null; // null for super_admin acting outside their own membership
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
  toResponse(): Response {
    return Response.json({ error: this.message }, { status: this.status });
  }
}

export async function requireUser(): Promise<AuthedUser> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new HttpError(401, "Not authenticated");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}

export async function requireSuperAdmin(): Promise<AuthedUser> {
  const user = await requireUser();
  if (user.role !== "super_admin") {
    throw new HttpError(403, "Super admin only");
  }
  return user;
}

export async function requireOrgMember(orgId: string): Promise<OrgContext> {
  const user = await requireUser();
  if (user.role === "super_admin") {
    const orgExists = await db.organization.findUnique({ where: { id: orgId }, select: { id: true } });
    if (!orgExists) throw new HttpError(404, "Organization not found");
    return { user, orgId, orgRole: null };
  }
  const member = await db.orgMember.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
    select: { role: true },
  });
  if (!member) throw new HttpError(403, "Not a member of this organization");
  return { user, orgId, orgRole: member.role as OrgRole };
}

export async function requireOrgAdmin(orgId: string): Promise<OrgContext> {
  const ctx = await requireOrgMember(orgId);
  if (ctx.user.role !== "super_admin" && ctx.orgRole !== "admin") {
    throw new HttpError(403, "Org admin only");
  }
  return ctx;
}

export async function getActiveOrgId(): Promise<string | null> {
  const session = await auth();
  return session?.activeOrgId ?? null;
}

export async function requireActiveOrg(): Promise<OrgContext> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    throw new HttpError(401, "Not authenticated");
  }
  if (!session.activeOrgId) {
    throw new HttpError(403, "No active organization");
  }
  return requireOrgMember(session.activeOrgId);
}

export function withErrorHandling<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) return err.toResponse();
      console.error("[org-access] unhandled", err);
      return Response.json({ error: "Internal error" }, { status: 500 });
    }
  };
}
