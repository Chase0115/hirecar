import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers cookies
const mockSet = vi.fn();
const mockDelete = vi.fn();
const mockCookies = vi.fn().mockResolvedValue({
  set: mockSet,
  delete: mockDelete,
});
vi.mock("next/headers", () => ({ cookies: mockCookies }));

// Import after mocks
const { adminLogin, adminLogout } = await import("@/actions/admin-auth");

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("adminLogin", () => {
  it("returns error when env credentials are not configured", async () => {
    vi.stubEnv("ADMIN_USERNAME", "");
    vi.stubEnv("ADMIN_PASSWORD", "");

    const result = await adminLogin("admin", "pass");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Admin credentials not configured");
  });

  it("returns error for invalid credentials", async () => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "secret");

    const result = await adminLogin("wrong", "creds");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credentials");
  });

  it("returns error when username is wrong", async () => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "secret");

    const result = await adminLogin("wrong", "secret");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credentials");
  });

  it("returns error when password is wrong", async () => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "secret");

    const result = await adminLogin("admin", "wrong");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid credentials");
  });

  it("sets HTTP-only cookie and returns success for valid credentials", async () => {
    vi.stubEnv("ADMIN_USERNAME", "admin");
    vi.stubEnv("ADMIN_PASSWORD", "secret");

    const result = await adminLogin("admin", "secret");

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockSet).toHaveBeenCalledWith("admin_session", "authenticated", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  });
});

describe("adminLogout", () => {
  it("deletes the session cookie", async () => {
    await adminLogout();

    expect(mockDelete).toHaveBeenCalledWith("admin_session");
  });
});
