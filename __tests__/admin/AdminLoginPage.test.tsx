import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLoginPage from "@/app/admin/login/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockAdminLogin = vi.fn();

vi.mock("@/actions/admin-auth", () => ({
  adminLogin: (...args: unknown[]) => mockAdminLogin(...args),
}));

describe("Admin Login Page", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockAdminLogin.mockClear();
  });

  it("renders the login form with username and password fields", () => {
    render(<AdminLoginPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Admin Login");
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
  });

  it("redirects to /admin on successful login", async () => {
    mockAdminLogin.mockResolvedValue({ success: true });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
    expect(mockAdminLogin).toHaveBeenCalledWith("admin", "secret");
  });

  it("shows error message on invalid credentials", async () => {
    mockAdminLogin.mockResolvedValue({ success: false, error: "Invalid credentials" });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "wrong" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows generic error when adminLogin throws", async () => {
    mockAdminLogin.mockRejectedValue(new Error("Network error"));
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("An unexpected error occurred");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables the submit button while loading", async () => {
    let resolveLogin: (value: { success: boolean }) => void;
    mockAdminLogin.mockReturnValue(
      new Promise((resolve) => { resolveLogin = resolve; })
    );
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    expect(screen.getByRole("button", { name: "Logging in…" })).toBeDisabled();

    resolveLogin!({ success: true });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  it("does not show error initially", () => {
    render(<AdminLoginPage />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
