# 🌾 ShopManager — Rice & Grains Management System

A **production-ready full-stack** web application for managing a rice and grains shop. Built with Spring Boot 3 + React/Vite + MySQL.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Material UI v5, Axios, React Router v6 |
| Backend | Java 21, Spring Boot 3.x, Spring Security, JWT |
| Database | MySQL 8 with Hibernate/JPA |
| Auth | JWT + BCrypt password hashing |
| Deployment | Docker + Docker Compose |

---

## ✨ Features

- 🔐 **Secure Auth** — JWT + BCrypt, protected routes, auto session restore
- 📊 **Dashboard** — Today's revenue, transactions, most sold item, charts
- 💰 **Sales Entry** — Searchable item dropdown, auto-price fill, discount support
- 📦 **Item Master** — Full CRUD, pagination, soft delete/restore, category filter
- 📈 **Reports** — Daily/Weekly/Monthly/Custom, export to PDF & Excel
- 👥 **Customers** — Customer management with history
- 🌙 **Dark/Light Mode** — Persisted theme preference
- 📱 **Responsive** — Mobile + desktop compatible

---

## 📋 Prerequisites

- **Java 21+** (for running backend manually)
- **Node.js 20+** (for running frontend manually)
- **MySQL 8** (or Docker)
- **Maven 3.9+** (or use Docker)
- **Docker + Docker Compose** (for containerized setup — recommended)

---

## ⚡ Quick Start (Docker — Recommended)

```bash
# 1. Clone / open the project
cd shop_accounts

# 2. Copy env file and set your passwords
cp .env.example .env
# Edit .env with your desired passwords

# 3. Start everything
docker-compose up --build

# 4. Open browser
# Frontend: http://localhost:80
# Backend API: http://localhost:8080
```

**Default credentials:** `admin` / `admin123`

---

## 🖥️ Local Development (Without Docker)

### Backend

```bash
cd backend

# Set environment variables (Windows PowerShell)
$env:DB_URL="jdbc:mysql://localhost:3306/shopdb?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true"
$env:DB_USER="root"
$env:DB_PASS="your_mysql_password"
$env:JWT_SECRET="yourSecretKey"

# Run
mvn spring-boot:run

# Backend starts at http://localhost:8080
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8080)
npm run dev

# Frontend starts at http://localhost:5173
```

---

## 🔧 Environment Variables

### Backend (`backend/.env.example`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/shopdb?...` |
| `DB_USER` | MySQL username | `root` |
| `DB_PASS` | MySQL password | `root` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Built-in default |
| `JWT_EXPIRATION` | Token expiry ms | `86400000` (24h) |
| `PORT` | Server port | `8080` |

### Frontend (`frontend/.env.example`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (empty = same origin via proxy) |

---

## 🗄️ Database

The database schema is **auto-created** by Hibernate on first run (`ddl-auto=update`).

Seed data is loaded from `backend/src/main/resources/data.sql`:
- **1 admin user**: `admin` / `admin123`
- **~80 items**: Rice, Flour, Lentils, Oil, Sugar, Salt, Grains

To reset seed data, run `data.sql` manually against your MySQL database.

---

## 📡 REST API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password → JWT |
| POST | `/api/auth/logout` | Logout (client-side token removal) |
| GET | `/api/auth/validate` | Validate current JWT |

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List all items (paginated) |
| GET | `/api/items/search?q=HMT` | Search items by name |
| GET | `/api/items/categories` | List all categories |
| GET | `/api/items/{id}` | Get single item |
| POST | `/api/items` | Create item |
| PUT | `/api/items/{id}` | Update item |
| DELETE | `/api/items/{id}` | Soft delete item |
| PATCH | `/api/items/{id}/restore` | Restore deleted item |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sales` | Record a sale |
| GET | `/api/sales` | List sales (date range, paginated) |
| GET | `/api/sales/today` | Today's sales |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily?date=2024-01-15` | Daily report |
| GET | `/api/reports/weekly` | This week's report |
| GET | `/api/reports/monthly` | This month's report |
| GET | `/api/reports/custom?start=...&end=...` | Custom date range |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Today's KPIs + recent sales |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Add customer |
| PUT | `/api/customers/{id}` | Update customer |
| DELETE | `/api/customers/{id}` | Delete customer |

---

## 🌐 Deployment

### Deploy Backend on Render/Railway

1. Push `backend/` to a GitHub repository
2. Create a new **Web Service** on Render/Railway
3. Build command: `mvn clean package -DskipTests`
4. Start command: `java -jar target/shop-manager-1.0.0.jar`
5. Add environment variables: `DB_URL`, `DB_USER`, `DB_PASS`, `JWT_SECRET`

### Deploy Frontend on Vercel/Netlify

1. Push `frontend/` to GitHub
2. Set build command: `npm run build`
3. Set publish dir: `dist`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com`

### Deploy with Docker Compose on VPS

```bash
# On your VPS
git clone <your-repo>
cd shop_accounts
cp .env.example .env
nano .env  # Set strong passwords

docker-compose up -d --build
```

---

## 🔑 Default Login

> **Username:** `admin`  
> **Password:** `admin123`

> ⚠️ **Change the default password immediately after first login** via Settings → Change Password.

---

## 📁 Project Structure

```
shop_accounts/
├── backend/                    # Spring Boot
│   ├── src/main/java/com/shopmanager/
│   │   ├── config/             # Security, CORS
│   │   ├── controller/         # REST controllers
│   │   ├── dto/                # Data transfer objects
│   │   ├── entity/             # JPA entities
│   │   ├── exception/          # Global error handling
│   │   ├── repository/         # Spring Data repos
│   │   ├── security/           # JWT filter & utils
│   │   └── service/            # Business logic
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── data.sql            # Seed data
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                   # React/Vite
│   ├── src/
│   │   ├── api/                # Axios API modules
│   │   ├── components/         # Layout, etc.
│   │   ├── context/            # Auth & theme
│   │   ├── pages/              # All page components
│   │   └── routes/             # Protected route
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🛡️ Security Notes

- Passwords hashed with **BCrypt** (strength 10)
- JWT tokens expire after **24 hours** (configurable)
- All API endpoints except `/api/auth/**` require a valid JWT
- CORS configured to allow all origins in dev (restrict in production)
- SQL injection protected via JPA parameterized queries
- Input validation on all endpoints via Bean Validation

---

## 📞 Support

Built with ❤️ for rice & grains shop management. For issues, check the backend logs:

```bash
# Docker logs
docker logs shopmanager-backend
docker logs shopmanager-frontend
docker logs shopdb-mysql
```
