# Dentist Management System

A comprehensive full-stack web application for managing a dental practice. This system helps dentists organize patient information, appointments, treatments, inventory, invoices, and X-ray records efficiently.

**Link:** [dentnotion.vercel.app](https://dentnotion.vercel.app)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Running the Application](#running-the-application)

## Features

- **Patient Management**: Store and manage patient information, medical history, and contact details
- **Appointment Scheduling**: Schedule, track, and manage patient appointments
- **Treatment Records**: Document and track patient treatments and procedures
- **Inventory Management**: Monitor dental supplies and equipment inventory
- **X-Ray Management**: Store and organize patient X-ray records
- **Invoice System**: Generate and manage patient invoices and billing
- **User Authentication**: Secure JWT-based authentication
- **Responsive UI**: Mobile-friendly design with Progressive Web App (PWA) support
- **Real-time Updates**: Supabase integration for real-time data synchronization

## Tech Stack

### Backend
- **Framework**: Django 5.2.8
- **API**: Django REST Framework 3.16.1
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL (via Supabase)
- **CORS**: django-cors-headers 4.9.0
- **Server**: Gunicorn 21.2.0
- **Environment**: Python 3.x

### Frontend
- **Framework**: Next.js 16.1.0
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS 4
- **Backend Client**: Supabase JS 2.89.0
- **PWA**: next-pwa 5.6.0
- **Linting**: ESLint

## Project Structure

```
Dentist-Management-System/
├── backend/                          # Django REST API
│   ├── manage.py                     # Django management script
│   ├── requirements.txt              # Python dependencies
│   ├── Procfile                      # Deployment configuration
│   ├── app/                          # Main Django app
│   │   ├── models.py                 # Database models
│   │   ├── serializers.py            # DRF serializers
│   │   ├── views/                    # ViewSets for each resource
│   │   │   ├── appointments_viewset.py
│   │   │   ├── patients_viewset.py
│   │   │   ├── treatments_viewset.py
│   │   │   ├── inventory_viewset.py
│   │   │   ├── invoices_viewset.py
│   │   │   ├── xrays_viewset.py
│   │   │   └── auth_viewset.py
│   │   ├── supabase_service/         # Supabase integration
│   │   │   ├── base.py               # Base Supabase client
│   │   │   ├── auth.py               # Authentication logic
│   │   │   ├── patients.py
│   │   │   ├── appointments.py
│   │   │   ├── treatments.py
│   │   │   ├── inventory.py
│   │   │   ├── invoices.py
│   │   │   └── xrays.py
│   │   ├── migrations/               
│   │   ├── auth_utils.py             # Authentication utilities
│   │   ├── views_utils.py            # View helper functions
│   │   ├── urls.py                   # App URL routing
│   │   └── admin.py                  # Django admin config
│   └── app_backend/                  # Django project settings
│       ├── settings.py               # Project settings
│       ├── urls.py                   # Project URL routing
│       ├── wsgi.py                   # WSGI configuration
│       ├── asgi.py                   # ASGI configuration
│       └── supabase_utils.py         # Supabase utilities
│
└── frontend/                         # Next.js Frontend
    ├── package.json                  # Node dependencies
    ├── next.config.mjs               # Next.js configuration
    ├── jsconfig.json                 # JavaScript config
    ├── tailwind.config.mjs            # Tailwind CSS config
    ├── postcss.config.mjs            # PostCSS config
    ├── app/                          # Next.js app directory
    │   ├── layout.js                 # Root layout
    │   ├── page.js                   # Home page
    │   ├── globals.css               # Global styles
    │   ├── auth/                     # Authentication pages
    │   │   ├── login/
    │   │   ├── signup/
    │   │   └── forgot-password/
    │   ├── dashboard/                # Dashboard page
    │   ├── patients/                 # Patient management
    │   ├── appointments/             # Appointment management
    │   ├── treatments/               # Treatment records
    │   ├── inventory/                # Inventory management
    │   ├── invoices/                 # Invoice management
    │   ├── xrays/                    # X-ray records
    │   ├── profile/                  # User profile
    │   ├── settings/                 # Settings page
    │   ├── components/               # Reusable components
    │   │   ├── AuthGuard.js          # Auth protection wrapper
    │   │   ├── ProtectedRoute.js     # Protected routes
    │   │   ├── Navbar.js
    │   │   ├── Sidebar.js
    │   │   ├── Modal.js
    │   │   ├── Table.js
    │   │   ├── Button.js
    │   │   ├── Input.js
    │   │   ├── Card.js
    │   │   └── SearchableSelect.js
    │   ├── context/                  # React context
    │   │   └── AuthContext.js        # Authentication context
    │   └── lib/                      # Utility functions
    │       ├── api.js                # API client
    │       ├── supabase.js           # Supabase client
    │       ├── utils.js              # Helper utilities
    │       └── api/                  # API endpoints
    │           ├── appointments.js
    │           ├── patients.js
    │           ├── treatments.js
    │           ├── inventory.js
    │           ├── invoices.js
    │           ├── xrays.js
    │           └── client.js
    └── public/                       # Static assets
        └── manifest.json             # PWA manifest
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm or yarn** - Comes with Node.js
- **Supabase Account** - [Sign up](https://supabase.com/)

## Installation & Setup

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create a Python virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

   If you encounter issues with Supabase on Windows, uncomment the additional dependencies in `requirements.txt` and reinstall.

5. **Create a `.env` file** in the `backend/` directory:
   ```env
   # Django Settings
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1

   # Supabase Configuration
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

3. **Create a `.env.local` file** in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

## Running the Application

### Development Mode

1. **Start the Django backend** (in the `backend/` directory with venv activated):
   ```bash
   python manage.py runserver
   ```
   The backend will run at `http://localhost:8000`

2. **Start the Next.js frontend** (in a new terminal, in the `frontend/` directory):
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:3000`

3. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Django Admin: `http://localhost:8000/admin`
   - API: `http://localhost:8000/api`

### Production Mode

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   npm start
   ```

2. **Run the backend with Gunicorn**:
   ```bash
   cd backend
   gunicorn app_backend.wsgi:application --bind 0.0.0.0:8000
   ```
