# Requirements Document

## Introduction

This feature adds a "maintenance" status to the loan car fleet management system. Administrators need the ability to mark cars as under maintenance, which removes those cars from the pool of vehicles available for customer rental. This ensures customers are never offered a car that is not roadworthy or is undergoing servicing.

## Glossary

- **Admin_Dashboard**: The administrative interface located at `/admin` used by fleet managers to manage cars and logs.
- **CarManager**: The client-side React component that renders the fleet management table and controls within the Admin_Dashboard.
- **Car_Selection_Page**: The customer-facing wizard page at `/wizard/car-selection` where customers choose a car to rent.
- **LoanCar**: The data model representing a vehicle in the fleet, stored in the `loan_cars` database table.
- **Car_Status**: The current operational state of a LoanCar. Valid values are `available`, `in_use`, and `maintenance`.
- **Fleet_API**: The server actions in `actions/cars.ts` that provide car data retrieval and status mutation operations.

## Requirements

### Requirement 1: Extend Car Status to Include Maintenance

**User Story:** As an administrator, I want a maintenance status option for cars, so that I can indicate when a vehicle is temporarily out of service.

#### Acceptance Criteria

1. THE LoanCar type SHALL include "maintenance" as a valid Car_Status value alongside "available" and "in_use".
2. THE database layer SHALL accept "maintenance" as a valid status value for the `loan_cars` table.
3. WHEN a LoanCar has a Car_Status of "maintenance", THE CarManager SHALL display a distinct visual indicator differentiating the maintenance state from "available" and "in_use".

### Requirement 2: Admin Maintenance Status Toggle

**User Story:** As an administrator, I want to toggle a car into and out of maintenance status, so that I can manage vehicle availability during servicing periods.

#### Acceptance Criteria

1. WHEN an administrator views a LoanCar in the CarManager, THE CarManager SHALL display a "Set Maintenance" action for cars with a Car_Status of "available".
2. WHEN an administrator clicks "Set Maintenance" on an available LoanCar, THE Fleet_API SHALL update the Car_Status to "maintenance".
3. WHEN an administrator views a LoanCar with a Car_Status of "maintenance", THE CarManager SHALL display a "Set Available" action to restore the car to service.
4. WHEN an administrator clicks "Set Available" on a maintenance LoanCar, THE Fleet_API SHALL update the Car_Status to "available".
5. WHEN a LoanCar has a Car_Status of "in_use", THE CarManager SHALL NOT display a "Set Maintenance" action for that car.

### Requirement 3: Exclude Maintenance Cars from Customer Rental

**User Story:** As a customer, I want to only see cars that are ready for rental, so that I do not attempt to book an unavailable vehicle.

#### Acceptance Criteria

1. WHEN a customer views the Car_Selection_Page for pickup, THE Fleet_API SHALL return only LoanCars with a Car_Status of "available".
2. WHEN a LoanCar has a Car_Status of "maintenance", THE Car_Selection_Page SHALL NOT display that car in the available cars list.
3. WHEN all LoanCars have a Car_Status of "maintenance" or "in_use", THE Car_Selection_Page SHALL display the existing "no cars available" message.

### Requirement 4: Maintenance Status Persistence

**User Story:** As an administrator, I want maintenance status changes to persist reliably, so that the fleet state is consistent across page reloads and concurrent admin sessions.

#### Acceptance Criteria

1. WHEN an administrator sets a LoanCar to "maintenance", THE Fleet_API SHALL persist the status change to the database within a transaction.
2. WHEN the Admin_Dashboard is reloaded, THE CarManager SHALL display the current Car_Status of each LoanCar as stored in the database.
3. IF a database error occurs during a status update, THEN THE Fleet_API SHALL return an error and the LoanCar status SHALL remain unchanged.
