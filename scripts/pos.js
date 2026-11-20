/**
 * FireFork POS System
 */

const API_BASE = (window.FIREFORK_CONFIG && window.FIREFORK_CONFIG.apiBase) || 'http://localhost:3000/api';
const DEFAULT_PIN = '1234';

let currentDate = null;
let currentTime = null;
let selectedTable = null;
let menuItems = [];
let categories = [];
let cart = [];

// PIN Authentication
function verifyPin() {
  const pin = document.getElementById('pin-input').value;
  const errorEl = document.getElementById('pin-error');
  
  if (pin === DEFAULT_PIN) {
    bootstrap.Modal.getInstance(document.getElementById('pinModal')).hide();
    document.getElementById('pos-interface').classList.remove('d-none');
    init();
  } else {
    errorEl.classList.remove('d-none');
    document.getElementById('pin-input').value = '';
  }
}

function logout() {
  location.reload();
}

// Initialize
function init() {
  setTodayDate();
  populateTimeSlots();
  updateDateTime();
  setInterval(updateDateTime, 1000);
  loadMenu();
}

function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  document.getElementById('filter-date').value = `${yyyy}-${mm}-${dd}`;
  currentDate = `${yyyy}-${mm}-${dd}`;
}

function populateTimeSlots() {
  const select = document.getElementById('filter-time');
  for (let hour = 14; hour <= 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 20 && min > 0) break;
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      const time24 = `${h}:${m}`;
      const hour12 = hour > 12 ? hour - 12 : hour;
      const ampm = 'PM';
      const time12 = `${hour12}:${m} ${ampm}`;
      const option = document.createElement('option');
      option.value = time24;
      option.textContent = time12;
      select.appendChild(option);
    }
  }
}

function updateDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  document.getElementById('current-datetime').textContent = formatted;
}

// Load Menu
async function loadMenu() {
  try {
    const [menuRes, catRes] = await Promise.all([
      fetch(`${API_BASE}/menu`),
      fetch(`${API_BASE}/menu/categories`)
    ]);
    
    const menuData = await menuRes.json();
    const catData = await catRes.json();
    
    menuItems = menuData.items || [];
    categories = catData.categories || [];
    
    renderCategories();
    loadTables();
  } catch (err) {
    console.error('Failed to load menu:', err);
  }
}

function renderCategories() {
  const container = document.getElementById('category-tabs');
  container.innerHTML = '';
  
  categories.forEach((cat, idx) => {
    const tab = document.createElement('button');
    tab.className = `category-tab ${idx === 0 ? 'active' : ''}`;
    tab.textContent = cat.name;
    tab.onclick = () => selectCategory(cat.id, tab);
    container.appendChild(tab);
  });
  
  if (categories.length > 0) {
    renderMenuItems(categories[0].id);
  }
}

function selectCategory(categoryId, tabEl) {
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');
  renderMenuItems(categoryId);
}

