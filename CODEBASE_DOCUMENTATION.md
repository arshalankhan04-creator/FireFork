# FireFork Restaurant System - Complete Codebase Documentation

> **Author's Note:** This documentation is written for junior developers who understand the tech stack but need a deep dive into how everything connects. Think of this as your onboarding guide.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Database Layer](#database-layer)
5. [Backend API](#backend-api)
6. [Frontend Pages](#frontend-pages)
7. [JavaScript Logic](#javascript-logic)
8. [Data Flow & Communication](#data-flow--communication)
9. [Business Logic Deep Dive](#business-logic-deep-dive)
10. [Key Features Implementation](#key-features-implementation)
11. [Development Workflow](#development-workflow)

---

## System Overview

FireFork is a **full-stack restaurant management system** with three main user-facing components:

1. **Customer Website** - Browse menu, read about chefs, make reservations
2. **Reservation System** - Real-time table booking with availability checking
3. **POS System** - Staff interface for managing orders and generating bills

### What Problem Does It Solve?

- **For Customers:** Easy online table reservations with instant availability feedback
- **For Staff:** Unified system to view reservations, take orders, and generate bills
- **For Restaurant:** Automated table allocation using "smallest-fit" algorithm to maximize capacity

---

## Architecture & Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **Bootstrap 5.3.2** - Grid system and utilities only
- **Bootstrap Icons** - Icon library

### Backend
- **Node.js** - Runtime environment
- **HTTP Module** - Native Node.js server (no Express)
- **PostgreSQL** - Primary database
- **SQLite** - Fallback database (via better-sqlite3)

### Key Design Decisions

**Why no Express?** 
- Minimal dependencies, full control over routing
- Educational value - understand HTTP fundamentals
- Lightweight footprint

**Why dual database support?**
- PostgreSQL for production (robust, ACID compliant)
- SQLite for quick local development (no setup required)
- Automatic fallback in `db.js`

---

## Project Structure

```
firefork/
├── assets/                    # Static assets
│   ├── fonts/                # Rowan font family
│   └── images/               # Food photos, chef images, icons
│       ├── chefs/
│       ├── food/
│       └── icons/
│
├── backend/                   # Node.js API server
│   ├── routes/               # API route handlers
│   │   ├── menu.js          # Menu endpoints
│   │   ├── reservations.js  # Booking & availability
│   │   └── orders.js        # POS order management
│   ├── utils/               # Helper functions
│   ├── config.js            # Environment configuration
│   ├── db.js                # PostgreSQL connection
│   ├── db-sqlite.js         # SQLite fallback
│   └── server.js            # HTTP server entry point
│
├── components/               # Reusable HTML components
│   ├── navbar.html          # Navigation bar
│   └── footer.html          # Footer
│
├── database/                 # SQL schemas & seeds
│   ├── schema.sql           # Menu tables
│   ├── schema_reservations.sql  # Booking & POS tables
│   ├── seed_menu.sql        # Menu data
│   └── seed_tables.sql      # Restaurant tables (T01-T12)
│
├── scripts/                  # Frontend JavaScript
│   ├── common.js            # Veg/non-veg toggle, shared logic
│   ├── components.js        # Load navbar/footer dynamically
│   ├── form.js              # Reservation form logic
│   ├── menu.js              # Menu page interactions
│   ├── pos.js               # POS system logic
│   ├── home.js              # Homepage animations
│   ├── story.js             # Chef profiles page
│   └── experience.js        # Experience page
│
├── styles/                   # CSS files
│   ├── common.css           # Global styles, variables
│   ├── home.css             # Homepage styles
│   ├── menu.css             # Menu page styles
│   ├── form.css             # Reservation form styles
│   ├── pos.css              # POS system styles
│   └── ...
│
├── index.html               # Homepage
├── menu.html                # Full menu page
├── form.html                # Reservation form
├── pos.html                 # POS system (staff only)
├── bill.html                # Bill receipt page
├── story.html               # Chef profiles
└── experience.html          # Additional content
```

---

## Database Layer

### Schema Design Philosophy

The database uses **normalized relational design** with clear separation of concerns:

1. **Menu System** - Categories and items
2. **Reservation System** - Customers, tables, bookings
3. **Order System** - Orders and line items

### Tables Breakdown

#### 1. Menu Tables (`schema.sql`)

**categories**
```sql
id              BIGSERIAL PRIMARY KEY
name            VARCHAR(60) UNIQUE      -- "Starters", "Mains", etc.
display_order   INT                     -- Sort order for UI
```

**menu_items**
```sql
id              BIGSERIAL PRIMARY KEY
category_id     BIGINT → categories(id)
name            VARCHAR(140)            -- "Bone Marrow Brulée"
description     TEXT                    -- Item description
price           DECIMAL(10,2)           -- Price in INR
is_veg          BOOLEAN                 -- Vegetarian flag
is_available    BOOLEAN                 -- In stock?
image_url       VARCHAR(500)            -- Image path
created_at      TIMESTAMPTZ
```

**Business Logic:**
- `is_veg` drives the veg/non-veg toggle feature
- `is_available` allows hiding sold-out items without deletion
- Prices stored as DECIMAL to avoid floating-point errors

#### 2. Reservation Tables (`schema_reservations.sql`)

**restaurant_tables**
```sql
id          BIGSERIAL PRIMARY KEY
table_code  VARCHAR(10) UNIQUE      -- "T01", "T02", etc.
capacity    INT                     -- 2, 4, 6, or 8 guests
```

**Seeded Data (seed_tables.sql):**
- 5 tables × 2 capacity (T01-T05)
- 4 tables × 4 capacity (T06-T09)
- 2 tables × 6 capacity (T10-T11)
- 1 table × 8 capacity (T12)

**customers**
```sql
id          BIGSERIAL PRIMARY KEY
name        VARCHAR(120)
phone       VARCHAR(15) UNIQUE      -- Primary identifier
created_at  TIMESTAMPTZ
```

**Why phone as unique?**
- Prevents duplicate customer records
- Used for "returning customer" detection
- Simpler than email validation

**reservations**
```sql
id                  BIGSERIAL PRIMARY KEY
customer_id         BIGINT → customers(id)
table_id            BIGINT → restaurant_tables(id)
booking_date        DATE
booking_time        TIME                    -- 14:00 to 20:00 only
duration_minutes    INT DEFAULT 120         -- 2-hour slots
party_size          INT
status              ENUM('confirmed', 'occupied', 'completed', 'cancelled')
dietary_preference  VARCHAR(40)
special_requests    TEXT
created_at          TIMESTAMPTZ

CONSTRAINT: booking_time >= '14:00' AND booking_time <= '20:00'
```

**Status Flow:**
1. `confirmed` - Reservation created
2. `occupied` - Customer arrived, order started
3. `completed` - Bill paid, table cleared
4. `cancelled` - Reservation cancelled

**orders**
```sql
id              BIGSERIAL PRIMARY KEY
reservation_id  BIGINT → reservations(id) UNIQUE
table_id        BIGINT → restaurant_tables(id)
order_date      DATE
total_amount    DECIMAL(10,2)           -- Sum of items
tax_amount      DECIMAL(10,2)           -- 5% tax
grand_total     DECIMAL(10,2)           -- total + tax
status          ENUM('active', 'finalized', 'cancelled')
finalized_at    TIMESTAMPTZ
```

**Key Constraint:** `UNIQUE(reservation_id)` - One order per reservation

**order_items**
```sql
id              BIGSERIAL PRIMARY KEY
order_id        BIGINT → orders(id) ON DELETE CASCADE
menu_item_id    BIGINT → menu_items(id)
quantity        INT
unit_price      DECIMAL(10,2)           -- Price at time of order
subtotal        DECIMAL(10,2)           -- quantity × unit_price
```

**Why store unit_price?**
- Historical accuracy - if menu prices change, old orders remain correct
- Audit trail for accounting

### Indexes for Performance

```sql
-- Reservation lookups by date/time
CREATE INDEX idx_reservations_date_time ON reservations(booking_date, booking_time);

-- Table availability checks
CREATE INDEX idx_reservations_table ON reservations(table_id, booking_date);

-- Order lookups
CREATE INDEX idx_orders_reservation ON orders(reservation_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

## Backend API

### Server Architecture (`server.js`)

The backend uses **pure Node.js HTTP module** with manual routing:

```javascript
http.createServer((req, res) => {
  route(req, res).catch(err => sendError(res, 500, err.message));
});
```

**Why manual routing?**
- Educational - understand HTTP fundamentals
- No middleware bloat
- Full control over request/response cycle

### CORS Handling

```javascript
function setCors(req, res) {
  const origin = req.headers.origin;
  const allowList = [config.cors.frontendUrl, ...config.cors.allowedOrigins];
  
  if (allowList.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    // Auto-allow local development
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
}
```

**Smart CORS:**
- Whitelist configured origins
- Auto-allow localhost for development
- Vary header for caching safety

### API Endpoints

#### Menu Routes (`routes/menu.js`)

**GET /api/menu/categories**
- Returns all menu categories sorted by `display_order`
- Used by POS to build category tabs

**GET /api/menu**
- Query params: `?isVeg=true|false` (optional)
- Returns menu items filtered by vegetarian preference
- Joins with categories for display

**GET /api/menu/:id**
- Returns single menu item with category name
- Used for detailed views (future feature)

#### Reservation Routes (`routes/reservations.js`)

**GET /api/availability/check**
```
Query: ?date=2024-01-15&time=18:00&partySize=4
Response: {
  available: true,
  table: { code: "T06", capacity: 4 },
  message: "Table T06 (capacity 4) available"
}
```

**Algorithm: Smallest-Fit Table Allocation**
```sql
SELECT t.id, t.table_code, t.capacity
FROM restaurant_tables t
WHERE t.capacity >= $partySize
  AND NOT EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.table_id = t.id
      AND r.booking_date = $date
      AND r.booking_time = $time
      AND r.status IN ('confirmed', 'occupied')
  )
ORDER BY t.capacity ASC, t.table_code ASC
LIMIT 1
```

**Why smallest-fit?**
- Maximizes table utilization
- Prevents "wasting" large tables on small parties
- Example: Party of 2 gets T01 (capacity 2), not T12 (capacity 8)

**POST /api/reservations**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "bookingDate": "2024-01-15",
  "bookingTime": "18:00",
  "partySize": 4,
  "dietaryPreference": "Vegetarian",
  "specialRequests": "Window seat please"
}
```

**Transaction Flow:**
1. BEGIN transaction
2. Find available table (smallest-fit)
3. Insert/update customer (ON CONFLICT phone)
4. Create reservation
5. COMMIT or ROLLBACK

**GET /api/pos/reservations**
```
Query: ?date=2024-01-15&time=18:00&status=confirmed
Response: Array of reservations with customer & table details
```

**GET /api/pos/tables**
```
Query: ?date=2024-01-15&time=18:00
Response: All tables with reservation status
```

**Critical for POS:** Returns ALL tables (not just occupied) so staff can see availability

#### Order Routes (`routes/orders.js`)

**POST /api/pos/orders**
```json
{
  "reservationId": 123,
  "items": [
    { "menuItemId": 5, "quantity": 2 },
    { "menuItemId": 12, "quantity": 1 }
  ]
}
```

**Logic:**
1. Verify reservation exists and is active
2. Get or create order for reservation
3. **Replace strategy:** Delete existing order_items, insert new ones
4. Calculate totals: `subtotal`, `tax (5%)`, `grand_total`
5. Update reservation status to `occupied`

**Why replace instead of update?**
- Simpler logic - no need to diff items
- Prevents orphaned items
- Frontend sends complete cart state

**POST /api/pos/orders/:id/finalize**
- Marks order as `finalized`
- Sets `finalized_at` timestamp
- Updates reservation status to `completed`
- Irreversible action

**GET /api/pos/bill/:orderId**
- Returns complete bill details
- Includes customer info, items, totals
- Used by bill.html to display receipt

### Database Abstraction (`db.js` & `db-sqlite.js`)

**Dual Database Strategy:**

```javascript
// db.js
let dbModule;
try {
  const { Pool } = require('pg');
  dbModule = { pool, query, withClient };  // PostgreSQL
} catch (err) {
  dbModule = require('./db-sqlite');       // Fallback to SQLite
}
```

**SQLite Adapter (`db-sqlite.js`):**
- Translates PostgreSQL syntax to SQLite
- Converts `$1, $2` placeholders to `?`
- Handles `INSERT...RETURNING` (SQLite doesn't support natively)
- Auto-initializes schema and seeds data

**Query Translation Example:**
```javascript
// PostgreSQL: INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id
// SQLite:     INSERT INTO customers (name, phone) VALUES (?, ?)
//             Then: SELECT last_insert_rowid()
```

---

## Frontend Pages

### Component System (`components.js`)

**Dynamic Component Loading:**
```javascript
async function loadComponents() {
  const navRes = await fetch('components/navbar.html');
  document.getElementById('navbar-placeholder').innerHTML = await navRes.text();
  
  const footRes = await fetch('components/footer.html');
  document.getElementById('footer-placeholder').innerHTML = await footRes.text();
}
```

**Why dynamic loading?**
- DRY principle - navbar/footer defined once
- Easy updates - change one file, affects all pages
- Requires local server (fetch API doesn't work with `file://`)

**Active Nav Highlighting:**
```javascript
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  if (page === 'menu.html') {
    document.querySelector('.nav-menu')?.classList.add('active');
  }
}
```

### Veg/Non-Veg Toggle (`common.js`)

**Global State Management:**
```javascript
let isVeg = false;

function toggleMode() {
  isVeg = !isVeg;
  localStorage.setItem('firefork_mode', isVeg ? 'veg' : 'non-veg');
  document.body.classList.toggle('veg-mode', isVeg);
  
  // Notify page-specific handlers
  if (typeof window.fireforkOnModeChange === 'function') {
    window.fireforkOnModeChange(isVeg);
  }
}
```

**Persistence:**
- Saved to `localStorage`
- Restored on page load
- Survives browser refresh

**Page-Specific Handlers:**
Each page registers a callback:
```javascript
// menu.js
window.fireforkOnModeChange = function(isVeg) {
  if (isVeg) {
    document.querySelectorAll('.non-veg-container').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.veg-container').forEach(el => el.style.display = 'block');
  }
};
```

### Homepage (`index.html` + `home.js`)

**Hero Section:**
- Dual background images (flame patterns)
- Floating food images (chicken, beef, pork vs salad, sandwich, tomato)
- Smooth crossfade on veg/non-veg toggle

**Menu Preview:**
- Shows 3 starters + 3 mains per mode
- Hardcoded (not API-driven) for performance

**Chefs Section:**
- Pill-shaped cards with chef photos
- Asymmetric grid layout

**Testimonials:**
- Bento-box grid (varying card sizes)
- Light/dark/primary color variants

### Menu Page (`menu.html` + `menu.js`)

**Sticky Category Navigation:**
```javascript
function scrollToSection(id, clickedPill) {
  const el = document.getElementById(id);
  const offset = navbar.offsetHeight + subNav.offsetHeight + 20;
  window.scrollTo({ 
    top: el.offsetTop - offset, 
    behavior: 'smooth' 
  });
}
```

**Cursor Follower:**
```javascript
menuTitles.forEach(title => {
  title.addEventListener('mouseenter', () => {
    const imgUrl = title.getAttribute('data-img');
    cursorPreview.style.backgroundImage = `url('${imgUrl}')`;
    cursorPreview.classList.add('visible');
  });
});
```

**UX Enhancement:** Hovering over dish names shows food image following cursor

### Reservation Form (`form.html` + `form.js`)

**Time Slot Generation:**
```javascript
function generateTimeSlots() {
  const slots = [];
  for (let hour = 14; hour <= 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 20 && min > 0) break;  // Last slot: 8:00 PM
      slots.push({ value: `${hour}:${min}`, label: `${hour12}:${min} PM` });
    }
  }
  return slots;
}
```

**Slots:** 2:00 PM, 2:30 PM, ..., 8:00 PM (13 slots)
**Why 8:00 PM last?** 2-hour dining + 8:00 PM = 10:00 PM close

**Real-Time Availability:**
```javascript
els.bookingDate.addEventListener('change', checkAvailability);
els.bookingTime.addEventListener('change', checkAvailability);
els.partySize.addEventListener('change', checkAvailability);

function checkAvailability() {
  clearTimeout(availabilityTimeout);
  availabilityTimeout = setTimeout(async () => {
    const response = await fetch(`${API_BASE}/availability/check?...`);
    // Show green checkmark or red X
  }, 500);  // Debounced 500ms
}
```

**Debouncing:** Prevents API spam while user types

**Form Submission:**
```javascript
async function handleSubmit(e) {
  e.preventDefault();
  setLoading(true);
  
  const response = await fetch(`${API_BASE}/reservations`, {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  
  if (response.ok) {
    showSuccess(data.message);
    els.form.reset();
  } else {
    showError(data.error);
  }
}
```

### POS System (`pos.html` + `pos.js`)

**PIN Authentication:**
```javascript
function verifyPin() {
  const pin = document.getElementById('pin-input').value;
  if (pin === DEFAULT_PIN) {  // '1234'
    bootstrap.Modal.getInstance(pinModal).hide();
    document.getElementById('pos-interface').classList.remove('d-none');
  }
}
```

**Security Note:** Hardcoded PIN for demo. Production should use bcrypt + database.

**Table Grid:**
```javascript
function renderTables(tables) {
  tables.forEach(table => {
    const isOccupied = table.reservation_id && table.reservation_status !== 'cancelled';
    const card = document.createElement('div');
    card.className = `table-card ${isOccupied ? 'occupied' : 'available'}`;
    card.onclick = () => selectTable(table);
    // ...
  });
}
```

**Visual States:**
- Green = Available
- Orange = Occupied
- Selected = Blue border

**Menu & Cart:**
```javascript
function addToCart(item) {
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
  }
  renderCart();
  saveOrder();  // Auto-save to backend
}
```

**Auto-Save:** Every cart change triggers API call to persist order

**Bill Generation:**
```javascript
async function generateBill() {
  await saveOrder();  // Final save
  
  const billData = {
    tableCode: selectedTable.table_code,
    customerName: selectedTable.customer_name,
    items: cart,
    subtotal, tax, total
  };
  
  localStorage.setItem('firefork_bill', JSON.stringify(billData));
  window.location.href = 'bill.html';
}
```

**Data Transfer:** Uses `localStorage` to pass bill data to bill.html

### Bill Page (`bill.html`)

**Data Loading:**
```javascript
window.addEventListener('DOMContentLoaded', () => {
  const billData = JSON.parse(localStorage.getItem('firefork_bill') || '{}');
  
  // Populate bill details
  document.getElementById('bill-table').textContent = billData.tableCode;
  // ...
  
  // Clear after 5 seconds
  setTimeout(() => {
    localStorage.removeItem('firefork_bill');
  }, 5000);
})

```

**Print-Friendly:** CSS `@media print` hides "Return to POS" button

---

## JavaScript Logic

### Module Pattern

All scripts use **IIFE (Immediately Invoked Function Expression)** to avoid global pollution:

```javascript
(function () {
  'use strict';
  
  // Private variables
  let isVeg = false;
  
  // Private functions
  function toggleMode() { /* ... */ }
  
  // Public API
  window.toggleMode = toggleMode;
})();
```

**Benefits:**
- No global variable conflicts
- Explicit public API via `window` object
- Strict mode enforcement

### Event Handling Patterns

**1. Direct Inline (Simple Actions)**
```html
<button onclick="toggleMode()">Toggle</button>
```

**2. addEventListener (Complex Logic)**
```javascript
document.getElementById('booking-form').addEventListener('submit', handleSubmit);
```

**3. Event Delegation (Dynamic Elements)**
```javascript
document.getElementById('tables-grid').addEventListener('click', (e) => {
  if (e.target.closest('.table-card')) {
    selectTable(e.target.closest('.table-card').dataset.tableId);
  }
});
```

### Async/Await for API Calls

**Consistent Error Handling:**
```javascript
async function loadMenu() {
  try {
    const response = await fetch(`${API_BASE}/menu`);
    if (!response.ok) throw new Error('Failed to load menu');
    const data = await response.json();
    menuItems = data.items;
  } catch (err) {
    console.error('Menu load error:', err);
    showError('Failed to load menu. Please refresh.');
  }
}
```

### State Management

**No Framework, Manual State:**
```javascript
// POS System State
let currentDate = null;
let currentTime = null;
let selectedTable = null;
let menuItems = [];
let cart = [];

// State updates trigger re-renders
function selectTable(table) {
  selectedTable = table;
  renderOrderPanel();
}

function addToCart(item) {
  cart.push(item);
  renderCart();
  saveOrder();
}
```

**Simple but Effective:** For small apps, manual state management is clearer than Redux/Vuex

---

## Data Flow & Communication

### Customer Reservation Flow

```
┌─────────────┐
│  form.html  │
└──────┬──────┘
       │ 1. User fills form
       │
       ▼
┌─────────────────────────────────────┐
│  scripts/form.js                    │
│  - Validates input                  │
│  - Checks availability (debounced)  │
│  - Submits reservation              │
└──────┬──────────────────────────────┘
       │ 2. POST /api/reservations
       │
       ▼
┌─────────────────────────────────────┐
│  backend/routes/reservations.js     │
│  - BEGIN transaction                │
│  - Find available table             │
│  - Insert/update customer           │
│  - Create reservation               │
│  - COMMIT                           │
└──────┬──────────────────────────────┘
       │ 3. Write to database
       │
       ▼
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  - customers table                  │
│  - reservations table               │
│  - restaurant_tables table          │
└─────────────────────────────────────┘
```

### POS Order Flow

```
┌─────────────┐
│  pos.html   │
└──────┬──────┘
       │ 1. Staff selects table
       │
       ▼
┌─────────────────────────────────────┐
│  scripts/pos.js                     │
│  - Load table status                │
│  - Display menu by category         │
│  - Build cart                       │
└──────┬──────────────────────────────┘
       │ 2. GET /api/pos/tables
       │    GET /api/menu
       │
       ▼
┌─────────────────────────────────────┐
│  backend/routes/reservations.js     │
│  backend/routes/menu.js             │
│  - Fetch reservations + tables      │
│  - Fetch menu items                 │
└──────┬──────────────────────────────┘
       │ 3. Return JSON data
       │
       ▼
┌─────────────────────────────────────┐
│  scripts/pos.js                     │
│  - Render table cards               │
│  - Render menu items                │
│  - User adds items to cart          │
└──────┬──────────────────────────────┘
       │ 4. POST /api/pos/orders (auto-save)
       │
       ▼
┌─────────────────────────────────────┐
│  backend/routes/orders.js           │
│  - Create/update order              │
│  - Calculate totals                 │
│  - Update reservation status        │
└──────┬──────────────────────────────┘
       │ 5. Write to database
       │
       ▼
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  - orders table                     │
│  - order_items table                │
│  - reservations (status update)     │
└─────────────────────────────────────┘
       │
       │ 6. Staff clicks "Generate Bill"
       │
       ▼
┌─────────────────────────────────────┐
│  scripts/pos.js                     │
│  - Finalize order                   │
│  - Store bill data in localStorage  │
│  - Redirect to bill.html            │
└──────┬──────────────────────────────┘
       │ 7. POST /api/pos/orders/:id/finalize
       │
       ▼
┌─────────────────────────────────────┐
│  backend/routes/orders.js           │
│  - Mark order as finalized          │
│  - Mark reservation as completed    │
└──────┬──────────────────────────────┘
       │ 8. Update database
       │
       ▼
┌─────────────┐
│  bill.html  │ ← Reads from localStorage
└─────────────┘
```

### Veg/Non-Veg Toggle Flow

```
┌─────────────────────────────────────┐
│  components/navbar.html             │
│  <button onclick="toggleMode()">    │
└──────┬──────────────────────────────┘
       │ 1. User clicks toggle
       │
       ▼
┌─────────────────────────────────────┐
│  scripts/common.js                  │
│  - Toggle isVeg flag                │
│  - Save to localStorage             │
│  - Add/remove 'veg-mode' class      │
│  - Call fireforkOnModeChange()      │
└──────┬──────────────────────────────┘
       │ 2. Notify page-specific handler
       │
       ▼
┌─────────────────────────────────────┐
│  Page-specific script               │
│  (home.js, menu.js, etc.)           │
│  - Show/hide veg/non-veg content    │
│  - Update hero text                 │
│  - Swap images                      │
└─────────────────────────────────────┘
```

**CSS-Driven Transitions:**
```css
body.veg-mode .non-veg-item { opacity: 0; }
body.veg-mode .veg-item { opacity: 1; }
```

---

## Business Logic Deep Dive

### Table Allocation Algorithm

**Problem:** Given a party size, find the best table to maximize restaurant capacity.

**Solution: Smallest-Fit Algorithm**

```javascript
// Pseudocode
function findAvailableTable(partySize, date, time) {
  // 1. Filter tables by capacity
  const suitableTables = tables.filter(t => t.capacity >= partySize);
  
  // 2. Exclude tables with overlapping reservations
  const availableTables = suitableTables.filter(t => {
    return !hasOverlappingReservation(t, date, time);
  });
  
  // 3. Sort by capacity (ascending) and table code
  availableTables.sort((a, b) => {
    if (a.capacity !== b.capacity) return a.capacity - b.capacity;
    return a.table_code.localeCompare(b.table_code);
  });
  
  // 4. Return smallest suitable table
  return availableTables[0] || null;
}
```

**Example Scenarios:**

| Party Size | Available Tables | Selected | Reason |
|------------|------------------|----------|--------|
| 2 | T01(2), T06(4), T10(6) | T01 | Exact match |
| 3 | T06(4), T10(6) | T06 | Smallest fit |
| 5 | T10(6), T12(8) | T10 | Smallest fit |
| 9 | None | null | No table large enough |

**Why not largest-fit?**
- Wastes capacity (party of 2 at table for 8)
- Reduces availability for larger parties

### Reservation Time Overlap Detection

**Problem:** Prevent double-booking tables.

**Solution: Time Window Check**

```sql
-- Check if table is available
SELECT 1 FROM reservations r
WHERE r.table_id = $tableId
  AND r.booking_date = $date
  AND r.booking_time = $time
  AND r.status IN ('confirmed', 'occupied')
```

**Assumptions:**
- All reservations are 2-hour slots
- Slots start on the hour or half-hour (14:00, 14:30, 15:00, ...)
- No overlapping slots (14:00 and 14:30 are different slots)

**Edge Case:** What if a customer books 14:00 and another tries 15:00?
- **Current behavior:** Allowed (different time slots)
- **Real-world consideration:** May need to check `booking_time + duration_minutes`

### Order Total Calculation

**Formula:**
```
subtotal = Σ(item.price × item.quantity)
tax = subtotal × 0.05  (5% tax rate)
grand_total = subtotal + tax
```

**Implementation:**
```javascript
// Frontend (pos.js)
const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
const tax = subtotal * 0.05;
const total = subtotal + tax;

// Backend (routes/orders.js)
const totalSql = `
  SELECT COALESCE(SUM(subtotal), 0) as total
  FROM order_items
  WHERE order_id = $1
`;
const totalAmount = parseFloat(totalResult.rows[0].total || 0);
const taxAmount = totalAmount * config.billing.taxRate;  // 0.05 from .env
const grandTotal = totalAmount + taxAmount;
```

**Why calculate on both sides?**
- Frontend: Instant feedback for staff
- Backend: Source of truth, prevents tampering

### Menu Filtering (Veg/Non-Veg)

**Database Query:**
```sql
SELECT mi.*, c.name AS category_name
FROM menu_items mi
JOIN categories c ON c.id = mi.category_id
WHERE mi.is_veg = $isVeg  -- Optional filter
ORDER BY c.display_order ASC, mi.name ASC
```

**Frontend Toggle:**
```javascript
// menu.js
window.fireforkOnModeChange = function(isVeg) {
  if (isVeg) {
    document.querySelectorAll('.non-veg-container').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.veg-container').forEach(el => el.style.display = 'block');
  } else {
    document.querySelectorAll('.non-veg-container').forEach(el => el.style.display = 'block');
    document.querySelectorAll('.veg-container').forEach(el => el.style.display = 'none');
  }
};
```

**Why not API-driven filtering?**
- Menu pages (index.html, menu.html) use hardcoded content for performance
- POS system uses API for real-time data

---

## Key Features Implementation

### 1. Real-Time Availability Checking

**User Experience:**
- As user selects date/time/party size, availability indicator updates
- Green checkmark = Available
- Red X = No tables

**Technical Implementation:**
```javascript
// Debounced API call (500ms delay)
let availabilityTimeout;
function checkAvailability() {
  clearTimeout(availabilityTimeout);
  availabilityTimeout = setTimeout(async () => {
    const url = `${API_BASE}/availability/check?date=${date}&time=${time}&partySize=${partySize}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.available) {
      showGreenCheckmark(data.message);
    } else {
      showRedX(data.message);
    }
  }, 500);
}
```

**Why debounce?**
- User might change date multiple times quickly
- Prevents API spam (reduces server load)
- Better UX (no flickering indicators)

### 2. Dynamic Component Loading

**Problem:** Navbar and footer repeated on every page.

**Solution:** Fetch and inject HTML at runtime.

```javascript
// components.js
async function loadComponents() {
  const navRes = await fetch('components/navbar.html');
  document.getElementById('navbar-placeholder').innerHTML = await navRes.text();
  
  const footRes = await fetch('components/footer.html');
  document.getElementById('footer-placeholder').innerHTML = await footRes.text();
}
```

**Requirement:** Must use local server (Python, Node, etc.)
- `file://` protocol blocks fetch requests (CORS)
- Development: `python -m http.server 5500`
- Production: Nginx, Apache, or Node.js

### 3. Persistent Veg/Non-Veg Preference

**User Story:** Customer toggles to veg mode, navigates to menu page, preference persists.

**Implementation:**
```javascript
// Save on toggle
localStorage.setItem('firefork_mode', isVeg ? 'veg' : 'non-veg');

// Restore on page load
function initializeMode() {
  const storedMode = localStorage.getItem('firefork_mode');
  if (storedMode === 'veg') {
    toggleMode();  // Switch to veg
  }
}
```

**localStorage vs sessionStorage:**
- `localStorage` = Persists across browser sessions
- `sessionStorage` = Cleared when tab closes
- Choice: `localStorage` for better UX

### 4. POS Auto-Save

**User Story:** Staff adds items to cart, order is saved automatically (no manual save button).

**Implementation:**
```javascript
function addToCart(item) {
  cart.push(item);
  renderCart();
  saveOrder();  // ← Auto-save
}

async function saveOrder() {
  if (cart.length === 0) return;
  
  await fetch(`${API_BASE}/pos/orders`, {
    method: 'POST',
    body: JSON.stringify({
      reservationId: selectedTable.reservation_id,
      items: cart.map(item => ({ menuItemId: item.id, quantity: item.quantity }))
    })
  });
}
```

**Benefits:**
- No lost data if browser crashes
- Staff doesn't need to remember to save
- Real-time sync with database

**Trade-off:** More API calls, but acceptable for small restaurant

### 5. Bill Data Transfer via localStorage

**Problem:** How to pass order data from pos.html to bill.html?

**Options:**
1. URL query params (limited size, visible in URL)
2. sessionStorage (cleared on tab close)
3. localStorage (persists, easy to clear)
4. Server-side session (requires cookies)

**Chosen Solution: localStorage**
```javascript
// pos.js
const billData = { tableCode, customerName, items, subtotal, tax, total };
localStorage.setItem('firefork_bill', JSON.stringify(billData));
window.location.href = 'bill.html';

// bill.html
const billData = JSON.parse(localStorage.getItem('firefork_bill') || '{}');
// Render bill...
setTimeout(() => localStorage.removeItem('firefork_bill'), 5000);
```

**Why clear after 5 seconds?**
- Prevents stale data on refresh
- Security (bill data shouldn't persist)

---

## Development Workflow

### Initial Setup

**1. Database Setup (PostgreSQL)**
```bash
# Create database
createdb firefork_db

# Run schemas
psql -d firefork_db -f database/schema.sql
psql -d firefork_db -f database/schema_reservations.sql

# Seed data
psql -d firefork_db -f database/seed_menu.sql
psql -d firefork_db -f database/seed_tables.sql
```

**2. Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env: Set DB_PASSWORD

# Start server
npm start
# Server runs on http://localhost:3000
```

**3. Frontend Setup**
```bash
# From project root
python -m http.server 5500
# Or: npx http-server -p 5500

# Open browser
# http://localhost:5500/index.html
```

### Environment Variables (`.env`)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=firefork_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_POOL_MAX=10

# Server
PORT=3000

# CORS
FRONTEND_URL=http://127.0.0.1:5500
CORS_ALLOWED_ORIGINS=http://localhost:5500

# POS
DEFAULT_POS_PIN=1234

# Billing
TAX_RATE=0.05

# Restaurant
RESTAURANT_OPEN_TIME=14:00
RESTAURANT_CLOSE_TIME=22:00
RESERVATION_DURATION_MINUTES=120
```

### Testing Workflow

**1. Test Customer Reservation**
```
1. Open http://localhost:5500/form.html
2. Fill form:
   - Name: John Doe
   - Phone: 9876543210
   - Date: Tomorrow
   - Time: 6:00 PM
   - Party Size: 4
3. Submit
4. Check database:
   SELECT * FROM reservations ORDER BY id DESC LIMIT 1;
```

**2. Test POS System**
```
1. Open http://localhost:5500/pos.html
2. Enter PIN: 1234
3. Select date: Today
4. Select time: 6:00 PM
5. Click table with reservation
6. Add menu items
7. Click "Generate Bill"
8. Verify bill.html displays correctly
```

**3. Test Veg/Non-Veg Toggle**
```
1. Open http://localhost:5500/index.html
2. Click veg toggle in navbar
3. Verify:
   - Hero text changes to "WHERE FIRE MEETS GREENS"
   - Floating images swap (salad, sandwich, tomato)
   - Menu preview shows veg items
4. Navigate to menu.html
5. Verify veg preference persists
```

### Common Issues & Solutions

**Issue: CORS errors**
```
Solution: 
- Ensure backend is running on port 3000
- Ensure frontend is on port 5500
- Check FRONTEND_URL in .env matches
```

**Issue: Components not loading**
```
Solution:
- Must use local server (not file://)
- Check browser console for fetch errors
- Verify components/navbar.html exists
```

**Issue: Database connection failed**
```
Solution:
- Check PostgreSQL is running: pg_isready
- Verify .env credentials
- Try SQLite fallback (auto-activates if PG fails)
```

**Issue: Reservations not showing in POS**
```
Solution:
- Check date/time filters match reservation
- Verify reservation status is 'confirmed' or 'occupied'
- Check database: SELECT * FROM reservations;
```

---

## Advanced Topics

### Scaling Considerations

**Current Limitations:**
- Single server (no load balancing)
- No caching layer
- Synchronous API calls
- No WebSocket for real-time updates

**Future Improvements:**
1. **Redis for caching**
   - Cache menu items (rarely change)
   - Cache table availability (invalidate on booking)

2. **WebSocket for POS**
   - Real-time table status updates
   - Multiple staff members see same data

3. **Queue system for reservations**
   - Handle high traffic (e.g., holiday bookings)
   - Prevent race conditions on table allocation

4. **Database connection pooling**
   - Already implemented (`pg.Pool`)
   - Tune `DB_POOL_MAX` based on load

### Security Enhancements

**Current Vulnerabilities:**
1. **Hardcoded POS PIN**
   - Solution: Hash with bcrypt, store in database
   - Add user accounts with roles (admin, staff)

2. **No authentication on API**
   - Solution: JWT tokens for POS endpoints
   - Public endpoints (menu, availability) remain open

3. **SQL injection risk**
   - Mitigated: Using parameterized queries (`$1, $2`)
   - Never concatenate user input into SQL

4. **XSS risk**
   - Mitigated: Using `textContent` instead of `innerHTML` for user data
   - Sanitize special requests field

### Performance Optimization

**Database Indexes:**
```sql
-- Already implemented
CREATE INDEX idx_reservations_date_time ON reservations(booking_date, booking_time);
CREATE INDEX idx_reservations_table ON reservations(table_id, booking_date);

-- Additional indexes for heavy queries
CREATE INDEX idx_menu_items_category ON menu_items(category_id) WHERE is_available = true;
CREATE INDEX idx_orders_status ON orders(status) WHERE status = 'active';
```

**Frontend Optimization:**
1. **Lazy load images**
   ```html
   <img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy">
   ```

2. **Minify CSS/JS**
   ```bash
   npm install -g terser cssnano
   terser scripts/pos.js -o scripts/pos.min.js
   ```

3. **CDN for Bootstrap**
   - Already using CDN (jsdelivr)
   - Consider self-hosting for offline capability

### Monitoring & Logging

**Backend Logging:**
```javascript
// Add to server.js
function logRequest(req) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
}

// Add to route function
async function route(req, res) {
  logRequest(req);
  // ... existing code
}
```

**Error Tracking:**
```javascript
// Add to server.js
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Send to error tracking service (Sentry, Rollbar)
});
```

**Database Query Logging:**
```javascript
// Add to db.js
async function query(text, params) {
  console.log('Query:', text, 'Params:', params);
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Duration:', duration, 'ms');
  return result;
}
```

---

## Conclusion

### What You've Learned

1. **Full-Stack Architecture**
   - How frontend, backend, and database communicate
   - RESTful API design patterns
   - Database schema design and normalization

2. **Business Logic Implementation**
   - Table allocation algorithms
   - Reservation conflict detection
   - Order management workflows

3. **Frontend Patterns**
   - Component-based architecture (without frameworks)
   - State management in vanilla JS
   - Event-driven programming

4. **Real-World Considerations**
   - CORS handling
   - Error handling and validation
   - Data persistence strategies

### Next Steps for Junior Developers

1. **Add Features**
   - Email confirmation for reservations
   - SMS notifications
   - Customer loyalty program
   - Table waitlist system

2. **Refactor**
   - Extract common API logic into `utils/api.js`
   - Create reusable UI components
   - Add TypeScript for type safety

3. **Test**
   - Write unit tests (Jest, Mocha)
   - Add integration tests for API
   - E2E tests with Playwright/Cypress

4. **Deploy**
   - Containerize with Docker
   - Deploy to Heroku/Railway/Render
   - Set up CI/CD pipeline

### Resources

- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Node.js HTTP Module:** https://nodejs.org/api/http.html
- **MDN Web Docs:** https://developer.mozilla.org/
- **Bootstrap 5:** https://getbootstrap.com/docs/5.3/

---

**Questions?** Review this documentation, experiment with the code, and don't hesitate to ask senior developers for clarification. The best way to learn is by building!

**Happy Coding! 🔥🍴**
