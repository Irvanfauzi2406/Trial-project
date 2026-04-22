/* =========================================================
   SmartStock AI — app.js (FULL WORKING VERSION FOR VERCEL)
   ========================================================= */

/* ── DEVELOPMENT MODE ── */
const IS_DEV = true;

/* ── DATA ── */
const PRODUCTS = [
  { id:1, name:"Susu Ultra Milk 1L",    cat:"Minuman", stock:142, min:50,  price:18500,  cost:13000, exp:"2025-05-28", em:"🥛" },
  { id:2, name:"Yogurt Strawberry",     cat:"Dairy",   stock:38,  min:30,  price:12000,  cost:7500,  exp:"2025-06-02", em:"🍓" },
  { id:3, name:"Daging Sapi 500g",      cat:"Protein", stock:25,  min:20,  price:85000,  cost:70000, exp:"2025-06-05", em:"🥩" },
  { id:4, name:"Roti Tawar",            cat:"Bakery",  stock:60,  min:40,  price:12000,  cost:7200,  exp:"2025-06-10", em:"🍞" },
  { id:5, name:"Ayam Fillet 500g",      cat:"Protein", stock:18,  min:25,  price:55000,  cost:42000, exp:"2025-06-15", em:"🍗" },
  { id:6, name:"Telur Ayam Negeri",     cat:"Protein", stock:200, min:50,  price:27000,  cost:22000, exp:"2025-07-01", em:"🥚" },
  { id:7, name:"Minuman Kaleng 330ml",  cat:"Minuman", stock:0,   min:30,  price:8500,   cost:6000,  exp:"2025-12-01", em:"🥤" },
  { id:8, name:"Keju Slice",            cat:"Dairy",   stock:12,  min:20,  price:35000,  cost:28000, exp:"2025-06-20", em:"🧀" },
];

const PNL_DATA = [
  { name:"Susu Ultra Milk 1L",   sell:8550000, cost:5100000, margin:40.35, status:"Profit"     },
  { name:"Roti Tawar",           sell:3600000, cost:2160000, margin:40.00, status:"Profit"     },
  { name:"Yogurt Strawberry",    sell:2875000, cost:1800000, margin:37.39, status:"Profit"     },
  { name:"Daging Sapi",          sell:6200000, cost:5890000, margin:5.00,  status:"Low Margin" },
  { name:"Ayam Fillet",          sell:4100000, cost:4350000, margin:-6.10, status:"Loss"       },
  { name:"Minuman Kaleng",       sell:2050000, cost:2200000, margin:-7.32, status:"Loss"       },
];

const SALES_DATA = [
  { m:"Jan", s:32000000, c:21000000 },
  { m:"Feb", s:38000000, c:25000000 },
  { m:"Mar", s:41000000, c:27000000 },
  { m:"Apr", s:36000000, c:24000000 },
  { m:"Mei", s:45680000, c:28250000 },
];

/* ── STATE ── */
let cart        = [];
let selProduct  = null;
let payMethod   = "qris";
let cdSec       = 899;
let cdTimer     = null;
let qtyMap      = {};
let charts      = {};

/* =========================================================
   UTILS
   ========================================================= */
const rp = v => "Rp " + Number(v).toLocaleString("id-ID");
const daysUntil = d => Math.ceil((new Date(d) - new Date()) / 86400000);

function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.innerHTML = '<span id="toast-msg"></span>';
    document.body.appendChild(el);
  }
  const msgEl = document.getElementById("toast-msg");
  if (msgEl) msgEl.textContent = msg;
  el.className = "show";
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('smartstock_cart', JSON.stringify(cart));
    localStorage.setItem('smartstock_qtyMap', JSON.stringify(qtyMap));
  } catch(e) {}
}

function loadFromLocalStorage() {
  try {
    const savedCart = localStorage.getItem('smartstock_cart');
    const savedQtyMap = localStorage.getItem('smartstock_qtyMap');
    if (savedCart) cart = JSON.parse(savedCart);
    if (savedQtyMap) qtyMap = JSON.parse(savedQtyMap);
    updateCartBadge();
  } catch(e) {}
}

