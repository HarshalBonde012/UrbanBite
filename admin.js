const currentUser = JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");
if (!currentUser || currentUser.role !== "admin") {
  alert("Admin login required. Use admin@urbanbite.in / admin123");
  window.location.href = "login.html";
}

let menu = getMenuData();
let editingOrderItems = [];
const toast = document.getElementById("toast");
const itemModal = document.getElementById("itemModal");
const orderModal = document.getElementById("orderModal");
const bookingModalAdmin = document.getElementById("bookingModalAdmin");
const dashboardDate = document.getElementById("dashboardDate");
const adminCategoryFilter = document.getElementById("adminCategoryFilter");

function money(v) { return `₹${Math.round(Number(v) || 0)}`; }
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function getOrders() { return JSON.parse(localStorage.getItem("urbanbite_orders") || "[]"); }
function saveOrders(orders) { localStorage.setItem("urbanbite_orders", JSON.stringify(orders)); }
function getBookings() {
  return JSON.parse(localStorage.getItem("urbanbite_bookings") || "[]").map(b => ({ ...b, status: b.status || "Reserved" }));
}
function saveBookings(bookings) { localStorage.setItem("urbanbite_bookings", JSON.stringify(bookings)); }
function localDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}
function openAdminModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}
function closeAdminModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function renderRecentOrderList(target, orders, emptyText) {
  if (!orders.length) {
    target.innerHTML = `<div class="empty-state compact-empty">${emptyText}</div>`;
    return;
  }
  target.innerHTML = orders.slice(0, 6).map(order => `
    <button class="recent-order recent-order-button" data-dashboard-order="${order.id}">
      <div><strong>${escapeHtml(order.id)}</strong><small>${escapeHtml(order.customer)} · ${escapeHtml(order.orderType)}</small></div>
      <div><strong>${money(order.total)}</strong><small>${escapeHtml(order.status)}</small></div>
    </button>
  `).join("");
  target.querySelectorAll("[data-dashboard-order]").forEach(btn => {
    btn.addEventListener("click", () => openOrderEditor(btn.dataset.dashboardOrder));
  });
}

function renderDashboard() {
  const selectedDate = dashboardDate.value || localDateKey();
  const allOrders = getOrders();
  const allBookings = getBookings();
  const dayOrders = allOrders.filter(order => localDateKey(order.createdAt) === selectedDate);
  const dayBookings = allBookings.filter(booking => booking.date === selectedDate && booking.status !== "Cancelled");
  const revenueOrders = dayOrders.filter(order => order.status !== "Cancelled");
  const availableMenu = menu.filter(item => item.available !== false).length;

  document.getElementById("statOrders").textContent = dayOrders.length;
  document.getElementById("statRevenue").textContent = money(revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0));
  document.getElementById("statMenu").textContent = `${availableMenu} / ${menu.length}`;
  document.getElementById("statBookings").textContent = dayBookings.length;
  document.getElementById("statOrdersLabel").textContent = selectedDate === localDateKey() ? "Today" : selectedDate;

  const preparing = dayOrders.filter(order => ["Received", "Preparing", "Ready", "Out for Delivery"].includes(order.status));
  const completed = dayOrders.filter(order => order.status === "Completed");
  renderRecentOrderList(document.getElementById("preparingOrders"), preparing, "No active kitchen orders for this date.");
  renderRecentOrderList(document.getElementById("completedOrders"), completed, "No completed orders for this date.");
}

function renderCategoryFilter() {
  const current = adminCategoryFilter.value || "All";
  const categories = [...new Set(menu.map(item => item.category))].sort((a, b) => a.localeCompare(b));
  adminCategoryFilter.innerHTML = `<option value="All">All Categories</option>${categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}`;
  adminCategoryFilter.value = categories.includes(current) ? current : "All";
}