function renderMenuItems(categoryId) {
  const container = document.getElementById('menu-items');
  const filtered = menuItems.filter(item => item.category_id === categoryId && item.is_available);
  
  container.innerHTML = '';
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'menu-item-card';
    card.onclick = () => addToCart(item);
    
    const vegBadge = `<span class="menu-item-veg-badge ${item.is_veg ? 'veg' : 'non-veg'}"></span>`;
    
    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="menu-item-name">${item.name} ${vegBadge}</div>
      </div>
      <div class="menu-item-price">₹${parseFloat(item.price).toFixed(2)}</div>
    `;
    container.appendChild(card);
  });
}

// Load Tables
async function loadTables() {
  currentDate = document.getElementById('filter-date').value;
  currentTime = document.getElementById('filter-time').value;
  
  if (!currentDate) {
    alert('Please select a date');
    return;
  }
  
  try {
    const url = currentTime 
      ? `${API_BASE}/pos/tables?date=${currentDate}&time=${currentTime}`
      : `${API_BASE}/pos/tables?date=${currentDate}&time=14:00`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    renderTables(data.tables || []);
  } catch (err) {
    console.error('Failed to load tables:', err);
  }
}

function renderTables(tables) {
  const container = document.getElementById('tables-grid');
  container.innerHTML = '';
  
  let occupied = 0;
  let available = 0;
  
  tables.forEach(table => {
    const isOccupied = table.reservation_id && table.reservation_status !== 'cancelled';
    if (isOccupied) occupied++;
    else available++;
    
    const card = document.createElement('div');
    card.className = `table-card ${isOccupied ? 'occupied' : 'available'}`;
    card.onclick = () => selectTable(table);
    
    card.innerHTML = `
      <div class="table-card-header">
        <div class="table-code">${table.table_code}</div>
        <span class="table-status-badge ${isOccupied ? 'occupied' : 'available'}">
          ${isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
        </span>
      </div>
      <div class="table-info">
        <i class="bi bi-people-fill"></i> Capacity: ${table.capacity}
      </div>
      ${isOccupied ? `
        <div class="customer-name">
          <i class="bi bi-person-fill"></i> ${table.customer_name}
        </div>
        <div class="table-info mt-1">
          <i class="bi bi-people"></i> Party: ${table.party_size}
        </div>
      ` : ''}
    `;
    
    container.appendChild(card);
  });
  
  document.getElementById('table-stats').textContent = 
    `${occupied} Occupied • ${available} Available`;
}

function selectTable(table) {
  selectedTable = table;
  
  document.querySelectorAll('.table-card').forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  
  const infoEl = document.getElementById('selected-table-info');
  infoEl.innerHTML = `
    <strong>${table.table_code}</strong> - ${table.customer_name || 'No reservation'}
  `;
  
  if (table.reservation_id) {
    document.getElementById('menu-section').classList.remove('d-none');
    loadExistingOrder(table.reservation_id);
  } else {
    document.getElementById('menu-section').classList.add('d-none');
    cart = [];
    renderCart();
  }
}

async function loadExistingOrder(reservationId) {
  // Check if order exists for this reservation
  try {
    const res = await fetch(`${API_BASE}/pos/reservations?date=${currentDate}`);
    const data = await res.json();
    const reservation = data.reservations.find(r => r.id === reservationId);
    
    if (reservation) {
      // Order will be created when items are added
      cart = [];
      renderCart();
    }
  } catch (err) {
    console.error('Failed to load order:', err);
  }
}

// Cart Management
function addToCart(item) {
  if (!selectedTable || !selectedTable.reservation_id) {
    alert('Please select an occupied table first');
    return;
  }
  
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      quantity: 1
    });
  }
  
  renderCart();
  saveOrder();
}

function updateQuantity(itemId, delta) {
  const item = cart.find(c => c.id === itemId);
  if (!item) return;
  
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(c => c.id !== itemId);
  }
  
  renderCart();
  saveOrder();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  
  if (cart.length === 0) {
    container.innerHTML = '<p class="text-muted text-center py-4">No items added</p>';
    document.getElementById('generate-bill-btn').classList.add('d-none');
    updateTotals(0, 0, 0);
    return;
  }
  
  container.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
        <span class="qty-display">${item.quantity}</span>
        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  
  updateTotals(subtotal, tax, total);
  document.getElementById('generate-bill-btn').classList.remove('d-none');
}

function updateTotals(subtotal, tax, total) {
  document.getElementById('cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById('cart-tax').textContent = `₹${tax.toFixed(2)}`;
  document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;
}

async function saveOrder() {
  if (!selectedTable || !selectedTable.reservation_id || cart.length === 0) return;
  
  try {
    const items = cart.map(item => ({
      menuItemId: item.id,
      quantity: item.quantity
    }));
    
    await fetch(`${API_BASE}/pos/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservationId: selectedTable.reservation_id,
        items
      })
    });
  } catch (err) {
    console.error('Failed to save order:', err);
  }
}

async function generateBill() {
  if (!selectedTable || !selectedTable.reservation_id || cart.length === 0) {
    alert('No items to bill');
    return;
  }
  
  if (!confirm('Generate bill for this table?')) return;
  
  try {
    // Save final order
    await saveOrder();
    
    // Get order ID
    const res = await fetch(`${API_BASE}/pos/reservations?date=${currentDate}`);
    const data = await res.json();
    const reservation = data.reservations.find(r => r.id === selectedTable.reservation_id);
    
    // Finalize order (this will be the order we just created/updated)
    const ordersRes = await fetch(`${API_BASE}/pos/reservations?date=${currentDate}`);
    const ordersData = await ordersRes.json();
    
    // Find the order for this reservation
    let orderId = null;
    for (const res of ordersData.reservations) {
      if (res.id === selectedTable.reservation_id) {
        // We need to get the order ID - let's create a simple approach
        // The order was created in saveOrder, so we'll finalize by reservation
        break;
      }
    }
    
    // For simplicity, redirect to bill page with reservation data
    const billData = {
      tableCode: selectedTable.table_code,
      customerName: selectedTable.customer_name,
      items: cart,
      subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      tax: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.05,
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05
    };
    
    localStorage.setItem('firefork_bill', JSON.stringify(billData));
    window.location.href = 'bill.html';
    
  } catch (err) {
    console.error('Failed to generate bill:', err);
    alert('Failed to generate bill');
  }
}

// Show PIN modal on load
window.addEventListener('DOMContentLoaded', () => {
  const pinModal = new bootstrap.Modal(document.getElementById('pinModal'));
  pinModal.show();
  
  document.getElementById('pin-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verifyPin();
  });
});
