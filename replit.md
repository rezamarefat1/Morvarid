# Morvarid Poultry Management System

## Overview

A comprehensive poultry farm management system designed for Persian (Farsi) speaking users in Iran. The application manages egg production tracking, sales invoicing, inventory management, and reporting for multiple poultry farms. Built with a mobile-first approach and full RTL (right-to-left) support, it enables farmers to efficiently record daily production statistics, generate sales invoices, and view analytics dashboards.

## Recent Changes (December 2025)

- Migrated from hardcoded farm types to dynamic UUID-based farms stored in database
- Added proper filtering by farmId AND date for production/invoice queries  
- Fixed user role validation to enforce farm assignment for non-admin roles
- Settings page allows assigning any farm (including inactive) to users
- Added logout confirmation dialogs to sidebar and bottom navigation
- All forms support Jalali (Persian) calendar for date selection
- User roles: "مسئول ثبت" (Recording Officer), "مسئول فروش" (Sales Officer), "مدیر سیستم" (Admin)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: Jalali (Persian) calendar using jalaali-js library

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON API with `/api` prefix
- **Build Tool**: Vite for development and production builds, esbuild for server bundling

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod schemas
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

### Authentication
- **Method**: Simple username/password authentication stored in localStorage
- **Session**: Client-side session management via AuthContext
- **Biometric**: Optional WebAuthn/biometric login support (platform authenticator)

### Key Design Patterns
- **Shared Types**: Schema definitions in `shared/` directory are used by both client and server
- **Query Keys**: API endpoints used directly as React Query keys
- **RTL Layout**: HTML document configured with `dir="rtl"` and `lang="fa"`
- **Responsive Design**: Mobile-first with bottom navigation on mobile, sidebar on desktop

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route page components
│   ├── contexts/        # React contexts (Auth)
│   ├── lib/             # Utilities (jalali dates, excel export, query client)
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── db.ts            # Database connection
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schema and Zod types
└── migrations/          # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **pg**: Node.js PostgreSQL client
- **connect-pg-simple**: Session store (available but auth is currently client-side)

### Third-Party Libraries
- **jalaali-js**: Persian/Jalali calendar date conversion
- **exceljs**: Excel file generation for report exports
- **lucide-react**: Icon library
- **date-fns**: Date utility functions

### Development Tools
- **Vite**: Development server with HMR
- **@replit/vite-plugin-***: Replit-specific development plugins (error overlay, cartographer)
- **drizzle-kit**: Database migration and schema management tool