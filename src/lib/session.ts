import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authSecret } from "@/lib/env";
import { isAdminRole, type SynteraRole, type SynteraStatus } from "@/lib/roles";

export const SESSION_COOKIE = "sx_aff_session";

export type SessionUser = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  role: SynteraRole;
  status: SynteraStatus;
  referralSlug: string;
};

function secretKey() {
  return new TextEncoder().encode(authSecret());
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secretKey());
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      id: String(payload.sub),
      email: (payload.email as string) ?? null,
      username: (payload.username as string) ?? null,
      name: (payload.name as string) ?? null,
      role: (payload.role as SynteraRole) || "distributor",
      status: (payload.status as SynteraStatus) || "active",
      referralSlug: String(payload.referralSlug || payload.username || payload.sub),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  if (session.status !== "active") {
    throw new Error("Account is not active");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (!isAdminRole(session.role)) {
    throw new Error("Admin access required");
  }
  return session;
}

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return Boolean(user && isAdminRole(user.role));
}
