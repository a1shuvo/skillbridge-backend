<p align="center">
  <h1 align="center">SkillBridge Backend 🎓</h1>
  <p align="center">
    <b>Enterprise-Grade Tutor Marketplace Backend</b>
  </p>
  <p align="center">
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white" alt="Node.js"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-4.x-000000?logo=express&logoColor=white" alt="Express"></a>
    <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white" alt="Prisma"></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  </p>
</p>

---

## 🎯 Overview

**SkillBridge** is a scalable, modular backend infrastructure designed for modern tutor-student marketplaces. Built with **Domain-Driven Design (DDD)** principles, it separates concerns into distinct bounded contexts while maintaining high cohesion and loose coupling.

### Key Highlights

- 🔐 **Secure Authentication** - Better Auth with OAuth 2.0 + JWT
- 🏗️ **Modular Architecture** - Domain-driven modules for maintainability
- ⚡ **High Performance** - Optimized Prisma queries with connection pooling
- 🛡️ **Role-Based Access Control** - Granular permissions (Student, Tutor, Admin)
- 📊 **Real-time Analytics** - Admin dashboard with platform metrics

---

## ✨ Features

### 👨‍🎓 For Students

| Feature                | Description                                           | Status |
| ---------------------- | ----------------------------------------------------- | ------ |
| **Smart Discovery**    | Filter tutors by subject, price, rating, availability | ✅     |
| **Secure Booking**     | Atomic booking transactions with conflict resolution  | ✅     |
| **Review System**      | Post-session ratings with moderation                  | ✅     |
| **Booking Management** | View upcoming/past sessions, reschedule/cancel        | ✅     |

### 👨‍🏫 For Tutors

| Feature                 | Description                                   | Status |
| ----------------------- | --------------------------------------------- | ------ |
| **Profile Management**  | Rich profiles with bio, credentials, subjects | ✅     |
| **Availability Engine** | Recurring and one-time slot management        | ✅     |
| **Session Dashboard**   | Calendar view of booked sessions              | ✅     |
| **Analytics**           | Revenue tracking, rating trends               | ✅     |

### 🛡️ For Administrators

| Feature                | Description                               | Status |
| ---------------------- | ----------------------------------------- | ------ |
| **User Moderation**    | Ban/unban users, verify tutor credentials | ✅     |
| **Platform Analytics** | Revenue, user growth, booking metrics     | ✅     |
| **Content Management** | CRUD operations for categories            | ✅     |
| **Audit Logs**         | Track administrative actions              | ✅     |

---

## 🛠 Tech Stack

### Core Infrastructure

- **Runtime:** Node.js 18+ (LTS)
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.0+ (Strict Mode)
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5.x with Accelerate

### Authentication & Security

- **Auth Provider:** Better Auth
- **OAuth:** Google Sign-In (OpenID Connect)
- **Session Management:** Secure HTTP-only cookies
- **Validation:** Zod (Runtime schema validation)

### Development & Tooling

- **Package Manager:** pnpm (for disk efficiency)
- **Build Tool:** tsup / tsc
- **Dev Server:** tsx (TypeScript Execute)
- **Code Quality:** ESLint + Prettier
- **Testing:** Jest + Supertest (optional)

---

## Project Structure

```txt
src/
├── app.ts
├── server.ts
├── lib/
│   ├── prisma.ts
│   └── auth.ts
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tutor/
│   ├── category/
│   ├── booking/
│   ├── review/
│   └── admin/
└── middlewares/
    ├── auth.ts
    ├── globalErrorHandler.ts
    └── notFound.ts
```

---

### Design Patterns

- **Repository Pattern** - Abstracted data access via Prisma
- **Dependency Injection** - Loose coupling between layers
- **Middleware Chain** - Composable request processing
- **Domain Modules** - Feature-based code organization

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database instance (local or cloud)
- pnpm package manager
- Git

### Installation

```bash
git clone https://github.com/a1shuvo/skillbridge-backend.git
cd skillbridge-backend
pnpm install
```

---

## Environment Setup

Create a `.env` file:

```bash
cp .env.example .env
# Edit .env with your configuration (see Environment section)
```

---

## Database Setup (Prisma)

Generate Prisma client:

```bash
pnpm prisma generate
```

Run migrations:

```bash
pnpm prisma migrate dev --name init
```

Open Prisma Studio (optional):

```bash
pnpm prisma studio
```

---

## Seed Admin (Required)

Admins are seeded and cannot be created via public registration.

```bash
pnpm seed:admin
```

---

## Run Dev Server

```bash
pnpm dev
```

Server runs at:

```
http://localhost:5000
```

---

## Auth Endpoints (Better Auth)

### Sign Up (Email)

```http
POST /api/auth/sign-up/email
```

```json
{
  "name": "Shuvo Saha",
  "email": "shuvo@gmail.com",
  "password": "12345678",
  "role": "STUDENT" // or "TUTOR"
}
```

### Sign In (Email)

```http
POST /api/auth/sign-in/email
```

```json
{
  "email": "shuvo@gmail.com",
  "password": "12345678"
}
```

### Current User

```http
GET /api/auth/me
```

---

## Core Endpoints

| Module      | Endpoint              | Method | Auth Required | Description                  |
| ----------- | --------------------- | ------ | ------------- | ---------------------------- |
| **Tutors**  | `/api/tutors`         | GET    | No            | List all tutors with filters |
| **Tutors**  | `/api/tutors/:id`     | GET    | No            | Get tutor details            |
| **Tutors**  | `/api/tutors/profile` | PUT    | Yes (Tutor)   | Update tutor profile         |
| **Booking** | `/api/bookings`       | POST   | Yes (Student) | Create new booking           |
| **Booking** | `/api/bookings/my`    | GET    | Yes           | Get user's bookings          |
| **Admin**   | `/api/admin/users`    | GET    | Yes (Admin)   | List all users               |
| **Admin**   | `/api/admin/stats`    | GET    | Yes (Admin)   | Platform analytics           |

---

## Scripts

| Command                   | Description              |
| ------------------------- | ------------------------ |
| `pnpm dev`                | Start development server |
| `pnpm seed:admin`         | Seed initial admin user  |
| `pnpm prisma generate`    | Generate Prisma client   |
| `pnpm prisma migrate dev` | Run migrations           |
| `pnpm prisma studio`      | Open Prisma Studio       |

---

## 📄 License

MIT License © SkillBridge

---

## 👨‍💻 Author

Built with ❤️ by **Shuvo Saha**
