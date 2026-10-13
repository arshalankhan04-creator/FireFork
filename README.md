# FireFork Restaurant Website

A modern restaurant website showcasing menu, chef profiles, and reservation form.

## Structure

### Frontend Pages
- `index.html` - Homepage with hero, menu preview, chefs, testimonials
- `menu.html` - Full menu with veg/non-veg toggle
- `story.html` - Chef profiles and brigade
- `form.html` - Reservation form (frontend-only validation)
- `experience.html` - Additional content page

### Backend (Minimal)
- `backend/server.js` - Node.js API server
- `backend/routes/menu.js` - Menu data endpoint
- `database/schema.sql` - Database schema (categories, menu_items)
- `database/seed_menu.sql` - Menu data seeding

### Assets
- `assets/fonts/` - Rowan font family
- `assets/images/` - Food images, chef photos, backgrounds

## Features

- Veg/Non-veg menu toggle with smooth transitions
- Responsive design with Bootstrap 5
- Custom typography (Caesar Dressing, Rowan)
- Interactive menu with hover effects
- Reservation form with date/time validation
- Reusable navbar and footer components

## Setup

### Database (Optional)
```bash
# Create PostgreSQL database
createdb firefork_db

# Run schema
psql -d firefork_db -f database/schema.sql

# Seed menu data
psql -d firefork_db -f database/seed_menu.sql
```

### Backend (Optional)
```bash
cd backend
npm install
npm start
```

### Frontend
Open `index.html` in a browser or use a local server:
```bash
# Python
python -m http.server 5500

# Node
npx http-server -p 5500
```

## Tech Stack

- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5.3.2
- Bootstrap Icons
- Google Fonts (Caesar Dressing, Inter, Outfit)
- Node.js + PostgreSQL (backend)

## Notes

The reservation form currently performs frontend-only validation. Backend submission logic has been removed for future rebuild.
