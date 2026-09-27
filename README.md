# AutoFlow â€” Smart Vehicle Service Management Platform

AutoFlow is an enterprise-grade, workflow-driven SaaS platform engineered for modern automotive service centers. It coordinates customers, service advisors, mechanics, and inventory storekeepers through a synchronized, validated business lifecycle.

---

## 1. Project Highlights
* **Zero Disconnected CRUD:** Every action moves the vehicle along a strict 10-stage finite state machine.
* **Gated Business Workflow:** Technicians cannot begin repairs without customer digital approval on estimates; vehicles cannot be handed over with pending invoices.
* **Automated Inventory Engine:** Real-time stock decrements upon estimate approval with automatic low-stock threshold alerts.
* **Role-Based Access:** Users sign in with their own registered account; access is determined by the role stored in MongoDB.
* **MongoDB-Backed Data:** Application records are read from and saved to the configured MongoDB database.

---

## 2. Tech Stack

### Frontend
* **Core:** React.js 18 + Vite
* **Styling:** Vanilla CSS + Tailwind CSS (Glassmorphism dark theme)
* **Routing:** React Router v6 (Role-guarded routes)
* **Network:** Axios with JWT request interceptors
* **Charts & Analytics:** Recharts
* **Icons:** Lucide React

### Backend
* **Runtime:** Node.js + Express.js (MVC Pattern)
* **Database & ORM:** MongoDB + Mongoose
* **Authentication:** JWT (JSON Web Tokens) + bcryptjs

---

## 3. Accounts

Create a customer account through the registration page, or sign in using an account already present in your MongoDB database. Staff accounts must be created with the appropriate role.

---

## 4. Local Setup Instructions

### Prerequisites
* Node.js v18+ or v20+
* npm

### Quick Start (Both Servers Run Concurrently)

#### 1. Start Backend:
```bash
cd backend
npm install
npm start
```
The backend uses a local MongoDB server at `mongodb://127.0.0.1:27017/autoflow`. Start MongoDB Community Server before starting the backend. No Atlas URI or `.env` file is required for the database connection.

The backend does not create demo records or use an in-memory database. An empty local database will show empty lists until records are created through the application.

#### 2. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 6. Architecture & Workflow Documentation Files
* [ARCHITECTURE.md](file:///c:/Users/ADMIN/Desktop/Thinqloud/ARCHITECTURE.md): Complete technical design and database schemas.
* [BUSINESS_FLOW.md](file:///c:/Users/ADMIN/Desktop/Thinqloud/BUSINESS_FLOW.md): Detailed 10-step lifecycle and business gating rules.
* [API_DOCUMENTATION.md](file:///c:/Users/ADMIN/Desktop/Thinqloud/API_DOCUMENTATION.md): Full REST API contracts and parameters.
* [AI_DEVELOPMENT_LOG.md](file:///c:/Users/ADMIN/Desktop/Thinqloud/AI_DEVELOPMENT_LOG.md): Problem statements, prompts, modifications, and learnings.
