"use client";

import type { LoanCar } from "@/lib/types";

interface CarCardProps {
  car: LoanCar & { hirerName?: string | null };
  selected: boolean;
  onSelect: (carId: number) => void;
}

export default function CarCard({ car, selected, onSelect }: CarCardProps) {
  return (
    <button
      type="button"
      className={`car-card${selected ? " car-card--selected" : ""}`}
      onClick={() => onSelect(car.id)}
      aria-pressed={selected}
    >
      <span className="car-card__make-model">
        {car.make} {car.model}
      </span>
      {car.colour && (
        <span className="car-card__colour">{car.colour}</span>
      )}
      {car.plateNumber && (
        <span className="car-card__plate">{car.plateNumber}</span>
      )}
      {car.hirerName && (
        <span className="car-card__hirer">{car.hirerName}</span>
      )}
    </button>
  );
}
