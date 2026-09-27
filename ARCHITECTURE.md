# AutoFlow — System Architecture & Technical Design

## 1. Architectural Philosophy
AutoFlow is built on clean architectural patterns separating presentation, business logic, state-machine validation, and persistence:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REACT SPA PRESENTATION LAYER                      │
│                                                                             │
│   [Tailwind CSS]   [Recharts Analytics]   [Custom Dynamic Modals & Toasts] │
│          │                 │                           │                    │
│   [AuthContext]    [NotificationContext]     [Role-Based Route Guards]      │
│   (1-Click Demo)                                                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (Bearer JWT / Axios)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS.JS MVC BACKEND                             │
│                                                                             │
│   ├── Middleware: JWT Protect, Role Guard (RBAC), Global Error Handler      │
│   ├── Controllers: Auth, Vehicles, Bookings, ServiceJobs, Inspections,      │
│   │                Estimates, Inventory, Invoices, Payments, Analytics      │
│   ├── Services & Rules: State Machine Engine, Auto Inventory Decrement      │
│   └── Mongoose Models: User, Customer, Vehicle, Booking, ServiceJob,        │
│                        Inspection, Part, Estimate, Invoice, Payment, Audit  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Mongoose ORM
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA PERSISTENCE                                │
│                                                                             │
│  MongoDB Native Server / MongoMemoryServer (Seamless Zero-Config Fallback) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Normalized Schemas

### 2.1 User & Customer Models
* **`User`**: Core authentication record containing hashed passwords (`bcrypt`), system roles (`CUSTOMER`, `SERVICE_ADVISOR`, `MECHANIC`, `ADMIN`), contact phone, and technician specializations.
* **`Customer`**: References `User`, holding postal address, emergency contacts, and account notes.

### 2.2 Vehicle Model (`Vehicle`)
* Contains `customerId` (ref: `User`), uppercase unique `registrationNumber`, `make`, `model`, `year`, `fuelType`, `mileage` (odometer in KM), and `vin`.

### 2.3 Booking & ServiceJob Models
* **`Booking`**: Captures customer requested date, time slot, service package, problem notes, and initial `BOOKED` status.
* **`ServiceJob`**: Central hub of workshop execution. Contains check-in telemetry (`odometer`, `fuelLevelPercent`, `existingDamages`), assigned `advisorId`, assigned `mechanicId`, current status, quality check sign-off (`qcDetails`), and an array of timestamped status transitions (`statusHistory`).

### 2.4 Inspection & Parts Inventory Models
* **`Inspection`**: Embedded checklist categories (`Engine`, `Brakes`, `Suspension`, `Electrical`, `Tyres`) with conditions (`GOOD`, `NEEDS_ATTENTION`, `REPLACE`), technician diagnostic summary, and recommended repair items.
* **`Part`**: Inventory ledger tracking `partNumber`, item name, category, supplier, `purchasePrice`, `sellingPrice`, `currentStock`, and `minStockLevel`.

### 2.5 Estimate, Invoice & Payment Models
* **`Estimate`**: Itemized spare parts, labour tasks with hourly rates, tax amount (`18% standard GST`), discount amount, `grandTotal`, and customer authorization state (`PENDING`, `APPROVED`, `REJECTED`).
* **`Invoice`**: Sealed billing statement reflecting finalized amounts, `paymentStatus` (`PENDING`, `PARTIAL`, `PAID`), and payment balance.
* **`Payment`**: Records transaction reference, payment method (`UPI`, `CARD`, `CASH`), amount settled, and timestamp.

### 2.6 AuditLog Model (`AuditLog`)
* Append-only immutable activity log capturing `userName`, `userRole`, `action`, target `entity`, `entityId`, and detailed event description.

---

## 3. High-Reliability Zero-Config Database Fallback
To ensure that evaluators testing AutoFlow on different machines face zero setup hurdles, the database connector `src/config/db.js` incorporates intelligent fallback:
1. Connects to `mongodb://127.0.0.1:27017/autoflow` by default.
2. If no local MongoDB service is running, it automatically boots an in-process **`MongoMemoryServer`** instance and seeds the entire realistic dataset seamlessly!