function renderMenuTable() {
  const tbody = document.getElementById("adminMenuBody");
  const selectedCategory = adminCategoryFilter.value || "All";
  const filtered = menu
    .filter(item => selectedCategory === "All" || item.category === selectedCategory)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6">No menu items in this category.</td></tr>`;
    return;
  }

  let lastCategory = "";
  tbody.innerHTML = filtered.map(item => {
    const categoryRow = item.category !== lastCategory
      ? `<tr class="category-group-row"><td colspan="6">${escapeHtml(item.category)}</td></tr>`
      : "";
    lastCategory = item.category;
    return `${categoryRow}
      <tr>
        <td><div class="admin-dish-cell"><img src="${escapeHtml(item.image)}" alt=""><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></div></div></td>
        <td>${escapeHtml(item.category)}</td>
        <td>${money(item.price)}</td>
        <td><span class="type-chip ${item.type === "Veg" ? "veg" : "nonveg"}">${escapeHtml(item.type)}</span></td>
        <td><button class="availability-btn ${item.available !== false ? "available" : "unavailable"}" data-toggle-availability="${item.id}">${item.available !== false ? "Available" : "Out of stock"}</button></td>
        <td><div class="table-actions"><button class="edit-btn" data-edit-item="${item.id}">Edit</button><button class="delete-btn" data-delete-item="${item.id}">Delete</button></div></td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll("[data-toggle-availability]").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = menu.find(entry => entry.id === Number(btn.dataset.toggleAvailability));
      if (!item) return;
      item.available = item.available === false;
      saveMenuData(menu);
      renderAll();
      showToast(item.available ? "Dish is available again" : "Dish marked out of stock");
    });
  });

  tbody.querySelectorAll("[data-edit-item]").forEach(btn => btn.addEventListener("click", () => openItemEditor(Number(btn.dataset.editItem))));
  tbody.querySelectorAll("[data-delete-item]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!confirm("Delete this dish?")) return;
      menu = menu.filter(item => item.id !== Number(btn.dataset.deleteItem));
      saveMenuData(menu);
      renderAll();
      showToast("Dish deleted");
    });
  });
}

function openItemEditor(id = null) {
  const form = document.getElementById("itemForm");
  form.reset();
  form.elements.available.checked = true;
  document.getElementById("itemModalTitle").textContent = id ? "Edit Dish" : "Add New Dish";
  document.getElementById("itemSubmitBtn").textContent = id ? "Update Dish" : "Add Dish";
  if (id) {
    const item = menu.find(entry => entry.id === id);
    if (!item) return;
    form.elements.id.value = item.id;
    form.elements.name.value = item.name || "";
    form.elements.category.value = item.category || "";
    form.elements.price.value = item.price || "";
    form.elements.type.value = item.type || "Veg";
    form.elements.image.value = item.image || "";
    form.elements.description.value = item.description || "";
    form.elements.emoji.value = item.emoji || "";
    form.elements.rating.value = item.rating || 4.5;
    form.elements.available.checked = item.available !== false;
  } else {
    form.elements.id.value = "";
  }
  openAdminModal(itemModal);
}

function renderOrders() {
  const orders = getOrders();
  const tbody = document.getElementById("ordersBody");
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7">No orders available.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
    return `
      <tr>
        <td><strong>${escapeHtml(order.id)}</strong><br><small>${order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</small></td>
        <td>${escapeHtml(order.customer)}<br><small>${escapeHtml(order.phone)}</small></td>
        <td><strong>${itemCount}</strong><br><small>${(order.items || []).slice(0, 2).map(item => `${escapeHtml(item.name)} ×${item.qty}`).join(", ")}${(order.items || []).length > 2 ? "…" : ""}</small></td>
        <td>${money(order.total)}</td>
        <td>${escapeHtml(order.orderType)}</td>
        <td><select class="status-select" data-order-id="${order.id}">${["Received", "Preparing", "Ready", "Out for Delivery", "Completed", "Cancelled"].map(status => `<option ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
        <td><button class="edit-btn" data-view-order="${order.id}">View / Edit</button></td>
      </tr>`;
  }).join("");

  tbody.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", () => {
      const updated = getOrders();
      const order = updated.find(entry => entry.id === select.dataset.orderId);
      if (!order) return;
      order.status = select.value;
      saveOrders(updated);
      renderDashboard();
      showToast("Order status updated");
    });
  });
  tbody.querySelectorAll("[data-view-order]").forEach(btn => btn.addEventListener("click", () => openOrderEditor(btn.dataset.viewOrder)));
}

function calculateEditedOrderTotal(order, items, orderType) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
  const discount = Number(order.discount || 0) > 0 && subtotal >= 699 ? subtotal * 0.15 : 0;
  const delivery = orderType === "Pickup" || subtotal === 0 || subtotal >= 499 ? 0 : 40;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}

