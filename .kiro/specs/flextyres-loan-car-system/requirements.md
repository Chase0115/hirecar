# Requirements Document

## Introduction

The FlexTyres Self-Service Loan Car System is a high-contrast, senior-friendly web application that enables customers to self-service check-in and check-out loan cars at a tyre shop. The system uses a step-by-step wizard flow with large UI elements, requires no login (phone number as identifier), records server-side timestamps for every action, and provides an admin dashboard for staff to manage logs and car availability.

## Glossary

- **Wizard**: A multi-step guided interface that walks the customer through the loan car pick-up or drop-off process one screen at a time.
- **Customer**: A person borrowing a loan car from FlexTyres while their own vehicle is being serviced.
- **Admin**: A FlexTyres staff member with access to the protected admin dashboard.
- **Loan_Car**: A vehicle owned by FlexTyres that is lent to customers during servicing.
- **Session**: A single pick-up or drop-off transaction initiated by a customer through the Wizard.
- **Log_Entry**: A record in the database capturing the details of a single pick-up or drop-off action.
- **Server_Side_Timestamp**: A timestamp generated on the server at the moment an action is recorded, ensuring accuracy independent of the client device clock.
- **Car_Status**: The availability state of a Loan_Car, either "Available" or "In Use".
- **License_Photo**: A photograph or uploaded image of the customer's driver license, stored in blob storage.
- **Plate_Number**: The registration plate identifier of a vehicle.

## Requirements

### Requirement 1: Language and Action Selection

**User Story:** As a customer, I want to select my preferred language and intended action, so that I can navigate the system in a language I understand and proceed to the correct flow.

#### Acceptance Criteria

1. WHEN the customer opens the application, THE Wizard SHALL display a language selection screen with two options: Korean (KO) and English (EN).
2. WHEN the customer selects a language, THE Wizard SHALL render all subsequent screens in the selected language.
3. WHEN the customer has selected a language, THE Wizard SHALL display two action buttons: "PICK UP" and "DROP OFF".
4. THE Wizard SHALL display all buttons with a minimum touch target size of 48x48 CSS pixels and a contrast ratio of at least 4.5:1 against the background.

### Requirement 2: Customer Identity Input

**User Story:** As a customer, I want to enter my name, phone number, and my own car's plate number, so that FlexTyres can identify me and link the loan to my vehicle.

#### Acceptance Criteria

1. WHEN the customer proceeds past action selection, THE Wizard SHALL display input fields for Customer Name, Phone Number, and the customer's own car Plate_Number.
2. WHEN the customer submits the identity form with any empty field, THE Wizard SHALL display an inline validation error and prevent progression to the next step.
3. WHEN the customer submits a Phone Number that does not match a valid Australian phone format, THE Wizard SHALL display a validation error indicating the expected format.
4. THE Wizard SHALL display all input labels and fields at a minimum font size of 18px.

### Requirement 3: Driver License Upload

**User Story:** As a customer, I want to upload or photograph my driver license, so that FlexTyres has a record of my license for the loan period.

#### Acceptance Criteria

1. WHEN the customer proceeds past identity input, THE Wizard SHALL display two options: "Take a Photo" (device camera) and "Upload Image" (file gallery).
2. WHEN the customer captures or selects a License_Photo, THE System SHALL upload the image to blob storage and associate the stored URL with the current Session.
3. IF the License_Photo upload fails, THEN THE System SHALL display an error message and allow the customer to retry without losing previously entered data.
4. WHEN the customer selects "Take a Photo", THE System SHALL request camera access from the device and open the camera interface.
5. THE System SHALL accept image files in JPEG and PNG formats with a maximum file size of 10 MB.

### Requirement 4: Loan Car Selection

**User Story:** As a customer, I want to see which loan cars are available and select one, so that I can pick up a car that is ready for use.

#### Acceptance Criteria

1. WHEN the customer proceeds past license upload, THE Wizard SHALL display a grid of Loan_Cars whose Car_Status is "Available".
2. THE Wizard SHALL display each Loan_Car card showing the car make, model, colour (where applicable), and Plate_Number.
3. WHEN a Loan_Car has a Car_Status of "In Use", THE Wizard SHALL exclude that car from the displayed grid.
4. WHEN the customer selects a Loan_Car from the grid, THE Wizard SHALL highlight the selected card and enable progression to the next step.
5. WHEN no Loan_Cars have a Car_Status of "Available", THE Wizard SHALL display a message indicating no cars are currently available and prevent progression.

### Requirement 5: Terms Acceptance

**User Story:** As a customer, I want to review and agree to the loan terms, so that I acknowledge my responsibilities regarding tolls, fines, and accident liability.

#### Acceptance Criteria

1. WHEN the customer proceeds past car selection, THE Wizard SHALL display three separate agreement items: E-Toll transfer to hire car, Fine liability, and Accident repair liability.
2. WHEN the customer has not agreed to all three terms, THE Wizard SHALL disable the proceed button.
3. WHEN the customer agrees to all three terms, THE Wizard SHALL enable the proceed button to complete the session.

