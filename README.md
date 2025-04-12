# Medication Service

## Overview

The **Medication Service** is a critical microservice in the MediTrack healthcare platform, designed to manage medication records and provide refill alerts for patients. It supports secure CRUD operations for medication data, restricted to authorized users within organizations, and integrates with Firebase Firestore for reliable storage. Built with Node.js and Express.js, this service ensures scalable and secure medication tracking for healthcare applications.

This README is optimized for production deployment, offering detailed instructions for setup, usage, and integration.

## Features

-   **Medication Management**: Create, read, update, and delete (CRUD) medication records for patients.
-   **Refill Alerts**: Generate notifications for medications nearing depletion based on inventory and end dates.
-   **Organization-Based Access**: Restrict medication data access to specific organizations for enhanced security.
-   **Audit Logging**: Record all medication-related actions (create, update, delete) in Firestore for traceability.
-   **Secure Authentication**: Integrate with the MediTrack Auth Service for JWT-based authorization.

## Tech Stack

-   **Node.js**: Runtime environment (v16+ recommended).
-   **Express.js**: Web framework for API routing.
-   **Firebase Admin SDK**: For Firestore database operations and authentication integration.
-   **Docker**: For containerized deployment.
-   **Jest**: For unit testing.

## Project Structure

| **Directory/File**                 | **Description**                            |
|------------------------------------|--------------------------------------------|
| `.github/`                         | Contains GitHub-specific files             |
| `.github/workflows/`               | Directory for GitHub Actions workflows     |
| `.github/workflows/ci.yml`         | GitHub Actions workflow for CI             |
| `src/`                             | Source code directory                      |
| `src/config/`                      | Configuration files                        |
| `src/config/firebaseConfig.js`     | Firebase Admin SDK initialization          |
| `src/middleware/`                  | Middleware files                           |
| `src/middleware/authenticate.js`   | JWT verification middleware                |
| `src/routes/`                      | API route definitions                      |
| `src/routes/index.js`              | Main API route definitions                 |
| `src/index.js`                     | Main application entry point               |
| `tests/`                           | Unit test directory                        |
| `tests/medication.test.js`         | Unit tests for the Medication Service      |
| `.dockerignore`                    | Docker ignore rules                        |
| `.gitignore`                       | Git ignore rules                           |
| `Dockerfile`                       | Docker configuration file                  |
| `package.json`                     | Project dependencies and scripts           |
| `package-lock.json`                | Dependency lock file                       |
| `README.md`                        | Project documentation                      |



## Prerequisites

-   **Node.js** (v16 or higher)
-   **npm** (v8 or higher)
-   **Firebase Project**: A Firebase project with Firestore enabled and a service account key.
-   **Docker** (optional, for containerized deployment)
-   **Auth Service**: A running instance of the MediTrack Auth Service for JWT validation.

## Setup and Installation

1.  **Clone the Repository**:

    ```
    git clone https://github.com/Maverics-Seneca/medication-service.git
    cd medication-service
    ```

2.  **Install Dependencies**:

    ```
    npm install
    ```

3.  **Set Up Environment Variables**:

    Create a `.env` file in the root directory with the following:

    ```
    PORT=4003
    FIREBASE_CREDENTIALS=<base64-encoded-firebase-service-account-key>
    ```

    -   `FIREBASE_CREDENTIALS`: Base64-encoded JSON key from your Firebase service account. Generate it via Firebase Console > Project Settings > Service Accounts.

## API Endpoints

| Method | Endpoint                                 | Description                                 | Protected |
| :----- | :--------------------------------------- | :------------------------------------------ | :-------- |
| POST   | `/api/medications`                       | Create a new medication for a patient       | Yes       |
| GET    | `/api/medications`                       | Retrieve medications for an organization    | Yes       |
| GET    | `/api/medications/user/:userId`          | Retrieve medications for a specific user    | Yes       |
| GET    | `/api/medications/:medicationId`         | Retrieve a specific medication by ID        | Yes       |
| PUT    | `/api/medications/:medicationId`         | Update a medication's details               | Yes       |
| DELETE | `/api/medications/:medicationId`         | Delete a medication record                  | Yes       |
| GET    | `/api/medications/refill-alerts/:userId` | Get refill alerts for a user's medications. | Yes       |

-   **Protected Routes**: Require a valid JWT in the `Authorization` header (`Bearer <token>`), obtained from the Auth Service.
-   **Query Parameters**:
    -   `/api/medications`: Requires `organizationId` query parameter.
    -   `/api/medications/refill-alerts/:userId`: Optionally accepts `days` query parameter (default: 7).

## Docker Deployment

1.  **Build the Image**:

    ```
    docker build -t medication-service .
    ```

2.  **Run the Container**:

    ```
    docker run --env-file .env -p 4003:4003 medication-service
    ```

    Ensure the `.env` file includes `PORT` and `FIREBASE_CREDENTIALS`.

## Continuous Integration

-   **GitHub Actions**: The `.github/workflows/ci.yml` workflow runs linting and tests on every push or pull request to ensure code quality.
-   **Tests**: Located in `tests/medication.test.js`, covering basic endpoint functionality. Expand test cases for critical paths before production deployment.

## Security Considerations

-   **JWT Validation**: All API endpoints require a valid JWT, verified against the Auth Service.
-   **Firestore Security Rules**: Configure Firestore rules to restrict access to authorized users and organizations only.
-   **Environment Variables**: Keep `.env` and Firebase credentials out of version control. Use secret management in production.
-   **HTTPS**: Enable HTTPS for all API communications in production to encrypt data in transit.
-   **Input Validation**: The service validates incoming data, but ensure upstream services (e.g., frontend) sanitize inputs.

## Integration with MediTrack

The Medication Service is part of the MediTrack ecosystem:

-   **Auth Service**: Provides JWTs and user role validation (owner, admin, user).
-   **Frontend**: Consumes this service to display and manage medication records for patients.
-   **Reminder Service**: Can integrate with refill alerts to schedule automated reminders.

## Firestore Collections

-   `medications`: Stores medication records (`userId`, `organizationId`, `name`, `dosage`, `frequency`, `endDate`, `inventory`, `createdAt`).
-   `logs`: Stores audit logs for medication actions (`CREATE`, `UPDATE`, `DELETE`) with `userId`, `organizationId`, and `timestamp`.

## Troubleshooting

-   **401 Unauthorized**: Ensure the JWT is valid and includes `userId` and `organizationId` (for non-owners).
-   **403 Forbidden**: Verify the user has permission to access the requested `organizationId`.
-   **500 Internal Server Error**: Check Firestore connectivity and validate `FIREBASE_CREDENTIALS`.
-   **No Medications Found**: Confirm `userId` or `organizationId` matches existing Firestore records.
-   **Refill Alerts Empty**: Ensure medications have valid `inventory` and `endDate` values.

## Contributing

1.  Fork the repository.
2.  Create a feature branch:

    ```
    git checkout -b feature/your-feature
    ```

3.  Commit changes:

    ```
    git commit -m "Add your feature"
    ```

4.  Push to the branch:

    ```
    git push origin feature/your-feature
    ```

5.  Open a pull request against the `main` branch.

## License

This project is licensed under the MIT License - see the  file for details.
