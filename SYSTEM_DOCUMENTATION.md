# Bus Online - Online Bus Ticketing System

## Project Overview

**Bus Online** is a full-stack web application for Sri Lanka's online bus ticketing platform. The system enables users to search, book, and manage bus tickets digitally while providing administrators with tools to manage the platform.

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | ^8.2 | Server-side programming language |
| Laravel | ^12.0 | PHP web application framework |
| Laravel Sanctum | ^4.3 | API token authentication |
| MySQL | Latest | Relational database management |
| Composer | - | PHP dependency management |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.4 | React framework with SSR/SSG |
| React | 19.2.3 | UI component library |
| MUI (Material-UI) | ^7.3.7 | Pre-built UI component library |
| Tailwind CSS | ^4 | Utility-first CSS framework |
| Axios | ^1.13.4 | HTTP client for API communication |

### DevOps & Tools
- **Docker** - Containerization (MySQL data backup)
- **PHPUnit** - Backend testing framework
- **ESLint** - JavaScript/React code linting
- **Vite** - Frontend build tool

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js Frontend (React 19)                 │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │    │
│  │  │ Public  │  │  User   │  │  Admin  │  │ Context │    │    │
│  │  │ Pages   │  │ Pages   │  │ Pages   │  │ (Auth)  │    │    │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API (JSON)
                          │ Bearer Token Auth
┌─────────────────────────▼───────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Laravel 12 Backend                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │    │
│  │  │ Controllers │  │   Models    │  │  Sanctum    │      │    │
│  │  │ (Auth)      │  │  (User)     │  │  Tokens     │      │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MySQL Database                        │    │
│  │  ┌─────────┐  ┌────────────────┐  ┌─────────────────┐  │    │
│  │  │  users  │  │ password_reset │  │ personal_access │  │    │
│  │  │         │  │    _tokens     │  │     _tokens     │  │    │
│  │  └─────────┘  └────────────────┘  └─────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Features Implemented

### Authentication System
- **User Login/Logout** - Secure authentication with email and password
- **Token-Based Authentication** - Laravel Sanctum for stateless API authentication
- **Role-Based Access Control** - Admin and User roles
- **Session Management** - Secure session handling with token storage
- **Protected Routes** - Middleware-protected API endpoints

### User Management
- **User Registration** - Account creation with validation
- **User Profile** - Fetch authenticated user data via `/api/auth/me`
- **Admin Seeder** - Pre-configured admin account for system management

### Frontend Features
- **Responsive Design** - Mobile-first with Tailwind CSS
- **Material UI Components** - Professional UI with MUI library
- **Global State Management** - React Context API for auth state
- **API Integration** - Axios instance with interceptors for auth headers
- **Route Groups** - Organized routing: (public), (user), (admin)

---

## Database Schema

### Users Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | Primary Key, Auto Increment |
| name | VARCHAR | Required |
| email | VARCHAR | Unique, Required |
| email_verified_at | TIMESTAMP | Nullable |
| password | VARCHAR | Hashed |
| role | ENUM('admin', 'user') | Default: 'user' |
| remember_token | VARCHAR | Nullable |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-generated |

### Sessions Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | VARCHAR | Primary Key |
| user_id | BIGINT | Foreign Key, Nullable |
| ip_address | VARCHAR(45) | Nullable |
| user_agent | TEXT | Nullable |
| payload | LONGTEXT | Required |
| last_activity | INT | Indexed |

### Personal Access Tokens Table
| Column | Type | Purpose |
|--------|------|---------|
| id | BIGINT | Primary Key |
| tokenable_type | VARCHAR | Polymorphic relation |
| tokenable_id | BIGINT | User ID |
| name | VARCHAR | Token name |
| token | VARCHAR(64) | Hashed token |
| abilities | TEXT | Token permissions |
| last_used_at | TIMESTAMP | Activity tracking |
| expires_at | TIMESTAMP | Token expiration |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Request/Response Examples