function renderOrderItemsEditor() {
  const box = document.getElementById("orderItemsEditor");
  box.innerHTML = editingOrderItems.length ? editingOrderItems.map((item, index) => `
    <div class="order-edit-item">
      <img src="${escapeHtml(item.image || "")}" alt="">
      <div><strong>${escapeHtml(item.name)}</strong><small>${money(item.price)} each</small></div>
      <label>Qty<input type="number" min="0" value="${Number(item.qty || 0)}" data-order-item-qty="${index}"></label>
    </div>
  `).join("") : `<div class="empty-state compact-empty">No items in this order.</div>`;

  box.querySelectorAll("[data-order-item-qty]").forEach(input => {
    input.addEventListener("input", () => {
      editingOrderItems[Number(input.dataset.orderItemQty)].qty = Math.max(0, Number(input.value || 0));
      updateOrderEditTotal();
    });
  });
}

function updateOrderEditTotal() {
  const form = document.getElementById("orderEditForm");
  const original = getOrders().find(order => order.id === form.elements.id.value) || {};
  const totals = calculateEditedOrderTotal(original, editingOrderItems, form.elements.orderType.value);
  document.getElementById("orderEditTotal").textContent = money(totals.total);
}

function openOrderEditor(orderId) {
  const order = getOrders().find(entry => entry.id === orderId);
  if (!order) return;
  const form = document.getElementById("orderEditForm");
  form.elements.id.value = order.id;
  form.elements.customer.value = order.customer || "";
  form.elements.phone.value = order.phone || "";
  form.elements.address.value = order.address || "";
  form.elements.orderType.value = order.orderType || "Delivery";
  form.elements.status.value = order.status || "Received";
  form.elements.notes.value = order.notes || "";
  editingOrderItems = (order.items || []).map(item => ({ ...item, qty: Number(item.qty || 0) }));
  renderOrderItemsEditor();
  updateOrderEditTotal();
  openAdminModal(orderModal);
}

function bookingRow(booking, listType) {
  let actions = `<button class="edit-btn" data-edit-booking="${booking.id}">Edit</button>`;
  if (listType === "Reserved") {
    actions += `<button class="success-btn" data-booking-status="Checked In" data-booking-id="${booking.id}">Check In</button><button class="delete-btn" data-booking-status="Cancelled" data-booking-id="${booking.id}">Cancel</button>`;
  } else if (listType === "Checked In") {
    actions += `<button class="neutral-btn" data-booking-status="Reserved" data-booking-id="${booking.id}">Reserved</button><button class="delete-btn" data-booking-status="Cancelled" data-booking-id="${booking.id}">Cancel</button>`;
  } else {
    actions += `<button class="success-btn" data-booking-status="Reserved" data-booking-id="${booking.id}">Restore</button>`;
  }
  return `<tr><td><strong>${escapeHtml(booking.name)}</strong><br><small>${escapeHtml(booking.phone)}</small></td><td>${escapeHtml(booking.date)}</td><td>${escapeHtml(booking.time)}</td><td>${escapeHtml(booking.guests)}</td><td>${escapeHtml(booking.seating)}</td><td><div class="table-actions">${actions}</div></td></tr>`;
}

function renderBookings() {
  const bookings = getBookings();
  const groups = {
    "Reserved": document.getElementById("reservedBookingsBody"),
    "Checked In": document.getElementById("checkedInBookingsBody"),
    "Cancelled": document.getElementById("cancelledBookingsBody")
  };
  Object.entries(groups).forEach(([status, body]) => {
    const list = bookings.filter(booking => booking.status === status).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    body.innerHTML = list.length ? list.map(booking => bookingRow(booking, status)).join("") : `<tr><td colspan="6">No ${status.toLowerCase()} reservations.</td></tr>`;
  });

  document.querySelectorAll("[data-booking-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      const bookings = getBookings();
      const booking = bookings.find(entry => String(entry.id) === String(btn.dataset.bookingId));
      if (!booking) return;
      booking.status = btn.dataset.bookingStatus;
      saveBookings(bookings);
      renderDashboard();
      renderBookings();
      showToast(`Reservation moved to ${booking.status}`);
    });
  });
  document.querySelectorAll("[data-edit-booking]").forEach(btn => btn.addEventListener("click", () => openBookingEditor(btn.dataset.editBooking)));
}

