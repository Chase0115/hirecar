# Implementation Plan: Car Maintenance Status

## Overview

Extend the loan car status system to support a "maintenance" state. Changes flow bottom-up: types → server actions → UI components. The existing `getAvailableCars` query already filters by `status = 'available'`, so the customer-facing car selection page requires no code changes — it automatically excludes maintenance cars once the status exists.

## Tasks

- [x] 1. Extend LoanCar type and database layer
  - [x] 1.1 Add "maintenance" to the LoanCar status union in `lib/types.ts`
    - Change `status: "available" | "in_use"` to `status: "available" | "in_use" | "maintenance"`
    - _Requirements: 1.1, 1.2_

- [x] 2. Implement maintenance server actions
  - [x] 2.1 Add `setCarMaintenance` server action in `actions/cars.ts`
    - Accept `carId: number` and `maintenance: boolean`
    - When `maintenance` is true: validate car is "available", update to "maintenance" within a transaction
    - When `maintenance` is false: validate car is "maintenance", update to "available" within a transaction
    - Throw descriptive errors for invalid transitions (in_use → maintenance, non-maintenance → available via this action)
    - _Requirements: 2.2, 2.4, 4.1, 4.3_
  - [x] 2.2 Update `toggleCarStatus` in `actions/cars.ts` to reject maintenance cars
    - Add a guard: if current status is "maintenance", throw an error instead of toggling
    - _Requirements: 2.5_
  - [ ]* 2.3 Write property test for maintenance toggle round-trip
    - **Property 2: Maintenance toggle round-trip**
    - **Validates: Requirements 2.2, 2.4**
  - [ ]* 2.4 Write property test for available cars filtering
    - **Property 3: Available cars filtering excludes non-available statuses**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 2.5 Write unit tests for error cases in `setCarMaintenance`
    - Test: setting in_use car to maintenance throws error
    - Test: toggling a maintenance car throws error
    - Test: setting non-maintenance car to available via setCarMaintenance throws error
    - _Requirements: 2.5, 4.3_

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Update CarManager UI component
  - [x] 4.1 Add maintenance status badge in `components/CarManager.tsx`
    - Add `car-manager__status--maintenance` CSS class case for the status display
    - Display "Maintenance" text for cars with maintenance status
    - _Requirements: 1.3_
  - [x] 4.2 Update action buttons per car status in `components/CarManager.tsx`
    - For "available" cars: show "Set In Use" and "Set Maintenance" buttons
    - For "in_use" cars: show "Set Available" button (no maintenance option)
    - For "maintenance" cars: show "Set Available" button only
    - Wire "Set Maintenance" to call `setCarMaintenance(carId, true)`
    - Wire "Set Available" on maintenance cars to call `setCarMaintenance(carId, false)`
    - _Requirements: 2.1, 2.3, 2.5_
  - [ ]* 4.3 Write property test for status-dependent action buttons
    - **Property 1: Status-dependent action buttons**
    - **Validates: Requirements 2.1, 2.3, 2.5**
  - [ ]* 4.4 Write unit test for maintenance badge rendering
    - Verify the maintenance badge has the correct CSS class and text
    - _Requirements: 1.3_

- [x] 5. Add maintenance status styling
  - [x] 5.1 Add CSS for `car-manager__status--maintenance` in `app/globals.css`
    - Use a distinct color (e.g., orange/amber) to differentiate from available (green) and in_use (red/amber)
    - _Requirements: 1.3_

- [x] 6. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The customer-facing `app/wizard/car-selection/page.tsx` requires no changes — it already calls `getAvailableCars()` which filters by `status = 'available'`
- `fast-check` is already installed in the project for property-based testing
- Each property test should run a minimum of 100 iterations
