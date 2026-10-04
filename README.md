# Express Backend Server (Neon DB & Node.js)

A clean, modular Node.js Express server with Neon PostgreSQL, JWT Authentication, and layered architecture (Controllers, Services, Models, Middlewares, Routes).

## Project Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                   # Neon PostgreSQL connection pool & health check
│   │   └── env.config.js           # Centralized environment configuration
│   ├── controllers/
│   │   ├── auth.controller.js      # Register, login, getMe controller
│   │   ├── health.controller.js    # Health check controller
│   │   └── user.controller.js      # Profile update & password change controller
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT authentication middleware
│   │   ├── error.middleware.js     # Global error handler
│   │   └── notFound.middleware.js  # 404 route handler
│   ├── models/
│   │   └── user.model.js           # Parameterized SQL queries for "users" table
│   ├── routes/
│   │   ├── auth.routes.js          # Authentication routes (/api/v1/auth)
│   │   ├── health.routes.js        # Health check route (/api/v1/health)
│   │   ├── index.js                # Central API router
│   │   └── user.routes.js          # Protected user routes (/api/v1/users)
│   ├── services/
│   │   ├── auth.service.js         # Registration, login & password verification logic
│   │   └── user.service.js         # User profile update & password change logic
│   ├── utils/
│   │   ├── ApiError.js             # Standardized error response class
│   │   ├── ApiResponse.js          # Standardized API response format
│   │   └── asyncHandler.js         # Async error wrapper for route handlers
│   ├── app.js                      # Express middleware and routing configuration
│   └── server.js                   # Entry point, DB connection check & server bootstrap
├── .env                            # Environment variables (git-ignored)
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
└── package.json
```

## Setup & Configuration

### 1. Configure `.env`
Add your Neon PostgreSQL connection string and JWT secret in `.env`:
```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=*
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
```

### 2. Run the Server
- **Development (with hot reload via nodemon):**
  ```bash
  npm run dev
  ```
- **Production:**
  ```bash
  npm start
  ```

---

## API Reference (`/api/v1`)

### 1. Authentication (`/api/v1/auth`)

#### **Register User**
- **Endpoint:** `POST /api/v1/auth/register`
- **Body (JSON):**
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "strongPassword123",
    "phone": "+1234567890",
    "profileImageUrl": "https://example.com/photo.jpg",
    "address": "123 Main Street",
    "locality": "Downtown",
    "pincode": "123456",
    "city": "New York",
    "state": "NY",
    "latitude": 40.712776,
    "longitude": -74.005974
  }
  ```

#### **Login User**
- **Endpoint:** `POST /api/v1/auth/login`
- **Body (JSON):**
  ```json
  {
    "phone": "+1234567890",
    "password": "strongPassword123"
  }
  ```

#### **Get Current User**
- **Endpoint:** `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <token>`

---

### 2. User Profile Management (`/api/v1/users`)

#### **Get Profile**
- **Endpoint:** `GET /api/v1/users/profile`
- **Headers:** `Authorization: Bearer <token>`

#### **Update Profile**
- **Endpoint:** `PATCH /api/v1/users/profile` or `PUT /api/v1/users/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body (JSON):** (Any subset of fields)
  ```json
  {
    "fullName": "Jane Smith",
    "phone": "+1987654321",
    "profileImageUrl": "https://example.com/new-avatar.jpg",
    "address": "456 Oak Avenue",
    "locality": "Uptown",
    "pincode": "654321",
    "city": "Brooklyn",
    "state": "NY",
    "latitude": 40.678177,
    "longitude": -73.944160
  }
  ```

#### **Change Password**
- **Endpoint:** `PATCH /api/v1/users/change-password` or `PUT /api/v1/users/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body (JSON):**
  ```json
  {
    "currentPassword": "strongPassword123",
    "newPassword": "newStrongPassword456"
  }
  ```
