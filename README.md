# SmartRent TZ - Full-Stack PropTech Platform

Welcome to SmartRent TZ! This is a modern property rental and management platform tailored for the Tanzanian market. It features role-based access for Tenants, Landlords, Agents, and Administrators.

## Prerequisites
Before you start the system, ensure you have the following installed:
1. **Node.js** (v16 or higher)
2. **XAMPP** (or any local MySQL server)

## Starting the System

The project is structured as a monorepo with two main directories: `client` (Frontend) and `server` (Backend). You will need to run two separate terminal windows to start both.

### 1. Start the Database
1. Open the **XAMPP Control Panel**.
2. Start the **MySQL** module.
*(Ensure MySQL is running on the default port 3306).*

### 2. Start the Backend API Server
Open a new terminal or command prompt, and run the following commands:

```bash
# Navigate to the backend directory
cd a:\xampp\htdocs\smartrentTz\server

# Install dependencies (only needed the first time)
npm install

# Make sure your database is up to date (only needed if you change schema.prisma)
npx prisma db push

# (Optional) If you want to reset the database with fresh demo data:
node prisma/seed.js

# Start the Node.js backend server in development mode
npm run dev
```
The backend server will start running at **http://localhost:5000**.

### 3. Start the Frontend Application
Open a **second** terminal or command prompt, and run the following commands:

```bash
# Navigate to the frontend directory
cd a:\xampp\htdocs\smartrentTz\client

# Install dependencies (only needed the first time)
npm install

# Start the Vite development server
npm run dev
```
The frontend application will start running at **http://localhost:5173**. 
Open this URL in your browser to view the application!

## Demo Accounts
You can log in to the system using any of the seeded demo accounts. All accounts share the same password.

**Password for all accounts:** `password123`

- **Tenant:** `tenant@smartrent.test`
- **Landlord:** `landlord@smartrent.test`
- **Agent:** `agent@smartrent.test`
- **Admin:** `admin@smartrent.test`

## Troubleshooting
- **Database Connection Error:** Ensure XAMPP MySQL is running and your `server/.env` file has the correct `DATABASE_URL` (e.g., `mysql://root:@localhost:3306/smartrent`).
- **Port already in use:** If port 5000 or 5173 is busy, stop any other running processes or check for multiple instances of Node.js running in the background.
