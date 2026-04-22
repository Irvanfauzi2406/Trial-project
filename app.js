// SmartStock - Main Application
// Data produk
const products = [
  { id: 1, name: "Susu Ultra Milk 1L", category: "Minuman", stock: 142, minStock: 50, price: 18500, cost: 13000, expiry: "2025-06-15", emoji: "🥛" },
  { id: 2, name: "Yogurt Stroberi", category: "Dairy", stock: 38, minStock: 30, price: 12000, cost: 7500, expiry: "2025-06-20", emoji: "🍓" },
  { id: 3, name: "Daging Sapi Segar 500g", category: "Protein", stock: 25, minStock: 20, price: 85000, cost: 70000, expiry: "2025-06-10", emoji: "🥩" },
  { id: 4, name: "Roti Tawar Gandum", category: "Bakery", stock: 60, minStock: 40, price: 12000, cost: 7200, expiry: "2025-06-18", emoji: "🍞" },
  { id: 5, name: "Ayam Fillet 500g", category: "Protein", stock: 18, minStock: 25, price: 55000, cost: 42000, expiry: "2025-06-12", emoji: "🍗" },
  { id: 6, name: "Telur Negeri 1kg", category: "Protein", stock: 200, minStock: 50, price: 27000, cost: 22000, expiry: "2025-07-01", emoji: "🥚" },
  { id: 7, name: "Minuman Cola 330ml", category: "Minuman", stock: 0, minStock: 30, price: 8500, cost: 6000, expiry: "2025-12-01", emoji: "🥤" },
  { id: 8, name: "Keju Slice 12pc", category: "Dairy", stock: 12, minStock: 20, price: 35000, cost: 28000, expiry: "2025-06-25", emoji: "🧀" }
];

const pnlData = [
  { name: "Susu Ultra Milk", sales: 8550000, cost: 5100000, margin: 40.35, status: "Profit" },
  { name: "Roti Tawar", sales: 3600000, cost: 2160000, margin: 40.0, status: "Profit" },
  { name: "Yogurt Stroberi", sales: 2875000, cost: 1800000, margin: 37.39, status: "Profit" },
  { name: "Daging Sapi", sales: 6200000, cost: 5890000, margin: 5.0, status: "Low Margin" },
  { name: "Ayam Fillet", sales: 4100000, cost: 4350000, margin: -6.1, status: "Loss" },
  { name: "Minuman Cola", sales: 2050000, cost: 2200000, margin: -7.32, status: "Loss" }
];

let cart = [];
let selectedProduct = null;
let paymentMethod = "qris";
let quantityMap = {};

// Helper functions
const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");
const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / 86400000);

