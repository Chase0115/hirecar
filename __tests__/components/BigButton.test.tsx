import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BigButton from "@/components/BigButton";

describe("BigButton", () => {
  it("renders children text", () => {
    render(<BigButton>Click Me</BigButton>);
    expect(screen.getByRole("button", { name: "Click Me" })).toBeInTheDocument();
  });

  it("applies primary variant class by default", () => {
    render(<BigButton>Primary</BigButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("big-button--primary");
  });

  it("applies secondary variant class when specified", () => {
    render(<BigButton variant="secondary">Secondary</BigButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("big-button--secondary");
  });

  it("can be disabled", () => {
    render(<BigButton disabled>Disabled</BigButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<BigButton onClick={handleClick}>Click</BigButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(<BigButton disabled onClick={handleClick}>Click</BigButton>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("merges custom className", () => {
    render(<BigButton className="custom-class">Styled</BigButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-class");
    expect(btn.className).toContain("big-button");
  });
});
