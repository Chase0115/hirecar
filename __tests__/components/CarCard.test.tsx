import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CarCard from "@/components/CarCard";
import type { LoanCar } from "@/lib/types";

const baseCar: LoanCar = {
  id: 1,
  make: "Toyota",
  model: "Camry",
  colour: "White",
  plateNumber: "DO04AB",
  status: "available",
};

describe("CarCard", () => {
  it("displays make and model", () => {
    render(<CarCard car={baseCar} selected={false} onSelect={vi.fn()} />);
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
  });

  it("displays colour when present", () => {
    render(<CarCard car={baseCar} selected={false} onSelect={vi.fn()} />);
    expect(screen.getByText("White")).toBeInTheDocument();
  });

  it("does not display colour when null", () => {
    const car = { ...baseCar, colour: null };
    render(<CarCard car={car} selected={false} onSelect={vi.fn()} />);
    expect(screen.queryByText("White")).not.toBeInTheDocument();
  });

  it("displays plate number when present", () => {
    render(<CarCard car={baseCar} selected={false} onSelect={vi.fn()} />);
    expect(screen.getByText("DO04AB")).toBeInTheDocument();
  });

  it("does not display plate number when null", () => {
    const car = { ...baseCar, plateNumber: null };
    render(<CarCard car={car} selected={false} onSelect={vi.fn()} />);
    expect(screen.queryByText("DO04AB")).not.toBeInTheDocument();
  });

  it("calls onSelect with car id when clicked", () => {
    const onSelect = vi.fn();
    render(<CarCard car={baseCar} selected={false} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("has aria-pressed=true when selected", () => {
    render(<CarCard car={baseCar} selected={true} onSelect={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("has aria-pressed=false when not selected", () => {
    render(<CarCard car={baseCar} selected={false} onSelect={vi.fn()} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("applies selected class when selected", () => {
    render(<CarCard car={baseCar} selected={true} onSelect={vi.fn()} />);
    expect(screen.getByRole("button").className).toContain("car-card--selected");
  });
});
