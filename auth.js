const toast = document.getElementById("toast");
const tabButtons = document.querySelectorAll("[data-auth-tab]");
const forms = document.querySelectorAll(".auth-form");

function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(()=>toast.classList.remove("show"),2400);
}

tabButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    tabButtons.forEach(x=>x.classList.toggle("active",x===btn));
    forms.forEach(form=>form.classList.toggle("active",form.id === `${btn.dataset.authTab}Form`));
  });
});

document.getElementById("signupForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const users = JSON.parse(localStorage.getItem("urbanbite_users") || "[]");

  if(users.some(user=>user.email.toLowerCase() === data.email.toLowerCase())){
    showToast("An account with this email already exists");
    return;
  }

  users.push({id:Date.now(),name:data.name,email:data.email,phone:data.phone,password:data.password,role:"user"});
  localStorage.setItem("urbanbite_users",JSON.stringify(users));
  showToast("Account created. You can now login.");
  e.target.reset();
  document.querySelector('[data-auth-tab="login"]').click();
});

document.getElementById("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());

  if(data.email.toLowerCase() === "admin@urbanbite.in" && data.password === "admin123"){
    localStorage.setItem("urbanbite_current_user",JSON.stringify({name:"Admin",email:data.email,role:"admin"}));
    window.location.href = "admin.html";
    return;
  }

  const users = JSON.parse(localStorage.getItem("urbanbite_users") || "[]");
  const user = users.find(u=>u.email.toLowerCase() === data.email.toLowerCase() && u.password === data.password);

  if(!user){
    showToast("Incorrect email or password");
    return;
  }

  localStorage.setItem("urbanbite_current_user",JSON.stringify({
    id:user.id,name:user.name,email:user.email,phone:user.phone,role:"user"
  }));

  const returnTarget = localStorage.getItem("urbanbite_return_after_login");
  if(returnTarget === "checkout"){
    window.location.href = "index.html?checkout=1";
  } else {
    window.location.href = "index.html";
  }
});