function showToast(msg) {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-message");
  msgEl.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

// Navigasi
function navigate(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  
  const targetPage = document.getElementById("page-" + pageId);
  if (targetPage) targetPage.classList.add("active");
  
  const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add("active");
  
  // Load page content
  if (pageId === "dashboard") loadDashboard();
  else if (pageId === "penjualan") { renderProducts(); updateCartSidebar(); }
  else if (pageId === "produk") loadProductsTable();
  else if (pageId === "stok") loadStockTable();
  else if (pageId === "expdate") loadExpiredTable();
  else if (pageId === "pnl") loadPnLTable();
  else if (pageId === "payment") loadPaymentPage();
}

// Dashboard
function loadDashboard() {
  const dateEl = document.getElementById("dash-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  
  const statsContainer = document.getElementById("stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe"><i class="fas fa-box" style="color:#2563eb;font-size:20px"></i></div><div class="stat-label">Total Produk</div><div class="stat-value">1.256</div><div style="font-size:11px;color:#10b981">↑ 8 baru</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5"><i class="fas fa-check-circle" style="color:#10b981;font-size:20px"></i></div><div class="stat-label">In Stock</div><div class="stat-value">892</div><div style="font-size:11px;color:#64748b">71% dari total</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2"><i class="fas fa-exclamation-triangle" style="color:#ef4444;font-size:20px"></i></div><div class="stat-label">Out of Stock</div><div class="stat-value">64</div><div style="font-size:11px;color:#ef4444">5% dari total</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fed7aa"><i class="fas fa-clock" style="color:#f97316;font-size:20px"></i></div><div class="stat-label">Akan Expired</div><div class="stat-value">38</div><div style="font-size:11px;color:#f97316">≤30 hari</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5"><i class="fas fa-chart-line" style="color:#10b981;font-size:20px"></i></div><div class="stat-label">Penjualan</div><div class="stat-value">45,68 Jt</div><div style="font-size:11px;color:#10b981">↑ 12,5%</div></div>
    `;
  }
}

// Products
let currentCategory = "all";

function filterCat(btn, cat) {
  document.querySelectorAll(".category-filter .btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = cat;
  renderProducts();
}

function renderProducts() {
  const filtered = currentCategory === "all" ? products : products.filter(p => p.category === currentCategory);
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  
  grid.innerHTML = filtered.map(p => `
    <div class="product-card" onclick="selectProduct(${p.id})">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div style="font-size:11px;color:#64748b;margin:4px 0">${p.category}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span class="product-price">${formatRupiah(p.price)}</span>
        <span class="badge ${p.stock > p.minStock ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}">${p.stock > 0 ? p.stock : "Habis"}</span>
      </div>
      ${p.stock > 0 ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="event.stopPropagation();addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Tambah</button>` : ''}
    </div>
  `).join("");
}

function selectProduct(id) {
  selectedProduct = products.find(p => p.id === id);
  if (selectedProduct) updateCartSidebar();
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product || product.stock === 0) return;
  
  const qty = quantityMap[productId] || 1;
  const existing = cart.find(c => c.id === productId);
  if (existing) existing.qty += qty;
  else cart.push({ ...product, qty });
  
  updateCartBadge();
  updateCartSidebar();
  showToast(`${product.name} ditambahkan ke keranjang`);
}

function updateCartBadge() {
  const total = cart.reduce((a, c) => a + c.qty, 0);
  const badge = document.getElementById("cart-badge");
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? "inline-flex" : "none";
  }
}

function updateCartSidebar() {
  const container = document.getElementById("cart-sidebar");
  if (!container) return;
  
  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#94a3b8;padding:40px 0"><i class="fas fa-shopping-cart"></i> Keranjang kosong</p>`;
    return;
  }
  
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const total = subtotal + 2000;
  
  container.innerHTML = `
    <h3 style="font-size:14px;margin-bottom:16px">Keranjang (${cart.reduce((a,c)=>a+c.qty,0)} item)</h3>
    ${cart.map(c => `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:12px">
        <span>${c.emoji} ${c.name} ×${c.qty}</span>
        <span style="font-weight:600">${formatRupiah(c.price * c.qty)}</span>
      </div>
    `).join("")}
    <div style="border-top:1px solid #e2e8f0;margin:12px 0;padding-top:12px">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Biaya layanan</span><span>${formatRupiah(2000)}</span></div>
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px"><span>Total</span><span style="color:#10b981">${formatRupiah(total)}</span></div>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="navigate('payment')"><i class="fas fa-arrow-right"></i> Checkout</button>
  `;
}

// Payment
function loadPaymentPage() {
  const methodsContainer = document.getElementById("payment-methods");
  if (methodsContainer) {
    methodsContainer.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="method-option ${paymentMethod === 'qris' ? 'active' : ''}" onclick="selectPaymentMethod('qris')" style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;cursor:pointer">
          <i class="fas fa-qrcode" style="font-size:20px"></i><div style="flex:1"><div style="font-weight:600">QRIS</div><div style="font-size:11px;color:#64748b">Scan QR Code</div></div>
          <div class="radio ${paymentMethod === 'qris' ? 'selected' : ''}" style="width:16px;height:16px;border-radius:50%;border:2px solid #cbd5e1;background:${paymentMethod === 'qris' ? '#10b981' : 'white'}"></div>
        </div>
        <div class="method-option ${paymentMethod === 'bca' ? 'active' : ''}" onclick="selectPaymentMethod('bca')" style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e2e8f0;border-radius:12px;cursor:pointer">
          <i class="fas fa-university" style="font-size:20px"></i><div style="flex:1"><div style="font-weight:600">Transfer Bank</div><div style="font-size:11px;color:#64748b">BCA, Mandiri, BNI</div></div>
          <div class="radio ${paymentMethod === 'bca' ? 'selected' : ''}" style="width:16px;height:16px;border-radius:50%;border:2px solid #cbd5e1;background:${paymentMethod === 'bca' ? '#10b981' : 'white'}"></div>
        </div>
      </div>
    `;
  }
  
  const summaryContainer = document.getElementById("order-summary");
  if (summaryContainer) {
    const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
    summaryContainer.innerHTML = `
      ${cart.map(c => `<div style="display:flex;justify-content:space-between;margin-bottom:10px"><span>${c.name} ×${c.qty}</span><span>${formatRupiah(c.price * c.qty)}</span></div>`).join("")}
      <div style="border-top:1px solid #e2e8f0;margin-top:12px;padding-top:12px">
        <div style="display:flex;justify-content:space-between"><span>Total</span><span style="font-weight:700">${formatRupiah(subtotal + 2000)}</span></div>
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:16px" onclick="processPayment()"><i class="fas fa-check"></i> Bayar Sekarang</button>
    `;
  }
}

function selectPaymentMethod(method) {
  paymentMethod = method;
  loadPaymentPage();
}

function processPayment() {
  document.getElementById("payment-success").style.display = "block";
  cart = [];
  updateCartBadge();
  showToast("Pembayaran berhasil! Terima kasih.");
  setTimeout(() => navigate("dashboard"), 2000);
}

// Tables
function loadProductsTable() {
  const tbody = document.getElementById("products-table");
  if (!tbody) return;
  tbody.innerHTML = products.map(p => {
    const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
    return `<tr>
      <td><span style="font-size:24px;margin-right:8px">${p.emoji}</span> ${p.name}</td>
      <td>${p.category}</td>
      <td>${formatRupiah(p.price)}</td>
      <td>${formatRupiah(p.cost)}</td>
      <td style="color:${margin >= 20 ? '#10b981' : margin >= 0 ? '#f97316' : '#ef4444'}">${margin}%</td>
      <td>${p.stock}</td>
      <td>${p.minStock}</td>
      <td>${p.expiry}</td>
      <td><button class="btn btn-outline btn-sm" onclick="showToast('Edit ${p.name}')"><i class="fas fa-edit"></i></button></td>
    </tr>`;
  }).join("");
}

function loadStockTable() {
  const tbody = document.getElementById("stock-table");
  if (!tbody) return;
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><span style="font-size:24px;margin-right:8px">${p.emoji}</span> ${p.name}</td>
      <td>${p.category}</td>
      <td style="font-weight:600;color:${p.stock === 0 ? '#ef4444' : p.stock <= p.minStock ? '#f97316' : '#10b981'}">${p.stock}</td>
      <td>${p.minStock}</td>
      <td>${p.expiry}</td>
      <td><span class="badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}">${p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Low Stock' : 'Aman'}</span></td>
      <td><button class="btn btn-primary btn-sm" onclick="showToast('Update stok ${p.name}')"><i class="fas fa-sync-alt"></i> Update</button></td>
    </tr>
  `).join("");
}

function loadExpiredTable() {
  const tbody = document.getElementById("expired-table");
  if (!tbody) return;
  const sorted = [...products].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry));
  tbody.innerHTML = sorted.map(p => {
    const days = daysUntil(p.expiry);
    const status = days <= 7 ? "Kritis" : days <= 30 ? "Perhatian" : "Aman";
    return `<tr>
      <td><span style="font-size:24px;margin-right:8px">${p.emoji}</span> ${p.name}</td>
      <td>${p.category}</td>
      <td>${p.stock}</td>
      <td>${p.expiry}</td>
      <td><span class="badge ${days <= 7 ? 'badge-danger' : days <= 30 ? 'badge-warning' : 'badge-success'}">${days} hari</span></td>
      <td>${days <= 7 ? '🔥 Flash Sale 30%' : days <= 30 ? '📦 Bundle Promo' : '✅ Normal'}</td>
      <td><button class="btn btn-outline btn-sm" onclick="showToast('Promo diaktifkan')"><i class="fas fa-tag"></i> Promo</button></td>
    </tr>`;
  }).join("");
}

function loadPnLTable() {
  const tbody = document.getElementById("pnl-table");
  if (!tbody) return;
  tbody.innerHTML = pnlData.map(p => {
    const profit = p.sales - p.cost;
    return `<tr>
      <td><strong>${p.name}</strong></td>
      <td>${formatRupiah(p.sales)}</td>
      <td>${formatRupiah(p.cost)}</td>
      <td style="color:${profit >= 0 ? '#10b981' : '#ef4444'}">${formatRupiah(profit)}</td>
      <td style="color:${p.margin >= 20 ? '#10b981' : p.margin >= 0 ? '#f97316' : '#ef4444'}">${p.margin}%</td>
      <td><span class="badge ${p.status === 'Profit' ? 'badge-success' : p.status === 'Loss' ? 'badge-danger' : 'badge-warning'}">${p.status}</span></td>
    </tr>`;
  }).join("");
}

// AI Insights
function generateInsights() {
  const container = document.getElementById("insights-container");
  if (!container) return;
  
  const insights = [
    { title: "Optimasi Stok Minuman", desc: "Penjualan minuman meningkat 32% di akhir pekan", action: "Tambah stok 20% setiap Kamis", priority: "high" },
    { title: "Produk Mendekati Expired", desc: "8 produk akan kadaluarsa dalam 14 hari", action: "Buat bundle promo diskon", priority: "high" },
    { title: "Margin Negatif", desc: "2 produk memiliki margin negatif", action: "Evaluasi harga jual", priority: "high" },
    { title: "Cross-Selling Opportunity", desc: "Pembeli susu cenderung membeli roti", action: "Buat paket hemat", priority: "medium" }
  ];
  
  container.innerHTML = insights.map(ins => `
    <div style="background:white;border-radius:16px;border:1px solid #e2e8f0;padding:20px;border-top:3px solid ${ins.priority === 'high' ? '#ef4444' : '#f97316'}">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px"><h3 style="font-size:14px">${ins.title}</h3><span class="badge ${ins.priority === 'high' ? 'badge-danger' : 'badge-warning'}">${ins.priority === 'high' ? 'Penting' : 'Sedang'}</span></div>
      <p style="font-size:13px;color:#475569;margin-bottom:12px">${ins.desc}</p>
      <div style="background:#f8fafc;border-radius:10px;padding:10px"><span style="font-size:12px;font-weight:600">→ ${ins.action}</span></div>
    </div>
  `).join("");
}

// Global functions
window.navigate = navigate;
window.filterCat = filterCat;
window.selectProduct = selectProduct;
window.addToCart = addToCart;
window.selectPaymentMethod = selectPaymentMethod;
window.processPayment = processPayment;
window.generateInsights = generateInsights;
window.showToast = showToast;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  renderProducts();
  loadProductsTable();
  loadStockTable();
  loadExpiredTable();
  loadPnLTable();
  showToast("SmartStock siap digunakan");
});
