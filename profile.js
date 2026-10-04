const toast = document.getElementById("toast");

function getCurrentUser(){
  return JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");
}

function getUsers(){
  return JSON.parse(localStorage.getItem("urbanbite_users") || "[]");
}

function getOrders(){
  return JSON.parse(localStorage.getItem("urbanbite_orders") || "[]");
}

function money(value){
  return `₹${Math.round(Number(value) || 0)}`;
}

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.profileToastTimer);
  window.profileToastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function requireLogin(){
  const user = getCurrentUser();

  if(!user || user.role !== "user"){
    alert("Please login to view your profile.");
    window.location.href = "login.html";
    return null;
  }

  return user;
}

function getUserOrders(user){
  return getOrders().filter(order => {
    if(order.userId && user.id){
      return String(order.userId) === String(user.id);
    }

    if(order.userEmail && user.email){
      return order.userEmail.toLowerCase() === user.email.toLowerCase();
    }

    return order.phone && user.phone && order.phone === user.phone;
  });
}

function renderProfile(){
  const user = requireLogin();
  if(!user) return;

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("");

  document.getElementById("profileAvatar").textContent = initials || "U";
  document.getElementById("sidebarName").textContent = user.name || "User";
  document.getElementById("sidebarEmail").textContent = user.email || "";

  document.getElementById("profileName").textContent = user.name || "—";
  document.getElementById("profileEmail").textContent = user.email || "—";
  document.getElementById("profilePhone").textContent = user.phone || "—";
  document.getElementById("profileAddress").textContent = user.address || "Not added yet";

  document.getElementById("editName").value = user.name || "";
  document.getElementById("editEmail").value = user.email || "";
  document.getElementById("editPhone").value = user.phone || "";
  document.getElementById("editAddress").value = user.address || "";
  document.getElementById("editPassword").value = "";

  const orders = getUserOrders(user);
  document.getElementById("profileOrderCount").textContent = orders.length;
  document.getElementById("profileTotalSpent").textContent =
    money(orders.reduce((sum, order) => sum + Number(order.total || 0), 0));

  renderOrders(orders);
}

function renderOrders(orders){
  const list = document.getElementById("profileOrdersList");

  if(!orders.length){
    list.innerHTML = `
      <div class="profile-empty">
        <div>🧾</div>
        <h3>No orders yet</h3>
        <p>Your orders will appear here after you place them while logged in.</p>
        <a class="btn btn-primary" href="index.html#menu">Explore Menu</a>
      </div>
    `;
    return;
  }

  list.innerHTML = orders.map(order => {
    const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const date = order.createdAt ? new Date(order.createdAt).toLocaleString() : "—";

    return `
      <article class="profile-order-card">
        <div class="profile-order-top">
          <div>
            <small>Order ID</small>
            <strong>${order.id || "—"}</strong>
          </div>

          <span class="profile-order-status">${order.status || "Received"}</span>
        </div>

        <div class="profile-order-info">
          <span>${itemCount} item${itemCount === 1 ? "" : "s"}</span>
          <span>${order.orderType || "Delivery"}</span>
          <span>${date}</span>
        </div>

        <div class="profile-order-items">
          ${(order.items || []).map(item => `
            <span>${item.emoji || "🍽️"} ${item.name} × ${item.qty}</span>
          `).join("")}
        </div>

        <div class="profile-order-total">
          <span>Total</span>
          <strong>${money(order.total)}</strong>
        </div>
      </article>
    `;
  }).join("");
}

document.querySelectorAll("[data-profile-view]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-profile-view]").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    document.querySelectorAll(".profile-view").forEach(view => {
      view.classList.toggle(
        "active",
        view.id === `profile-${button.dataset.profileView}`
      );
    });
  });
});

document.getElementById("profileEditForm").addEventListener("submit", event => {
  event.preventDefault();

  const currentUser = requireLogin();
  if(!currentUser) return;

  const formData = Object.fromEntries(new FormData(event.target).entries());
  const users = getUsers();

  const duplicateEmail = users.some(user =>
    String(user.id) !== String(currentUser.id) &&
    user.email.toLowerCase() === formData.email.toLowerCase()
  );

  if(duplicateEmail){
    showToast("This email is already used by another account");
    return;
  }

  const userIndex = users.findIndex(user =>
    String(user.id) === String(currentUser.id)
  );

  const oldEmail = currentUser.email;
  const oldPhone = currentUser.phone;

  const updatedUser = {
    ...currentUser,
    name: formData.name.trim(),
    email: formData.email.trim(),
    phone: formData.phone.trim(),
    address: formData.address.trim()
  };

  if(userIndex !== -1){
    users[userIndex] = {
      ...users[userIndex],
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address
    };

    if(formData.password.trim()){
      users[userIndex].password = formData.password.trim();
    }

    localStorage.setItem("urbanbite_users", JSON.stringify(users));
  }

  // Keep old orders linked even if email/phone changes.
  const orders = getOrders().map(order => {
    const belongsToUser =
      (order.userId && String(order.userId) === String(currentUser.id)) ||
      (!order.userId && order.userEmail && order.userEmail.toLowerCase() === oldEmail.toLowerCase()) ||
      (!order.userId && !order.userEmail && order.phone === oldPhone);

    if(belongsToUser){
      return {
        ...order,
        userId: currentUser.id,
        userEmail: updatedUser.email,
        phone: updatedUser.phone
      };
    }

    return order;
  });

  localStorage.setItem("urbanbite_orders", JSON.stringify(orders));
  localStorage.setItem("urbanbite_current_user", JSON.stringify(updatedUser));

  renderProfile();
  showToast("Profile updated successfully");

  document.querySelector('[data-profile-view="overview"]').click();
});

document.getElementById("logoutProfileBtn").addEventListener("click", () => {
  const logout = confirm("Are you sure you want to logout?");
  if(!logout) return;

  localStorage.removeItem("urbanbite_current_user");
  localStorage.removeItem("urbanbite_return_after_login");
  window.location.href = "index.html";
});

renderProfile();
