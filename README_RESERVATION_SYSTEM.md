# FireFork Reservation & POS System

A complete restaurant management solution with online booking and point-of-sale functionality.

## Features

### Customer Booking System
- Real-time table availability checking
- Automatic table allocation (smallest-fit algorithm)
- Date/time slot selection (2:00 PM - 8:00 PM)
- Party size support (1-20 guests)
- Dietary preferences and special requests
- Mobile-responsive design

### POS System
- PIN-protected staff access (default: 1234)
- Date/time-based table management
- Visual table status (available/occupied)
- Real-time reservation details
- Menu integration with categories
- Shopping cart with quantity controls
- Live bill calculation (subtotal + 5% tax)
- Bill generation with thank you page
- Multi-table management

## System Architecture

### Frontend
- Vanilla JavaScript (no frameworks)
- Bootstrap 5.3.2 for responsive layout
- Custom CSS with FireFork branding
- Real-time API integration

### Backend
- Node.js HTTP server (no Express - minimal dependencies)
- RESTful API architecture
- PostgreSQL database with connection pooling
- Transaction-based order management

### Database
- PostgreSQL 14+
- 12 tables (configurable capacity)
- Reservation lifecycle tracking
- Order and billing management

## Quick Start

### 1. Database Setup
```bash
createdb firefork_db
psql -d firefork_db -f database/schema.sql
psql -d firefork_db -f database/schema_reservations.sql
psql -d firefork_db -f database/seed_tables.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm start
```

### 3. Frontend Setup
```bash
# Using Python
python -m http.server 5500

# Or use Live Server in VS Code
```

### 4. Access
- Booking: http://localhost:5500/form.html
- POS: http://localhost:5500/pos.html (PIN: 1234)

## Table Configuration

Default setup (12 tables):
- T01-T05: 2-person tables (5 tables)
- T06-T09: 4-person tables (4 tables)
- T10-T11: 6-person tables (2 tables)
- T12: 8-person table (1 table)

## Business Logic

### Reservation Rules
- Booking window: 2:00 PM - 8:00 PM
- Reservation duration: 2 hours
- Multiple reservations can overlap on same table (turnover optimization)
- Smallest suitable table auto-allocated

### Table Status Lifecycle
1. **Available** - No reservation for selected date/time
2. **Confirmed** - Reservation created, time slot not started
3. **Occupied** - Reservation time slot active, can take orders
4. **Completed** - Bill generated, table freed

### Order Workflow
1. Staff selects date/time and views tables
2. Clicks occupied table to view reservation
3. Adds menu items to cart
4. System calculates subtotal + 5% tax
5. Generates bill → Thank you page → Returns to POS

## API Reference

### Availability Check
```
GET /api/availability/check?date=2024-01-15&time=18:00&partySize=4
```

### Create Reservation
```
POST /api/reservations
Body: {
  name, phone, bookingDate, bookingTime, partySize,
  dietaryPreference?, specialRequests?
}
```

### Get Table Status
```
GET /api/pos/tables?date=2024-01-15&time=18:00
```

### Create/Update Order
```
POST /api/pos/orders
Body: {
  reservationId,
  items: [{ menuItemId, quantity }]
}
```

## Configuration

### Environment Variables (.env)
```
PORT=3000
DB_HOST=localhost
DB_NAME=firefork_db
DB_USER=postgres
DB_PASSWORD=your_password
DEFAULT_POS_PIN=1234
TAX_RATE=0.05
RESTAURANT_OPEN_TIME=14:00
RESTAURANT_CLOSE_TIME=22:00
RESERVATION_DURATION_MINUTES=120
```

## Design Philosophy

### Intentional Minimalism
- Clean, purpose-driven UI
- FireFork brand colors (Orange #FF3500, Dark #35161B)
- Caesar Dressing font for headers
- Rowan/Inter for body text
- Micro-interactions and smooth transitions

### No Overengineering
- Simple, functional, working
- Minimal dependencies
- Clear separation of concerns
- Easy to understand and maintain

## File Structure

```
├── form.html                    # Customer booking page
├── pos.html                     # Staff POS system
├── bill.html                    # Bill generation page
├── scripts/
│   ├── form.js                  # Booking form logic
│   └── pos.js                   # POS system logic
├── styles/
│   ├── common.css               # Shared styles
│   ├── form.css                 # Booking form styles
│   └── pos.css                  # POS system styles
├── backend/
│   ├── server.js                # HTTP server
│   ├── config.js                # Configuration
│   ├── db.js                    # Database connection
│   ├── routes/
│   │   ├── reservations.js      # Reservation endpoints
│   │   ├── orders.js            # Order endpoints
│   │   └── menu.js              # Menu endpoints
│   └── package.json
└── database/
    ├── schema.sql               # Base schema (menu)
    ├── schema_reservations.sql  # Reservation schema
    └── seed_tables.sql          # Table configuration
```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify database exists: `psql -l | grep firefork`
- Check .env credentials

### CORS errors
- Ensure backend runs on port 3000
- Verify FRONTEND_URL in .env matches your frontend URL

### Tables not showing
- Run all schema files in order
- Check seed_tables.sql was executed
- Verify date/time filters in POS

### PIN not working
- Default is 1234
- Check DEFAULT_POS_PIN in .env
- Clear browser cache

## Future Enhancements

- Walk-in customer support
- Table reservation editing/cancellation
- Kitchen display system
- Payment method tracking
- Reporting and analytics
- Email/SMS confirmations
- Multi-location support

## License

Proprietary - FireFork Restaurant

## Support

For setup assistance, see SETUP_GUIDE.md
