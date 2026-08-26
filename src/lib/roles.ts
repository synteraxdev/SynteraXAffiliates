export const ADMIN_ROLES = ["admin", "company"] as const;
export const USER_ROLES = ["distributor", "employee", "admin", "company"] as const;

export type SynteraRole = "company" | "admin" | "employee" | "distributor";
export type SynteraStatus = "active" | "inactive" | "suspended" | "pending";

export function isAdminRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "company";
}

export function isActiveStatus(status: string | null | undefined): boolean {
  return status === "active";
}

export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case "company":
      return "Company";
    case "admin":
      return "Admin";
    case "employee":
      return "Employee";
    case "distributor":
      return "Affiliate";
    default:
      return role || "Unknown";
  }
}
