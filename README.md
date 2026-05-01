# Recipe Nest (Frontend + Backend)

Single README for both folders in this repository.

Recipe Nest is a full-stack recipe platform with three access areas:
- User portal
- Chif/Admin portal

## Repository Structure (Detailed)

```text
Recipe_Nest/
├─ Recipe_Nest_And_Cheef_Portal/              # Frontend (React + Vite)
│  ├─ src/
│  │  ├─ assets/                              # Logos/static assets
│  │  ├─ components/                          # Shared UI + auth + user components
│  │  ├─ context/                             # React context providers
│  │  ├─ image/                               # Additional image resources
│  │  ├─ pages/                               # Admin pages
│  │  ├─ routes/                              # Route definitions (AppRoutes)
│  │  ├─ services/                            # API helper/service functions
│  │  ├─ styles/                              # All CSS files
│  │  ├─ App.jsx                              # App shell + auth refresh
│  │  ├─ App.css                              # Global style imports
│  │  └─ main.jsx                             # React entry point
│  ├─ public/
│  ├─ server/                                 # Local helper server (if used)
│  ├─ package.json                            # Frontend scripts/dependencies
│  └─ vite.config.*                           # Vite config
├─ Recipe_Nest_and_Chief_Portal_Backend/      # Backend (Node.js + Express + MongoDB)
│  ├─ src/
│  │  ├─ config/                              # Env and config
│  │  ├─ controllers/                         # Route controllers
│  │  ├─ data/                                # Seed/demo data
│  │  ├─ models/                              # Mongoose models
│  │  ├─ routes/                              # API route definitions
│  │  ├─ services/                            # Business logic layer
│  │  ├─ middleware/                          # Auth/error middleware
│  │  ├─ app.js                               # Express app setup
│  │  └─ server.js                            # Server bootstrap
│  ├─ uploads/                                # Uploaded files
│  ├─ scripts/                                # Seed scripts
│  └─ package.json                            # Backend scripts/dependencies
├─ .gitignore
└─ README.md
```

## Who Can Perform What

- **Chif/Admin Portal**
  - Manage dashboard, recipes, users, comments, analytics, and settings
  - Admin can delete user IDs

- **Chief**
  - Can access admin/chif dashboard and manage own scope (based on role checks)

- **User**
  - Browse recipes, save recipes, profile actions, and normal user features

## Detailed Role Tasks

### Admin / Chif Portal

- Access admin workspace (`/admin`)
- Manage recipe library and recipe status (publish/draft/archive)
- Add and update recipes from admin add-recipe page
- Moderate comments
- View analytics and settings
- Can view users and perform management actions

### Chief

- Can access admin/chif area based on role checks
- Can manage recipes in allowed scope
- Can use dashboard and related tools available to chief role

### User

- Register and login
- Browse recipe pages (breakfast/lunch/dinner/dessert and detail pages)
- Save recipes
- Manage profile
- Can view published/shared recipes in user-facing portal

## Recipe Flow (Add + View)

### How to Add Recipe

1. Login with role that has recipe management permission (Admin/Chief).
2. Open recipe add page:
   - `/add-recipe` (role-based)
   - `/admin/add-recipe` (admin portal)
3. Fill recipe details and submit.
4. Recipe appears in management list and is visible according to status/portal rules.

### Who Can View Recipes

- **User:** Can view recipes from user portal pages and recipe detail pages.
- **Admin/Chief:** Can view recipes in both management and portal contexts.

## Features by Role

### Admin/Chif Features

- Dashboard overview
- Recipe management (list, edit, status, delete where permitted)
- User management view
- Comment moderation
- Comment rating management and review
- Analytics and settings
- View which user/chef added each recipe item

### Chief Features

- Chif dashboard access
- Recipe operations in permitted scope
- Access to portal tools mapped to chief role
- View chef details and profile information
- View which items were added by chef accounts

### User Features

- Authentication (login/signup/forgot/reset password)
- Browse and filter recipes
- View recipe details
- Save/favorite recipes
- Profile management
- Add comment ratings on recipes

### Other Features

- Role-based access control for Admin, Chef, and User portals
- Recipe status flow (publish/draft/archive)
- Profile avatar upload and update support
- Dashboard analytics for admin-level monitoring

## Setup and Run

### 1) Frontend

```bash
cd Recipe_Nest_And_Cheef_Portal
npm install
npm run dev
```

Frontend default dev URL is usually `http://localhost:5173`.

### 2) Backend

```bash
cd Recipe_Nest_and_Chief_Portal_Backend
npm install
npm run dev
```

Backend runs with `.env` values (default `PORT=8080` from config if not provided).

## Environment Reference

### Frontend `.env`

```env
VITE_API_URL=http://localhost:3000
```

### Backend `.env`

```env
PORT=8080
NODE_ENV=development
DB_URI=mongodb://localhost:27017/recipe_nest_and_chief_portal
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

## Tech Stack

### Frontend

- React 19
- Vite 7
- React Router DOM
- React Toastify
- Recharts
- Axios
- CSS modules/files

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Multer (uploads)
- CORS, Dotenv, Helmet

## API Endpoints

### Base

- `GET /` - Health check

### Users

- `POST /api/users/login`
- `GET /api/users`
- `GET /api/users/:id`
- `DELETE /api/users/:id`
- `PATCH /api/users/:id/status`

### Recipes

- `GET /api/recipes`
- `DELETE /api/recipes/:id`
- `PUT /api/recipes/:id`
- `PATCH /api/recipes/:id/feature`
- `PATCH /api/recipes/:id/status`

### Comments

- `GET /api/comments`
- `DELETE /api/comments/:id/admin`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/analytics`
- `GET /api/admin/recipes`

## Made By

- **Nabin Dhakal**
- Software Engineer Student
- Website: `nabindhakal28.com.np`
- Email: `info@nabindhakal28.com.np`
- Alternate Email: `cpnnabingovnp@gmail.com`
