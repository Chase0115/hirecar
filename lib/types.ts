export interface LoanCar {
  id: number;
  make: string;
  model: string;
  colour: string | null;
  plateNumber: string | null;
  status: "available" | "in_use";
}

export interface LogEntry {
  id: number;
  createdAt: Date;
  action: "pickup" | "dropoff";
  customerName: string;
  phoneNumber: string;
  customerPlateNumber: string | null;
  loanCarId: number;
  licensePhotoUrl: string | null;
  isManual: boolean;
}

export interface ManualLogInput {
  action: "pickup" | "dropoff";
  customerName: string;
  phoneNumber: string;
  customerPlateNumber?: string;
  loanCarId: number;
  licensePhotoUrl?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
