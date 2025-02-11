# Medication Service

## Overview

The Medication Service is a crucial component of our healthcare microservices architecture, designed to manage medication tracking and refill alerts. Built with Node.js and Firebase Firestore, this service provides robust CRUD operations for medications and timely refill notifications.

## Features

- Medication CRUD operations
- Refill alerts
- Secure data storage using Firebase Firestore

## Tech Stack

- Node.js
- Express.js
- Firebase Firestore

## Project Structure

```
medication-service/
│── src/
│ ├── controllers/
│ │ ├── medicationController.js
│ ├── routes/
│ │ ├── medicationRoutes.js
│ ├── models/
│ │ ├── Medication.js
│ ├── config/
│ │ ├── firebase.js
│ ├── app.js
│── .github/workflows/
│── Dockerfile
│── package.json
│── README.md
```

## Setup and Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Maverics-Seneca/medication-service.git
   ```

2. Install dependencies:
   ```sh
   cd medication-service
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```ini
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   ```

4. Start the service:
   ```sh
   npm start
   ```

## API Endpoints

- `POST /medications`: Create a new medication entry
- `GET /medications`: Retrieve all medications
- `GET /medications/:id`: Retrieve a specific medication
- `PUT /medications/:id`: Update a medication entry
- `DELETE /medications/:id`: Delete a medication entry
- `GET /medications/refill-alerts`: Get refill alerts

## Docker

To build and run the service using Docker:

```sh
docker build -t medication-service .
docker run -p 3000:3000 medication-service
```

## CI/CD

This project uses GitHub Actions for continuous integration and deployment. The workflow is defined in `.github/workflows/ci-cd.yml`.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
