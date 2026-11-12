# CUFind – Chandigarh University Smart Lost & Found Platform

CUFind is an enterprise-grade, full-stack smart Lost & Found web application engineered specifically for Chandigarh University (CU). It centralizes lost item reports, found property registration, automated deterministic similarity matching, ownership claim verification, dispute resolution, and recovery auditing across all campus departments.

---

## 1. Problem Statement & Solution

### Problem
Students and faculty frequently lose personal items (student ID cards, laptops, chargers, books, keys, water bottles, bags, wallets) across campus buildings, libraries, sports grounds, and cafeterias. Traditional campus lost and founds rely on fragmented bulletin boards, physical noticeboards, or disorganized social media groups with no formal verification, leading to fraudulent claims, unclaimed items, and low recovery rates.

### Solution
CUFind provides:
- **Centralized Registry:** Public searchable marketplace for all lost and found reports.
- **Smart Matching Engine:** Deterministic keyword- and attribute-based similarity engine that calculates a weighted score (0–100%) between opposite report types (`LOST` ↔ `FOUND`) and alerts students automatically.
- **Ownership Verification & Claim Workflow:** Prevents fraudulent claims by keeping private identifying details confidential and requiring claimants to submit unique proof and purchase records.
- **Dispute Resolution:** Flags items with rival claimants for formal administrative comparison and audit-logged decisions.
- **Recovery Archives & Analytics:** Transparent tracking of campus recovery rates and historical items.
- **Role-Based Governance:** Explicit boundaries between Students, Campus Administrators, and the Super Administrator.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (modern deep navy, indigo, and emerald palette)
- **Routing:** React Router DOM v6
- **State Management & Auth:** React Context API (`AuthContext`)
- **API Client:** Axios with JWT request/response interceptors
- **Form Handling & Validation:** React Hook Form + Zod schemas
- **Icons:** Lucide React

### Backend
- **Language & Runtime:** Java 21 (OpenJDK 21)
- **Framework:** Spring Boot 3.3.4
- **Web & REST:** Spring Web MVC
- **Database Access:** Spring Data JPA + Hibernate ORM
- **Security:** Spring Security 6 with stateless JWT authentication & BCrypt password hashing
- **API Documentation:** Springdoc OpenAPI / Swagger UI
- **Database Migrations:** Flyway Migration Engine
- **Boilerplate Reduction:** Project Lombok

### Database & Storage
- **Relational Database:** PostgreSQL (`projdb`, isolated `campusfind` schema)
- **File Storage:** Configurable filesystem storage with MIME-type verification, UUID randomization, and path-traversal safeguards

---

## 3. Architecture & Security Overview

The platform adheres to a layered backend architecture:
```
backend/
├── config/           # Spring Security, OpenAPI, CORS, DataInitializer
├── controller/       # REST API Controllers (Auth, Items, Claims, Matches, Notifications, Admin, SuperAdmin, Files)
├── service/          # Business logic, Smart Matching Engine, File Storage, Notifications, Auditing
├── repository/       # Spring Data JPA Repositories & Specifications
├── entity/           # JPA Entities (User, ItemReport, ItemImage, Claim, ClaimImage, ItemMatch, Notification, AdminAuditLog)
├── dto/              # Request / Response Transfer Objects with Jakarta Bean Validation
├── enums/            # Role, ReportType, ItemCategory, ReportStatus, ClaimStatus, NotificationType
├── security/         # JwtTokenProvider, JwtAuthenticationFilter, CustomUserDetailsService, UserPrincipal
└── exception/        # GlobalExceptionHandler, Custom exceptions (ResourceNotFound, BadRequest, Forbidden, Unauthorized)
```

### Security Guarantees
1. **Never trust client-supplied roles:** All endpoints are protected on the backend using `@PreAuthorize("hasRole(...)")` and Spring Security filters.
2. **Super Admin Exclusivity:** Only the `SUPERADMIN` role can create new administrators, view admin listings, toggle status, and reset admin passwords. Regular administrators attempting to invoke superadmin APIs receive `403 Forbidden`.
3. **Password Hashing:** Passwords are never stored or logged in plaintext; they are hashed using BCrypt.
4. **Fraud Prevention & Data Privacy:** For found items, secret identifying marks (e.g. roll numbers, engraved initials, serial numbers) are shielded from public API views. Claimants must independently state them in their claim.
5. **Double-Recovery Protection:** Once an administrator approves a claim, the database executes an atomic transaction marking the item as `RECOVERED`, marking the approved claim as `APPROVED`, rejecting rival claims, and recording the audit entry.

---

## 4. Smart Matching System (Deterministic Engine)

The intelligent matching engine compares `LOST` reports against `FOUND` reports (opposite types only).

### Weighted Scoring Formula:
| Parameter | Weight | Description |
| :--- | :---: | :--- |
| **Title Similarity** | **25%** | Tokenized Jaccard similarity after stop-word removal |
| **Description Similarity** | **20%** | Description keyword set intersection |
| **Category Match** | **15%** | 100% on exact match, 0% otherwise |
| **Colour Match** | **10%** | Jaccard token overlap between color specifications |
| **Brand Match** | **10%** | Brand token alignment and keyword context search |
| **Location Proximity** | **10%** | Proximity match across campus halls and buildings |
| **Date Proximity** | **10%** | Decays smoothly over 14 days difference |

