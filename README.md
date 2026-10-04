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
│   │   ├── businessService.controller.js # Business services listing, filters & detail controller
│   │   ├── health.controller.js    # Health check controller
│   │   └── user.controller.js      # Profile update & password change controller
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT authentication middleware
│   │   ├── error.middleware.js     # Global error handler
│   │   └── notFound.middleware.js  # 404 route handler
│   ├── models/
│   │   ├── businessService.model.js # SQL queries for business_services & business_profiles
│   │   └── user.model.js           # Parameterized SQL queries for "users" table
│   ├── routes/
│   │   ├── auth.routes.js          # Authentication routes (/api/v1/auth)
│   │   ├── businessService.routes.js # Business services routes (/api/v1/business-services)
│   │   ├── health.routes.js        # Health check route (/api/v1/health)
│   │   ├── index.js                # Central API router
│   │   └── user.routes.js          # Protected user routes (/api/v1/users)
│   ├── services/
│   │   ├── auth.service.js         # Registration, login & password verification logic
│   │   ├── businessService.service.js # Business service filtering & retrieval logic
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

---

### 3. Business Services (`/api/v1/business-services`)

#### **Fetch All Business Services (with Filters & Pagination)**
- **Endpoint:** `GET /api/v1/business-services`
- **Access:** Public
- **Query Parameters:**
  | Parameter | Type | Description |
  | :--- | :--- | :--- |
  | `district` | `string` | Filter by district or business locality/city (case-insensitive) |
  | `minPrice` | `number` | Minimum price filter (applies to `price_from` / `price_to`) |
  | `maxPrice` | `number` | Maximum price filter (applies to `price_to` / `price_from`) |
  | `priceType` | `string` | `fixed`, `starting_from`, `hourly`, `daily`, `monthly`, `custom` |
  | `serviceId` | `uuid` | Filter by master service UUID |
  | `serviceSlug` | `string` | Filter by master service slug (e.g. `ac-repair`) |
  | `category` | `string` | Filter by service category (e.g. `Cleaning`) |
  | `businessId` | `uuid` | Filter services for a specific business profile |
  | `verifiedOnly` | `boolean` | If `true`, returns services only from verified businesses |
  | `search` | `string` | Keyword search in service title, description, and business name |
  | `sortBy` | `string` | `price_asc`, `price_desc`, `newest` (default), `oldest`, `title_asc` |
  | `page` | `number` | Page number (default: `1`) |
  | `limit` | `number` | Number of items per page (default: `10`, max: `100`) |

- **Example Request:**
  `GET /api/v1/business-services?district=Kolkata&minPrice=200&maxPrice=1500&sortBy=price_asc&page=1&limit=10`

- **Response:**
  ```json
  {
    "statusCode": 200,
    "data": {
      "businessServices": [
        {
          "id": "a823b207-6b45-42f8-9a4f-124b89fa5c12",
          "business_id": "8f3b1456-e917-48f1-8f20-9289a81234bc",
          "service_id": "7b231189-d456-4982-b712-421b89ef51a0",
          "title": "Split AC Deep Cleaning & Servicing",
          "description": "Comprehensive indoor and outdoor unit jet pump cleaning",
          "price_from": "499.00",
          "price_to": "1299.00",
          "price_type": "starting_from",
          "district": "Kolkata",
          "active": true,
          "created_at": "2026-10-04T12:00:00.000Z",
          "updated_at": "2026-10-04T12:00:00.000Z",
          "business_profile": {
            "id": "8f3b1456-e917-48f1-8f20-9289a81234bc",
            "business_name": "Apex Coolers & Electronics",
            "description": "Trusted home cooling & electrical repairs",
            "phone": "+919876543210",
            "email": "contact@apexcoolers.com",
            "whatsapp_number": "+919876543210",
            "website_url": "https://apexcoolers.com",
            "logo_url": "https://example.com/logo.png",
            "cover_image_url": "https://example.com/cover.png",
            "address": "12/A Park Street",
            "locality": "Park Street",
            "pincode": "700016",
            "city": "Kolkata",
            "state": "West Bengal",
            "latitude": 22.5512,
            "longitude": 88.3524,
            "verified": true,
            "active": true
          },
          "service": {
            "id": "7b231189-d456-4982-b712-421b89ef51a0",
            "name": "AC Repair",
            "slug": "ac-repair",
            "description": "AC installation, repair and service",
            "category": "Appliance Repair",
            "image_url": "https://example.com/service.jpg",
            "active": true
          }
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    },
    "message": "Business services retrieved successfully",
    "success": true
  }
  ```

#### **Fetch Available Districts**
- **Endpoint:** `GET /api/v1/business-services/districts`
- **Access:** Public
- **Description:** Retrieves all unique districts where active businesses provide services (useful for populating filter dropdowns).

#### **Fetch Single Business Service by ID**
- **Endpoint:** `GET /api/v1/business-services/:id`
- **Access:** Public
- **Description:** Retrieves a single business service by UUID with full business profile and master service information.

#### **Fetch Services by Business Profile ID**
- **Endpoint:** `GET /api/v1/business-services/business/:businessId`
- **Access:** Public
- **Query Parameters:** `?activeOnly=true` (default: `true`)
- **Description:** Retrieves all services offered by a specific business profile.

### 4. Public Marketplace Discovery (`/api/v1/public`)

- `GET /api/v1/public/districts` — active districts, including manually created districts.
- `GET /api/v1/public/districts/:district/services` — services assigned to that district.
- `GET /api/v1/public/businesses?district=Kolkata&serviceSlug=electrician` — registered businesses offering a service in a district.

### 5. Admin Management (`/api/v1/admin`)

The current admin UI uses these manual-management endpoints:

- `GET/POST/PATCH/DELETE /api/v1/admin/districts`
- `GET/POST /api/v1/admin/services`
- `POST/DELETE /api/v1/admin/districts/:districtId/services/:serviceId`
- `GET/POST /api/v1/admin/organizations`

Apply the updated `db.sql` before using the new admin forms. The current project has no admin authentication middleware, so protect `/api/v1/admin` before deploying it publicly.