/* =========================================================
   NAVIGATION
   ========================================================= */
function navigate(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  
  const page = document.getElementById("page-" + id);
  if (page) page.classList.add("active");
  
  document.querySelectorAll(".nav-item").forEach(b => {
    if (b.dataset.page === id) b.classList.add("active");
  });
  
  // Initialize page
  if (id === 'dashboard') initDashboard();
  else if (id === 'penjualan') { renderProducts(); if (selProduct) renderAside(); }
  else if (id === 'payment') initPayment();
  else if (id === 'produk') initProdukPage();
  else if (id === 'stok') initStokPage();
  else if (id === 'expdate') initExpDate();
  else if (id === 'laporan') setTimeout(initLaporan, 100);
  else if (id === 'pnl') setTimeout(initPnL, 100);
  else if (id === 'aiinsight') { if (document.getElementById("insights-grid")) generateInsights(); }
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function initDashboard() {
  const dateEl = document.getElementById("dash-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });
  }
  
  // Expiry list
  const expItems = PRODUCTS
    .filter(p => p.stock > 0 && daysUntil(p.exp) <= 30)
    .sort((a, b) => daysUntil(a.exp) - daysUntil(b.exp));
  
  const expList = document.getElementById("exp-list");
  if (expList) {
    expList.innerHTML = expItems.map(p => {
      const d = daysUntil(p.exp);
      const cls = d <= 7 ? "b-red" : d <= 14 ? "b-amber" : "b-blue";
      const rec = d <= 7 ? "Flash Sale" : d <= 14 ? "Bundling" : "Promo";
      return `
        <div class="exp-item">
          <div>
            <div class="exp-prod-name">${p.em} ${p.name}</div>
            <div class="exp-prod-date">${p.exp}</div>
          </div>
          <div style="text-align:right">
            <div class="exp-days-chip badge ${cls}">${d} hari</div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${rec}</div>
          </div>
        </div>`;
    }).join("");
  }
  
  // Try to create charts if Chart.js is available
  if (typeof Chart !== 'undefined') {
    try {
      // Donut chart
      const ctx1 = document.getElementById("dash-pie");
      if (ctx1) {
        if (charts.dashPie) charts.dashPie.destroy();
        charts.dashPie = new Chart(ctx1, {
          type: "doughnut",
          data: {
            labels: ["In Stock", "Low Stock", "Out of Stock"],
            datasets: [{
              data: [892, 300, 64],
              backgroundColor: ["#16a34a", "#d97706", "#dc2626"],
              borderWidth: 0,
            }]
          },
          options: { cutout: "68%", plugins: { legend: { display: false } } }
        });
      }
      
      // Bar chart
      const ctx2 = document.getElementById("dash-bar");
      if (ctx2) {
        if (charts.dashBar) charts.dashBar.destroy();
        charts.dashBar = new Chart(ctx2, {
          type: "bar",
          data: {
            labels: SALES_DATA.map(s => s.m),
            datasets: [
              { label: "Penjualan", data: SALES_DATA.map(s => s.s), backgroundColor: "#16a34a", borderRadius: 6 },
              { label: "Modal", data: SALES_DATA.map(s => s.c), backgroundColor: "#bfdbfe", borderRadius: 6 },
            ]
          },
          options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } }
        });
      }
    } catch(e) { console.log("Chart error:", e); }
  }
}

/* =========================================================
   STORE / PENJUALAN
   ========================================================= */
let currentCat = "all";

function filterCat(btn, cat) {
  document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCat = cat;
  renderProducts();
}

