# 🌾 ShopManager — Rice & Grains Management System

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green?logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A **production-ready full-stack** web application for managing a rice and grains shop. Built with **Spring Boot 3 + React/Vite + MongoDB** — featuring real-time sales tracking, inventory management, analytics dashboards, and PDF/Excel reporting.

> 🔗 **Repository:** [github.com/manojreddy88836-mallidi/shop-management](https://github.com/manojreddy88836-mallidi/shop-management)

---

## 📸 Screenshots

| Dashboard | Sales Entry | Reports |
|-----------|------------|---------|
| *(Dashboard screenshot)* | *(Sales page screenshot)* | *(Reports screenshot)* |

| Item Master | Sales History | Settings |
|-------------|--------------|----------|
| *(Items page screenshot)* | *(History screenshot)* | *(Settings screenshot)* |

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Material UI v5, Recharts, Axios, React Router v6 |
| **Backend** | Java 21, Spring Boot 3.2.5, Spring Security 6, JWT |
| **Database** | MongoDB 8.x (Spring Data MongoDB) |
| **Auth** | JWT (jjwt 0.12.3) + BCrypt password hashing |
| **Export** | jsPDF + jspdf-autotable, SheetJS (XLSX) |
| **Charts** | Recharts 2 |
| **Notifications** | Notistack 3 |
| **Date Handling** | Day.js |
| **Build** | Maven 3.9+, npm |

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based stateless authentication with BCrypt password hashing
- Protected routes with auto session restore from localStorage
- Password change via Settings page
- All API endpoints secured except `/api/auth/**`

### 📊 Dashboard
- **Real-time KPIs** — today's revenue, total KG sold, transaction count
- **Period selector** — Today / Yesterday / This Week / This Month / Custom range
- **Top items** chart by KG sold (Recharts bar chart)
- **Recent sales** live feed showing latest 10 transactions
- Most sold item and highest revenue item highlights

### 💰 Sales Entry
- Searchable item dropdown (type-ahead, 190+ items)
- Quantity input in **kg** (supports decimals: 0.25, 1.5, 25, etc.)
- Manual total price entry (shop owner sets the price per transaction)
- Optional date/time override for backdated entries
- Edit and delete existing sales
- Date picker to view/manage sales for any date

### 📦 Item Master (Inventory)
- Full CRUD — create, read, update, soft-delete, restore
- **190+ pre-seeded items** across categories: RICE, BASMATI, PADDY, FLOUR, LENTILS, OIL, SUGAR, SALT, GRAINS
- Paginated list with search and category filter
- Auto-sync on startup — renames, inserts missing items, deactivates obsolete ones

### 📈 Reports
- **Daily / Weekly / Monthly / Custom** date-range reports
- Item-wise breakdown: KG sold, transaction count, revenue
- **Export to PDF** (jsPDF + AutoTable)
- **Export to Excel** (SheetJS/XLSX)

### 📋 Sales History
- Full paginated sales log with date-range and item name search
- Edit / delete any past sale record

### 👥 Customer Management
- Add, edit, delete customer records
- Fields: Name, phone, address
- Searchable paginated list

### 🌙 UI / UX
- **Dark / Light mode** toggle with persisted preference
- Fully responsive (mobile + desktop)
- Toast notifications (Notistack)
- Loading skeletons and error boundaries

---

## 📋 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Java** | 21+ | Run Spring Boot backend |
| **Maven** | 3.9+ | Build backend |
| **Node.js** | 20+ | Run React frontend |
| **npm** | 9+ | Frontend package manager |
| **MongoDB** | 7+ or 8+ | Database (local or Atlas) |

> 💡 **No Docker required** — MongoDB runs as a native Windows Service after installation.

---

## ⚡ Quick Start — Local Development

### Step 1 — Install MongoDB

**Option A: winget (Windows)**
```powershell
winget install MongoDB.Server --accept-source-agreements --accept-package-agreements
# MongoDB installs and auto-starts as a Windows Service on port 27017
```

**Option B: Manual Download**
Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- Select: Windows → MSI → Install as a Service

**Verify MongoDB is running:**
```powershell
Get-Service -Name "MongoDB"
# Status should be: Running
```

---

### Step 2 — Run the Backend

```bash
cd backend
mvn spring-boot:run
```

- Backend starts at: **http://localhost:8080**
- On first startup, `DataInitializer` automatically:
  - Creates the `shop_management` MongoDB database
  - Seeds the **admin user** (`admin` / `admin123`)
  - Seeds **190+ items** across all categories

---

### Step 3 — Run the Frontend

```bash
cd frontend
npm install      # first time only
npm run dev
```

- Frontend starts at: **http://localhost:5173**
- Vite proxies all `/api` requests to `http://localhost:8080`

---

### 🔑 Default Login

> **Username:** `admin`  
> **Password:** `admin123`

> ⚠️ Change the default password immediately after first login via **Settings → Change Password**.

---

## 🔧 Environment Variables

### Backend — `application.properties`

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/shop_management` |
| `MONGO_DB` | MongoDB database name | `shop_management` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Built-in dev default |
| `JWT_EXPIRATION` | Token expiry in milliseconds | `86400000` (24 hours) |
| `PORT` | Server port | `8080` |

**Override via environment variables (PowerShell):**
```powershell
$env:MONGO_URI = "mongodb+srv://user:pass@cluster.mongodb.net/shop_management"
$env:JWT_SECRET = "your-very-long-secret-key-at-least-32-characters"
mvn spring-boot:run
```

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend base URL | Empty (uses Vite proxy to localhost:8080) |

---

## 🗄️ Database — MongoDB

### Collections

| Collection | Description |
|-----------|-------------|
| `users` | Admin accounts with BCrypt-hashed passwords |
| `items` | Product master list (190+ rice & grain items) |
| `sales` | Denormalized sale records (itemName + category embedded) |
| `customers` | Customer contact records |

### Auto-Seeding (DataInitializer)

Every startup, `DataInitializer` runs idempotently:
1. **Admin user** — created if not exists; password re-hashed if changed
2. **Item master sync** — applies renames, inserts missing items, deactivates obsolete items
3. **No data loss** — existing sales are never touched

### No Schema Migration Needed

MongoDB is schema-less. Collections are created automatically on first write. No SQL scripts, no Flyway/Liquibase required.

### MongoDB Atlas (Cloud) Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/shop_management`
3. Set it as `MONGO_URI` environment variable

---

## 📡 REST API Reference

All endpoints except `/api/auth/login` require:
```
Authorization: Bearer <JWT_TOKEN>
```

### 🔐 Auth
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/auth/login` | Login → returns JWT | `{username, password}` |
| `POST` | `/api/auth/change-password` | Change password | `{currentPassword, newPassword}` |
| `GET` | `/api/auth/validate` | Validate current JWT | — |

### 📦 Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/items?search=&category=&page=0&size=20` | Paginated item list (ACTIVE only) |
| `GET` | `/api/items/search?q=HMT` | Type-ahead search (returns ACTIVE items) |
| `GET` | `/api/items/categories` | All distinct categories |
| `GET` | `/api/items/{id}` | Get single item by MongoDB ObjectId |
| `POST` | `/api/items` | Create item |
| `PUT` | `/api/items/{id}` | Update item |
| `DELETE` | `/api/items/{id}` | Soft delete (sets status=DELETED) |
| `PATCH` | `/api/items/{id}/restore` | Restore deleted item |

### 💰 Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sales` | Record a sale |
| `PUT` | `/api/sales/{id}` | Edit a sale |
| `DELETE` | `/api/sales/{id}` | Delete a sale |
| `GET` | `/api/sales?start=&end=&page=0&size=20` | Paginated sales by date range |
| `GET` | `/api/sales/today` | All sales for today |
| `GET` | `/api/sales/by-date?date=2024-01-15` | All sales for a specific date |
| `GET` | `/api/sales/history?start=&end=&search=&page=0` | Searchable sales history |

**Sale Request Body:**
```json
{
  "itemId": "64b3f1a2c8e4d5f6a7b8c9d0",
  "quantityKg": 25.5,
  "totalPrice": 1150.00,
  "saleDate": "2024-01-15",
  "saleTime": "10:30:00"
}
```

### 📊 Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Today's KPIs + top items + recent sales |
| `GET` | `/api/dashboard/stats?period=yesterday` | Yesterday's stats |
| `GET` | `/api/dashboard/stats?period=week` | This week's stats |
| `GET` | `/api/dashboard/stats?period=month` | This month's stats |
| `GET` | `/api/dashboard/stats?start=2024-01-01&end=2024-01-31` | Custom range stats |

### 📈 Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/daily?date=2024-01-15` | Daily item-wise report |
| `GET` | `/api/reports/weekly` | This week (Mon → today) |
| `GET` | `/api/reports/monthly` | This month (1st → today) |
| `GET` | `/api/reports/custom?start=2024-01-01&end=2024-01-31` | Custom date range |

**Report Response (per item):**
```json
{
  "itemName": "GM CRM",
  "totalKg": 150.5,
  "transactions": 12,
  "revenue": 6750.00
}
```

### 👥 Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customers?search=&page=0&size=20` | Paginated customer list |
| `GET` | `/api/customers/{id}` | Get customer by ID |
| `POST` | `/api/customers` | Create customer |
| `PUT` | `/api/customers/{id}` | Update customer |
| `DELETE` | `/api/customers/{id}` | Delete customer |

---

## 📁 Project Structure

```
shop_accounts/
├── backend/                              # Spring Boot 3.2.5 Application
│   ├── src/main/java/com/shopmanager/
│   │   ├── ShopManagerApplication.java   # Entry point
│   │   ├── DataInitializer.java          # Auto-seeds users + item master on startup
│   │   ├── config/                       # SecurityConfig, CorsConfig
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── ItemController.java
│   │   │   ├── SaleController.java
│   │   │   ├── DashboardController.java
│   │   │   ├── ReportController.java
│   │   │   └── CustomerController.java
│   │   ├── dto/                          # Request/Response DTOs
│   │   │   ├── SaleDTO.java / SaleRequest.java
│   │   │   ├── ItemDTO.java
│   │   │   ├── CustomerDTO.java
│   │   │   ├── DashboardDTO.java
│   │   │   ├── ReportItemDTO.java
│   │   │   ├── PageResponse.java
│   │   │   └── ApiResponse.java
│   │   ├── entity/                       # MongoDB @Document classes
│   │   │   ├── User.java
│   │   │   ├── Item.java
│   │   │   ├── Sale.java                 # Denormalized (embeds itemName, category)
│   │   │   └── Customer.java
│   │   ├── exception/                    # GlobalExceptionHandler, custom exceptions
│   │   ├── repository/
│   │   │   ├── UserRepository.java       # MongoRepository<User, String>
│   │   │   ├── ItemRepository.java       # MongoRepository<Item, String>
│   │   │   ├── SaleRepository.java       # MongoRepository<Sale, String>
│   │   │   ├── SaleAggregationRepository.java  # MongoTemplate aggregation pipelines
│   │   │   └── CustomerRepository.java   # MongoRepository<Customer, String>
│   │   ├── security/                     # JwtUtil, JwtFilter, CustomUserDetailsService
│   │   └── service/
│   │       ├── AuthService.java
│   │       ├── ItemService.java
│   │       ├── SaleService.java
│   │       ├── DashboardService.java
│   │       ├── ReportService.java
│   │       └── CustomerService.java
│   ├── src/main/resources/
│   │   └── application.properties        # MongoDB URI, JWT config
│   └── pom.xml                           # spring-boot-starter-data-mongodb
├── frontend/                             # React 18 + Vite 5 Application
│   ├── src/
│   │   ├── api/                          # Axios API service modules
│   │   ├── components/                   # Shared layout components
│   │   ├── context/                      # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── SalesPage.jsx             # Sale entry + today's sales list
│   │   │   ├── SalesHistoryPage.jsx      # Searchable historical log
│   │   │   ├── ItemsPage.jsx
│   │   │   ├── ReportsPage.jsx           # PDF/Excel export
│   │   │   ├── CustomersPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   └── routes/                       # ProtectedRoute wrapper
│   ├── vite.config.js                    # Proxy /api → localhost:8080
│   └── package.json
├── docker-compose.yml                    # Docker setup
├── .env.example
├── .gitignore
└── README.md
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│               Browser (React 18)                │
│  Dashboard · Sales · Items · Reports · History  │
└─────────────────┬───────────────────────────────┘
                  │ HTTP + JWT (Axios)
                  ▼
┌─────────────────────────────────────────────────┐
│          Spring Boot 3.2.5 (port 8080)          │
│  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Controllers │  │  Spring Security + JWT │  │
│  └──────┬───────┘  └────────────────────────┘  │
│         │                                        │
│  ┌──────▼───────────────────────────────────┐  │
│  │              Service Layer               │  │
│  │  SaleService · ItemService · Dashboard   │  │
│  │  ReportService · CustomerService         │  │
│  └──────┬───────────────────────────────────┘  │
│         │                                        │
│  ┌──────▼──────────────┐  ┌──────────────────┐ │
│  │  MongoRepository    │  │  MongoTemplate   │ │
│  │  (CRUD operations)  │  │  (Aggregation    │ │
│  │                     │  │   Pipelines)     │ │
│  └──────┬──────────────┘  └──────┬───────────┘ │
└─────────┼──────────────────────── ┼─────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────┐
│            MongoDB 8.x (port 27017)             │
│  Collections: users · items · sales · customers │
└─────────────────────────────────────────────────┘
```

---

## 🌐 Deployment

### ☁️ Backend on Render / Railway (with MongoDB Atlas)

1. Push repo to GitHub
2. Create a **Web Service** on Render / Railway
3. Set **Build Command:** `mvn clean package -DskipTests`
4. Set **Start Command:** `java -jar target/shop-manager-1.0.0.jar`
5. Add environment variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/shop_management` |
| `JWT_SECRET` | Your 32+ character secret key |
| `JWT_EXPIRATION` | `86400000` |

### 🌍 Frontend on Vercel / Netlify

1. Set **Build Command:** `npm run build`
2. Set **Publish Directory:** `dist`
3. Add environment variable:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com` |

### 🐳 Docker Compose (VPS / Self-hosted)

```bash
git clone https://github.com/manojreddy88836-mallidi/shop-management.git
cd shop-management
cp .env.example .env
# Edit .env: set JWT_SECRET to a strong random string
docker-compose up -d --build
```

> Update `docker-compose.yml` to use MongoDB instead of MySQL if self-hosting with Docker.

---

## 🛡️ Security

- Passwords hashed with **BCrypt** (strength 10)
- JWT tokens expire after **24 hours** (configurable via `JWT_EXPIRATION`)
- All API endpoints except `/api/auth/login` require a valid Bearer token
- CORS configured — restrict `allowedOrigins` in production
- Input validation on all endpoints via **Jakarta Bean Validation**
- MongoDB ObjectId strings validated at the service layer
- No SQL injection risk (MongoDB + parameterized queries)

---

## 🔍 Troubleshooting

### MongoDB won't connect
```powershell
# Check service status
Get-Service -Name "MongoDB"

# Start it manually
Start-Service -Name "MongoDB"

# Verify port 27017 is listening
Test-NetConnection -ComputerName localhost -Port 27017
```

### Backend won't start
```bash
# Compile first to catch errors
mvn compile -DskipTests

# Run with verbose logging
mvn spring-boot:run -Dlogging.level.com.shopmanager=DEBUG
```

### Frontend can't reach API
- Make sure backend is running on port 8080
- Check `vite.config.js` has the correct proxy target
- In production, set `VITE_API_URL` to the deployed backend URL

### Reset item master
The item list is re-synced from the `MASTER_ITEMS` array in `DataInitializer.java` on every startup. Just restart the backend.

---

## 🔮 Future Enhancements

- [ ] **Multi-user support** — roles (admin, cashier, viewer)
- [ ] **Purchase orders / stock-in** tracking
- [ ] **Low stock alerts** when item quantity drops below threshold
- [ ] **WhatsApp/SMS receipts** via Twilio integration
- [ ] **Profit margin tracking** (purchase price vs sell price)
- [ ] **Barcode scanner** support for item lookup
- [ ] **Mobile app** (React Native / Flutter) using the same REST API
- [ ] **Audit log** — track who changed what and when
- [ ] **Data export** — monthly archive to ZIP (PDF + Excel)

---

## 📞 Support & Logs

Built with ❤️ for rice & grains shop management.

**Check backend logs:**
```bash
# Running locally — output shows in the terminal
# Check MongoDB connectivity
mongosh --eval "db.adminCommand('ping')"
```

**Key log messages to look for:**
```
✅ Admin user created.
✅ Item master sync: renamed=0, inserted=136, activated=0, deactivated=0 | active=136
Tomcat started on port 8080
```

---

*Last updated: July 2026 — v2.0 (MongoDB edition)*