### Requirement 6: Session Completion and Confirmation

**User Story:** As a customer, I want to see a confirmation that my pick-up or drop-off was successful, so that I know the process is complete.

#### Acceptance Criteria

1. WHEN the customer completes all wizard steps for a "PICK UP" action, THE System SHALL create a Log_Entry with a Server_Side_Timestamp, set the selected Loan_Car Car_Status to "In Use", and display a confirmation screen showing the selected car model and a "Successfully Registered" message.
2. WHEN the customer completes the wizard for a "DROP OFF" action, THE System SHALL create a Log_Entry with a Server_Side_Timestamp and set the returned Loan_Car Car_Status to "Available".
3. THE System SHALL generate the Server_Side_Timestamp at the moment the action is recorded on the server, independent of the client device clock.

### Requirement 7: Drop-Off Flow

**User Story:** As a customer, I want a simplified drop-off process, so that I can return a loan car quickly without repeating unnecessary steps.

#### Acceptance Criteria

1. WHEN the customer selects "DROP OFF" as the action, THE Wizard SHALL collect Customer Name and Phone Number, then display a list of Loan_Cars currently marked "In Use" for the customer to identify which car is being returned.
2. WHEN the customer selects a Loan_Car to return, THE System SHALL set that Loan_Car Car_Status to "Available" and create a Log_Entry with a Server_Side_Timestamp.

### Requirement 8: Admin Dashboard Access

**User Story:** As an admin, I want a protected dashboard, so that only authorized staff can view and manage loan car records.

#### Acceptance Criteria

1. WHEN a user navigates to the admin route, THE System SHALL require authentication before granting access.
2. IF an unauthenticated user attempts to access the admin dashboard, THEN THE System SHALL redirect the user to an admin login page.
3. WHEN an admin successfully authenticates, THE System SHALL display the admin dashboard.

### Requirement 9: Admin Log Viewer

**User Story:** As an admin, I want to view a detailed log of all pick-up and drop-off actions, so that I can track loan car usage and resolve disputes.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a table of all Log_Entries showing: Server_Side_Timestamp, Action type (Pick Up or Drop Off), Customer Name, Phone Number, and Loan_Car Plate_Number.
2. WHEN an admin clicks on a Log_Entry row, THE Admin_Dashboard SHALL display the associated License_Photo for that session.
3. THE Admin_Dashboard SHALL sort Log_Entries by Server_Side_Timestamp in descending order by default.

### Requirement 10: Admin Manual Controls

**User Story:** As an admin, I want to edit logs, toggle car availability, and add manual entries, so that I can correct mistakes and handle phone-in bookings.

#### Acceptance Criteria

1. WHEN an admin edits a Log_Entry, THE Admin_Dashboard SHALL update the record in the database and display the updated entry.
2. WHEN an admin deletes a Log_Entry, THE Admin_Dashboard SHALL remove the record from the database and update the displayed table.
3. WHEN an admin toggles a Loan_Car Car_Status, THE System SHALL update the Car_Status between "Available" and "In Use" and reflect the change in both the admin dashboard and the customer-facing Wizard.
4. WHEN an admin adds a manual Log_Entry, THE Admin_Dashboard SHALL create a new record with admin-supplied details and a Server_Side_Timestamp.
5. WHEN an admin deletes a Log_Entry associated with a "PICK UP" action, THE System SHALL set the corresponding Loan_Car Car_Status back to "Available".

### Requirement 11: Loan Car Fleet Data

**User Story:** As a system operator, I want the loan car fleet pre-configured in the database, so that the system is ready to use on first deployment.

#### Acceptance Criteria

1. THE System SHALL seed the database with the following Loan_Cars on initial deployment: TOYOTA WHITE CAMRY (DO04AB), TOYOTA GREY CAMRY (DL93GR), TOYOTA COROLLA (DH34UJ), KIA RIO (BW13WQ), SUZUKI SWIFT (BK06RH), HONDA JAZZ, HOLDEN COMMODORE (BF35WY), TOYOTA HIACE.
2. THE System SHALL set the initial Car_Status of all seeded Loan_Cars to "Available".

### Requirement 12: Senior-Friendly UI Standards

**User Story:** As a senior customer, I want the interface to be easy to read and interact with, so that I can complete the process without difficulty.

#### Acceptance Criteria

1. THE Wizard SHALL use a minimum body font size of 18px and a minimum heading font size of 24px.
2. THE Wizard SHALL use a high-contrast colour scheme with a contrast ratio of at least 4.5:1 for all text and interactive elements.
3. THE Wizard SHALL display a visible step indicator showing the current step and total number of steps throughout the flow.
4. THE Wizard SHALL provide clear "Back" and "Next" navigation buttons on every step except the first and last respectively.