function renderProducts() {
  const list = currentCat === "all" ? PRODUCTS : PRODUCTS.filter(p => p.cat === currentCat);
  const grid = document.getElementById("prod-grid");
  if (!grid) return;
  
  grid.innerHTML = list.map(p => `
    <div class="prod-card ${selProduct?.id === p.id ? "selected" : ""}" onclick="selectProduct(${p.id})">
      <span class="prod-emoji">${p.em}</span>
      <div class="prod-name">${p.name}</div>
      <div class="prod-cat-tag">${p.cat}</div>
      <div class="prod-footer">
        <span class="prod-price">${rp(p.price)}</span>
        <span class="badge ${p.stock > p.min ? "b-green" : p.stock > 0 ? "b-amber" : "b-red"}">
          ${p.stock > 0 ? "Stok: " + p.stock : "Habis"}
        </span>
      </div>
      ${p.stock > 0 ? 
        `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="event.stopPropagation();addToCart(${p.id})">+ Keranjang</button>` :
        `<button class="btn btn-outline btn-sm" style="width:100%;margin-top:12px" disabled>Stok Habis</button>`}
    </div>
  `).join("");
}

function selectProduct(id) {
  selProduct = PRODUCTS.find(p => p.id === id);
  renderProducts();
  renderAside();
}

function renderAside() {
  const aside = document.getElementById("aside-content");
  if (!aside || !selProduct) return;
  const p = selProduct;
  
  aside.innerHTML = `
    <div class="aside-inner">
      <span class="aside-emoji">${p.em}</span>
      <div class="aside-name">${p.name}</div>
      <div class="aside-price">${rp(p.price)}</div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:14px">
        <span class="aside-stock-dot" style="background:${p.stock > 0 ? "#16a34a" : "#dc2626"}"></span>
        <span style="font-size:12px;font-weight:600;color:${p.stock > 0 ? "var(--green)" : "var(--red)"}">
          ${p.stock > 0 ? "Stok tersedia (" + p.stock + ")" : "Stok habis"}
        </span>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">
        Exp Date: <strong style="color:var(--amber)">${p.exp}</strong>
      </p>
      
      <div class="pickup-box">
        <div class="pickup-title">
          <span>📦 Metode Pengambilan</span>
          <span class="badge b-blue">Pickup Only</span>
        </div>
        <p style="font-size:11px;color:var(--blue);opacity:.8">Hanya tersedia di lokasi toko kami.</p>
      </div>
      
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div class="qty-wrap">
          <button class="qty-btn" onclick="chgQty(${p.id},-1)">−</button>
          <span class="qty-val" id="qty-${p.id}">${qtyMap[p.id] || 1}</span>
          <button class="qty-btn" onclick="chgQty(${p.id},1)">+</button>
        </div>
        ${p.stock > 0 ?
          `<button class="btn btn-primary" style="flex:1" onclick="addToCart(${p.id})">Tambah ke Keranjang</button>` :
          `<button class="btn btn-outline" style="flex:1" disabled>Stok Habis</button>`}
      </div>
      
      ${cart.length > 0 ? `
      <div class="cart-mini">
        <div style="font-size:12px;font-weight:700;margin-bottom:10px">
          🛒 Keranjang (${cart.reduce((a,c) => a+c.qty, 0)} item)
        </div>
        ${cart.map(c => `
          <div class="cart-row">
            <span>${c.em} ${c.name} ×${c.qty}</span>
            <span style="font-weight:700">${rp(c.price * c.qty)}</span>
          </div>
        `).join("")}
        <div class="cart-total-row">
          <span>Total</span>
          <span style="color:var(--green);font-weight:800">${rp(cart.reduce((a,c) => a+c.price*c.qty,0) + 2000)}</span>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;margin-top:10px" onclick="navigate('payment')">
          Checkout →
        </button>
      </div>` : ""}
    </div>
  `;
}

function chgQty(id, delta) {
  if (!qtyMap[id]) qtyMap[id] = 1;
  qtyMap[id] = Math.max(1, qtyMap[id] + delta);
  const el = document.getElementById("qty-" + id);
  if (el) el.textContent = qtyMap[id];
  saveToLocalStorage();
}

function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock === 0) return;
  const qty = qtyMap[id] || 1;
  const ex = cart.find(c => c.id === id);
  if (ex) ex.qty += qty;
  else cart.push({ ...p, qty });
  updateCartBadge();
  renderAside();
  saveToLocalStorage();
  toast("✓ " + p.name + " ditambahkan");
}

function updateCartBadge() {
  const total = cart.reduce((a, c) => a + c.qty, 0);
  const el = document.getElementById("cart-badge");
  if (el) {
    el.textContent = total;
    el.style.display = total > 0 ? "inline-flex" : "none";
  }
}

/* =========================================================
   PAYMENT
   ========================================================= */
const PAY_METHODS = [
  { id:"qris", ico:"▦", name:"QRIS", sub:"Bayar dengan QR Code" },
  { id:"va", ico:"🏦", name:"Virtual Account", sub:"BCA, Mandiri, BRI" },
  { id:"ew", ico:"📱", name:"E-Wallet", sub:"OVO, GoPay, DANA" },
  { id:"cc", ico:"💳", name:"Kartu Kredit", sub:"Visa, Mastercard" },
];

function initPayment() {
  renderMethods();
  renderPayDetail();
  renderPaySummary();
  startCountdown();
}

function renderMethods() {
  const el = document.getElementById("methods-list");
  if (!el) return;
  el.innerHTML = PAY_METHODS.map(m => `
    <button class="method-btn ${m.id === payMethod ? "active" : ""}" onclick="selectMethod('${m.id}')">
      <span class="method-ico">${m.ico}</span>
      <div style="flex:1">
        <div class="method-name">${m.name}</div>
        <div class="method-sub">${m.sub}</div>
      </div>
      <div class="method-radio"></div>
    </button>
  `).join("");
}

function selectMethod(id) {
  payMethod = id;
  renderMethods();
  renderPayDetail();
}

function renderPayDetail() {
  const m = PAY_METHODS.find(x => x.id === payMethod);
  const titleEl = document.getElementById("pay-method-title");
  const bodyEl = document.getElementById("pay-method-body");
  if (!titleEl || !bodyEl) return;
  titleEl.textContent = m.name;
  
  bodyEl.innerHTML = `
    <div style="text-align:center;padding:20px">
      <div style="font-size:48px;margin-bottom:14px">${m.ico}</div>
      <p style="font-size:14px;font-weight:700;margin-bottom:8px">${m.name}</p>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:20px">Klik konfirmasi untuk melanjutkan</p>
      <button class="btn btn-primary btn-xl" onclick="simulatePay()">Konfirmasi Pembayaran</button>
    </div>
  `;
}

function startCountdown() {
  if (cdTimer) clearInterval(cdTimer);
  cdSec = 899;
  cdTimer = setInterval(() => {
    cdSec--;
    const el = document.getElementById("countdown-el");
    if (el) {
      const mm = String(Math.floor(cdSec / 60)).padStart(2, "0");
      const ss = String(cdSec % 60).padStart(2, "0");
      el.textContent = mm + ":" + ss;
    }
    if (cdSec <= 0) clearInterval(cdTimer);
  }, 1000);
}

function renderPaySummary() {
  const sub = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const tot = sub + 2000;
  const el = document.getElementById("pay-summary");
  if (!el) return;
  
  if (cart.length === 0) {
    el.innerHTML = `<div style="text-align:center;padding:32px">🛒 Keranjang kosong</div>`;
    return;
  }
  
  el.innerHTML = `
    ${cart.map(c => `
      <div class="summary-item">
        <span style="font-size:24px">${c.em}</span>
        <div style="flex:1">
          <div style="font-weight:600">${c.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">${c.qty} × ${rp(c.price)}</div>
        </div>
        <div style="font-weight:700">${rp(c.price * c.qty)}</div>
      </div>
    `).join("")}
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:5px">
      <span>Subtotal</span><span>${rp(sub)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:10px">
      <span>Biaya Layanan</span><span>${rp(2000)}</span>
    </div>
    <div class="summary-total-row">
      <span style="font-weight:700">Total</span>
      <span style="font-size:18px;font-weight:800;color:var(--green)">${rp(tot)}</span>
    </div>
  `;
}

function simulatePay() {
  clearInterval(cdTimer);
  const successDiv = document.getElementById("pay-success");
  if (successDiv) successDiv.style.display = "block";
  cart = [];
  updateCartBadge();
  saveToLocalStorage();
  toast("🎉 Pembayaran berhasil!");
}

/* =========================================================
   EXP DATE PAGE
   ========================================================= */
function initExpDate() {
  const items = PRODUCTS.map(p => ({ ...p, days: daysUntil(p.exp) })).sort((a, b) => a.days - b.days);
  
  const kritis = document.getElementById("exp-kritis");
  const warning = document.getElementById("exp-warning");
  const safe = document.getElementById("exp-safe");
  if (kritis) kritis.textContent = items.filter(i => i.days <= 7).length;
  if (warning) warning.textContent = items.filter(i => i.days > 7 && i.days <= 30).length;
  if (safe) safe.textContent = items.filter(i => i.days > 30).length;
  
  const tbody = document.getElementById("exp-tbody");
  if (tbody) {
    tbody.innerHTML = items.map(p => {
      const d = p.days;
      const cls = d <= 7 ? "b-red" : d <= 30 ? "b-amber" : "b-green";
      const rec = d <= 7 ? "🔥 Flash Sale" : d <= 14 ? "📦 Bundling" : d <= 30 ? "🎯 Promo" : "✅ Normal";
      return `<tr>
        <td><div class="td-name"><span>${p.em}</span>${p.name}</div></td>
        <td>${p.cat}</td><td>${p.stock}</td>
        <td>${p.exp}</td><td><span class="badge ${cls}">${d} hari</span></td>
        <td style="font-weight:700">${rec}</td>
        <td><button class="btn btn-outline btn-sm" onclick="toast('Promo diaktifkan')">Aktifkan</button></td>
      </tr>`;
    }).join("");
  }
}

/* =========================================================
   PRODUK PAGE
   ========================================================= */
function initProdukPage() {
  const tbody = document.getElementById("produk-tbody");
  if (!tbody) return;
  tbody.innerHTML = PRODUCTS.map(p => {
    const mg = (((p.price - p.cost) / p.price) * 100).toFixed(1);
    return `<tr>
      <td><div class="td-name"><span>${p.em}</span>${p.name}</div></td>
      <td>${p.cat}</td><td class="val-profit">${rp(p.price)}</td>
      <td>${rp(p.cost)}</td><td class="${mg >= 20 ? 'val-profit' : 'val-low'}">${mg}%</td>
      <td style="font-weight:700;color:${p.stock===0?'var(--red)':p.stock<=p.min?'var(--amber)':'var(--green)'}">${p.stock}</td>
      <td>${p.min}</td><td>${p.exp}</td>
      <td><button class="btn btn-outline btn-sm" onclick="toast('Edit ${p.name}')">Edit</button></td>
    </tr>`;
  }).join("");
}

/* =========================================================
   STOK PAGE
   ========================================================= */
function initStokPage() {
  const tbody = document.getElementById("stok-tbody");
  if (!tbody) return;
  tbody.innerHTML = PRODUCTS.map(p => `<tr>
    <td><div class="td-name"><span>${p.em}</span>${p.name}</div></td>
    <td>${p.cat}</td>
    <td style="font-weight:700;color:${p.stock===0?'var(--red)':p.stock<=p.min?'var(--amber)':'var(--green)'}">${p.stock}</td>
    <td>${p.min}</td><td>${p.exp}</td>
    <td><button class="btn btn-primary btn-sm" onclick="toast('Update stok ${p.name}')">Update</button></td>
  </tr>`).join("");
}

/* =========================================================
   P&L PAGE
   ========================================================= */
function initPnL() {
  const tbody = document.getElementById("pnl-tbody");
  if (tbody) {
    tbody.innerHTML = PNL_DATA.map(d => {
      const profit = d.sell - d.cost;
      const bdg = d.status === "Profit" ? "b-green" : d.status === "Loss" ? "b-red" : "b-amber";
      return `<tr>
        <td>${d.name}</td><td>${rp(d.sell)}</td><td>${rp(d.cost)}</td>
        <td class="${profit >= 0 ? 'val-profit' : 'val-loss'}">${rp(profit)}</td>
        <td class="${d.margin >= 20 ? 'val-profit' : d.margin >= 0 ? 'val-low' : 'val-loss'}">${d.margin}%</td>
        <td><span class="badge ${bdg}">${d.status}</span></td>
      </tr>`;
    }).join("");
  }
  
  // Chart if available
  if (typeof Chart !== 'undefined') {
    const ctx = document.getElementById("pnl-chart");
    if (ctx) {
      if (charts.pnl) charts.pnl.destroy();
      charts.pnl = new Chart(ctx, {
        type: "bar",
        data: {
          labels: PNL_DATA.map(d => d.name.split(" ")[0]),
          datasets: [{
            label: "Margin %",
            data: PNL_DATA.map(d => d.margin),
            backgroundColor: PNL_DATA.map(d => d.margin >= 20 ? "#16a34a" : d.margin >= 0 ? "#d97706" : "#dc2626"),
            borderRadius: 5,
          }]
        },
        options: { indexAxis: "y", responsive: true, plugins: { legend: { display: false } } }
      });
    }
  }
}

function calcMargin() {
  const sell = parseFloat(document.getElementById("calc-sell")?.value);
  const cost = parseFloat(document.getElementById("calc-cost")?.value);
  const qty = parseFloat(document.getElementById("calc-qty")?.value) || 1;
  if (!sell || !cost) { toast("Isi harga jual dan modal"); return; }
  const profit = (sell - cost) * qty;
  const margin = ((sell - cost) / sell) * 100;
  
  const resultDiv = document.getElementById("calc-result");
  if (resultDiv) resultDiv.style.display = "grid";
  const rProfit = document.getElementById("r-profit");
  const rMargin = document.getElementById("r-margin");
  const rBep = document.getElementById("r-bep");
  const rRev = document.getElementById("r-rev");
  if (rProfit) rProfit.innerHTML = profit >= 0 ? rp(profit) : rp(profit);
  if (rMargin) rMargin.innerHTML = margin.toFixed(2) + "%";
  if (rBep) rBep.textContent = Math.ceil(cost / (sell - cost)) + " unit";
  if (rRev) rRev.textContent = rp(sell * qty);
}

async function pnlAI() {
  const btn = document.getElementById("btn-pnl-ai");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Analyzing...`;
  }
  const box = document.getElementById("pnl-ai-body");
  if (box) {
    setTimeout(() => {
      box.innerHTML = `
        <p class="ai-body">📊 <strong>Analisis:</strong> 2 produk merugi (Ayam Fillet & Minuman Kaleng).<br><br>
        💡 <strong>Rekomendasi:</strong><br>
        • Naikkan harga Ayam Fillet 5%<br>
        • Cari supplier baru untuk minuman<br>
        • Fokus promosi ke 3 produk profit tertinggi</p>
        <div class="potential-box">
          <div class="potential-label">Potensi peningkatan profit</div>
          <div class="potential-value">Rp 2.850.000 <span style="font-size:13px">/bulan</span></div>
        </div>`;
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = "🤖 Analyze AI";
      }
    }, 1000);
  }
}

/* =========================================================
   AI INSIGHTS
   ========================================================= */
async function generateInsights() {
  const btn = document.getElementById("btn-insights");
  const grid = document.getElementById("insights-grid");
  if (!grid) return;
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Generating...`;
  }
  
  const mockInsights = [
    { title: "Optimasi Stok Minuman", description: "Minuman meningkat 32% di akhir pekan.", priority: "high", category: "Inventory", action: "Tambah stok 20% setiap Kamis" },
    { title: "Produk Expired Mendekat", description: "8 produk akan expired dalam 14 hari.", priority: "high", category: "Expiry", action: "Buat bundle promo diskon" },
    { title: "Margin Negatif", description: "2 produk memiliki margin negatif.", priority: "high", category: "Finance", action: "Evaluasi harga jual" },
    { title: "Peluang Cross-Selling", description: "Pembeli susu cenderung beli roti.", priority: "medium", category: "Sales", action: "Buat paket hemat" },
  ];
  
  const PCOLORS = { high: "#dc2626", medium: "#d97706", low: "#16a34a" };
  const PBADGE = { high: "b-red", medium: "b-amber", low: "b-green" };
  
  grid.innerHTML = mockInsights.map(ins => `
    <div class="insight-card" style="border-top-color:${PCOLORS[ins.priority]}">
      <div style="display:flex;justify-content:space-between;margin-bottom:7px">
        <div class="insight-card-title">${ins.title}</div>
        <span class="badge ${PBADGE[ins.priority]}">${ins.priority}</span>
      </div>
      <p class="insight-card-desc">${ins.description}</p>
      <div class="insight-action-box">
        <p class="insight-action-txt">→ ${ins.action}</p>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:7px">📂 ${ins.category}</div>
    </div>
  `).join("");
  
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = "✨ Generate Insights";
  }
}

async function askAdvisor() {
  const q = document.getElementById("advisor-q")?.value;
  if (!q) return;
  const ans = document.getElementById("advisor-answer");
  const txt = document.getElementById("advisor-text");
  if (ans) ans.style.display = "block";
  if (txt) txt.textContent = "AI sedang menganalisa...";
  
  setTimeout(() => {
    if (txt) {
      txt.textContent = "Terima kasih atas pertanyaannya. Untuk hasil terbaik, pastikan data stok dan penjualan Anda selalu terupdate secara berkala.";
    }
  }, 800);
}

/* =========================================================
   LAPORAN PAGE
   ========================================================= */
function initLaporan() {
  if (typeof Chart !== 'undefined') {
    const ctx1 = document.getElementById("laporan-line");
    if (ctx1) {
      if (charts.lapLine) charts.lapLine.destroy();
      charts.lapLine = new Chart(ctx1, {
        type: "line",
        data: {
          labels: SALES_DATA.map(s => s.m),
          datasets: [
            { label: "Penjualan", data: SALES_DATA.map(s => s.s), borderColor: "#16a34a", backgroundColor: "rgba(22,163,74,.1)", fill: true, tension: 0.3 },
            { label: "Modal", data: SALES_DATA.map(s => s.c), borderColor: "#2563eb", backgroundColor: "rgba(37,99,235,.05)", fill: true, tension: 0.3 },
          ]
        },
        options: { responsive: true, maintainAspectRatio: true }
      });
    }
    
    const ctx2 = document.getElementById("laporan-pie");
    if (ctx2) {
      if (charts.lapPie) charts.lapPie.destroy();
      charts.lapPie = new Chart(ctx2, {
        type: "doughnut",
        data: {
          labels: ["Minuman", "Protein", "Dairy", "Bakery"],
          datasets: [{ data: [35, 28, 20, 17], backgroundColor: ["#16a34a", "#2563eb", "#0891b2", "#d97706"] }]
        },
        options: { plugins: { legend: { position: "right" } }, cutout: "55%" }
      });
    }
  }
}

/* =========================================================
   EXPOSE GLOBAL FUNCTIONS
   ========================================================= */
window.navigate = navigate;
window.filterCat = filterCat;
window.selectProduct = selectProduct;
window.addToCart = addToCart;
window.chgQty = chgQty;
window.selectMethod = selectMethod;
window.simulatePay = simulatePay;
window.calcMargin = calcMargin;
window.pnlAI = pnlAI;
window.generateInsights = generateInsights;
window.askAdvisor = askAdvisor;
window.toast = toast;

/* =========================================================
   BOOTSTRAP
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("SmartStock AI starting...");
  loadFromLocalStorage();
  initDashboard();
  initExpDate();
  initProdukPage();
  initStokPage();
  renderProducts();
  initPayment();
  navigate('dashboard');
  toast("✨ SmartStock AI siap!");
});
