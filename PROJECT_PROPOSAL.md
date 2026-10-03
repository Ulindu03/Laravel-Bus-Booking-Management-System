# Serendib Go — Online Bus Booking System

## Project Proposal & Requirements Document

| Field              | Detail                                            |
| ------------------ | ------------------------------------------------- |
| **Project Name**   | Serendib Go — Sri Lanka's Online Bus Booking      |
| **Prepared By**    | Ulindu Chakranga Prabhashwara                     |
| **Date**           | 02 May 2026                                       |
| **Version**        | 1.0                                               |

---

## Table of Contents

1. [About This Project](#1-about-this-project)
2. [What Problem Does This Solve?](#2-what-problem-does-this-solve)
3. [Who Will Use This System?](#3-who-will-use-this-system)
4. [Main Features](#4-main-features)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technology Used](#7-technology-used)
8. [System Design](#8-system-design)
9. [Database Design](#9-database-design)
10. [Pages & Screens](#10-pages--screens)
11. [How the System Works — Step by Step](#11-how-the-system-works--step-by-step)
12. [Project Timeline](#12-project-timeline)
13. [Future Improvements](#13-future-improvements)

---

## 1. About This Project

**Serendib Go** is a web-based bus ticket booking system built for Sri Lanka. It allows passengers to search for buses, pick their seats, book tickets, and pay online — all from their phone or computer.

The system also gives administrators a dashboard to manage buses, routes, schedules, bookings, and users in one place.


---

## 2. What Problem Does This Solve?

Right now, most bus tickets in Sri Lanka are sold at the bus station counter. This causes many problems:

| Problem Today                          | How Serendib Go Fixes It                    |
| -------------------------------------- | ------------------------------------------- |
| Long queues at bus stations            | Book tickets from home using phone or laptop |
| No way to check seat availability      | See available seats in real time             |
| No guaranteed seat for passengers      | Reserve your exact seat before the trip      |
| Hard to find bus times and prices      | Search and compare buses instantly           |
| No digital record of tickets           | Get a digital ticket with QR code            |
| Difficult for operators to track sales | Admin dashboard shows all bookings and money |

---

## 3. Who Will Use This System?

There are **three types of users**:

### 3.1 Guest (Not Logged In)
A visitor who has not created an account. They can:
- View the homepage
- Search for available buses
- See bus routes and prices
- Create a new account or log in

### 3.2 Passenger (Registered User)
A person who has created an account and logged in. They can:
- Search and find buses
- Select seats on the bus
- Book tickets and make payments
- View and manage their bookings
- Download their ticket as a PDF
- Cancel a booking
- Update their profile

### 3.3 Administrator (Admin)
The system manager who controls everything. They can:
- Add, edit, or remove buses
- Create and manage bus routes
- Set up travel schedules
- View all bookings in the system
- Manage user accounts
- See revenue reports and statistics

---

## 4. Main Features

### For Passengers
| # | Feature               | Description                                           |
|---|-----------------------|-------------------------------------------------------|
| 1 | Bus Search            | Find buses by selecting where you want to go and when |
| 2 | Seat Selection        | Pick your preferred seat from a visual seat map       |
| 3 | Online Booking        | Book your ticket instantly after selecting a seat     |
| 4 | Online Payment        | Pay using credit card, debit card, or bank transfer   |
| 5 | Digital Ticket        | Get a downloadable PDF ticket with a QR code          |
| 6 | Booking History       | See all your past and upcoming trips                  |
| 7 | Cancel Booking        | Cancel a trip and get a refund (if eligible)           |
| 8 | Email Notifications   | Get booking confirmation and reminders via email      |
| 9 | User Profile          | Update your name, phone number, and password          |

### For Administrators
| # | Feature               | Description                                           |
|---|-----------------------|-------------------------------------------------------|
| 1 | Bus Management        | Add new buses, edit details, or remove old ones       |
| 2 | Route Management      | Create routes with start point, end point, and stops  |
| 3 | Schedule Management   | Assign buses to routes with date, time, and price     |
| 4 | Booking Overview      | View, search, and filter all bookings                 |
| 5 | User Management       | View all users, block or remove accounts              |
| 6 | Dashboard & Stats     | See total bookings, revenue, and active buses at once  |
| 7 | Revenue Reports       | View earnings with charts and graphs                  |

---

## 5. Functional Requirements

Functional requirements describe **what the system must do**. Each feature is explained clearly below.

### 5.1 User Registration & Login

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-01  | A guest can create a new account using name, email, and password | High |
| FR-02  | A user can log in with their email and password    | High     |
| FR-03  | The system gives a secure token after login (keeps user logged in) | High |
| FR-04  | A user can log out from the system                 | High     |
| FR-05  | A user can reset their password using their email  | Medium   |
| FR-06  | The system checks if the user is an admin or a normal user | High |
| FR-07  | A user can update their profile (name, phone)      | Medium   |
| FR-08  | Admin can view, block, or delete user accounts     | Medium   |

**How Registration Works:**
1. Guest fills in: Full Name, Email, Password, Confirm Password
2. System checks: Is the email already used? Is the password strong enough?
3. If everything is correct → Account is created → User can log in
4. If there is an error → System shows a clear error message

**How Login Works:**
1. User enters email and password
2. System checks the credentials
3. If correct → User gets a secure token and is sent to their dashboard
4. If wrong → System says "Invalid email or password"

### 5.2 Bus Management (Admin Only)

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-09  | Admin can add a new bus with all details            | High     |
| FR-10  | Admin can view a list of all buses                  | High     |
| FR-11  | Admin can edit bus details                          | High     |
| FR-12  | Admin can delete or deactivate a bus                | High     |
| FR-13  | Each bus has a seat layout (e.g., 2 seats × 2 seats per row) | High |
| FR-14  | System supports bus types: Normal, Semi-Luxury, Luxury, AC | Medium |

**Bus Details Include:**
- Bus registration number (e.g., NB-1234)
- Bus name / operator name
- Bus type (Normal, Semi-Luxury, Luxury, AC)
- Total number of seats
- Seat layout (2×2 or 2×3)
- Extra features (WiFi, charging ports, AC, TV)
- Status (Active, Inactive, Under Maintenance)

### 5.3 Route Management (Admin Only)

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-15  | Admin can create a new route (e.g., Colombo → Kandy) | High   |
| FR-16  | Each route can have stops in between (e.g., Kegalle) | High   |
| FR-17  | Admin can set the distance and travel time          | Medium   |
| FR-18  | Admin can edit or delete a route                    | High     |
| FR-19  | Admin can set a base ticket price for each route    | High     |

**Route Details Include:**
- Route name (e.g., "Colombo – Kandy Express")
- Starting city (Origin)
- Ending city (Destination)
- Stops along the way (in order)
- Total distance in kilometers
- Estimated travel time
- Base ticket price (in LKR)

### 5.4 Schedule Management (Admin Only)

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-20  | Admin can create a schedule (assign a bus to a route with date and time) | High |
| FR-21  | Admin can view all schedules in a list              | High     |
| FR-22  | Admin can edit or cancel a schedule                 | High     |
| FR-23  | System prevents assigning the same bus to two trips at the same time | High |
| FR-24  | Admin can set the ticket price (can be different from the base route price) | Medium |

### 5.5 Bus Search (For Everyone)

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-25  | Anyone can search buses by: From, To, and Date     | High     |
| FR-26  | Search results show: bus name, type, time, price, available seats | High |
| FR-27  | Users can filter results by bus type, price, or departure time | Medium |
| FR-28  | Users can sort results by price, time, or duration  | Medium   |
| FR-29  | If no buses found → show a friendly "No buses available" message | High |

### 5.6 Seat Selection & Booking

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-30  | Show a visual seat map of the bus (green = available, red = booked) | High |
| FR-31  | Passenger can click to select one or more seats     | High     |
| FR-32  | Total price updates live as seats are selected      | High     |
| FR-33  | Passenger enters their name and phone for each seat | Medium   |
| FR-34  | System shows a booking summary before payment       | High     |
| FR-35  | Selected seats are held for 10 minutes during checkout | Medium |
| FR-36  | No two passengers can book the same seat            | High     |

### 5.7 Booking Management

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-37  | System creates a booking with a unique reference number (e.g., SG-2026-ABC123) | High |
| FR-38  | Passenger can view all their bookings (upcoming and past) | High |
| FR-39  | Passenger can cancel a booking (if more than 2 hours before departure) | High |
| FR-40  | Admin can view all bookings across the entire system | High    |
| FR-41  | Booking status changes automatically: Pending → Confirmed → Completed | Medium |
| FR-42  | Unpaid bookings expire automatically after timeout  | Medium   |

**Booking Status Flow:**
```
  [Pending] ──(Payment)──→ [Confirmed] ──(Trip Done)──→ [Completed]
      │                         │
      │ (Timeout)               │ (User Cancels)
      ▼                         ▼
  [Expired]                 [Cancelled]
```

### 5.8 Payment Processing

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-43  | System processes payments through a payment gateway | Medium   |
| FR-44  | Support credit and debit card payments              | Medium   |
| FR-45  | System generates a payment receipt                  | Medium   |
| FR-46  | Refunds are processed for cancelled bookings        | Medium   |
| FR-47  | Each user can see their payment history             | Medium   |

### 5.9 Ticket Generation

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-48  | System generates a PDF ticket after successful payment | Medium |
| FR-49  | Ticket includes a QR code for easy verification     | Medium   |
| FR-50  | Ticket is automatically emailed to the passenger    | Medium   |
| FR-51  | Ticket shows: route, date, seat number, booking reference, passenger name | Medium |

### 5.10 Email Notifications

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-52  | Send confirmation email after booking               | Medium   |
| FR-53  | Send email when a booking is cancelled              | Medium   |
| FR-54  | Send reminder email 24 hours before the trip        | Low      |

### 5.11 Admin Dashboard

| ID     | Requirement                                        | Priority |
|--------|----------------------------------------------------|----------|
| FR-55  | Dashboard shows: total bookings, revenue, active buses | Medium |
| FR-56  | Admin can search and filter bookings                | High     |
| FR-57  | Admin can view revenue reports with charts          | Low      |
| FR-58  | Admin can see which routes are most popular         | Low      |

---

## 6. Non-Functional Requirements

Non-functional requirements describe **how well the system should work**. These are about speed, security, and quality — not features.

### 6.1 Performance (Speed)

| ID      | Requirement                                              | Target           |
|---------|----------------------------------------------------------|------------------|
| NFR-01  | Pages should load in under 3 seconds on a normal phone connection | < 3 seconds |
| NFR-02  | Search results should appear in under half a second      | < 500 ms         |
| NFR-03  | The system should handle at least 500 users at the same time | 500 users     |
| NFR-04  | Database searches should be fast with proper optimization | < 100 ms each   |

### 6.2 Security (Safety)

| ID      | Requirement                                              | How We Do It            |
|---------|----------------------------------------------------------|-------------------------|
| NFR-05  | All passwords are stored in encrypted form (not readable) | Bcrypt hashing         |
| NFR-06  | Only logged-in users can book tickets or access dashboards | Token-based login      |
| NFR-07  | All form inputs are checked and cleaned to prevent attacks | Input validation       |
| NFR-08  | The system blocks too many failed login attempts          | Rate limiting          |
| NFR-09  | No sensitive data (passwords, keys) is stored in the code | Environment variables  |
| NFR-10  | Protection against common web attacks (SQL injection, XSS) | Framework security    |
| NFR-11  | HTTPS is used in production for encrypted communication   | SSL certificate        |

### 6.3 Usability (Ease of Use)

| ID      | Requirement                                              |
|---------|----------------------------------------------------------|
| NFR-12  | The website works well on desktop, tablet, and mobile phones |
| NFR-13  | The design is clean, modern, and easy to navigate        |
| NFR-14  | Loading animations are shown while data is being fetched |
| NFR-15  | Error messages are clear and tell the user what to fix   |
| NFR-16  | All buttons and links can be used with keyboard (accessibility) |
| NFR-17  | The design follows a consistent style across all pages   |

### 6.4 Reliability (Dependability)

| ID      | Requirement                                              | Target         |
|---------|----------------------------------------------------------|----------------|
| NFR-18  | The system should be available at least 99.5% of the time | 99.5% uptime  |
| NFR-19  | The system never shows raw technical errors to users      | All pages      |
| NFR-20  | Database is backed up daily to prevent data loss          | Daily backups  |
| NFR-21  | If the page is refreshed, the user stays logged in        | Token recovery |

### 6.5 Scalability (Room to Grow)

| ID      | Requirement                                              |
|---------|----------------------------------------------------------|
| NFR-22  | The system is designed so more servers can be added if users grow |
| NFR-23  | All lists use pagination (show 20 items per page) to stay fast |
| NFR-24  | Images and heavy content load only when needed (lazy loading) |

### 6.6 Maintainability (Easy to Update)

| ID      | Requirement                                              |
|---------|----------------------------------------------------------|
| NFR-25  | Code follows clean architecture patterns (MVC on backend, components on frontend) |
| NFR-26  | The API follows REST standards for consistency            |
| NFR-27  | Code is organized by feature, making it easy to find things |
| NFR-28  | Version control (Git) is used to track all changes        |

### 6.7 Browser Support

| ID      | Requirement                                              |
|---------|----------------------------------------------------------|
| NFR-29  | Works on Chrome, Firefox, Safari, and Edge (recent versions) |
| NFR-30  | Works on mobile browsers (Chrome for Android, Safari for iPhone) |
| NFR-31  | Minimum screen size supported: 320px (small phones)       |

---

## 7. Technology Used

### 7.1 Backend (Server Side)

| Technology       | Version | What It Does                              |
|------------------|---------|-------------------------------------------|
| PHP              | 8.2+    | The programming language for the server   |
| Laravel          | 12      | The framework that makes development faster |
| Laravel Sanctum  | 4.3     | Handles user login and security tokens    |
| MySQL            | 8.0+    | The database that stores all data         |

### 7.2 Frontend (What Users See)

| Technology       | Version | What It Does                              |
|------------------|---------|-------------------------------------------|
| Next.js          | 16      | The framework for building fast web pages |
| React            | 19      | The library for building user interface pieces |
| Material-UI (MUI)| 7.3     | Ready-made buttons, forms, and design elements |
| Tailwind CSS     | 4       | Helps style the pages quickly             |
| Axios            | 1.13    | Sends and receives data from the server   |

### 7.3 Tools & Infrastructure

| Tool             | What It Does                                      |
|------------------|---------------------------------------------------|
| Docker           | Runs the database in a container (easy setup)     |
| Git              | Tracks code changes and allows teamwork           |
| PHPUnit          | Tests the backend code automatically              |
| ESLint           | Checks code quality and catches mistakes          |

---

## 8. System Design

The system has **three layers** that work together:

```
┌─────────────────────────────────────────────────────┐
│              WHAT USERS SEE (Frontend)               │
│                                                      │
│   Next.js 16 + React 19                             │
│   Pages: Home, Search, Booking, Dashboard, Admin    │
│   Styled with: Material-UI + Tailwind CSS           │
└──────────────────────┬──────────────────────────────┘
                       │
                  REST API (JSON)
                  + Login Token
                       │
┌──────────────────────▼──────────────────────────────┐
│              THE SERVER (Backend)                     │
│                                                      │
│   Laravel 12 + PHP 8.2                              │
│   Handles: Login, Buses, Routes, Bookings, Payments │
│   Security: Sanctum tokens + Input validation       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              THE DATABASE (Data Storage)              │
│                                                      │
│   MySQL Database                                     │
│   Tables: users, buses, routes, schedules,           │
│           bookings, seats, payments, tickets          │
└─────────────────────────────────────────────────────┘
```

**How they connect:**
1. The user opens the website in their browser (Frontend)
2. When they do something (e.g., search for a bus), the frontend sends a request to the server (Backend)
3. The server gets the data from the database and sends it back
4. The frontend shows the results to the user

---

## 9. Database Design

The database stores all the information the system needs. Here are the main tables:

### 9.1 Tables Overview

| Table       | What It Stores                                      |
|-------------|-----------------------------------------------------|
| users       | All user accounts (passengers and admins)           |
| buses       | All registered buses with their details             |
| routes      | All bus routes (from city A to city B)              |
| schedules   | Which bus goes on which route, at what time         |
| bookings    | Every ticket booking made by passengers             |
| booked_seats| Which seats are booked in each booking              |
| payments    | Payment records for each booking                    |
| tickets     | Digital tickets generated after payment             |

### 9.2 How Tables Connect

```
users ──────────┐
                │
buses ───┐      │
         │      │
routes ──┤      │
         │      │
    schedules   │
         │      │
    bookings ◄──┘
     │  │  │
     │  │  │
  seats │ tickets
        │
    payments
```

- A **schedule** connects one **bus** to one **route** at a specific date and time
- A **booking** connects one **user** to one **schedule**
- Each booking can have multiple **seats**, one **payment**, and multiple **tickets**

### 9.3 Key Table Details

**Users Table:**
| Field     | Type     | Description                    |
|-----------|----------|--------------------------------|
| id        | Number   | Unique user ID                 |
| name      | Text     | Full name                      |
| email     | Text     | Email address (unique)         |
| password  | Text     | Encrypted password             |
| role      | Choice   | "admin" or "user"              |
| phone     | Text     | Phone number (optional)        |
| status    | Choice   | "active" or "blocked"          |

**Buses Table:**
| Field       | Type     | Description                  |
|-------------|----------|------------------------------|
| id          | Number   | Unique bus ID                |
| bus_number  | Text     | Registration number (unique) |
| name        | Text     | Bus or operator name         |
| type        | Choice   | Normal / Semi-Luxury / Luxury / AC |
| total_seats | Number   | How many seats the bus has   |
| seat_layout | Text     | Layout like "2x2" or "2x3"  |
| amenities   | List     | WiFi, AC, TV, etc.           |
| status      | Choice   | Active / Inactive / Maintenance |

**Bookings Table:**
| Field        | Type     | Description                  |
|--------------|----------|------------------------------|
| id           | Number   | Unique booking ID            |
| user_id      | Number   | Who made this booking        |
| schedule_id  | Number   | Which trip this booking is for |
| booking_ref  | Text     | Unique code (e.g., SG-2026-ABC123) |
| total_seats  | Number   | How many seats were booked   |
| total_amount | Money    | Total price paid             |
| status       | Choice   | Pending / Confirmed / Completed / Cancelled / Expired |

---

## 10. Pages & Screens

### 10.1 Public Pages (Anyone Can See)

| Page              | URL           | What It Shows                          |
|-------------------|---------------|----------------------------------------|
| Homepage          | `/`           | Hero banner, search form, features, popular routes, stats |
| Search Results    | `/search`     | List of available buses based on search |
| Contact Us        | `/contact`    | Contact form for questions             |

### 10.2 Auth Pages (Login & Register)

| Page              | URL              | What It Shows                       |
|-------------------|------------------|-------------------------------------|
| Login             | `/login`         | Email and password form             |
| Register          | `/register`      | Name, email, and password form      |
| Forgot Password   | `/forgot-password` | Email form to reset password      |

### 10.3 Passenger Pages (Logged In Users)

| Page              | URL                    | What It Shows                  |
|-------------------|------------------------|--------------------------------|
| User Dashboard    | `/dashboard`           | Overview of upcoming trips     |
| My Bookings       | `/bookings`            | All past and upcoming bookings |
| Booking Details   | `/bookings/{id}`       | Full details of one booking    |
| Seat Selection    | `/book/{scheduleId}`   | Interactive seat map           |
| Payment           | `/payment/{bookingId}` | Payment form                   |
| My Profile        | `/profile`             | Edit name, phone, password     |

### 10.4 Admin Pages (Admin Only)

| Page              | URL                | What It Shows                     |
|-------------------|--------------------|-----------------------------------|
| Admin Dashboard   | `/admin/home`      | Stats cards, charts, overview     |
| Bus Management    | `/admin/buses`     | Table of all buses with CRUD      |
| Route Management  | `/admin/routes`    | Table of all routes with CRUD     |
| Schedule Mgmt     | `/admin/schedules` | Table of all schedules with CRUD  |
| All Bookings      | `/admin/bookings`  | All bookings in the system        |
| User Management   | `/admin/users`     | All user accounts                 |

---

## 11. How the System Works — Step by Step

### 11.1 Passenger Books a Ticket

```
Step 1: Passenger opens the website
Step 2: Searches for a bus (From: Colombo, To: Kandy, Date: Tomorrow)
Step 3: System shows available buses with prices and times
Step 4: Passenger clicks "Book Now" on their preferred bus
Step 5: System shows the seat map — passenger picks seat(s)
Step 6: Passenger reviews the booking summary
Step 7: Passenger enters payment details and pays
Step 8: System confirms the booking
Step 9: A PDF ticket with QR code is generated
Step 10: Ticket is emailed to the passenger
Step 11: Passenger can view or download the ticket anytime from "My Bookings"
```

### 11.2 Admin Adds a New Bus Schedule

```
Step 1: Admin logs in to the admin dashboard
Step 2: Goes to "Bus Management" → Adds a new bus (if not already added)
Step 3: Goes to "Route Management" → Creates a route (e.g., Colombo → Kandy)
Step 4: Goes to "Schedule Management" → Creates a new schedule
Step 5: Selects the bus, the route, date, time, and price
Step 6: System checks for conflicts (is the bus already assigned?)
Step 7: Schedule is created — now passengers can find it when searching
```

### 11.3 Passenger Cancels a Booking

```
Step 1: Passenger logs in and goes to "My Bookings"
Step 2: Clicks "Cancel" on an upcoming booking
Step 3: System checks: Is it more than 2 hours before departure?
Step 4: If yes → Booking is cancelled, seats are released, refund is started
Step 5: If no → System says "Too late to cancel"
Step 6: Cancellation confirmation email is sent
```

---

## 12. Project Timeline

| Phase | What Gets Built                        | Duration     |
|-------|----------------------------------------|--------------|
| 1     | User login, registration, password reset | 1 week      |
| 2     | Admin panels: buses, routes, schedules  | 2 weeks      |
| 3     | Bus search, seat selection, booking     | 2 weeks      |
| 4     | Payment processing, PDF tickets, emails | 1 week       |
| 5     | Polish, testing, and final improvements | 2 weeks      |
| **Total** | **Complete system delivery**        | **8 weeks**  |

---

## 13. Future Improvements

These features can be added in later versions to make the system even better:

| Feature                  | Description                                          |
|--------------------------|------------------------------------------------------|
| Live Bus Tracking        | Show the bus location on a map in real time          |
| Reviews & Ratings        | Let passengers rate their trip and leave comments    |
| Multi-Language Support   | Add Sinhala and Tamil language options               |
| Mobile App               | Build a mobile app for Android and iOS               |
| Recurring Schedules      | Let admin set daily or weekly repeating schedules    |
| Loyalty Program          | Reward frequent travelers with discounts             |
| SMS Notifications        | Send booking confirmations via text message          |

---

## Summary

**Serendib Go** is a complete, modern, and easy-to-use bus booking platform designed for Sri Lanka. It covers everything from searching for a bus to paying for a ticket and getting a digital receipt.

**Key Highlights:**
- Simple and beautiful design that works on all devices
- Secure login system with role-based access
- Real-time seat selection with visual seat map
- Automated PDF tickets with QR codes
- Full admin control panel with reports
- Built with modern, reliable technology (Laravel + Next.js)

---

> **Document Version:** 1.0  
> **Date:** 02 May 2026  
> **Prepared By:** Ulindu Chakranga Prabhashwara  
> **Status:** Final — Ready for Client Review
