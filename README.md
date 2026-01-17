# Best Legacy Divine School Website

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://best-legacy-school.vercel.app)

A comprehensive school management website built with Django (backend) and React (frontend).

## Features

- 🏫 Public website with Home, About, Admissions, Gallery, and Contact pages
- 📧 Automated email notifications for admission applications
- 🆔 Automatic student ID generation
- 👨‍💼 Admin Dashboard for managing inquiries and applications
- 📊 Academics Portal for teachers to upload results and students to view them
- 📱 Fully responsive design

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- React Router
- Axios

**Backend:**
- Django 5.1
- Django REST Framework
- PostgreSQL (production) / SQLite (development)
- CORS Headers

## Local Development

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

## Deployment

See `DEPLOYMENT_QUICKSTART.md` for detailed deployment instructions.

**Quick Deploy:**
- Backend: Render.com
- Frontend: Vercel.com
- Both offer free tiers!

## Environment Variables

Create `.env` files based on `.env.example` templates.

## License

© 2026 Best Legacy Divine School. All rights reserved.
