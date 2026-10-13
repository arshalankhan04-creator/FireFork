# FireFork Reservation & POS System - Setup Guide

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 14+
- A static file server (Live Server, Python http.server, etc.)

---

## Database Setup

### 1. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE firefork_db;

# Exit psql
\q
```

### 2. Run Schema Files

```bash
# Run base schema (menu tables)
psql -U postgres -d firefork_db -f database/schema.sql

# Run reservation schema
psql -U postgres -d firefork_db -f database/schema_reservations.sql

# Seed restaurant tables
psql -U postgres -d firefork_db -f database/seed_tables.sql

# Seed menu items (if exists)
psql -U postgres -d firefork_db -f database/seed_menu.sql
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
# Update DB_PASSWORD with your PostgreSQL password
```

### 3. Start Backend Server

```bash
npm start
```

Server will run on `http://localhost:3000`

---

## Frontend Setup

### 1. Start Static File Server

Using Live Server (VS Code extension):
- Right-click `index.html` → "Open with Live Server"

Using Python:
```bash
python -m http.server 5500
```

Using Node.js http-server:
```bash
npx http-server -p 5500
```

### 2. Access Application

- Customer Booking: `http://localhost:5500/form.html`
- POS System: `http://localhost:5500/pos.html`
- Homepage: `http://localhost:5500/index.html`

---

## System Configuration

### Table Configuration

Default setup (12 tables):
- 5 tables for 2 people (T01-T05)
- 4 tables for 4 people (T06-T09)
- 2 tables for 6 people (T10-T11)
- 1 table for 8 people (T12)

To modify, edit `database/seed_tables.sql` and re-run.

### POS PIN

Default PIN: `1234`

To change, update `DEFAULT_POS_PIN` in `backend/.env`

### Operating Hours

- Booking: 2:00 PM - 8:00 PM
- Restaurant closes: 10:00 PM
- Reservation duration: 2 hours

To modify, update in `backend/.env`:
```
RESTAURANT_OPEN_TIME=14:00
RESTAURANT_CLOSE_TIME=22:00
RESERVATION_DURATION_MINUTES=120
```

### Tax Rate

Default: 5%

To change, update `TAX_RATE` in `backend/.env` (e.g., `0.08` for 8%)

---

## Usage Workflow

### Customer Booking Flow

1. Customer visits `form.html`
2. Fills in details (name, phone, date, time, party size)
3. System checks availability in real-time
4. On submit, smallest suitable table is auto-allocated
5. Confirmation message displayed

### POS System Flow

1. Staff opens `pos.html`
2. Enters PIN (default: 1234)
3. Selects date and time slot
4. Views all tables with reservation status
5. Clicks occupied table to view details
6. Adds menu items to order
7. Clicks "Generate Bill"
8. Bill page displays with thank you message
9. Returns to POS to manage other tables

---

## API Endpoints

### Customer Endpoints

- `GET /api/availability/check?date=YYYY-MM-DD&time=HH:MM&partySize=N` - Check availability
- `POST /api/reservations` - Create reservation

### POS Endpoints

- `GET /api/pos/tables?date=YYYY-MM-DD&time=HH:MM` - Get table status
- `GET /api/pos/reservations?date=YYYY-MM-DD` - Get reservations
- `POST /api/pos/orders` - Create/update order
- `POST /api/pos/orders/:id/finalize` - Finalize order
- `GET /api/pos/bill/:orderId` - Get bill details

### Menu Endpoints

- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get categories

---

## Troubleshooting

### Database Connection Error

- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `backend/.env`
- Ensure database exists: `psql -U postgres -l`

### CORS Error

- Ensure backend is running on port 3000
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check browser console for specific CORS errors

### Tables Not Loading

- Verify database schema is created
- Check `seed_tables.sql` was executed
- Inspect browser console and backend logs

### PIN Not Working

- Default PIN is `1234`
- Check `DEFAULT_POS_PIN` in `backend/.env`
- Clear browser cache and reload

---

## Production Deployment

### Security Considerations

1. Change default PIN
2. Use environment-specific `.env` files
3. Enable HTTPS
4. Implement rate limiting
5. Add authentication for API endpoints
6. Use connection pooling for database

### Environment Variables

Set these in production:
```
NODE_ENV=production
PORT=3000
DB_HOST=your_db_host
DB_PASSWORD=strong_password
FRONTEND_URL=https://yourdomain.com
```

---

## Support

For issues or questions, check:
- Database logs: `tail -f /var/log/postgresql/postgresql-14-main.log`
- Backend logs: Check terminal where `npm start` is running
- Browser console: F12 → Console tab
