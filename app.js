const menuGrid = document.getElementById("menuGrid");
const categoryTabs = document.getElementById("categoryTabs");
const searchInput = document.getElementById("menuSearch");
const vegOnly = document.getElementById("vegOnly");
const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");
const cartItemsBox = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const bookingModal = document.getElementById("bookingModal");
const checkoutModal = document.getElementById("checkoutModal");
const toast = document.getElementById("toast");

let menu = getMenuData();
let cart = JSON.parse(localStorage.getItem("urbanbite_cart") || "[]");
let activeCategory = "All";
let couponApplied = localStorage.getItem("urbanbite_coupon") === "URBAN15";

function money(value){ return `₹${Math.round(value)}`; }

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(()=>toast.classList.remove("show"), 2500);
}

function getCategories(){
  return ["All", ...new Set(menu.map(item=>item.category))];
}

function renderCategories(){
  categoryTabs.innerHTML = getCategories().map(category => `
    <button class="${category === activeCategory ? "active" : ""}" data-category="${category}">${category}</button>
  `).join("");

  categoryTabs.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click",()=>{
      activeCategory = btn.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function renderMenu(){
  const query = searchInput.value.trim().toLowerCase();
  const filtered = menu.filter(item=>{
    const categoryMatch = activeCategory === "All" || item.category === activeCategory;
    const searchMatch = item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query);
    const vegMatch = !vegOnly.checked || item.type === "Veg";
    return categoryMatch && searchMatch && vegMatch;
  });

  if(!filtered.length){
    menuGrid.innerHTML = `<div class="empty-state">No dishes found. Try another search or category.</div>`;
    return;
  }

  menuGrid.innerHTML = filtered.map(item=>`
    <article class="menu-card">
      <div class="menu-image">
        <span class="food-badge">${item.type === "Veg" ? "🟢 Veg" : "🔴 Non-Veg"}</span>
        <span>${item.emoji}</span>
      </div>
      <div class="menu-card-body">
        <div class="menu-card-top">
          <h3>${item.name}</h3>
          <span class="rating">★ ${item.rating}</span>
        </div>
        <p>${item.description}</p>
        <div class="menu-card-bottom">
          <span class="price">${money(item.price)}</span>
          <button class="add-btn" data-add="${item.id}">Add +</button>
        </div>
      </div>
    </article>
  `).join("");

  menuGrid.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click",()=>addToCart(Number(btn.dataset.add)));
  });
}

function saveCart(){
  localStorage.setItem("urbanbite_cart", JSON.stringify(cart));
  updateCart();
}

function addToCart(id){
  const existing = cart.find(item=>item.id===id);
  if(existing) existing.qty++;
  else cart.push({id,qty:1});
  saveCart();
  showToast("Added to cart");
}

function changeQty(id, change){
  const item = cart.find(x=>x.id===id);
  if(!item) return;
  item.qty += change;
  if(item.qty <= 0) cart = cart.filter(x=>x.id!==id);
  saveCart();
}

function removeFromCart(id){
  cart = cart.filter(x=>x.id!==id);
  saveCart();
}

function getCartDetails(){
  return cart.map(cartItem=>{
    const item = menu.find(x=>x.id===cartItem.id);
    return item ? {...item, qty:cartItem.qty} : null;
  }).filter(Boolean);
}

function calculateCart(){
  const details = getCartDetails();
  const subtotal = details.reduce((sum,item)=>sum + item.price*item.qty, 0);
  const discount = couponApplied && subtotal >= 699 ? subtotal*0.15 : 0;
  const delivery = subtotal === 0 ? 0 : subtotal >= 499 ? 0 : 40;
  return {subtotal, discount, delivery, total:subtotal-discount+delivery};
}

function updateCart(){
  const details = getCartDetails();
  cartCount.textContent = cart.reduce((sum,item)=>sum+item.qty,0);

  if(!details.length){
    cartItemsBox.innerHTML = `<div class="cart-empty"><div style="font-size:3rem">🛒</div><p>Your cart is empty.</p></div>`;
  } else {
    cartItemsBox.innerHTML = details.map(item=>`
      <div class="cart-item">
        <div class="cart-item-icon">${item.emoji}</div>
        <div>
          <h4>${item.name}</h4>
          <small>${money(item.price)} each</small>
          <div class="qty-controls">
            <button data-minus="${item.id}">−</button>
            <strong>${item.qty}</strong>
            <button data-plus="${item.id}">+</button>
          </div>
          <button class="remove-item" data-remove="${item.id}">Remove</button>
        </div>
        <strong>${money(item.price*item.qty)}</strong>
      </div>
    `).join("");
  }

  const totals = calculateCart();
  document.getElementById("cartSubtotal").textContent = money(totals.subtotal);
  document.getElementById("cartDiscount").textContent = `- ${money(totals.discount)}`;
  document.getElementById("deliveryFee").textContent = totals.delivery === 0 && totals.subtotal > 0 ? "FREE" : money(totals.delivery);
  document.getElementById("cartTotal").textContent = money(totals.total);

  cartItemsBox.querySelectorAll("[data-minus]").forEach(btn=>btn.onclick=()=>changeQty(Number(btn.dataset.minus),-1));
  cartItemsBox.querySelectorAll("[data-plus]").forEach(btn=>btn.onclick=()=>changeQty(Number(btn.dataset.plus),1));
  cartItemsBox.querySelectorAll("[data-remove]").forEach(btn=>btn.onclick=()=>removeFromCart(Number(btn.dataset.remove)));
}

