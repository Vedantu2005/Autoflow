# AutoFlow — End-to-End Business Workflow Specification

## 1. Executive Summary
"AutoFlow" is an enterprise-grade vehicle service management platform built to eradicate communication breakdown, unbilled technician work, inventory discrepancies, and delivery payment disputes in automotive repair centers.

Instead of treating service jobs as disconnected database tables, AutoFlow implements a **strict State Machine**:

```
[Customer Books Service]
           │
           ▼
        BOOKED ──(Cancellation)──► CANCELLED
           │
           ▼ (Vehicle arrives & Advisor records odometer/fuel/damages)
      CHECKED_IN
           │
           ▼ (Advisor assigns Technician & opens Job Card)
      INSPECTION
           │
           ▼ (Technician logs digital checklist & defects)
   ESTIMATE_PENDING
           │
           ▼ (Advisor itemizes Parts & Labour with 18% Tax)
  CUSTOMER_APPROVAL
           │
     ┌─────┴────────────────────────┐
     ▼                              ▼
  APPROVED                      REJECTED ──► Returns to ESTIMATE_PENDING
     │
     ▼ (Technician begins work & INVENTORY IS AUTOMATICALLY DECREMENTED)
    IN_SERVICE
     │
     ▼ (Technician completes repairs)
  QUALITY_CHECK
     │
     ▼ (Advisor verifies road test & generates final invoice)
READY_FOR_DELIVERY
     │
     ▼ (Customer settles payment via UPI/Card/Cash)
   COMPLETED ──► Archived permanently into Vehicle Service History Vault!
```

---

## 2. Detailed Lifecycle Stages & Gating Rules

### Stage 1: Customer Booking (`BOOKED`)
* **Actor:** Customer
* **Input:** Vehicle, preferred service package (e.g., General Periodic Service, Brake Overhaul), date, time slot, problem notes.
* **Gating Rule:** Booking slot checked against workshop daily capacity.

### Stage 2: Vehicle Check-In (`CHECKED_IN`)
* **Actor:** Service Advisor
* **Input:** Current odometer (KM), fuel level gauge percentage, initial inspection of existing dents/scratches, check-in notes.
* **Outcome:** System generates unique Job Card number `#SJ-1001` and marks booking as `CHECKED_IN`.

### Stage 3: Digital Multi-Point Inspection (`INSPECTION`)
* **Actor:** Mechanic
* **Input:** Multi-point checklist categories (Engine, Brakes, Suspension, Electrical, Tyres), defect conditions (`GOOD`, `NEEDS_ATTENTION`, `REPLACE`), technician diagnostic summary, and recommended repairs.
* **Transition:** Submitting diagnosis transitions Job Card to `ESTIMATE_PENDING`.

### Stage 4: Estimate Generation & Customer Approval (`CUSTOMER_APPROVAL`)
* **Actor:** Service Advisor & Customer
* **Input:** Parts selection from inventory (with live stock verification), labour hours & hourly rates, tax computation (18% standard GST), and customer discount.
* **Enforced Business Rule:** 
  > **Strict Gate 1 (Approval Requirement):** A technician CANNOT start service or draw parts from store until the customer clicks **Approve Estimate**.

### Stage 5: Service Execution & Auto-Stock Deduction (`IN_SERVICE`)
* **Actor:** Mechanic & System Engine
* **Automated Action:**
  ```javascript
  Part.currentStock = Part.currentStock - item.quantity;
  if (Part.currentStock <= Part.minStockLevel) {
    Trigger "Low Stock Alert" on Admin Dashboard;
  }
  ```
* **Enforced Business Rule:** Parts cannot be consumed if inventory quantity is insufficient.

### Stage 6: Quality Inspection (`QUALITY_CHECK`)
* **Actor:** Service Advisor
* **Input:** Road test verification, quality checklist sign-off.
* **Outcome:** Advisor approves QC and system triggers Final Invoice generation (`#INV-1001`).

### Stage 7: Invoicing & Payment Settlement (`READY_FOR_DELIVERY`)
* **Actor:** Customer & Advisor
* **Simulation:** Supports simulated settlement through UPI, Credit/Debit Card, or Cash Desk.
* **Enforced Business Rule:**
  > **Strict Gate 2 (Delivery Gatekeeper):** An Advisor is strictly blocked by the system from marking a vehicle `COMPLETED` if Invoice status is `PENDING` or balance is unpaid.

### Stage 8: Handover & Permanent Service History Archive (`COMPLETED`)
* **Actor:** Service Advisor
* **Outcome:** Keys handed over, job status marked `COMPLETED`. The entire lifecycle (job card, checklist, parts replaced, total cost, invoices) is sealed into the vehicle's permanent Service History vault.

---

## 3. Actor Roles & Permissions Matrix

| Capability | Customer | Service Advisor | Mechanic | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Register & Manage Vehicles | ✅ Own | ✅ All | ❌ | ✅ All |
| Book Service Appointments | ✅ | ✅ | ❌ | ✅ |
| Vehicle Check-In & Job Card Creation | ❌ | ✅ | ❌ | ✅ |
| Perform Digital Multi-Point Checklist | ❌ | ❌ | ✅ | ✅ |
| Build Parts & Labour Estimate | ❌ | ✅ | ❌ | ✅ |
| Approve / Reject Estimate | ✅ | ❌ | ❌ | ✅ Override |
| Start Repair & Update Progress | ❌ | ❌ | ✅ | ❌ |
| Conduct Quality Check (QC) | ❌ | ✅ | ❌ | ✅ |
| Issue Final Invoices | ❌ | ✅ | ❌ | ✅ |
| Settle Invoice Payment | ✅ | ✅ | ❌ | ✅ |
| Deliver Vehicle | ❌ | ✅ | ❌ | ✅ |
| Restock Parts & Manage Inventory | ❌ | ❌ | ❌ | ✅ |
| View System-Wide Analytics & Audit Trail | ❌ | ❌ | ❌ | ✅ |
