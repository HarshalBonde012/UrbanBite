const currentUser = JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");
if (!currentUser || currentUser.role !== "admin") {
  alert("Admin login required. Use admin@urbanbite.in / admin123");
  window.location.href = "login.html";
}

let menu = getMenuData();
const toast = document.getElementById("toast");
const itemModal = document.getElementById("itemModal");

function money(v) { return `₹${Math.round(v)}`; }
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function getOrders() { return JSON.parse(localStorage.getItem("urbanbite_orders") || "[]"); }
function getBookings() { return JSON.parse(localStorage.getItem("urbanbite_bookings") || "[]"); }

function renderDashboard() {
  const orders = getOrders();
  const bookings = getBookings();
  document.getElementById("statOrders").textContent = orders.length;
  document.getElementById("statRevenue").textContent = money(orders.reduce((s, o) => s + Number(o.total || 0), 0));
  document.getElementById("statMenu").textContent = menu.length;
  document.getElementById("statBookings").textContent = bookings.length;

  const box = document.getElementById("recentOrders");
  if (!orders.length) {
    box.innerHTML = `<div class="empty-state">No orders yet. Place a demo order from the website.</div>`;
    return;
  }

  box.innerHTML = orders.slice(0, 5).map(order => `
    <div class="recent-order">
      <div><strong>${order.id}</strong><small>${order.customer} • ${order.orderType}</small></div>
      <div><strong>${money(order.total)}</strong><small>${order.status}</small></div>
    </div>
  `).join("");
}

function renderMenuTable() {
  document.getElementById("adminMenuBody").innerHTML = menu.map(item => `
    <tr>
      <td><strong>${item.emoji} ${item.name}</strong></td>
      <td>${item.category}</td>
      <td>${money(item.price)}</td>
      <td>${item.type}</td>
      <td><button class="delete-btn" data-delete-item="${item.id}">Delete</button></td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-delete-item]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this dish?")) return;
      menu = menu.filter(item => item.id !== Number(btn.dataset.deleteItem));
      saveMenuData(menu);
      renderAll();
      showToast("Dish deleted");
    });
  });
}

function renderOrders() {
  const orders = getOrders();
  const tbody = document.getElementById("ordersBody");
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="5">No orders available.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>${order.id}</strong><br><small>${new Date(order.createdAt).toLocaleString()}</small></td>
      <td>${order.customer}<br><small>${order.phone}</small></td>
      <td>${money(order.total)}</td>
      <td>${order.orderType}</td>
      <td>
        <select class="status-select" data-order-id="${order.id}">
          ${["Received", "Preparing", "Ready", "Out for Delivery", "Completed", "Cancelled"].map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", () => {
      const updated = getOrders();
      const order = updated.find(x => x.id === select.dataset.orderId);
      if (order) {
        order.status = select.value;
        localStorage.setItem("urbanbite_orders", JSON.stringify(updated));
        renderDashboard();
        showToast("Order status updated");
      }
    });
  });
}

function renderBookings() {
  const bookings = getBookings();
  document.getElementById("bookingsBody").innerHTML = bookings.length ? bookings.map(b => `
    <tr><td>${b.name}</td><td>${b.phone}</td><td>${b.date}</td><td>${b.time}</td><td>${b.guests}</td><td>${b.seating}</td></tr>
  `).join("") : `<tr><td colspan="6">No reservations available.</td></tr>`;
}

function renderAll() {
  menu = getMenuData();
  renderDashboard();
  renderMenuTable();
  renderOrders();
  renderBookings();
}

document.querySelectorAll(".admin-nav").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav").forEach(x => x.classList.toggle("active", x === btn));
    document.querySelectorAll(".admin-view").forEach(view => view.classList.toggle("active", view.id === `view-${btn.dataset.view}`));
    document.getElementById("adminTitle").textContent = btn.textContent.replace(/[▦🍽🧾🪑]/g, "").trim();
    document.getElementById("adminSidebar").classList.remove("open");
  });
});

document.getElementById("openAddItem").addEventListener("click", () => {
  itemModal.classList.add("open");
  itemModal.setAttribute("aria-hidden", "false");
});
document.getElementById("closeItemModal").addEventListener("click", () => {
  itemModal.classList.remove("open");
  itemModal.setAttribute("aria-hidden", "true");
});
itemModal.addEventListener("click", e => {
  if (e.target === itemModal) {
    itemModal.classList.remove("open");
    itemModal.setAttribute("aria-hidden", "true");
  }
});

document.getElementById("addItemForm").addEventListener("submit", e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  menu.push({
    id: Date.now(),
    name: data.name,
    category: data.category,
    price: Number(data.price),
    type: data.type,
    description: data.description,
    emoji: data.emoji || "🍽️",
    rating: Number(data.rating || 4.5)
  });
  saveMenuData(menu);
  e.target.reset();
  itemModal.classList.remove("open");
  renderAll();
  showToast("New dish added");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("urbanbite_current_user");
  window.location.href = "login.html";
});

document.getElementById("adminMenuBtn").addEventListener("click", () => {
  document.getElementById("adminSidebar").classList.toggle("open");
});

renderAll();
