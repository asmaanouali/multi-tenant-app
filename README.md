# Multi-Tenant Platform

A full-stack multi-tenant application with event management, catalog, and organization features. Built with Node.js, Express, Prisma, and React.

## 🏗️ Project Structure

```
PROJECT/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── calendarController.js
│   │   │   ├── catalogController.js
│   │   │   ├── catalogEventController.js
│   │   │   ├── organizationEventController.js
│   │   │   ├── subscriptionController.js
│   │   │   └── tenantController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   └── routes/
│   │       ├── authRoutes.js
│   │       ├── calendarRoutes.js
│   │       ├── catalogRoutes.js
│   │       ├── tenantRoutes.js
│   │       └── userRoutes.js
│   ├── prisma/
│   └── node_modules/
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── authService.js
    │   │   ├── axios.js
    │   │   ├── calendarService.js
    │   │   ├── catalogService.js
    │   │   └── tenantService.js
    │   ├── components/
    │   │   ├── common/
    │   │   └── layout/
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useAuth.js
    │   ├── pages/
    │   │   ├── CalendarPage.jsx
    │   │   ├── CatalogsPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── EventsPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── OrganizationsPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── SettingsPage.jsx
    │   └── utils/
    │       ├── constants.js
    │       └── dateHelpers.js
    ├── public/
    └── node_modules/
```

## ✨ Features

- **Multi-Tenancy**: Complete tenant isolation with subscription management
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Event Management**: Create and manage calendar events and catalog events
- **Organization Management**: Multi-organization support per tenant
- **Catalog System**: Product/service catalog with event scheduling
- **Dashboard**: Centralized overview of key metrics and activities
- **User Management**: Complete user lifecycle management
- **Settings**: Configurable tenant and user preferences

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Authentication**: JWT
- **Middleware**: Custom auth and error handling

### Frontend
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Routing**: React Router (implied)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL/MySQL/SQLite (depending on Prisma configuration)

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
DATABASE_URL="your_database_connection_string"
JWT_SECRET="your_jwt_secret_key"
PORT=5000
```

5. Run Prisma migrations:
```bash
npx prisma migrate dev
```

6. Generate Prisma Client:
```bash
npx prisma generate
```

7. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

## 🔑 Environment Variables

### Backend
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |

### Frontend
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API base URL | Yes |

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants/:id` - Get tenant details
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Calendar
- `GET /api/calendar/events` - List calendar events
- `POST /api/calendar/events` - Create calendar event
- `PUT /api/calendar/events/:id` - Update calendar event
- `DELETE /api/calendar/events/:id` - Delete calendar event

### Catalog
- `GET /api/catalog` - List catalog items
- `POST /api/catalog` - Create catalog item
- `GET /api/catalog/:id` - Get catalog item details
- `PUT /api/catalog/:id` - Update catalog item
- `DELETE /api/catalog/:id` - Delete catalog item

## 🗂️ Database Schema

The application uses Prisma ORM. Key models include:

- **User**: User accounts with authentication
- **Tenant**: Multi-tenant isolation
- **Organization**: Organizations within tenants
- **Subscription**: Tenant subscription management
- **CalendarEvent**: Scheduled calendar events
- **CatalogEvent**: Catalog-based events
- **Catalog**: Product/service catalog items

Run `npx prisma studio` to explore your database with a visual editor.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend Deployment
1. Set production environment variables
2. Build the application (if using TypeScript)
3. Run database migrations: `npx prisma migrate deploy`
4. Start the server: `npm start`

### Frontend Deployment
1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)

## 📝 Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests
- `npx prisma studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint
