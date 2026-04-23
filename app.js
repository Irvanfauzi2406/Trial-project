// SmartStock - Main Application (Complete Version)

// Data
const productsData = [
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

const monthlySales = [
  { month: "Jan", sales: 32000000, cost: 21000000 },
  { month: "Feb", sales: 38000000, cost: 25000000 },
  { month: "Mar", sales: 41000000, cost: 27000000 },
  { month: "Apr", sales: 36000000, cost: 24000000 },
  { month: "Mei", sales: 45680000, cost: 28250000 }
];

// State
let cart = [];
let selectedProduct = null;
let currentCategory = "all";
let quantityMap = {};
let charts = {};

// Helper functions
const formatRupiah = (num) => "Rp " + num.toLocaleString("id-ID");
const daysUntil = (date) => Math.ceil((new Date(date) - new Date()) / 86400000);

function showToast(message) {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-message");
  if (!toast) return;
  msgEl.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

function saveToLocalStorage() {
  localStorage.setItem("smartstock_cart", JSON.stringify(cart));
  localStorage.setItem("smartstock_qty", JSON.stringify(quantityMap));
}

function loadFromLocalStorage() {
  const savedCart = localStorage.getItem("smartstock_cart");
  const savedQty = localStorage.getItem("smartstock_qty");
  if (savedCart) cart = JSON.parse(savedCart);
  if (savedQty) quantityMap = JSON.parse(savedQty);
  updateCartBadge();
}

// Navigation
function navigate(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  
  const targetPage = document.getElementById("page-" + pageId);
  if (targetPage) targetPage.classList.add("active");
  
  const activeNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (activeNav) activeNav.classList.add("active");
  
  // Initialize page content
  if (pageId === "dashboard") initDashboard();
  else if (pageId === "penjualan") { renderProducts(); updateCartSidebar(); }
  else if (pageId === "payment") initPayment();
  else if (pageId === "produk") renderProductsTable();
  else if (pageId === "stok") renderStockTable();
  else if (pageId === "expdate") renderExpiredTable();
  else if (pageId === "pnl") { renderPnLTable(); initMarginChart(); }
  else if (pageId === "laporan") initReportCharts();
}
function initDashboard() {
  const dateEl = document.getElementById("dash-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }
  
  // Stats container
  const statsContainer = document.getElementById("stats-container");
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-card"><div class="stat-icon" style="background:#dbeafe"><i class="fas fa-box" style="color:#3b82f6"></i></div><div class="stat-label">Total Produk</div><div class="stat-value">1.256</div><div style="font-size:11px;color:#10b981"><i class="fas fa-arrow-up"></i> 8 baru hari ini</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5"><i class="fas fa-check-circle" style="color:#10b981"></i></div><div class="stat-label">In Stock</div><div class="stat-value">892</div><div style="font-size:11px;color:#64748b">71% dari total</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fee2e2"><i class="fas fa-exclamation-triangle" style="color:#dc2626"></i></div><div class="stat-label">Out of Stock</div><div class="stat-value">64</div><div style="font-size:11px;color:#dc2626">5% dari total</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fed7aa"><i class="fas fa-clock" style="color:#f97316"></i></div><div class="stat-label">Akan Expired</div><div class="stat-value">38</div><div style="font-size:11px;color:#f97316">≤30 hari</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#d1fae5"><i class="fas fa-chart-line" style="color:#10b981"></i></div><div class="stat-label">Penjualan</div><div class="stat-value">45,68 Jt</div><div style="font-size:11px;color:#10b981"><i class="fas fa-arrow-up"></i> 12,5%</div></div>
    `;
  }
  
  // Expired preview - FIXED
  const expiredPreview = document.getElementById("expired-preview");
  if (expiredPreview) {
    const expiring = productsData.filter(p => p.stock > 0 && daysUntil(p.expiry) <= 30)
      .sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry))
      .slice(0, 4);
    
    if (expiring.length === 0) {
      expiredPreview.innerHTML = `<div style="text-align:center;padding:20px;color:#10b981"><i class="fas fa-check-circle"></i> Semua produk aman!</div>`;
    } else {
      expiredPreview.innerHTML = expiring.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0">
          <div><span style="font-size:20px;margin-right:8px">${p.emoji}</span> ${p.name}</div>
          <div><span class="badge ${daysUntil(p.expiry) <= 7 ? 'badge-danger' : 'badge-warning'}">${daysUntil(p.expiry)} hari</span></div>
        </div>
      `).join("");
    }
  }
  
  // Charts - FIXED with timeout to ensure DOM is ready
  setTimeout(() => {
    if (typeof Chart !== "undefined") {
      // Doughnut chart
      const doughnutCtx = document.getElementById("doughnut-chart");
      if (doughnutCtx) {
        if (charts.doughnut) charts.doughnut.destroy();
        charts.doughnut = new Chart(doughnutCtx, {
          type: "doughnut",
          data: { 
            labels: ["In Stock", "Low Stock", "Out of Stock"], 
            datasets: [{ 
              data: [892, 300, 64], 
              backgroundColor: ["#10b981", "#f97316", "#dc2626"], 
              borderWidth: 0,
              hoverOffset: 8
            }] 
          },
          options: { 
            cutout: "60%", 
            responsive: true,
            maintainAspectRatio: true,
            plugins: { 
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} produk (${((ctx.raw/1256)*100).toFixed(1)}%)` } }
            } 
          }
        });
      }
      
      // Sales chart
      const salesCtx = document.getElementById("sales-chart");
      if (salesCtx) {
        if (charts.sales) charts.sales.destroy();
        charts.sales = new Chart(salesCtx, {
          type: "bar",
          data: { 
            labels: monthlySales.map(s => s.month), 
            datasets: [
              { label: "Penjualan", data: monthlySales.map(s => s.sales), backgroundColor: "#10b981", borderRadius: 8, barPercentage: 0.65 },
              { label: "Modal", data: monthlySales.map(s => s.cost), backgroundColor: "#3b82f6", borderRadius: 8, barPercentage: 0.65 }
            ] 
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: true,
            plugins: { 
              legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
              tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatRupiah(ctx.raw)}` } }
            },
            scales: { y: { ticks: { callback: (v) => (v/1e6).toFixed(0) + "Jt" } } }
          }
        });
      }
    } else {
      console.log("Chart.js not loaded yet");
    }
  }, 100);
    }
  }
}

// Products
function filterCat(btn, cat) {
  document.querySelectorAll("#category-filter .btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = cat;
  renderProducts();
}

function renderProducts() {
  const filtered = currentCategory === "all" ? productsData : productsData.filter(p => p.category === currentCategory);
  const grid = document.getElementById("product-grid");
  if (!grid) return;
  
  grid.innerHTML = filtered.map(p => `
    <div class="product-card ${selectedProduct?.id === p.id ? "selected" : ""}" onclick="selectProduct(${p.id})">
      <div class="product-emoji">${p.emoji}</div>
      <div class="product-name">${p.name}</div>
      <div style="font-size:11px;color:#64748b;margin:4px 0">${p.category}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span class="product-price">${formatRupiah(p.price)}</span>
        <span class="badge ${p.stock > p.minStock ? 'badge-success' : p.stock > 0 ? 'badge-warning' : 'badge-danger'}">${p.stock > 0 ? p.stock : "Habis"}</span>
      </div>
      ${p.stock > 0 ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="event.stopPropagation();addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Tambah</button>` : '<button class="btn btn-outline btn-sm" style="width:100%;margin-top:12px" disabled><i class="fas fa-ban"></i> Habis</button>'}
    </div>
  `).join("");
}

function selectProduct(id) {
  selectedProduct = productsData.find(p => p.id === id);
  renderProducts();
  updateCartSidebar();
}

function addToCart(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product || product.stock === 0) return;
  
  const qty = quantityMap[productId] || 1;
  const existing = cart.find(c => c.id === productId);
  if (existing) existing.qty += qty;
  else cart.push({ ...product, qty: qty });
  
  updateCartBadge();
  updateCartSidebar();
  saveToLocalStorage();
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
  const container = document.getElementById("cart-sidebar-container");
  if (!container) return;
  
  if (selectedProduct && !cart.length) {
    const p = selectedProduct;
    container.innerHTML = `
      <div>
        <div style="text-align:center;margin-bottom:16px"><span style="font-size:64px">${p.emoji}</span></div>
        <h3 style="font-size:16px;margin-bottom:4px">${p.name}</h3>
        <div style="font-size:20px;font-weight:700;color:#10b981;margin-bottom:12px">${formatRupiah(p.price)}</div>
        <div style="margin-bottom:16px"><span class="badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}">${p.stock > 0 ? `Stok: ${p.stock}` : "Stok Habis"}</span></div>
        <p style="font-size:12px;color:#64748b;margin-bottom:16px">Expired: ${p.expiry}</p>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
          <div style="display:flex;align-items:center;border:1px solid #e2e8f0;border-radius:10px">
            <button class="btn btn-outline btn-sm" style="border:none" onclick="changeQty(${p.id}, -1)">-</button>
            <span style="width:40px;text-align:center" id="qty-${p.id}">${quantityMap[p.id] || 1}</span>
            <button class="btn btn-outline btn-sm" style="border:none" onclick="changeQty(${p.id}, 1)">+</button>
          </div>
          <button class="btn btn-primary" style="flex:1" onclick="addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Tambah</button>
        </div>
      </div>
    `;
    return;
  }
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#94a3b8">
        <i class="fas fa-shopping-cart" style="font-size:48px;margin-bottom:12px"></i>
        <p>Keranjang kosong</p>
        <p style="font-size:11px;margin-top:4px">Pilih produk untuk mulai berbelanja</p>
      </div>
    `;
    return;
  }
  
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const total = subtotal + 2000;
  
  container.innerHTML = `
    <h3 style="font-size:14px;margin-bottom:16px">Keranjang (${cart.reduce((a,c)=>a+c.qty,0)} item)</h3>
    ${cart.map(c => `
      <div class="cart-item">
        <span>${c.emoji} ${c.name} ×${c.qty}</span>
        <span style="font-weight:600">${formatRupiah(c.price * c.qty)}</span>
      </div>
    `).join("")}
    <div class="cart-total">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Subtotal</span><span>${formatRupiah(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <span>Biaya Layanan</span><span>${formatRupiah(2000)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0">
        <span>Total</span><span style="color:#10b981">${formatRupiah(total)}</span>
      </div>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:16px" onclick="navigate('payment')"><i class="fas fa-arrow-right"></i> Checkout</button>
  `;
}

function changeQty(id, delta) {
  if (!quantityMap[id]) quantityMap[id] = 1;
  quantityMap[id] = Math.max(1, quantityMap[id] + delta);
  const qtyEl = document.getElementById(`qty-${id}`);
  if (qtyEl) qtyEl.textContent = quantityMap[id];
  saveToLocalStorage();
}

// Payment
function initPayment() {
  const methodsContainer = document.getElementById("payment-methods-list");
  if (methodsContainer) {
    methodsContainer.innerHTML = `
      <div class="payment-method active" onclick="selectPaymentMethod('qris')">
        <i class="fas fa-qrcode" style="font-size:24px"></i>
        <div style="flex:1"><div style="font-weight:600">QRIS</div><div style="font-size:11px;color:#64748b">Scan QR Code</div></div>
        <div class="payment-method-radio"></div>
      </div>
      <div class="payment-method" onclick="selectPaymentMethod('bca')">
        <i class="fas fa-university" style="font-size:24px"></i>
        <div style="flex:1"><div style="font-weight:600">Transfer Bank</div><div style="font-size:11px;color:#64748b">BCA, Mandiri, BNI, BRI</div></div>
        <div class="payment-method-radio"></div>
      </div>
      <div class="payment-method" onclick="selectPaymentMethod('ovo')">
        <i class="fas fa-mobile-alt" style="font-size:24px"></i>
        <div style="flex:1"><div style="font-weight:600">E-Wallet</div><div style="font-size:11px;color:#64748b">OVO, GoPay, DANA, ShopeePay</div></div>
        <div class="payment-method-radio"></div>
      </div>
    `;
  }
  
  updateOrderSummary();
}

function selectPaymentMethod(method) {
  document.querySelectorAll(".payment-method").forEach(m => m.classList.remove("active"));
  event.currentTarget.classList.add("active");
  updateOrderSummary();
}

function updateOrderSummary() {
  const container = document.getElementById("order-summary-container");
  if (!container) return;
  
  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#94a3b8">Keranjang kosong</p>`;
    return;
  }
  
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const total = subtotal + 2000;
  
  container.innerHTML = `
    ${cart.map(c => `
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <span>${c.name} ×${c.qty}</span>
        <span>${formatRupiah(c.price * c.qty)}</span>
      </div>
    `).join("")}
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span>Subtotal</span><span>${formatRupiah(subtotal)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span>Biaya Layanan</span><span>${formatRupiah(2000)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0">
      <span>Total</span><span style="color:#10b981;font-size:18px">${formatRupiah(total)}</span>
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="processPayment()"><i class="fas fa-check"></i> Bayar Sekarang</button>
  `;
}

function processPayment() {
  const successDiv = document.getElementById("payment-success");
  if (successDiv) successDiv.style.display = "block";
  cart = [];
  updateCartBadge();
  saveToLocalStorage();
  showToast("Pembayaran berhasil! Terima kasih telah berbelanja.");
  setTimeout(() => navigate("dashboard"), 2000);
}

// Product Table
function renderProductsTable() {
  const tbody = document.getElementById("products-table");
  if (!tbody) return;
  
  tbody.innerHTML = productsData.map(p => {
    const margin = ((p.price - p.cost) / p.price * 100).toFixed(1);
    return `<tr>
      <td><span style="font-size:24px;margin-right:8px">${p.emoji}</span> ${p.name}</td>
      <td>${p.category}</td>
      <td>${formatRupiah(p.price)}</td>
      <td>${formatRupiah(p.cost)}</td>
      <td style="color:${margin >= 20 ? '#10b981' : margin >= 0 ? '#f97316' : '#dc2626'}">${margin}%</td>
      <td>${p.stock}</td><td>${p.minStock}</td><td>${p.expiry}</td>
      <td><button class="btn btn-outline btn-sm" onclick="showToast('Edit ${p.name}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-danger btn-sm" onclick="showToast('Hapus ${p.name}')"><i class="fas fa-trash"></i></button></td>
    </tr>`;
  }).join("");
}

// Stock Table
function renderStockTable() {
  const tbody = document.getElementById("stock-table");
  if (!tbody) return;
  
  tbody.innerHTML = productsData.map(p => `
    <tr>
      <td><span style="font-size:24px;margin-right:8px">${p.emoji}</span> ${p.name}</td>
      <td>${p.category}</td>
      <td style="font-weight:600;color:${p.stock === 0 ? '#dc2626' : p.stock <= p.minStock ? '#f97316' : '#10b981'}">${p.stock}</td>
      <td>${p.minStock}</td>
      <td>${p.expiry}</td>
      <td><span class="badge ${p.stock === 0 ? 'badge-danger' : p.stock <= p.minStock ? 'badge-warning' : 'badge-success'}">${p.stock === 0 ? 'Habis' : p.stock <= p.minStock ? 'Low Stock' : 'Aman'}</span></td>
      <td><button class="btn btn-primary btn-sm" onclick="showToast('Update stok ${p.name}')"><i class="fas fa-sync-alt"></i> Update</button></td>
    </tr>`;
  }).join("");
}

// Expired Table
function renderExpiredTable() {
  const sorted = [...productsData].sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry));
  
  const critical = sorted.filter(p => daysUntil(p.expiry) <= 7).length;
  const warning = sorted.filter(p => daysUntil(p.expiry) > 7 && daysUntil(p.expiry) <= 30).length;
  const safe = sorted.filter(p => daysUntil(p.expiry) > 30).length;
  
  document.getElementById("critical-count").textContent = critical;
  document.getElementById("warning-count").textContent = warning;
  document.getElementById("safe-count").textContent = safe;
  
  const tbody = document.getElementById("expired-table");
  if (!tbody) return;
  
  tbody.innerHTML = sorted.map(p => {
    const days = daysUntil(p.expiry);
    const rec = days <= 7 ? "🔥 Flash Sale 30%" : days <= 14 ? "📦 Bundle Promo" : days <= 30 ? "🎯 Diskon 15%" : "✅ Normal";
    return `<tr>
      <td><span style="font-size:24px;margin-right:8px">${p.emoji}</span> ${p.name}</td>
      <td>${p.category}</td>
      <td>${p.stock}</td>
      <td>${p.expiry}</td>
      <td><span class="badge ${days <= 7 ? 'badge-danger' : days <= 30 ? 'badge-warning' : 'badge-success'}">${days} hari</span></td>
      <td>${rec}</td>
      <td><button class="btn btn-outline btn-sm" onclick="showToast('Promo diaktifkan untuk ${p.name}')"><i class="fas fa-tag"></i> Aktifkan Promo</button></td>
    </tr>`;
  }).join("");
}

// P&L Table
function renderPnLTable() {
  const tbody = document.getElementById("pnl-table");
  if (!tbody) return;
  
  tbody.innerHTML = pnlData.map(p => {
    const profit = p.sales - p.cost;
    return `<tr>
      <td><strong>${p.name}</strong></td>
      <td>${formatRupiah(p.sales)}</td>
      <td>${formatRupiah(p.cost)}</td>
      <td style="color:${profit >= 0 ? '#10b981' : '#dc2626'}">${formatRupiah(profit)}</td>
      <td style="color:${p.margin >= 20 ? '#10b981' : p.margin >= 0 ? '#f97316' : '#dc2626'}">${p.margin}%</td>
      <td><span class="badge ${p.status === 'Profit' ? 'badge-success' : p.status === 'Loss' ? 'badge-danger' : 'badge-warning'}">${p.status}</span></td>
    </tr>`;
  }).join("");
}

function initMarginChart() {
  if (typeof Chart === "undefined") return;
  const ctx = document.getElementById("margin-chart");
  if (!ctx) return;
  if (charts.margin) charts.margin.destroy();
  charts.margin = new Chart(ctx, {
    type: "bar",
    data: { labels: pnlData.map(p => p.name.split(" ")[0]), datasets: [{ label: "Margin (%)", data: pnlData.map(p => p.margin), backgroundColor: pnlData.map(p => p.margin >= 20 ? "#10b981" : p.margin >= 0 ? "#f97316" : "#dc2626"), borderRadius: 8 }] },
    options: { indexAxis: "y", responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
  });
}

function calculateMargin() {
  const price = parseFloat(document.getElementById("calc-price")?.value);
  const cost = parseFloat(document.getElementById("calc-cost")?.value);
  const qty = parseFloat(document.getElementById("calc-qty")?.value) || 1;
  
  if (!price || !cost) {
    showToast("Masukkan harga jual dan harga modal");
    return;
  }
  
  const profit = (price - cost) * qty;
  const margin = ((price - cost) / price) * 100;
  const bep = Math.ceil(cost / (price - cost));
  
  document.getElementById("calc-result").style.display = "grid";
  document.getElementById("calc-profit").innerHTML = profit >= 0 ? formatRupiah(profit) : formatRupiah(profit);
  document.getElementById("calc-margin").innerHTML = margin.toFixed(2) + "%";
  document.getElementById("calc-bep").innerHTML = bep + " unit";
  document.getElementById("calc-revenue").innerHTML = formatRupiah(price * qty);
}

function runAIAnalysis() {
  const container = document.getElementById("ai-analysis");
  if (!container) return;
  container.innerHTML = `<p style="font-size:12px;color:#475569"><i class="fas fa-spinner fa-pulse"></i> Menganalisis data...</p>`;
  setTimeout(() => {
    container.innerHTML = `
      <p style="font-size:12px;margin-bottom:12px"><strong>📊 Hasil Analisis AI:</strong></p>
      <ul style="margin-left:20px;font-size:12px;margin-bottom:12px">
        <li>2 produk merugi (Ayam Fillet & Minuman Cola)</li>
        <li>Rekomendasi: Naikkan harga Ayam Fillet 5-10%</li>
        <li>Cari supplier alternatif untuk minuman</li>
        <li>Fokus promosi ke 3 produk margin tertinggi</li>
      </ul>
      <div class="potential-box" style="background:#d1fae5;padding:12px;border-radius:12px">
        <div style="font-size:11px;color:#065f46">Potensi peningkatan profit</div>
        <div style="font-size:20px;font-weight:700;color:#10b981">Rp 2.850.000 <span style="font-size:12px">/bulan</span></div>
      </div>
    `;
  }, 1500);
}

// AI Insights
function generateInsights() {
  const grid = document.getElementById("insights-grid");
  if (!grid) return;
  
  const insights = [
    { title: "Optimasi Stok Minuman", desc: "Penjualan minuman meningkat 32% di akhir pekan berdasarkan data 4 minggu terakhir.", action: "Tambah stok 20% setiap Kamis-Jumat", priority: "high", category: "Inventory" },
    { title: "Produk Mendekati Expired", desc: "8 produk akan kadaluarsa dalam 14 hari ke depan dengan total nilai Rp 4,2 juta.", action: "Buat bundle promo diskon 30%", priority: "high", category: "Expiry" },
    { title: "Margin Negatif Terdeteksi", desc: "Ayam Fillet dan Minuman Cola memiliki margin negatif selama 2 bulan berturut-turut.", action: "Evaluasi harga jual atau cari supplier baru", priority: "high", category: "Finance" },
    { title: "Cross-Selling Opportunity", desc: "Pembeli Susu Ultra Milk 78% juga membeli Roti Tawar dalam transaksi yang sama.", action: "Buat paket hemat susu + roti", priority: "medium", category: "Sales" },
    { title: "Rekomendasi Supplier Baru", desc: "Harga daging sapi Anda 12% di atas rata-rata pasar Jakarta.", action: "Cek harga dari 3 supplier alternatif", priority: "medium", category: "Procurement" },
    { title: "Jam Sibuk Toko", desc: "Puncak pembelian terjadi pukul 16.00-19.00 (weekday) dan 10.00-12.00 (weekend).", action: "Tambah kasir di jam sibuk", priority: "low", category: "Operations" }
  ];
  
  grid.innerHTML = insights.map(ins => `
    <div class="insight-card" style="border-top-color: ${ins.priority === 'high' ? '#dc2626' : ins.priority === 'medium' ? '#f97316' : '#10b981'}">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px">
        <h3 style="font-size:14px;font-weight:700">${ins.title}</h3>
        <span class="badge ${ins.priority === 'high' ? 'badge-danger' : ins.priority === 'medium' ? 'badge-warning' : 'badge-success'}">${ins.priority === 'high' ? 'Prioritas' : ins.priority === 'medium' ? 'Sedang' : 'Rendah'}</span>
      </div>
      <p style="font-size:12px;color:#475569;margin-bottom:12px">${ins.desc}</p>
      <div style="background:#f8fafc;border-radius:10px;padding:10px">
        <span style="font-size:12px;font-weight:600"><i class="fas fa-bullhorn"></i> → ${ins.action}</span>
      </div>
      <div style="font-size:10px;color:#94a3b8;margin-top:8px"><i class="fas fa-folder"></i> ${ins.category}</div>
    </div>
  `).join("");
}

function askAdvisor() {
  const question = document.getElementById("advisor-question")?.value;
  if (!question) {
    showToast("Masukkan pertanyaan Anda terlebih dahulu");
    return;
  }
  
  const answerDiv = document.getElementById("advisor-answer");
  const textEl = document.getElementById("advisor-text");
  if (!answerDiv || !textEl) return;
  
  answerDiv.style.display = "block";
  textEl.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> AI sedang menganalisis...';
  
  setTimeout(() => {
    const answers = {
      default: "Terima kasih atas pertanyaannya. Untuk meningkatkan performa bisnis, fokus pada 3 hal utama: optimasi stok, monitoring margin, dan promosi produk mendekati expired."
    };
    textEl.innerHTML = answers.default;
  }, 1500);
}

// Report Charts
function initReportCharts() {
    if (typeof Chart === "undefined") return;

    // Line Chart untuk Laporan
    const lineCtx = document.getElementById("report-line-chart");
    if (lineCtx) {
        if (charts.reportLine) charts.reportLine.destroy();
        charts.reportLine = new Chart(lineCtx, {
            type: "line",
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "Mei"],
                datasets: [
                    {
                        label: "Penjualan",
                        data: [32000000, 38000000, 41000000, 36000000, 45680000],
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: "#10b981",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: "Modal",
                        data: [21000000, 25000000, 27000000, 24000000, 28250000],
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59, 130, 246, 0.05)",
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: "#3b82f6",
                        pointBorderColor: "#fff",
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: "top",
                        labels: { boxWidth: 12, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let value = context.raw;
                                return context.dataset.label + ": Rp " + value.toLocaleString("id-ID");
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return (value / 1000000).toFixed(0) + " Jt";
                            }
                        }
                    }
                }
            }
        });
    }

    // Pie Chart untuk Laporan
    const pieCtx = document.getElementById("report-pie-chart");
    if (pieCtx) {
        if (charts.reportPie) charts.reportPie.destroy();
        charts.reportPie = new Chart(pieCtx, {
            type: "doughnut",
            data: {
                labels: ["Minuman", "Protein", "Dairy", "Bakery"],
                datasets: [{
                    data: [35, 28, 20, 17],
                    backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f97316"],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { boxWidth: 12, font: { size: 11 } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ": " + context.raw + "%";
                            }
                        }
                    }
                },
                cutout: "55%"
            }
        });
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadFromLocalStorage();
  initDashboard();
  renderProducts();
  renderProductsTable();
  renderStockTable();
  renderExpiredTable();
  renderPnLTable();
  initMarginChart();
  initReportCharts();
  showToast("SmartStock siap digunakan");
});

// Global functions
window.navigate = navigate;
window.filterCat = filterCat;
window.selectProduct = selectProduct;
window.addToCart = addToCart;
window.changeQty = changeQty;
window.selectPaymentMethod = selectPaymentMethod;
window.processPayment = processPayment;
window.calculateMargin = calculateMargin;
window.runAIAnalysis = runAIAnalysis;
window.generateInsights = generateInsights;
window.askAdvisor = askAdvisor;
window.showToast = showToast;