function openCart(){
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden","false");
  overlay.classList.add("active");
  document.body.classList.add("no-scroll");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden","true");
  overlay.classList.remove("active");
  document.body.classList.remove("no-scroll");
}
function openModal(modal){
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.classList.add("no-scroll");
}
function closeModal(modal){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.classList.remove("no-scroll");
}

document.getElementById("openCart").addEventListener("click",openCart);
document.getElementById("closeCart").addEventListener("click",closeCart);
overlay.addEventListener("click",closeCart);

document.getElementById("applyCoupon").addEventListener("click",()=>{
  const value = document.getElementById("couponInput").value.trim().toUpperCase();
  const subtotal = calculateCart().subtotal;
  if(value === "URBAN15" && subtotal >= 699){
    couponApplied = true;
    localStorage.setItem("urbanbite_coupon","URBAN15");
    updateCart();
    showToast("15% coupon applied");
  } else if(value === "URBAN15"){
    showToast("Coupon works on orders above ₹699");
  } else {
    showToast("Invalid coupon code");
  }
});

document.getElementById("checkoutBtn").addEventListener("click",()=>{
  if(cart.length === 0){
    showToast("Your cart is empty");
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");

  if(!currentUser || currentUser.role !== "user"){
    closeCart();
    alert("Login required! Please login or create an account before placing your order.");
    localStorage.setItem("urbanbite_return_after_login", "checkout");
    window.location.href = "login.html";
    return;
  }

  closeCart();
  const form = document.getElementById("checkoutForm");
  form.elements.name.value = currentUser.name || "";
  form.elements.phone.value = currentUser.phone || "";
  openModal(checkoutModal);
});

document.querySelectorAll("[data-open-booking]").forEach(btn=>{
  btn.addEventListener("click",()=>openModal(bookingModal));
});
document.querySelectorAll("[data-close-modal]").forEach(btn=>{
  btn.addEventListener("click",()=>closeModal(btn.closest(".modal")));
});
document.querySelectorAll(".modal").forEach(modal=>{
  modal.addEventListener("click",e=>{ if(e.target===modal) closeModal(modal); });
});

document.getElementById("bookingForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.id = Date.now();
  const bookings = JSON.parse(localStorage.getItem("urbanbite_bookings") || "[]");
  bookings.unshift(data);
  localStorage.setItem("urbanbite_bookings", JSON.stringify(bookings));
  e.target.reset();
  closeModal(bookingModal);
  showToast("Table reservation saved successfully");
});

document.getElementById("checkoutForm").addEventListener("submit",e=>{
  e.preventDefault();

  const currentUser = JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");
  if(!currentUser || currentUser.role !== "user"){
    closeModal(checkoutModal);
    alert("Your login session is missing. Please login before placing the order.");
    localStorage.setItem("urbanbite_return_after_login", "checkout");
    window.location.href = "login.html";
    return;
  }

  const formData = Object.fromEntries(new FormData(e.target).entries());
  const details = getCartDetails();
  const totals = calculateCart();
  const orders = JSON.parse(localStorage.getItem("urbanbite_orders") || "[]");

  const order = {
    id:`UB${Date.now().toString().slice(-6)}`,
    userId:currentUser.id,
    userEmail:currentUser.email,
    customer:formData.name,
    phone:formData.phone,
    address:formData.address,
    orderType:formData.orderType,
    payment:formData.payment,
    notes:formData.notes,
    items:details,
    subtotal:totals.subtotal,
    discount:totals.discount,
    delivery:totals.delivery,
    total:totals.total,
    status:"Received",
    createdAt:new Date().toISOString()
  };

  orders.unshift(order);
  localStorage.setItem("urbanbite_orders", JSON.stringify(orders));
  cart = [];
  couponApplied = false;
  localStorage.removeItem("urbanbite_coupon");
  saveCart();
  e.target.reset();
  closeModal(checkoutModal);
  showToast(`Order ${order.id} placed successfully`);
});

searchInput.addEventListener("input",renderMenu);
vegOnly.addEventListener("change",renderMenu);

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle.addEventListener("click",()=>{
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded",String(open));
});
navLinks.querySelectorAll("a").forEach(link=>link.addEventListener("click",()=>navLinks.classList.remove("open")));

window.addEventListener("scroll",()=>{
  const sections = [...document.querySelectorAll("main section[id]")];
  let current = "home";
  sections.forEach(section=>{
    if(window.scrollY >= section.offsetTop - 180) current = section.id;
  });
  navLinks.querySelectorAll("a").forEach(a=>a.classList.toggle("active",a.getAttribute("href") === `#${current}`));
});

const currentUser = JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");
const accountBtn = document.getElementById("accountBtn");

if(currentUser && currentUser.role === "user"){
  accountBtn.textContent = `👤 ${currentUser.name.split(" ")[0]}`;
  accountBtn.href = "profile.html";
} else {
  accountBtn.textContent = "Login";
  accountBtn.href = "login.html";
}

document.getElementById("year").textContent = new Date().getFullYear();
renderCategories();
renderMenu();
updateCart();

// Return user to checkout after login when checkout triggered the login flow.
const checkoutParams = new URLSearchParams(window.location.search);
if(checkoutParams.get("checkout") === "1") {
  const returningUser = JSON.parse(localStorage.getItem("urbanbite_current_user") || "null");
  if(returningUser && returningUser.role === "user" && cart.length > 0) {
    const form = document.getElementById("checkoutForm");
    form.elements.name.value = returningUser.name || "";
    form.elements.phone.value = returningUser.phone || "";
    localStorage.removeItem("urbanbite_return_after_login");
    openModal(checkoutModal);
  }
  history.replaceState({}, document.title, "index.html");
}
