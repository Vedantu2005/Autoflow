# AutoFlow — REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require an `Authorization: Bearer <token>` HTTP header.

---

## 1. Authentication Endpoints

### Register New User
* **Method:** `POST`
* **Route:** `/api/auth/register`
* **Access:** Public
* **Payload:**
  ```json
  {
    "name": "Amit Patil",
    "email": "amit@autoflow.com",
    "password": "password123",
    "phone": "+91 98765 43210",
    "role": "CUSTOMER"
  }
  ```

### User Login
* **Method:** `POST`
* **Route:** `/api/auth/login`
* **Access:** Public
* **Payload:**
  ```json
  {
    "email": "amit@autoflow.com",
    "password": "password123"
  }
  ```
* **Response:** Returns JWT token and user profile object with assigned role.

---

## 2. Vehicles Endpoints

### List Vehicles
* **Method:** `GET`
* **Route:** `/api/vehicles`
* **Access:** Private (Customer sees own vehicles, Staff sees all)

### Register Vehicle
* **Method:** `POST`
* **Route:** `/api/vehicles`
* **Payload:**
  ```json
  {
    "registrationNumber": "MH10AB1234",
    "make": "Honda",
    "model": "City",
    "year": 2021,
    "fuelType": "PETROL",
    "mileage": 45200
  }
  ```

### Vehicle Service History
* **Method:** `GET`
* **Route:** `/api/vehicles/:id/history`
* **Access:** Private

---

## 3. Bookings & Service Jobs Endpoints

### Create Booking
* **Method:** `POST`
* **Route:** `/api/bookings`
* **Payload:**
  ```json
  {
    "vehicleId": "65af...",
    "serviceType": "General Periodic Service",
    "preferredDate": "2026-09-24",
    "preferredTimeSlot": "09:00 AM - 11:00 AM",
    "customerComments": "Engine oil check and brake inspection"
  }
  ```

### Vehicle Check-In (Generate Job Card)
* **Method:** `POST`
* **Route:** `/api/service-jobs`
* **Access:** Service Advisor / Admin
* **Payload:**
  ```json
  {
    "bookingId": "65af...",
    "vehicleId": "65af...",
    "mechanicId": "65af...",
    "serviceType": "General Periodic Service",
    "odometer": 45200,
    "fuelLevelPercent": 70,
    "existingDamages": ["Minor bumper scratch"],
    "checkInNotes": "Checked in at reception desk"
  }
  ```

### Update Job Status
* **Method:** `PUT`
* **Route:** `/api/service-jobs/:id/status`
* **Payload:**
  ```json
  {
    "status": "IN_SERVICE",
    "notes": "Technician began maintenance operations"
  }
  ```
* **Enforced Business Rule:** Fails with 400 Bad Request if transitioning to `IN_SERVICE` before customer approval on estimate!

### Quality Check Sign-off
* **Method:** `PUT`
* **Route:** `/api/service-jobs/:id/qc`
* **Access:** Service Advisor / Admin
* **Payload:**
  ```json
  {
    "passed": true,
    "notes": "Road test successful. All brake and engine checks passed."
  }
  ```

---

## 4. Inspections & Estimates Endpoints

### Submit Digital Inspection
* **Method:** `POST`
* **Route:** `/api/inspections`
* **Access:** Mechanic / Advisor / Admin
* **Payload:**
  ```json
  {
    "serviceJobId": "65af...",
    "checklist": [
      { "category": "Engine", "item": "Engine Oil Quality", "condition": "NEEDS_ATTENTION", "notes": "Degraded" },
      { "category": "Brakes", "item": "Front Brake Pads", "condition": "REPLACE", "notes": "Worn down" }
    ],
    "overallDiagnosis": "Engine oil and filter need replacement, front brake pads worn.",
    "recommendedRepairs": ["Engine Oil Change", "Oil Filter Replacement", "Brake Pad Replacement"]
  }
  ```

### Generate Estimate
* **Method:** `POST`
* **Route:** `/api/estimates`
* **Access:** Service Advisor / Admin
* **Payload:**
  ```json
  {
    "serviceJobId": "65af...",
    "parts": [{ "partId": "65af...", "quantity": 1 }],
    "labour": [{ "description": "Periodic Service Labour", "hours": 2, "ratePerHour": 500 }],
    "taxPercent": 18,
    "discountAmount": 0
  }
  ```

### Customer Approve / Reject Estimate
* **Method:** `PUT`
* **Route:** `/api/estimates/:id/approve`
* **Access:** Customer / Advisor / Admin
* **Payload:**
  ```json
  {
    "action": "APPROVE"
  }
  ```
* **Automated Effect:** Automatically decrements stock for every part in inventory and triggers low-stock alerts if stock drops below threshold!

---

## 5. Invoicing & Razorpay Payments

### Issue Final Invoice
* **Method:** `POST`
* **Route:** `/api/invoices`
* **Payload:** `{ "serviceJobId": "65af..." }`

### Get Razorpay Public Key
* **Method:** `GET`
* **Route:** `/api/payments/razorpay-key`
* **Response:** `{ "keyId": "rzp_test_RoMYE85wG1Vzew" }`

### Create Razorpay Order
* **Method:** `POST`
* **Route:** `/api/payments/create-order`
* **Payload:**
  ```json
  {
    "invoiceId": "65af...",
    "amount": 4897
  }
  ```
* **Response:** Returns `orderId`, `amount` (in paise), `currency`, `keyId`, and invoice context for Razorpay Checkout SDK.

### Verify Razorpay Payment Signature
* **Method:** `POST`
* **Route:** `/api/payments/verify`
* **Payload:**
  ```json
  {
    "invoiceId": "65af...",
    "razorpay_order_id": "order_...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "...",
    "amount": 4897
  }
  ```
* **Effect:** Verifies HMAC-SHA256 signature using Razorpay Key Secret. Updates invoice status to `PAID` (or `PARTIAL`), logs transaction in `Payment` collection, creates audit log, and marks job status as `READY_FOR_DELIVERY`.

### Process Cash / Counter Settlement (Fallback)
* **Method:** `POST`
* **Route:** `/api/payments`
* **Payload:**
  ```json
  {
    "invoiceId": "65af...",
    "amount": 4897,
    "paymentMethod": "CASH",
    "transactionRef": "CASH-892716301"
  }
  ```
* **Effect:** Records physical counter payment and updates invoice status.

---

## 6. Inventory & Analytics Endpoints

### List Inventory Parts
* **Method:** `GET`
* **Route:** `/api/parts`

### Get Low Stock Parts
* **Method:** `GET`
* **Route:** `/api/parts/low-stock`

### Executive Dashboard Analytics
* **Method:** `GET`
* **Route:** `/api/analytics/dashboard`
* **Access:** Admin / Advisor

### System Audit Trail
* **Method:** `GET`
* **Route:** `/api/audit-logs`
* **Access:** Admin