function openBookingEditor(id) {
  const booking = getBookings().find(entry => String(entry.id) === String(id));
  if (!booking) return;
  const form = document.getElementById("bookingEditForm");
  ["id", "name", "phone", "date", "time", "guests", "seating", "status"].forEach(key => {
    if (form.elements[key]) form.elements[key].value = booking[key] || (key === "status" ? "Reserved" : "");
  });
  openAdminModal(bookingModalAdmin);
}

function renderAll() {
  menu = getMenuData();
  renderCategoryFilter();
  renderDashboard();
  renderMenuTable();
  renderOrders();
  renderBookings();
}

dashboardDate.value = localDateKey();
dashboardDate.addEventListener("change", renderDashboard);
adminCategoryFilter.addEventListener("change", renderMenuTable);

document.querySelectorAll(".admin-nav").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-nav").forEach(entry => entry.classList.toggle("active", entry === btn));
    document.querySelectorAll(".admin-view").forEach(view => view.classList.toggle("active", view.id === `view-${btn.dataset.view}`));
    document.getElementById("adminTitle").textContent = btn.textContent.trim();
    document.getElementById("adminSidebar").classList.remove("open");
  });
});

document.getElementById("openAddItem").addEventListener("click", () => openItemEditor());
document.getElementById("closeItemModal").addEventListener("click", () => closeAdminModal(itemModal));
[itemModal, orderModal, bookingModalAdmin].forEach(modal => modal.addEventListener("click", event => {
  if (event.target === modal) closeAdminModal(modal);
}));
document.querySelectorAll("[data-close-admin-modal]").forEach(btn => btn.addEventListener("click", () => closeAdminModal(document.getElementById(btn.dataset.closeAdminModal))));

document.getElementById("itemForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const id = data.id ? Number(data.id) : Date.now();
  const dish = {
    id,
    name: data.name.trim(),
    category: data.category.trim(),
    price: Number(data.price),
    type: data.type,
    image: data.image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    description: data.description.trim(),
    emoji: data.emoji.trim(),
    rating: Number(data.rating || 4.5),
    available: event.target.elements.available.checked
  };
  const existingIndex = menu.findIndex(item => item.id === id);
  if (existingIndex >= 0) menu[existingIndex] = dish;
  else menu.push(dish);
  saveMenuData(menu);
  closeAdminModal(itemModal);
  renderAll();
  showToast(existingIndex >= 0 ? "Dish updated" : "New dish added");
});

document.getElementById("orderEditForm").elements.orderType.addEventListener("change", updateOrderEditTotal);
document.getElementById("orderEditForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const orders = getOrders();
  const order = orders.find(entry => entry.id === data.id);
  if (!order) return;
  editingOrderItems = editingOrderItems.filter(item => Number(item.qty || 0) > 0);
  const totals = calculateEditedOrderTotal(order, editingOrderItems, data.orderType);
  Object.assign(order, {
    customer: data.customer.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    orderType: data.orderType,
    status: data.status,
    notes: data.notes.trim(),
    items: editingOrderItems,
    subtotal: totals.subtotal,
    discount: totals.discount,
    delivery: totals.delivery,
    total: totals.total
  });
  saveOrders(orders);
  closeAdminModal(orderModal);
  renderDashboard();
  renderOrders();
  showToast("Order updated");
});

document.getElementById("bookingEditForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  const bookings = getBookings();
  const booking = bookings.find(entry => String(entry.id) === String(data.id));
  if (!booking) return;
  Object.assign(booking, {
    name: data.name.trim(),
    phone: data.phone.trim(),
    date: data.date,
    time: data.time,
    guests: data.guests,
    seating: data.seating,
    status: data.status
  });
  saveBookings(bookings);
  closeAdminModal(bookingModalAdmin);
  renderDashboard();
  renderBookings();
  showToast("Reservation updated");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("urbanbite_current_user");
  window.location.href = "login.html";
});

document.getElementById("adminMenuBtn").addEventListener("click", () => {
  document.getElementById("adminSidebar").classList.toggle("open");
});

renderAll();
