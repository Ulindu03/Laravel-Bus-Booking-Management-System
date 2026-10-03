# 📋 Software Requirements Specification (SRS)

## Serendib Go — Online Bus Booking Management System

| Field                | Detail                                                        |
| -------------------- | ------------------------------------------------------------- |
| **Project Title**    | Serendib Go — Sri Lanka's Online Bus Ticketing Platform       |
| **Version**          | 2.0                                                           |
| **Date**             | 21 April 2026                                                 |
| **Author**           | Ulindu Chakranga Prabhashwara                                 |
| **Technology Stack** | Laravel 12 (Backend) · Next.js 16 (Frontend) · MySQL · Docker |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Current System Status](#2-current-system-status)
3. [System Architecture](#3-system-architecture)
4. [User Roles & Actors](#4-user-roles--actors)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Database Design](#7-database-design)
8. [API Specification](#8-api-specification)
9. [Frontend Pages & Components](#9-frontend-pages--components)
10. [Use Case Descriptions](#10-use-case-descriptions)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Glossary](#12-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document provides a complete Software Requirements Specification (SRS) for **Serendib Go**, a full-stack online bus booking management system. It defines every functional and non-functional requirement necessary to deliver a production-ready platform for Sri Lanka's inter-city bus transport.

### 1.2 Scope

The system will allow:

- **Passengers** — to search routes, select seats, book tickets, make payments, and manage their travel history.
- **Bus Operators** — to manage their fleet, define schedules, and monitor bookings.
- **Administrators** — to oversee the entire platform, manage users, approve operators, and view analytics.

### 1.3 Intended Audience

| Audience       | Purpose                              |
| -------------- | ------------------------------------ |
| Developer(s)   | Implementation reference             |
| Lecturer/Tutor | Academic evaluation and grading      |
| Project Owner  | Feature approval and sign-off        |
| QA / Tester    | Test case development and validation |

### 1.4 Definitions & Abbreviations

| Term     | Meaning                                    |
| -------- | ------------------------------------------ |
| SRS      | Software Requirements Specification        |
| API      | Application Programming Interface          |
| RBAC     | Role-Based Access Control                  |
| CRUD     | Create, Read, Update, Delete               |
| JWT      | JSON Web Token                             |
| SSR      | Server-Side Rendering                      |
| MUI      | Material-UI (React component library)      |
| Sanctum  | Laravel Sanctum (API token authentication) |

---

## 2. Current System Status

### 2.1 What Is Already Built

| Layer    | Component              | Status | Notes                                   |
| -------- | ---------------------- | ------ | --------------------------------------- |
| Backend  | User Model             | ✅ Done | Includes role field (admin/user)        |
| Backend  | AuthController         | ✅ Done | Login, Logout, Me endpoints             |
| Backend  | Sanctum Auth           | ✅ Done | Token-based API authentication          |
| Backend  | Admin Seeder           | ✅ Done | Pre-configured admin account            |
| Backend  | Database Migrations    | ✅ Done | Users, sessions, personal access tokens |
| Frontend | Homepage               | ✅ Done | Hero, Search, Features, Routes, Stats   |
| Frontend | Header & Footer        | ✅ Done | Global navigation and footer            |
| Frontend | Preloader              | ✅ Done | Animated page loading screen            |
| Frontend | Auth Context           | ✅ Done | Login/logout/fetchUser via Context API  |
| Frontend | Axios Instance         | ✅ Done | Interceptors for Bearer token           |
| Frontend | Register Page          | ✅ Done | Full form with validation               |
| Frontend | Route Groups           | ✅ Done | (public), (auth), (admin), (user)       |
| Frontend | Dashboard Page         | ⚠️ Stub | Placeholder only                        |

### 2.2 What Still Needs to Be Built

| Priority | Module                  | Status     |
| -------- | ----------------------- | ---------- |
| 🔴 High  | User Registration API   | ❌ Not Built |
| 🔴 High  | Login Page (Frontend)   | ❌ Not Built |
| 🔴 High  | Bus Management (CRUD)   | ❌ Not Built |
| 🔴 High  | Route Management (CRUD) | ❌ Not Built |
| 🔴 High  | Schedule Management     | ❌ Not Built |
| 🔴 High  | Seat Selection & Booking| ❌ Not Built |
| 🔴 High  | Booking Management      | ❌ Not Built |
| 🟡 Medium| Payment Integration     | ❌ Not Built |
| 🟡 Medium| PDF Ticket Generation   | ❌ Not Built |
| 🟡 Medium| Email Notifications     | ❌ Not Built |
| 🟡 Medium| User Dashboard          | ⚠️ Stub Only |
| 🟡 Medium| Admin Dashboard         | ❌ Not Built |
| 🟢 Low   | Real-time Bus Tracking  | ❌ Not Built |
| 🟢 Low   | Reviews & Ratings       | ❌ Not Built |
| 🟢 Low   | Analytics & Reports     | ❌ Not Built |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                   Next.js 16 + React 19                           │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │  Public   │  │   Auth   │  │   User   │  │     Admin        │  │  │
│  │  │  Pages    │  │   Pages  │  │  Dashboard│  │   Dashboard     │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │  │
│  │            MUI Components · CSS Modules · Tailwind CSS            │  │
│  │                   AuthContext · Axios Interceptors                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │  REST API (JSON) + Bearer Token
┌──────────────────────────────▼───────────────────────────────────────────┐
│                          API LAYER (Server)                              │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                     Laravel 12 + PHP 8.2                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐    │  │
│  │  │  Controllers  │  │   Models     │  │  Middleware (Sanctum) │    │  │
│  │  │  · Auth       │  │  · User      │  │  · auth:sanctum      │    │  │
│  │  │  · Bus        │  │  · Bus       │  │  · role:admin        │    │  │
│  │  │  · Route      │  │  · Route     │  │  · cors              │    │  │
│  │  │  · Schedule   │  │  · Schedule  │  │  · throttle          │    │  │
│  │  │  · Booking    │  │  · Booking   │  └──────────────────────┘    │  │
│  │  │  · Payment    │  │  · Payment   │                              │  │
│  │  │  · Admin      │  │  · Ticket    │  ┌──────────────────────┐    │  │
│  │  └──────────────┘  └──────────────┘  │  Services & Helpers   │    │  │
│  │                                       │  · PDF Generator      │    │  │
│  │                                       │  · Email Service      │    │  │
│  │                                       │  · Payment Gateway    │    │  │
│  │                                       └──────────────────────┘    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                          DATA LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    MySQL Database (Docker)                         │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ users  │ │ buses  │ │  routes  │ │schedules │ │  bookings  │  │  │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │payments│ │tickets │ │  seats   │ │ reviews  │ │   tokens   │  │  │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘ └────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. User Roles & Actors

### 4.1 Primary Actors

| Role            | Description                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| **Guest**       | Unauthenticated visitor. Can view the homepage, search bus routes, and access the login/register pages |
| **Passenger**   | Registered user. Can search, book, pay, view tickets, cancel bookings, and manage their profile       |
| **Admin**       | Platform administrator. Full CRUD on buses, routes, schedules, users, and bookings. Views analytics   |

### 4.2 Secondary Actors

| Actor               | Description                                |
| -------------------- | ------------------------------------------ |
| **Payment Gateway**  | External system for processing payments    |
| **Email Service**    | External SMTP/API for email notifications  |
| **PDF Engine**       | Server-side service for ticket generation  |

---

## 5. Functional Requirements

### 5.1 Authentication & User Management

| ID       | Requirement                                           | Priority | Status     |
| -------- | ----------------------------------------------------- | -------- | ---------- |
| FR-1.1   | User registration with name, email, and password      | High     | ⚠️ Frontend only |
| FR-1.2   | User login with email and password                    | High     | ✅ Backend done   |
| FR-1.3   | Token-based authentication (Laravel Sanctum)          | High     | ✅ Done           |
| FR-1.4   | User logout (revoke all tokens)                       | High     | ✅ Done           |
| FR-1.5   | Fetch authenticated user profile (`/api/auth/me`)     | High     | ✅ Done           |
| FR-1.6   | Role-based access control (admin / user)              | High     | ✅ Model done     |
| FR-1.7   | Password reset via email link                         | Medium   | ❌ Not Built     |
| FR-1.8   | Email verification after registration                 | Medium   | ❌ Not Built     |
| FR-1.9   | Update user profile (name, phone, avatar)             | Medium   | ❌ Not Built     |
| FR-1.10  | Admin can manage all user accounts (view/block/delete) | Medium  | ❌ Not Built     |

#### FR-1.1 — User Registration (Detailed)

- **Input**: Full name, email address, password, confirm password
- **Validation Rules**:
  - Name: required, min 2 chars, max 255 chars
  - Email: required, valid email format, unique in users table
  - Password: required, min 8 chars, must contain one uppercase, one number
  - Confirm password: required, must match password
- **Processing**: Hash password with bcrypt, store user with role = "user"
- **Output**: Success message with redirect to login page
- **Error Response**: Validation errors returned as JSON with 422 status

#### FR-1.2 — User Login (Detailed)

- **Input**: Email address, password
- **Validation Rules**:
  - Email: required, valid email format
  - Password: required
- **Processing**: Verify credentials, generate Sanctum token
- **Output**: JSON containing `access_token`, `token_type`, and `user` object
- **Error Response**: 401 with "Invalid email or password" message

---

### 5.2 Bus Management (Admin Only)

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-2.1   | Admin can add a new bus with details                        | High     | ❌ Not Built |
| FR-2.2   | Admin can view all registered buses                         | High     | ❌ Not Built |
| FR-2.3   | Admin can update bus details                                | High     | ❌ Not Built |
| FR-2.4   | Admin can delete/deactivate a bus                           | High     | ❌ Not Built |
| FR-2.5   | Each bus has a seat layout configuration                    | High     | ❌ Not Built |
| FR-2.6   | Bus types supported: Normal, Semi-Luxury, Luxury, AC       | Medium   | ❌ Not Built |

#### FR-2.1 — Add New Bus (Detailed)

- **Fields Required**:
  - Bus number/registration (unique, e.g., `NB-1234`)
  - Bus name/operator name
  - Bus type (Normal / Semi-Luxury / Luxury / AC)
  - Total seat capacity (e.g., 42, 54)
  - Seat layout (e.g., `2x2`, `2x3`)
  - Amenities (WiFi, charging ports, AC, TV — checkboxes)
  - Status (active / inactive / maintenance)

---

### 5.3 Route Management (Admin Only)

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-3.1   | Admin can create bus routes (origin → destination)          | High     | ❌ Not Built |
| FR-3.2   | Each route includes intermediate stops                      | High     | ❌ Not Built |
| FR-3.3   | Estimated duration and distance per route                   | Medium   | ❌ Not Built |
| FR-3.4   | Admin can update route details                              | High     | ❌ Not Built |
| FR-3.5   | Admin can deactivate/delete a route                         | Medium   | ❌ Not Built |

#### FR-3.1 — Create Route (Detailed)

- **Fields Required**:
  - Route name (e.g., "Colombo – Kandy Express")
  - Origin city
  - Destination city
  - Intermediate stops (ordered list with estimated time at each stop)
  - Total distance (km)
  - Estimated travel duration (hours/minutes)
  - Base fare price (LKR)
  - Status (active / inactive)

---

### 5.4 Schedule Management (Admin Only)

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-4.1   | Admin can create schedules (link a bus to a route + date/time) | High  | ❌ Not Built |
| FR-4.2   | Admin can view all schedules (list/calendar view)           | High     | ❌ Not Built |
| FR-4.3   | Admin can update schedule details                           | High     | ❌ Not Built |
| FR-4.4   | Admin can cancel a scheduled trip                           | High     | ❌ Not Built |
| FR-4.5   | System prevents double-booking of same bus at overlapping times | High | ❌ Not Built |
| FR-4.6   | Recurring schedule creation (daily/weekly)                  | Low      | ❌ Not Built |

#### FR-4.1 — Create Schedule (Detailed)

- **Fields Required**:
  - Select Bus (from active buses)
  - Select Route (from active routes)
  - Departure date and time
  - Arrival date and time (estimated)
  - Price per seat (can override route base fare)
  - Available seats (auto-populated from bus capacity)
  - Status (scheduled / in-progress / completed / cancelled)

---

### 5.5 Search & Browse (Public / Passenger)

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-5.1   | Search buses by origin, destination, and date               | High     | ⚠️ UI only   |
| FR-5.2   | Display search results with bus details, time, price, seats | High     | ❌ Not Built |
| FR-5.3   | Filter results by bus type, price range, departure time     | Medium   | ❌ Not Built |
| FR-5.4   | Sort results by price, departure time, duration             | Medium   | ❌ Not Built |
| FR-5.5   | View detailed bus information before booking                | Medium   | ❌ Not Built |
| FR-5.6   | Display popular/featured routes on homepage                 | Low      | ✅ Done (static) |

#### FR-5.1 — Search Buses (Detailed)

- **Input**: Origin city, Destination city, Travel date
- **Processing**: Query schedules table joining routes and buses
- **Output**: List of available trips including:
  - Bus name & type
  - Departure & arrival times
  - Available seat count
  - Price per seat
  - Amenities
  - Duration
- **Edge Cases**: No results → friendly "No buses found" message with alternative date suggestion

---

### 5.6 Seat Selection & Booking (Passenger Only)

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-6.1   | Interactive seat map showing available/booked seats         | High     | ❌ Not Built |
| FR-6.2   | Passenger can select one or more seats                      | High     | ❌ Not Built |
| FR-6.3   | Real-time seat availability (prevent double-booking)        | High     | ❌ Not Built |
| FR-6.4   | Booking summary before payment                              | High     | ❌ Not Built |
| FR-6.5   | Passenger details required for each seat (name, phone)      | Medium   | ❌ Not Built |
| FR-6.6   | Temporary seat hold for 10 minutes during checkout          | Medium   | ❌ Not Built |

#### FR-6.1 — Interactive Seat Map (Detailed)

- **Display**: Visual grid representing bus seat layout
  - 🟢 Green = Available seat
  - 🔴 Red = Already booked
  - 🔵 Blue = Selected by current user
  - ⬜ Grey = Aisle / Empty space
- **Interaction**: Click to select/deselect seat
- **Live Price Update**: Total fare updates as seats are selected

---

### 5.7 Booking Management

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-7.1   | Create booking with passenger details and selected seats    | High     | ❌ Not Built |
| FR-7.2   | Booking confirmation with unique booking reference          | High     | ❌ Not Built |
| FR-7.3   | View all user bookings (upcoming & past)                    | High     | ❌ Not Built |
| FR-7.4   | Cancel a booking (with cancellation policy logic)           | High     | ❌ Not Built |
| FR-7.5   | Admin can view all bookings across the system               | High     | ❌ Not Built |
| FR-7.6   | Booking status tracking (pending → confirmed → completed)   | Medium   | ❌ Not Built |
| FR-7.7   | Auto-expire unpaid bookings after timeout                   | Medium   | ❌ Not Built |

#### Booking Lifecycle State Machine

```
  ┌──────────┐     Pay      ┌───────────┐    Depart    ┌───────────┐
  │ PENDING  │─────────────▶│ CONFIRMED │─────────────▶│ COMPLETED │
  └──────────┘              └───────────┘              └───────────┘
       │                          │
       │ Timeout                  │ Cancel
       ▼                          ▼
  ┌──────────┐              ┌───────────┐
  │ EXPIRED  │              │ CANCELLED │
  └──────────┘              └───────────┘
```

---

### 5.8 Payment Processing

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-8.1   | Process payments via integrated payment gateway             | Medium   | ❌ Not Built |
| FR-8.2   | Support credit/debit cards                                  | Medium   | ❌ Not Built |
| FR-8.3   | Payment receipt generation                                  | Medium   | ❌ Not Built |
| FR-8.4   | Refund processing for cancellations                         | Medium   | ❌ Not Built |
| FR-8.5   | Payment history for each user                               | Medium   | ❌ Not Built |
| FR-8.6   | Admin revenue reports                                       | Low      | ❌ Not Built |

---

### 5.9 Ticket Generation

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-9.1   | Generate downloadable PDF ticket after payment              | Medium   | ❌ Not Built |
| FR-9.2   | Ticket includes QR code for verification                    | Medium   | ❌ Not Built |
| FR-9.3   | Email ticket to passenger automatically                     | Medium   | ❌ Not Built |
| FR-9.4   | Ticket displays: route, date, seat, booking ref, passenger  | Medium   | ❌ Not Built |

---

### 5.10 Notifications

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-10.1  | Email confirmation after successful booking                 | Medium   | ❌ Not Built |
| FR-10.2  | Email notification for booking cancellation                 | Medium   | ❌ Not Built |
| FR-10.3  | Reminder email 24 hours before departure                    | Low      | ❌ Not Built |
| FR-10.4  | Admin notification for new bookings                         | Low      | ❌ Not Built |

---

### 5.11 Admin Dashboard & Analytics

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-11.1  | Dashboard overview: total bookings, revenue, active buses   | Medium   | ❌ Not Built |
| FR-11.2  | User management panel (search, view, block users)           | Medium   | ❌ Not Built |
| FR-11.3  | Bus management panel                                        | High     | ❌ Not Built |
| FR-11.4  | Route management panel                                      | High     | ❌ Not Built |
| FR-11.5  | Schedule management panel                                   | High     | ❌ Not Built |
| FR-11.6  | Booking management panel (view, search, filter)             | High     | ❌ Not Built |
| FR-11.7  | Revenue analytics with charts                               | Low      | ❌ Not Built |
| FR-11.8  | Popular routes report                                       | Low      | ❌ Not Built |

---

### 5.12 User Dashboard

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-12.1  | View upcoming bookings                                      | High     | ❌ Not Built |
| FR-12.2  | View booking history (past trips)                           | High     | ❌ Not Built |
| FR-12.3  | Cancel an upcoming booking                                  | High     | ❌ Not Built |
| FR-12.4  | Download ticket PDF for confirmed bookings                  | Medium   | ❌ Not Built |
| FR-12.5  | Edit profile information                                    | Medium   | ❌ Not Built |
| FR-12.6  | Change password                                             | Medium   | ❌ Not Built |

---

### 5.13 Contact / Support

| ID       | Requirement                                                 | Priority | Status       |
| -------- | ----------------------------------------------------------- | -------- | ------------ |
| FR-13.1  | Contact form for guest & user inquiries                     | Low      | ❌ Not Built |
| FR-13.2  | FAQ / Help section                                          | Low      | ❌ Not Built |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID        | Requirement                                                          | Target            |
| --------- | -------------------------------------------------------------------- | ----------------- |
| NFR-1.1   | Page load time should be under 3 seconds on 4G connection            | < 3 seconds       |
| NFR-1.2   | API response time for search queries should be under 500ms           | < 500 ms          |
| NFR-1.3   | System should handle at least 500 concurrent users                   | 500 users         |
| NFR-1.4   | Database queries should be optimized with proper indexing             | < 100 ms per query|
| NFR-1.5   | Next.js SSR should deliver first contentful paint within 1.5s        | < 1.5 seconds     |

### 6.2 Security

| ID        | Requirement                                                          | Implementation            |
| --------- | -------------------------------------------------------------------- | ------------------------- |
| NFR-2.1   | All passwords must be hashed using bcrypt                            | Laravel Hash facade       |
| NFR-2.2   | API authentication via token-based system                            | Laravel Sanctum           |
| NFR-2.3   | All API endpoints must validate and sanitize input                   | Laravel Form Requests     |
| NFR-2.4   | CSRF protection for all state-changing requests                      | Laravel middleware         |
| NFR-2.5   | CORS configured to allow only the frontend origin                    | Laravel CORS config       |
| NFR-2.6   | Sensitive data stored in environment variables, not in code          | `.env` file               |
| NFR-2.7   | Rate limiting on authentication endpoints                            | Laravel throttle middleware|
| NFR-2.8   | SQL injection prevention via parameterized queries                   | Eloquent ORM              |
| NFR-2.9   | XSS prevention on all user-generated output                         | React auto-escaping + CSP |
| NFR-2.10  | HTTPS enforced in production                                         | Server / reverse proxy    |
| NFR-2.11  | Token expiration and refresh mechanism                               | Sanctum token abilities   |

### 6.3 Usability

| ID        | Requirement                                                          |
| --------- | -------------------------------------------------------------------- |
| NFR-3.1   | Responsive design supporting desktop, tablet, and mobile (320px+)    |
| NFR-3.2   | Consistent UI using Material-UI component library                    |
| NFR-3.3   | Intuitive navigation with clear CTA buttons                         |
| NFR-3.4   | Loading states and skeleton screens during data fetching             |
| NFR-3.5   | Meaningful error messages for all form validations                   |
| NFR-3.6   | Accessibility compliance (WCAG 2.1 Level AA minimum)                |
| NFR-3.7   | Keyboard navigation support for all interactive elements             |
| NFR-3.8   | Sinhala/Tamil language support (future consideration)                |

### 6.4 Reliability & Availability

| ID        | Requirement                                                          | Target       |
| --------- | -------------------------------------------------------------------- | ------------ |
| NFR-4.1   | System uptime target                                                 | 99.5%        |
| NFR-4.2   | Graceful error handling — no raw server errors shown to users        | All pages    |
| NFR-4.3   | Database backup strategy (daily automated backups via Docker)        | Daily        |
| NFR-4.4   | Data recovery point objective (RPO)                                  | < 24 hours   |
| NFR-4.5   | Automatic session recovery after page refresh                        | Token-based  |

### 6.5 Scalability

| ID        | Requirement                                                          |
| --------- | -------------------------------------------------------------------- |
| NFR-5.1   | Stateless API design to allow horizontal scaling                     |
| NFR-5.2   | Database connection pooling for efficient resource usage              |
| NFR-5.3   | Pagination on all list endpoints (default 20 items per page)         |
| NFR-5.4   | Lazy loading of images and non-critical resources                    |
| NFR-5.5   | CDN-ready static assets served from Next.js public directory         |

### 6.6 Maintainability

| ID        | Requirement                                                          |
| --------- | -------------------------------------------------------------------- |
| NFR-6.1   | MVC architecture pattern on backend (Laravel)                        |
| NFR-6.2   | Component-based architecture on frontend (React/Next.js)             |
| NFR-6.3   | RESTful API design following HTTP method conventions                 |
| NFR-6.4   | Code organized by feature/route groups                               |
| NFR-6.5   | Environment-based configuration (dev/staging/production)             |
| NFR-6.6   | ESLint configured for consistent code quality                        |
| NFR-6.7   | Version control with Git and meaningful commit messages              |

### 6.7 Compatibility

| ID        | Requirement                                                          |
| --------- | -------------------------------------------------------------------- |
| NFR-7.1   | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+                       |
| NFR-7.2   | Mobile browsers: Chrome Android, Safari iOS                         |
| NFR-7.3   | Minimum screen width: 320px (iPhone SE)                             |
| NFR-7.4   | PHP 8.2+ required for backend                                       |
| NFR-7.5   | Node.js 18+ required for frontend build                             |
| NFR-7.6   | MySQL 8.0+ required for database                                    |

### 6.8 Deployment & DevOps

| ID        | Requirement                                                          |
| --------- | -------------------------------------------------------------------- |
| NFR-8.1   | Docker containerization for database and optional services           |
| NFR-8.2   | Separate `.env` configuration for each environment                   |
| NFR-8.3   | PHPUnit test suite for backend API testing                           |
| NFR-8.4   | Build outputs should be production-optimized (minified, tree-shaken) |
| NFR-8.5   | CI/CD pipeline ready architecture                                    |

---

## 7. Database Design

### 7.1 Entity-Relationship Overview

```
  ┌──────────┐         ┌──────────┐         ┌───────────┐
  │  users   │         │  buses   │         │   routes  │
  │──────────│         │──────────│         │───────────│
  │ id (PK)  │         │ id (PK)  │         │ id (PK)   │
  │ name     │         │ bus_no   │         │ name      │
  │ email    │    ┌───▶│ name     │◀────┐   │ origin    │
  │ role     │    │    │ type     │     │   │destination│
  │ phone    │    │    │ capacity │     │   │ distance  │
  └─────┬────┘    │    │ layout   │     │   │ duration  │
        │         │    │ status   │     │   │ base_fare │
        │         │    └──────────┘     │   └──────┬────┘
        │         │                     │          │
        │    ┌────┴──────────────────┐  │          │
        │    │     schedules         │  │          │
        │    │───────────────────────│  │          │
        │    │ id (PK)              │──┘          │
        │    │ bus_id (FK→buses)    │◀─────────────┘
        │    │ route_id (FK→routes) │
        │    │ departure_time       │
        │    │ arrival_time         │
        │    │ price_per_seat       │
        │    │ status               │
        │    └──────────┬───────────┘
        │               │
        │    ┌──────────▼───────────┐
        │    │     bookings         │
        │    │───────────────────────│
        └───▶│ id (PK)             │
             │ user_id (FK→users)   │
             │ schedule_id (FK)     │
             │ booking_ref         │
             │ status              │
             │ total_amount        │
             │ booked_at           │
             └──────────┬──────────┘
                        │
           ┌────────────┼───────────────┐
           │            │               │
  ┌────────▼──┐  ┌──────▼──────┐  ┌────▼───────┐
  │  seats    │  │  payments   │  │  tickets   │
  │───────────│  │─────────────│  │────────────│
  │ id (PK)   │  │ id (PK)     │  │ id (PK)    │
  │booking_id │  │ booking_id  │  │ booking_id │
  │ seat_no   │  │ amount      │  │ seat_no    │
  │ passenger │  │ method      │  │ qr_code    │
  │ phone     │  │ txn_id      │  │ pdf_path   │
  └───────────┘  │ status      │  └────────────┘
                 └─────────────┘
```

### 7.2 Table Definitions

#### `users` Table (Existing — Needs Extension)

| Column             | Type                       | Constraints                    |
| ------------------ | -------------------------- | ------------------------------ |
| id                 | BIGINT UNSIGNED            | PK, Auto Increment             |
| name               | VARCHAR(255)               | NOT NULL                       |
| email              | VARCHAR(255)               | UNIQUE, NOT NULL               |
| email_verified_at  | TIMESTAMP                  | NULLABLE                       |
| password           | VARCHAR(255)               | NOT NULL, Hashed               |
| role               | ENUM('admin', 'user')      | DEFAULT 'user'                 |
| phone              | VARCHAR(20)                | NULLABLE *(new)*               |
| avatar             | VARCHAR(255)               | NULLABLE *(new)*               |
| status             | ENUM('active', 'blocked')  | DEFAULT 'active' *(new)*       |
| remember_token     | VARCHAR(100)               | NULLABLE                       |
| created_at         | TIMESTAMP                  | Auto-managed                   |
| updated_at         | TIMESTAMP                  | Auto-managed                   |

#### `buses` Table *(New)*

| Column        | Type                                            | Constraints             |
| ------------- | ----------------------------------------------- | ----------------------- |
| id            | BIGINT UNSIGNED                                 | PK, Auto Increment      |
| bus_number    | VARCHAR(20)                                     | UNIQUE, NOT NULL        |
| name          | VARCHAR(255)                                    | NOT NULL                |
| type          | ENUM('normal','semi_luxury','luxury','ac')       | NOT NULL                |
| total_seats   | INT UNSIGNED                                    | NOT NULL                |
| seat_layout   | VARCHAR(10)                                     | NOT NULL (e.g. '2x2')  |
| amenities     | JSON                                            | NULLABLE                |
| status        | ENUM('active','inactive','maintenance')          | DEFAULT 'active'        |
| image         | VARCHAR(255)                                    | NULLABLE                |
| created_at    | TIMESTAMP                                       | Auto-managed            |
| updated_at    | TIMESTAMP                                       | Auto-managed            |

#### `routes` Table *(New)*

| Column        | Type                            | Constraints             |
| ------------- | ------------------------------- | ----------------------- |
| id            | BIGINT UNSIGNED                 | PK, Auto Increment      |
| name          | VARCHAR(255)                    | NOT NULL                |
| origin        | VARCHAR(100)                    | NOT NULL                |
| destination   | VARCHAR(100)                    | NOT NULL                |
| stops         | JSON                            | NULLABLE                |
| distance_km   | DECIMAL(8,2)                    | NULLABLE                |
| duration_mins | INT UNSIGNED                    | NULLABLE                |
| base_fare     | DECIMAL(10,2)                   | NOT NULL                |
| status        | ENUM('active','inactive')       | DEFAULT 'active'        |
| created_at    | TIMESTAMP                       | Auto-managed            |
| updated_at    | TIMESTAMP                       | Auto-managed            |

#### `schedules` Table *(New)*

| Column          | Type                                           | Constraints              |
| --------------- | ---------------------------------------------- | ------------------------ |
| id              | BIGINT UNSIGNED                                | PK, Auto Increment       |
| bus_id          | BIGINT UNSIGNED                                | FK → buses(id)           |
| route_id        | BIGINT UNSIGNED                                | FK → routes(id)          |
| departure_time  | DATETIME                                       | NOT NULL                 |
| arrival_time    | DATETIME                                       | NOT NULL                 |
| price_per_seat  | DECIMAL(10,2)                                  | NOT NULL                 |
| available_seats | INT UNSIGNED                                   | NOT NULL                 |
| status          | ENUM('scheduled','in_progress','completed','cancelled') | DEFAULT 'scheduled' |
| created_at      | TIMESTAMP                                      | Auto-managed             |
| updated_at      | TIMESTAMP                                      | Auto-managed             |

#### `bookings` Table *(New)*

| Column          | Type                                           | Constraints              |
| --------------- | ---------------------------------------------- | ------------------------ |
| id              | BIGINT UNSIGNED                                | PK, Auto Increment       |
| user_id         | BIGINT UNSIGNED                                | FK → users(id)           |
| schedule_id     | BIGINT UNSIGNED                                | FK → schedules(id)       |
| booking_ref     | VARCHAR(20)                                    | UNIQUE, NOT NULL         |
| total_seats     | INT UNSIGNED                                   | NOT NULL                 |
| total_amount    | DECIMAL(10,2)                                  | NOT NULL                 |
| status          | ENUM('pending','confirmed','completed','cancelled','expired') | DEFAULT 'pending' |
| booked_at       | TIMESTAMP                                      | NOT NULL                 |
| cancelled_at    | TIMESTAMP                                      | NULLABLE                 |
| created_at      | TIMESTAMP                                      | Auto-managed             |
| updated_at      | TIMESTAMP                                      | Auto-managed             |

#### `booked_seats` Table *(New)*

| Column          | Type                  | Constraints              |
| --------------- | --------------------- | ------------------------ |
| id              | BIGINT UNSIGNED       | PK, Auto Increment       |
| booking_id      | BIGINT UNSIGNED       | FK → bookings(id)        |
| seat_number     | VARCHAR(5)            | NOT NULL (e.g. 'A1')     |
| passenger_name  | VARCHAR(255)          | NOT NULL                 |
| passenger_phone | VARCHAR(20)           | NULLABLE                 |
| created_at      | TIMESTAMP             | Auto-managed             |

#### `payments` Table *(New)*

| Column          | Type                                       | Constraints              |
| --------------- | ------------------------------------------ | ------------------------ |
| id              | BIGINT UNSIGNED                            | PK, Auto Increment       |
| booking_id      | BIGINT UNSIGNED                            | FK → bookings(id)        |
| amount          | DECIMAL(10,2)                              | NOT NULL                 |
| payment_method  | ENUM('card','bank_transfer','cash')         | NOT NULL                 |
| transaction_id  | VARCHAR(100)                               | NULLABLE                 |
| status          | ENUM('pending','completed','failed','refunded') | DEFAULT 'pending'   |
| paid_at         | TIMESTAMP                                  | NULLABLE                 |
| created_at      | TIMESTAMP                                  | Auto-managed             |
| updated_at      | TIMESTAMP                                  | Auto-managed             |

#### `tickets` Table *(New)*

| Column          | Type                | Constraints              |
| --------------- | ------------------- | ------------------------ |
| id              | BIGINT UNSIGNED     | PK, Auto Increment       |
| booking_id      | BIGINT UNSIGNED     | FK → bookings(id)        |
| ticket_number   | VARCHAR(20)         | UNIQUE, NOT NULL         |
| seat_number     | VARCHAR(5)          | NOT NULL                 |
| passenger_name  | VARCHAR(255)        | NOT NULL                 |
| qr_code         | TEXT                | NOT NULL                 |
| pdf_path        | VARCHAR(255)        | NULLABLE                 |
| created_at      | TIMESTAMP           | Auto-managed             |

#### `reviews` Table *(New — Low Priority)*

| Column          | Type                | Constraints              |
| --------------- | ------------------- | ------------------------ |
| id              | BIGINT UNSIGNED     | PK, Auto Increment       |
| user_id         | BIGINT UNSIGNED     | FK → users(id)           |
| schedule_id     | BIGINT UNSIGNED     | FK → schedules(id)       |
| rating          | TINYINT UNSIGNED    | NOT NULL (1–5)           |
| comment         | TEXT                | NULLABLE                 |
| created_at      | TIMESTAMP           | Auto-managed             |

---

## 8. API Specification

### 8.1 Authentication APIs

| Method | Endpoint                | Description            | Auth   | Status   |
| ------ | ----------------------- | ---------------------- | ------ | -------- |
| POST   | `/api/auth/register`    | Register new user      | No     | ❌       |
| POST   | `/api/auth/login`       | Login & get token      | No     | ✅       |
| POST   | `/api/auth/logout`      | Revoke all tokens      | Yes    | ✅       |
| GET    | `/api/auth/me`          | Get current user       | Yes    | ✅       |
| PUT    | `/api/auth/profile`     | Update profile         | Yes    | ❌       |
| POST   | `/api/auth/password`    | Change password        | Yes    | ❌       |

### 8.2 Bus Management APIs (Admin Only)

| Method | Endpoint                | Description            | Auth   | Role   |
| ------ | ----------------------- | ---------------------- | ------ | ------ |
| GET    | `/api/buses`            | List all buses         | Yes    | Admin  |
| POST   | `/api/buses`            | Create a bus           | Yes    | Admin  |
| GET    | `/api/buses/{id}`       | Get bus details        | Yes    | Admin  |
| PUT    | `/api/buses/{id}`       | Update bus             | Yes    | Admin  |
| DELETE | `/api/buses/{id}`       | Delete bus             | Yes    | Admin  |

### 8.3 Route Management APIs (Admin Only)

| Method | Endpoint                | Description            | Auth   | Role   |
| ------ | ----------------------- | ---------------------- | ------ | ------ |
| GET    | `/api/routes`           | List all routes        | Yes    | Admin  |
| POST   | `/api/routes`           | Create a route         | Yes    | Admin  |
| GET    | `/api/routes/{id}`      | Get route details      | Yes    | Admin  |
| PUT    | `/api/routes/{id}`      | Update route           | Yes    | Admin  |
| DELETE | `/api/routes/{id}`      | Delete route           | Yes    | Admin  |

### 8.4 Schedule Management APIs

| Method | Endpoint                     | Description             | Auth   | Role       |
| ------ | ---------------------------- | ----------------------- | ------ | ---------- |
| GET    | `/api/schedules`             | List schedules          | No     | Public     |
| POST   | `/api/schedules`             | Create schedule         | Yes    | Admin      |
| GET    | `/api/schedules/{id}`        | Get schedule details    | No     | Public     |
| PUT    | `/api/schedules/{id}`        | Update schedule         | Yes    | Admin      |
| DELETE | `/api/schedules/{id}`        | Delete schedule         | Yes    | Admin      |
| GET    | `/api/schedules/search`      | Search by route & date  | No     | Public     |

### 8.5 Booking APIs (Passenger Only)

| Method | Endpoint                     | Description              | Auth   | Role       |
| ------ | ---------------------------- | ------------------------ | ------ | ---------- |
| POST   | `/api/bookings`              | Create a booking         | Yes    | User       |
| GET    | `/api/bookings`              | List user's bookings     | Yes    | User       |
| GET    | `/api/bookings/{id}`         | Get booking details      | Yes    | User       |
| POST   | `/api/bookings/{id}/cancel`  | Cancel a booking         | Yes    | User       |
| GET    | `/api/bookings/{id}/ticket`  | Download ticket PDF      | Yes    | User       |

### 8.6 Payment APIs

| Method | Endpoint                     | Description              | Auth   | Role       |
| ------ | ---------------------------- | ------------------------ | ------ | ---------- |
| POST   | `/api/payments`              | Initiate payment         | Yes    | User       |
| GET    | `/api/payments/{id}`         | Get payment status       | Yes    | User       |
| POST   | `/api/payments/callback`     | Payment gateway callback | No     | System     |

### 8.7 Admin Dashboard APIs

| Method | Endpoint                     | Description              | Auth   | Role       |
| ------ | ---------------------------- | ------------------------ | ------ | ---------- |
| GET    | `/api/admin/dashboard`       | Dashboard stats overview | Yes    | Admin      |
| GET    | `/api/admin/bookings`        | All bookings list        | Yes    | Admin      |
| GET    | `/api/admin/users`           | All users list           | Yes    | Admin      |
| PUT    | `/api/admin/users/{id}`      | Update user status       | Yes    | Admin      |
| GET    | `/api/admin/revenue`         | Revenue report           | Yes    | Admin      |

### 8.8 Standard API Response Format

**Success Response:**
```json
{
    "success": true,
    "message": "Operation description",
    "data": { ... }
}
```

**Error Response:**
```json
{
    "success": false,
    "message": "Error description",
    "errors": {
        "field_name": ["Validation error message"]
    }
}
```

**Paginated Response:**
```json
{
    "success": true,
    "data": [ ... ],
    "pagination": {
        "current_page": 1,
        "per_page": 20,
        "total": 150,
        "last_page": 8,
        "from": 1,
        "to": 20
    }
}
```

---

## 9. Frontend Pages & Components

### 9.1 Page Map

| Route Group | Path                      | Page Name             | Status         |
| ----------- | ------------------------- | --------------------- | -------------- |
| (public)    | `/`                       | Homepage              | ✅ Done        |
| (public)    | `/contact`                | Contact Us            | ❌ Not Built   |
| (auth)      | `/login`                  | Login Page            | ❌ Not Built   |
| (auth)      | `/register`               | Register Page         | ✅ Done        |
| (auth)      | `/forgot-password`        | Forgot Password       | ❌ Not Built   |
| (public)    | `/search`                 | Search Results Page   | ❌ Not Built   |
| (public)    | `/schedule/{id}`          | Schedule Details      | ❌ Not Built   |
| (user)      | `/dashboard`              | User Dashboard        | ⚠️ Stub       |
| (user)      | `/bookings`               | My Bookings           | ❌ Not Built   |
| (user)      | `/bookings/{id}`          | Booking Details       | ❌ Not Built   |
| (user)      | `/book/{scheduleId}`      | Seat Selection & Book | ❌ Not Built   |
| (user)      | `/payment/{bookingId}`    | Payment Page          | ❌ Not Built   |
| (user)      | `/profile`                | User Profile          | ❌ Not Built   |
| (admin)     | `/admin/home`             | Admin Dashboard       | ❌ Not Built   |
| (admin)     | `/admin/buses`            | Bus Management        | ❌ Not Built   |
| (admin)     | `/admin/routes`           | Route Management      | ❌ Not Built   |
| (admin)     | `/admin/schedules`        | Schedule Management   | ❌ Not Built   |
| (admin)     | `/admin/bookings`         | All Bookings          | ❌ Not Built   |
| (admin)     | `/admin/users`            | User Management       | ❌ Not Built   |

### 9.2 Existing Component Inventory

| Component          | File                                      | Description                     |
| ------------------ | ----------------------------------------- | ------------------------------- |
| Header             | `components/common/Header.jsx`            | Navigation bar                  |
| Footer             | `components/common/Footer.jsx`            | Site footer                     |
| Preloader          | `components/common/Preloader.jsx`         | Animated page loading           |
| HeroSection        | `components/home/HeroSection.jsx`         | Homepage hero banner            |
| SearchBooking      | `components/home/SearchBooking.jsx`       | Quick booking search form       |
| FeaturesSection    | `components/home/FeaturesSection.jsx`     | Feature highlights              |
| PopularRoutes      | `components/home/PopularRoutes.jsx`       | Popular routes showcase         |
| StatsSection       | `components/home/StatsSection.jsx`        | Platform statistics             |

### 9.3 Components Still Needed

| Component          | Purpose                                        | Priority |
| ------------------ | ---------------------------------------------- | -------- |
| LoginForm          | Email + password login form                    | High     |
| SearchResults      | List of available buses from search            | High     |
| BusCard            | Individual bus result card                     | High     |
| SeatMap            | Interactive seat selection grid                | High     |
| BookingSummary     | Review before payment                          | High     |
| BookingCard        | Individual booking in user dashboard           | High     |
| AdminSidebar       | Admin panel side navigation                    | High     |
| DataTable          | Reusable CRUD data table for admin             | High     |
| StatsCard          | Dashboard metric card (admin)                  | Medium   |
| PaymentForm        | Card details input form                        | Medium   |
| TicketView         | PDF ticket preview / download                  | Medium   |
| ProfileForm        | User profile editor                           | Medium   |
| RouteTimeline      | Visual route with stops                        | Low      |
| RevenueChart       | Charts for admin analytics                     | Low      |

---

## 10. Use Case Descriptions

### UC-01: User Registration

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Guest                                                                |
| **Precondition**  | User is not logged in                                                |
| **Main Flow**     | 1. Guest navigates to `/register`                                    |
|                   | 2. Fills in name, email, password, confirm password                  |
|                   | 3. Clicks "Create Account"                                          |
|                   | 4. System validates input and creates account                        |
|                   | 5. Redirect to login page with success message                      |
| **Postcondition** | New user record exists with role = 'user'                            |
| **Exception**     | Email already exists → show error "Email is already registered"      |

### UC-02: User Login

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Registered User                                                      |
| **Precondition**  | User has a registered account                                        |
| **Main Flow**     | 1. User navigates to `/login`                                        |
|                   | 2. Enters email and password                                         |
|                   | 3. System validates credentials                                      |
|                   | 4. Sanctum token is generated and stored in localStorage             |
|                   | 5. User is redirected to dashboard (or admin home for admin role)    |
| **Postcondition** | User is authenticated with valid token                               |
| **Exception**     | Invalid credentials → show error "Invalid email or password"         |

### UC-03: Search Buses

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Guest or Passenger                                                   |
| **Precondition**  | Active schedules exist in the database                               |
| **Main Flow**     | 1. User selects origin, destination, and travel date                 |
|                   | 2. Clicks "Search Buses"                                             |
|                   | 3. System queries schedules matching criteria                        |
|                   | 4. Results displayed as cards with price, time, bus details          |
|                   | 5. User can filter/sort results                                     |
| **Postcondition** | Search results list displayed                                        |
| **Exception**     | No matching schedules → "No buses found" with alternative suggestions|

### UC-04: Book a Seat

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Passenger (authenticated)                                            |
| **Precondition**  | User has found a bus via search                                      |
| **Main Flow**     | 1. User clicks "Book Now" on a search result                         |
|                   | 2. Interactive seat map loads showing available seats                 |
|                   | 3. User selects desired seat(s) — live price updates                 |
|                   | 4. Fills in passenger details for each seat                          |
|                   | 5. Reviews booking summary                                          |
|                   | 6. Clicks "Proceed to Payment"                                      |
|                   | 7. Booking created with status "pending"                             |
| **Postcondition** | Booking record created, selected seats temporarily reserved          |
| **Exception**     | Seat taken by another user → refresh seat map with error message     |

### UC-05: Process Payment

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Passenger (authenticated)                                            |
| **Precondition**  | Booking exists with status "pending"                                 |
| **Main Flow**     | 1. User enters payment details (card number, expiry, CVV)            |
|                   | 2. System sends payment to gateway                                   |
|                   | 3. Gateway processes and returns confirmation                        |
|                   | 4. Booking status → "confirmed"                                      |
|                   | 5. Ticket PDF generated and emailed                                  |
| **Postcondition** | Payment completed, ticket available for download                     |
| **Exception**     | Payment failed → booking remains "pending", user can retry           |

### UC-06: Cancel Booking

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Passenger (authenticated)                                            |
| **Precondition**  | Booking exists with status "confirmed", departure > 2 hours away     |
| **Main Flow**     | 1. User navigates to "My Bookings"                                   |
|                   | 2. Clicks "Cancel" on an upcoming booking                             |
|                   | 3. Confirmation dialog shown                                         |
|                   | 4. System cancels booking, releases seats                            |
|                   | 5. Refund initiated (if applicable)                                  |
| **Postcondition** | Booking status = "cancelled", seats available for others             |
| **Exception**     | < 2 hours before departure → "Too late to cancel" error              |

### UC-07: Admin Manages Buses

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Admin                                                                |
| **Precondition**  | Admin is logged in                                                   |
| **Main Flow**     | 1. Admin navigates to "Bus Management"                               |
|                   | 2. Views list of all buses (with search and filters)                 |
|                   | 3. Can Add, Edit, or Delete a bus                                    |
|                   | 4. Changes saved to database                                         |
| **Postcondition** | Bus records updated accordingly                                      |

### UC-08: Admin Creates Schedule

| Field             | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| **Actor**         | Admin                                                                |
| **Precondition**  | At least one active bus and one active route exist                    |
| **Main Flow**     | 1. Admin navigates to "Schedule Management"                          |
|                   | 2. Clicks "Create Schedule"                                          |
|                   | 3. Selects bus, route, date/time, and price                          |
|                   | 4. System validates no conflicts (bus not double-booked)             |
|                   | 5. Schedule created                                                  |
| **Postcondition** | New schedule available for passenger search                          |
| **Exception**     | Bus already assigned at that time → "Schedule conflict" error        |

---

## 11. Implementation Roadmap

### Phase 1 — Core Authentication (Week 1)

| # | Task                                       | Estimated Effort |
| - | ------------------------------------------ | ---------------- |
| 1 | Build Registration API endpoint            | 2 hours          |
| 2 | Build Login page (frontend)                | 3 hours          |
| 3 | Build Forgot Password flow (API + page)    | 3 hours          |
| 4 | Implement route protection middleware      | 2 hours          |
| 5 | Admin role middleware (backend)            | 1 hour           |

### Phase 2 — Admin CRUD: Buses, Routes, Schedules (Week 2–3)

| # | Task                                       | Estimated Effort |
| - | ------------------------------------------ | ---------------- |
| 1 | Create Bus model, migration, controller    | 3 hours          |
| 2 | Create Route model, migration, controller  | 3 hours          |
| 3 | Create Schedule model, migration, controller | 3 hours        |
| 4 | Build Admin Dashboard layout (sidebar + content area) | 4 hours  |
| 5 | Build Bus Management page (CRUD table)     | 4 hours          |
| 6 | Build Route Management page (CRUD table)   | 4 hours          |
| 7 | Build Schedule Management page (CRUD table)| 4 hours          |
| 8 | Admin dashboard overview with stats cards  | 3 hours          |

### Phase 3 — Search & Booking (Week 4–5)

| # | Task                                       | Estimated Effort |
| - | ------------------------------------------ | ---------------- |
| 1 | Build search API with filters and sorting  | 3 hours          |
| 2 | Build Search Results page                  | 4 hours          |
| 3 | Build interactive Seat Map component       | 6 hours          |
| 4 | Build Booking flow (summary + create)      | 4 hours          |
| 5 | Create Booking model, migration, controller| 3 hours          |
| 6 | Create BookedSeat model and migration      | 2 hours          |
| 7 | Build User Dashboard page (my bookings)    | 4 hours          |
| 8 | Booking cancellation feature               | 2 hours          |

### Phase 4 — Payments & Tickets (Week 6)

| # | Task                                       | Estimated Effort |
| - | ------------------------------------------ | ---------------- |
| 1 | Integrate payment gateway (Stripe/PayHere) | 6 hours          |
| 2 | Build Payment page (frontend)              | 4 hours          |
| 3 | Payment callback & status handling         | 3 hours          |
| 4 | PDF ticket generation with QR code         | 4 hours          |
| 5 | Email notifications (booking + ticket)     | 3 hours          |

### Phase 5 — Polish & Extra Features (Week 7–8)

| # | Task                                       | Estimated Effort |
| - | ------------------------------------------ | ---------------- |
| 1 | User profile page (view + edit)            | 3 hours          |
| 2 | Contact page                               | 2 hours          |
| 3 | Admin user management panel                | 3 hours          |
| 4 | Admin revenue reports & charts             | 4 hours          |
| 5 | Reviews & ratings system                   | 4 hours          |
| 6 | Comprehensive testing (PHPUnit + manual)   | 6 hours          |
| 7 | Responsive design polish for all pages     | 4 hours          |
| 8 | Final documentation and deployment         | 3 hours          |

---

## 12. Glossary

| Term               | Definition                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Booking**        | A reservation record linking a user to a schedule with selected seats             |
| **Booking Ref**    | A unique alphanumeric code identifying a booking (e.g., `SG-2026-ABC123`)        |
| **Bus**            | A vehicle registered in the system with defined seat capacity and type            |
| **Route**          | A defined path between an origin and destination city, with optional stops        |
| **Schedule**       | An instance of a bus operating on a route at a specific date and time             |
| **Seat Map**       | Visual grid representation of a bus's seating arrangement                         |
| **Sanctum Token**  | A Laravel Sanctum-generated bearer token for stateless API authentication         |
| **RBAC**           | Role-Based Access Control — restricting system access based on user roles         |
| **Guest**          | A website visitor who has not logged in                                           |
| **Passenger**      | A registered and authenticated user who can make bookings                         |
| **Admin**          | A system administrator with full platform management privileges                  |
| **Payment Gateway**| Third-party service that processes online card/bank payments                      |
| **QR Code**        | Machine-readable code embedded in tickets for quick verification                 |
| **PDF Ticket**     | A downloadable document containing booking confirmation and travel details        |
| **SSR**            | Server-Side Rendering — pages rendered on the server before sending to browser   |

---

> **Document Status**: This is a living document. Requirements may be updated as the project evolves.
>
> **Last Updated**: 21 April 2026
>
> **Author**: Ulindu Chakranga Prabhashwara
