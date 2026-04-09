# Recipe Nest and Chief Portal Backend

Backend API service for the **Recipe Nest and Chief Portal** project.

## Tech Stack

- Node.js
- Express.js
- MongoDB (via Mongoose)
- JWT authentication
- Multer (file uploads)

## Project Structure

- `src/` — application source code
- `package.json` — project metadata, scripts, and dependencies

## Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB instance (local or cloud)

## Installation

1. Clone the repository.
2. Install dependencies:

   npm install

## Environment Variables

Create/update your `.env` file in the project root. Typical variables:

- `PORT=5000`
- `MONGODB_URI=your_mongodb_connection_string`
- `JWT_SECRET=your_jwt_secret`

> `.env` is ignored by Git for security.

## Available Scripts

- `npm run dev` — run in development mode with nodemon
- `npm start` — run the production server
- `npm test` — placeholder test command

## Run the App

Development:

npm run dev

Production:

npm start

## API Base

By default (if configured in your app):

- `http://localhost:5000`

## Author

- Nabin Dhakal (@cpnnabin)
