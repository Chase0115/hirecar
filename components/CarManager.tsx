"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleCarStatus } from "@/actions/cars";
import type { LoanCar } from "@/lib/types";

interface CarManagerProps {
  cars: LoanCar[];
}

export default function CarManager({ cars }: CarManagerProps) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function handleToggle(carId: number) {
    setTogglingId(carId);
    try {
      await toggleCarStatus(carId);
      router.refresh();
    } catch {
      alert("Failed to toggle car status.");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="car-manager">
      <h3>Fleet Management</h3>
      <table className="car-manager__table">
        <thead>
          <tr>
            <th>Car</th>
            <th>Plate</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td>
                {car.make} {car.model}
                {car.colour ? ` (${car.colour})` : ""}
              </td>
              <td>{car.plateNumber ?? "—"}</td>
              <td>
                <span
                  className={`car-manager__status car-manager__status--${car.status}`}
                >
                  {car.status === "available" ? "Available" : "In Use"}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className="big-button big-button--secondary car-manager__toggle"
                  onClick={() => handleToggle(car.id)}
                  disabled={togglingId === car.id}
                >
                  {togglingId === car.id
                    ? "Updating…"
                    : car.status === "available"
                      ? "Set In Use"
                      : "Set Available"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
