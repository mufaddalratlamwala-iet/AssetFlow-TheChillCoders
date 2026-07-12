# AssetFlow — Enterprise Asset Management System

> **Team: The Chill Coders** · Odoo Hackathon 2026

AssetFlow is a full-stack enterprise asset management platform that enables organizations to register, track, allocate, and audit hardware and resource assets across departments — powered by AI-assisted automation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend (Express Server)](#2-backend-express-server)
  - [3. Frontend (React + Vite)](#3-frontend-react--vite)
  - [4. AI Service (FastAPI) — Optional](#4-ai-service-fastapi--optional)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Default Login Credentials](#default-login-credentials)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Development Team](#development-team)

---

## Features

### Core Platform
- **JWT Authentication** — Secure login/signup with role-based access control (Admin, Asset Manager, Department Head, Employee)
- **Organization Setup** — CRUD operations for Departments, Asset Categories, and Employee management
- **Asset Directory** — Full asset registry with table/grid views, advanced search & filtering (by category, status, location), and detail modals showing allocation & maintenance history
- **Asset Registration** — Register new assets with serial tracking, acquisition records, and document URLs
- **Reports & Analytics Dashboard** — Aggregated utilization charts, maintenance frequency trends, department summaries, and booking heatmaps with time-frame filters
- **Activity & Notifications** — Unified real-time feed merging system notifications and audit activity logs, with dismiss actions, search, category filters, and JSON export

### AI-Powered Features
- **Smart Asset Registration** — Upload an invoice, receipt, or asset photo and the AI automatically extracts asset details (name, serial, cost, vendor, category) to pre-fill the registration form. Users can review, edit, and save.

### Role-Based Access Control
| Role             | Permissions                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **Admin**        | Full access — all CRUD operations, all reports, org-wide data visibility    |
| **Asset Manager**| Asset CRUD, reports, org-wide asset visibility                              |
| **Department Head** | Department-scoped data — sees own department's assets, logs, and reports |
| **Employee**     | View own allocated assets, own notifications and activity logs              |

---

## Tech Stack

| Layer        | Technology                                                      |
|--------------|----------------------------------------------------------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Material Symbols Icons       |
| **Backend**  | Node.js, Express 4, Mongoose 8, JWT (jsonwebtoken), bcryptjs   |
| **Database** | MongoDB Atlas (or local MongoDB)                                |
| **AI Service** | Python, FastAPI, OpenAI GPT-4.1, Uvicorn                     |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Client  │────▶│  Express Server │────▶│   MongoDB Atlas │
│  (localhost:5173)│     │  (localhost:5000)│     │                 │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         │  File Upload
         ▼
┌─────────────────┐
│  FastAPI AI Svc  │
│  (localhost:8000)│
│   or via ngrok   │
└─────────────────┘
```

---

## Project Structure

```
odoo-2026/
├── client/                          # React Frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx            # Authentication screen
│   │   │   ├── Sidebar.jsx          # Shared navigation sidebar
│   │   │   ├── OrganizationSetup.jsx# Departments, Categories, Employees
│   │   │   ├── AssetDirectory.jsx   # Asset registry + AI registration
│   │   │   ├── Reports.jsx          # Analytics dashboard
│   │   │   └── Notifications.jsx    # Activity feed & notifications
│   │   ├── App.jsx                  # Root component & screen router
│   │   ├── index.css                # Global styles & Tailwind config
│   │   └── main.jsx                 # Vite entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express Backend (Node.js)
│   ├── src/
│   │   ├── models/                  # Mongoose Schemas
│   │   │   ├── Employee.js
│   │   │   ├── Department.js
│   │   │   ├── AssetCategory.js
│   │   │   ├── Asset.js
│   │   │   ├── Allocation.js
│   │   │   ├── MaintenanceRequest.js
│   │   │   ├── Booking.js
│   │   │   ├── Notification.js
│   │   │   ├── ActivityLog.js
│   │   │   ├── TransferRequest.js
│   │   │   ├── AuditCycle.js
│   │   │   ├── AuditItem.js
│   │   │   └── AiJob.js
│   │   ├── services/                # Business logic layer
│   │   ├── controllers/             # Request handlers
│   │   ├── routes/                  # Express route definitions
│   │   ├── middlewares/             # Auth, error handler, activity logger
│   │   ├── utils/                   # Asset tag generator, notification helper
│   │   ├── seeds/seed.js            # Database seeder
│   │   ├── config/db.js             # MongoDB connection
│   │   ├── app.js                   # Express app configuration
│   │   └── server.js                # Entry point
│   ├── .env                         # Environment variables (not committed)
│   └── package.json
│
├── ai-service/                      # Python AI Microservice (FastAPI)
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── config.py                # Settings & env vars
│   │   ├── schemas.py               # Pydantic response models
│   │   ├── routers/
│   │   │   ├── registration.py      # POST /ai/registration/extract
│   │   │   └── search.py            # POST /ai/search
│   │   ├── services/
│   │   │   └── extraction_service.py# OpenAI vision extraction logic
│   │   └── db.py                    # MongoDB connection for AI search
│   ├── requirements.txt
│   └── .env                         # AI service env vars (not committed)
│
└── README.md 
```

---

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Python** ≥ 3.10 _(only for AI service)_
- **MongoDB** — Atlas cluster (recommended) or local instance
- **OpenAI API Key** _(only for AI service)_

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mufaddalratlamwala-iet/AssetFlow-TheChillCoders.git
cd AssetFlow-TheChillCoders
```

### 2. Backend (Express Server)

```bash
cd server
npm install
```

Create the `.env` file (see [Environment Variables](#environment-variables)), then:

```bash
# Seed the database with demo data
npm run seed

# Start the development server (port 5000)
npm run dev
```

### 3. Frontend (React + Vite)

```bash
cd client
npm install

# Start the dev server (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. AI Service (FastAPI) — Optional

> The AI service is only needed for the **Smart Asset Registration** feature.

```bash
cd ai-service

# Create a virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create the `.env` file inside `ai-service/` (see below), then:

```bash
# Start the AI service (port 8000)
python -m uvicorn app.main:app --reload --port 8000
```

---

## Environment Variables

### `server/.env`

```env
PORT=5000
MONGODB_URI=localhost:27017/AssetFlow
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here-change-in-production
JWT_EXPIRES_IN=7d
```

### `ai-service/.env`

```env
MONGODB_URI=localhost:27017/AssetFlow
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_EXTRACTION_MODEL=gpt-4.1
OPENAI_SEARCH_MODEL=gpt-4.1-mini
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
```

---

## Database Seeding

Run the seed script to populate the database with demo data:

```bash
cd server
npm run seed
```

This creates:
- **3 Departments** — Engineering, HR, Design
- **5 Employees** — with various roles (see credentials below)
- **3 Asset Categories** — Laptops, Furniture, Vehicles
- **4 Assets** — with varying statuses (Available, Allocated, Under Maintenance)
- **Allocations, Maintenance Requests, Bookings** — for report data
- **Notifications & Activity Logs** — for the activity feed

---

## Default Login Credentials

After seeding, use these accounts to test different roles:

| Email                     | Password     | Role             | Department  |
|---------------------------|-------------|------------------|-------------|
| `admin@assetflow.com`     | `admin123`  | Admin            | —           |
| `manager@assetflow.com`   | `manager123`| Asset Manager    | —           |
| `head@assetflow.com`      | `head123`   | Department Head  | Engineering |
| `emp1@assetflow.com`      | `emp123`    | Employee         | Engineering |
| `emp2@assetflow.com`      | `emp123`    | Employee         | HR          |

---

## API Endpoints

### Authentication
| Method | Endpoint             | Description         | Auth   |
|--------|----------------------|---------------------|--------|
| POST   | `/api/auth/signup`   | Register new user   | —      |
| POST   | `/api/auth/login`    | Login & get JWT     | —      |
| GET    | `/api/auth/me`       | Get current user    | Bearer |

### Organization Setup
| Method | Endpoint                    | Description              | Auth           |
|--------|-----------------------------|--------------------------|----------------|
| GET    | `/api/departments`          | List all departments     | Bearer         |
| POST   | `/api/departments`          | Create department        | Admin          |
| PATCH  | `/api/departments/:id`      | Update department        | Admin          |
| DELETE | `/api/departments/:id`      | Delete department        | Admin          |
| GET    | `/api/asset-categories`     | List all categories      | Bearer         |
| POST   | `/api/asset-categories`     | Create category          | Admin          |
| PATCH  | `/api/asset-categories/:id` | Update category          | Admin          |
| DELETE | `/api/asset-categories/:id` | Delete category          | Admin          |
| GET    | `/api/employees`            | List employees           | Admin          |
| PATCH  | `/api/employees/:id`        | Update employee          | Admin          |

### Asset Management
| Method | Endpoint                    | Description                        | Auth                  |
|--------|-----------------------------|------------------------------------|-----------------------|
| GET    | `/api/assets`               | List assets (filtered, searched)   | Bearer                |
| GET    | `/api/assets/:id`           | Asset detail + allocation/maintenance history | Bearer     |
| POST   | `/api/assets`               | Register new asset                 | Admin, Asset Manager  |
| PATCH  | `/api/assets/:id`           | Update asset                       | Admin, Asset Manager  |
| PATCH  | `/api/assets/:id/status`    | Change asset status                | Admin, Asset Manager  |

### Reports & Analytics
| Method | Endpoint                              | Description                 | Auth                            |
|--------|---------------------------------------|-----------------------------|----------------------------------|
| GET    | `/api/reports/utilization`            | Asset utilization breakdown | Admin, Asset Manager, Dept Head |
| GET    | `/api/reports/maintenance-frequency`  | Maintenance trends by month | Admin, Asset Manager, Dept Head |
| GET    | `/api/reports/department-summary`     | Assets per department       | Admin, Asset Manager, Dept Head |
| GET    | `/api/reports/booking-heatmap`        | Booking slots heatmap       | Admin, Asset Manager, Dept Head |

### Notifications & Activity Logs
| Method | Endpoint                           | Description              | Auth   |
|--------|-------------------------------------|--------------------------|--------|
| GET    | `/api/notifications`               | List notifications       | Bearer |
| PATCH  | `/api/notifications/:id/read`      | Mark notification read   | Bearer |
| GET    | `/api/activity-logs`               | List activity logs       | Bearer |

### AI Service (Smart Registration)
| Method | Endpoint                     | Description                                     | Auth |
|--------|------------------------------|-------------------------------------------------|------|
| POST   | `/ai/registration/extract`   | Extract asset fields from invoice/photo (multipart file) | —    |
| POST   | `/ai/search`                 | Natural language asset search                   | —    |
| GET    | `/health`                    | AI service health check                         | —    |

---

## Screenshots

### Login Screen
Secure JWT authentication with role-based session management.

### Asset Directory
Table and grid view modes with advanced filtering, asset registration, and detail modals.

### AI-Powered Registration
Upload an invoice or asset photo → AI extracts fields → form auto-fills with confidence indicators.

### Reports Dashboard
Utilization charts, maintenance trends, department allocations, and booking heatmaps.

### Activity & Notifications
Real-time merged feed of system alerts and audit logs with dismiss actions and search.

---

## Development Team

| Developer | Scope |
|-----------|-------|
| **Dev A** | Auth, Org Setup, Asset Directory, Reports, Notifications, AI Integration, Models & Seed |
| **Dev B** | Allocation workflows, Maintenance module, Audit cycles, Transfer requests |

---

## License

This project was built for the **Odoo Hackathon 2026**.