### Match Thresholds:
- **80% – 100%:** **High Match** (instant prominent alert and notification)
- **60% – 79%:** **Possible Match** (suggested in dashboard)
- **Below 60%:** Filtered out to avoid notification fatigue

---

## 5. System Roles & Default Credentials

### Default Super Admin (Bootstrap Seeder)
An idempotent seeder initializes the root Super Admin account on first startup:
- **Email:** `admin@gmail.com`
- **Password:** `admin123`
- **Role:** `SUPERADMIN`

All student and administrative accounts, lost and found reports, claims, and matches are created dynamically through the platform.

> [!WARNING]
> The default development password (`admin123`) must be changed via Account Settings before real-world production deployment.

---

## 6. Installation & Setup Guide

### Prerequisites
- **Java:** OpenJDK 21 or higher (`java -version`)
- **Maven:** Version 3.9+ (`mvn -version`)
- **Node.js:** v18+ or v20+ (`node -v`)
- **npm:** v9+ (`npm -v`)
- **PostgreSQL:** Version 14+ (`psql --version`)

---

### Step 1: PostgreSQL Database Configuration

1. Log into your PostgreSQL instance:
```bash
psql -U postgres
```

2. Verify or create the database named `projdb`:
```sql
CREATE DATABASE projdb;
```

3. (Optional) The application uses the dedicated schema `campusfind` within `projdb`. Flyway migrations create all tables and indexes automatically upon backend startup.

---

### Step 2: Environment Configuration

Copy `.env.example` to `.env` in the project root and set your database password and secrets:
```bash
cp .env.example .env
```
Example `.env`:
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=projdb
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Backend Server Port
PORT=8081

# JWT Secret & Expiration
JWT_SECRET=CUFindSecretKeyForJwtAuthenticationSuperSecure384BitStringHere!
JWT_EXPIRATION_MS=86400000

# File Upload Directory
UPLOAD_DIR=uploads

# Super Admin Credentials
SUPERADMIN_EMAIL=admin@gmail.com
SUPERADMIN_PASSWORD=admin123
SUPERADMIN_NAME=System Super Admin
```

---

### Step 3: Start the Spring Boot Backend

From the project root:
```bash
cd backend
mvn clean spring-boot:run
```
The backend starts on port **8081** (http://localhost:8081).
- **Swagger OpenAPI Documentation:** [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- **API Spec JSON:** [http://localhost:8081/v3/api-docs](http://localhost:8081/v3/api-docs)

---

### Step 4: Start the React Frontend

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The React application starts at **http://localhost:5173**.

---

## 7. Running Tests

### Backend Unit & Integration Tests
Execute the automated test suite covering authentication, RBAC, matching score calculation, and authorization guards:
```bash
cd backend
mvn test
```
**Test Results:**
- `SmartMatchingServiceTest`: Tokenization, stop-word elimination, High Match calculation, and low score filtering.
- `AuthAndWorkflowIntegrationTest`: Super Admin bootstrap, student registration & login, Super Admin admin creation, and regular admin forbidden checks.

### Frontend Production Build
Verify TypeScript compile checks and Vite asset optimization:
```bash
cd frontend
npm run build
```

---

## 8. Main Application Workflows

1. **Student Registration:** Students sign up via `/register` using their official Chandigarh University email (`@cuchd.in`, e.g. `24BCS10980@cuchd.in`). All fields (`Full Name`, `@cuchd.in Email`, `Set Password`, `Confirm Password`, `University ID`, `Department`, and `Phone Number`) are mandatory, and the University ID (e.g. `24BCS10980`) is automatically derived from the prefix before `@cuchd.in`.
2. **Report Lost Item:** File a lost report with location, description, category, and photos.
3. **Report Found Item:** File a found item. Sensitive identifiers are kept confidential.
4. **Smart Match Engine in Action:** When a report is created, the system compares it against opposite listings and delivers an in-app notification when a similarity score exceeds 60%.
5. **Ownership Claim Submission:** A claimant submits an explanation and secret proof.
6. **Administrator Verification & Dispute Resolution:**
   - Single claims: Verified and approved.
   - Rival claims: Flagged as `DISPUTED` for administrative comparison.
7. **Recovery Archive:** Approving a claim marks the item `RECOVERED` and places it in the recovery archive.
8. **Super Admin Account Management:** Log in as Super Admin (`admin@gmail.com`) to create and manage campus officers.

---

## 9. Deliverables Directory Structure

```
PBLJ_Project/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/campusfind/
│       │   │   ├── config/
│       │   │   ├── controller/
│       │   │   ├── dto/
│       │   │   ├── entity/
│       │   │   ├── enums/
│       │   │   ├── exception/
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   └── service/
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/V1__init_campusfind_schema.sql
│       └── test/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
├── database/
│   └── schema.sql
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 10. Future Enhancements
- Mobile push notifications via WebPush / PWA.
- AI image similarity comparison using vector embeddings (e.g. CLIP).
- QR code stickers for student ID cards and laptops for instant one-scan recovery.
- Campus map integration with interactive building pins.
