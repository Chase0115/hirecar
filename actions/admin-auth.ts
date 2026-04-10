"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

/**
 * Authenticates admin using environment variable credentials.
 * Sets an HTTP-only cookie on success.
 * Requirements: 8.1, 8.2, 8.3
 */
export async function adminLogin(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return { success: false, error: "Admin credentials not configured" };
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    return { success: false, error: "Invalid credentials" };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return { success: true };
}

/**
 * Logs out the admin by deleting the session cookie.
 */
export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
