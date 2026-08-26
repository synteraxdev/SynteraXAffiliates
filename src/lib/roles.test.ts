import { describe, expect, it } from "vitest";
import { isActiveStatus, isAdminRole, roleLabel } from "@/lib/roles";

describe("roles", () => {
  it("treats admin and company as admin", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole("company")).toBe(true);
    expect(isAdminRole("distributor")).toBe(false);
    expect(isAdminRole("employee")).toBe(false);
  });

  it("labels roles for the portal", () => {
    expect(roleLabel("distributor")).toBe("Affiliate");
    expect(roleLabel("admin")).toBe("Admin");
  });

  it("requires an active status", () => {
    expect(isActiveStatus("active")).toBe(true);
    expect(isActiveStatus("suspended")).toBe(false);
  });
});