**Login Request:**
```json
POST /api/auth/login
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Login Response:**
```json
{
    "access_token": "1|abc123...",
    "token_type": "Bearer",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "user@example.com",
        "role": "user"
    }
}
```

---

## Project Structure

### Backend (Laravel)
```
Backend/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── AuthController.php    # Authentication logic
│   ├── Models/
│   │   └── User.php                  # User model with Sanctum
│   └── Providers/
├── config/
│   └── sanctum.php                   # API token configuration
├── database/
│   ├── migrations/                   # Database schema
│   └── seeders/
│       └── AdminUserSeeder.php       # Admin account seeder
├── routes/
│   └── api.php                       # API route definitions
└── tests/
    ├── Feature/
    └── Unit/
```

### Frontend (Next.js)
```
Frontend/
├── src/
│   ├── app/
│   │   ├── (admin)/                  # Admin dashboard pages
│   │   │   └── home/
│   │   ├── (public)/                 # Public pages
│   │   │   ├── auth/
│   │   │   │   └── login/
│   │   │   └── contact/
│   │   ├── (user)/                   # User dashboard pages
│   │   ├── api/
│   │   │   └── axios.js              # API configuration
│   │   ├── context/
│   │   │   └── AuthContext.js        # Auth state management
│   │   ├── layout.jsx                # Root layout
│   │   └── page.jsx                  # Homepage
│   └── components/
│       ├── common/
│       │   ├── Header.jsx
│       │   └── Footer.jsx
│       └── home/
│           └── HeroSection.jsx
└── public/
```

---

## Security Features

- **Password Hashing** - Bcrypt hashing via Laravel's Hash facade
- **CSRF Protection** - Built-in Laravel middleware
- **Token Authentication** - Sanctum tokens with secure storage
- **Input Validation** - Request validation on all endpoints
- **CORS Configuration** - Configured cross-origin resource sharing
- **Environment Variables** - Sensitive data stored in `.env` files

---

## Development Commands

### Backend (Laravel)
```bash
# Install dependencies
composer install

# Run migrations
php artisan migrate

# Seed admin user
php artisan db:seed --class=AdminUserSeeder

# Start development server
php artisan serve

# Run tests
php artisan test
```

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Key Skills Demonstrated

### Backend Development
- RESTful API design and implementation
- Laravel framework proficiency
- Database design and migrations
- Authentication/Authorization systems
- MVC architecture pattern
- Middleware implementation

### Frontend Development
- React.js / Next.js development
- State management with Context API
- Responsive UI design
- API integration with Axios
- Component-based architecture
- CSS frameworks (Tailwind, MUI)

### DevOps & Tools
- Version control (Git)
- Database management (MySQL)
- Docker containerization
- Testing frameworks (PHPUnit)
- Package managers (Composer, npm)

### Soft Skills
- Full-stack development capability
- Clean code practices
- System architecture design
- Documentation

---

## CV Summary Points

> **Bus Online - Full Stack Web Application**
> - Developed a complete online bus ticketing platform using **Laravel 12** (backend) and **Next.js 16** (frontend)
> - Implemented secure **token-based authentication** using Laravel Sanctum with role-based access control
> - Built responsive UI with **React 19**, **Material-UI**, and **Tailwind CSS**
> - Designed and implemented **RESTful API** architecture with proper request validation
> - Created database schema with **MySQL**, including migrations and seeders
> - Integrated frontend with backend using **Axios** with interceptors for authentication
> - Followed **MVC architecture** and component-based design patterns

---

## Future Enhancements (Planned)

- [ ] Bus route management system
- [ ] Seat selection and booking
- [ ] Payment gateway integration
- [ ] Ticket generation (PDF)
- [ ] Email notifications
- [ ] User dashboard with booking history
- [ ] Admin analytics dashboard
- [ ] Real-time bus tracking

---

*Documentation generated for CV/portfolio purposes*
*Project: Bus Online - Sri Lanka's Online Bus Ticketing Platform*
