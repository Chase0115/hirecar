import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLayout from "@/app/admin/layout";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockAdminLogout = vi.fn();

vi.mock("@/actions/admin-auth", () => ({
  adminLogout: (...args: unknown[]) => mockAdminLogout(...args),
}));

describe("Admin Dashboard Layout", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockAdminLogout.mockClear();
    mockAdminLogout.mockResolvedValue(undefined);
  });

  it("renders the Admin Dashboard heading", () => {
    render(<AdminLayout><div>child</div></AdminLayout>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Admin Dashboard");
  });

  it("renders the Log Out button", () => {
    render(<AdminLayout><div>child</div></AdminLayout>);
    expect(screen.getByRole("button", { name: "Log Out" })).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<AdminLayout><p>Dashboard content</p></AdminLayout>);
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });

  it("calls adminLogout and redirects to /admin/login on logout", async () => {
    render(<AdminLayout><div>child</div></AdminLayout>);
    fireEvent.click(screen.getByRole("button", { name: "Log Out" }));

    await waitFor(() => {
      expect(mockAdminLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    });
  });
});
