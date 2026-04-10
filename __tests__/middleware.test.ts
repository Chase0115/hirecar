import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function createRequest(path: string, cookieValue?: string): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  const req = new NextRequest(url);
  if (cookieValue) {
    req.cookies.set("admin_session", cookieValue);
  }
  return req;
}

describe("middleware", () => {
  it("allows access to /admin/login without auth", () => {
    const req = createRequest("/admin/login");
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated user from /admin to /admin/login", () => {
    const req = createRequest("/admin");
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("redirects unauthenticated user from /admin/dashboard to /admin/login", () => {
    const req = createRequest("/admin/dashboard");
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("redirects when cookie has wrong value", () => {
    const req = createRequest("/admin", "invalid-value");
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/admin/login");
  });

  it("allows authenticated user to access /admin", () => {
    const req = createRequest("/admin", "authenticated");
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows authenticated user to access /admin sub-routes", () => {
    const req = createRequest("/admin/logs", "authenticated");
    const res = middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
