# FireFork Reservation System - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Database (2 minutes)
```bash
# Create database
createdb firefork_db

# Run schemas
psql -d firefork_db -f database/schema.sql
psql -d firefork_db -f database/schema_reservations.sql
psql -d firefork_db -f database/seed_tables.sql
psql -d firefork_db -f database/seed_menu.sql
```

### Step 2: Backend (1 minute)
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: Set DB_PASSWORD
npm start
```

### Step 3: Frontend (1 minute)
```bash
# In new terminal, from project root
python -m http.server 5500
```

### Step 4: Test (1 minute)
1. Open http://localhost:5500/form.html
2. Make a test booking
3. Open http://localhost:5500/pos.html
4. Enter PIN: 1234
5. Select today's date
6. See your reservation!

---

## 📋 What You Get

### Customer Booking (form.html)
- Real-time availability checking
- Auto table allocation
- 2 PM - 8 PM booking window
- Mobile responsive

### POS System (pos.html)
- PIN: 1234
- View all tables by date/time
- Add menu items to orders
- Generate bills with 5% tax
- Multi-table management

### Bill Page (bill.html)
- Professional receipt
- Thank you message
- Return to POS

---

## 🎯 Key Features

✅ 12 tables (2/4/6/8 person capacity)
✅ 2-hour reservation slots
✅ Smallest-fit allocation
✅ Real-time availability
✅ Order management
✅ Bill generation
✅ FireFork branding

---

## 🔧 Configuration

### Change PIN
Edit `backend/.env`:
```
DEFAULT_POS_PIN=your_pin
```

### Change Tax Rate
Edit `backend/.env`:
```
TAX_RATE=0.08  # 8%
```

### Add Tables
```sql
INSERT INTO restaurant_tables (table_code, capacity)
VALUES ('T13', 4);
```

---

## 📚 Full Documentation

- **Setup Guide**: `SETUP_GUIDE.md`
- **System README**: `README_RESERVATION_SYSTEM.md`
- **API Reference**: See README

---

## ❓ Troubleshooting

**Backend won't start**
- Check PostgreSQL: `pg_isready`
- Verify .env credentials

**CORS errors**
- Backend must run on port 3000
- Frontend on port 5500

**No tables showing**
- Run all schema files
- Check seed_tables.sql executed

---

## 🎉 You're Ready!

The system is production-ready with:
- Clean, minimal code
- FireFork design system
- No overengineering
- Simple, functional, working

**Happy serving! 🔥🍴**
