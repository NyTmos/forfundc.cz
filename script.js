
// --- LOCAL STORAGE USERS ---
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let announcements = JSON.parse(localStorage.getItem("announcements")) || [];

// DOM elements
const navHome = document.getElementById("nav-home");
const navLogin = document.getElementById("nav-login");
const homeSection = document.getElementById("home-section");
const loginSection = document.getElementById("login-section");
const logoutBtn = document.getElementById("logout-btn");

const userCard = document.getElementById("user-card");
const usernameDisplay = document.getElementById("username-display");
const roleDisplay = document.getElementById("role-display");

const announceForm = document.getElementById("announce-form");
const announceContainer = document.getElementById("announcements");

// --- Navigace ---
navHome.addEventListener("click", () => {
  homeSection.style.display = "block";
  loginSection.style.display = "none";
});

navLogin.addEventListener("click", () => {
  homeSection.style.display = "none";
  loginSection.style.display = "block";
});

// --- Registrace ---
document.getElementById("register-form").addEventListener("submit", e => {
  e.preventDefault();
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;

  if (users.find(u => u.username === username)) {
    alert("Uživatel už existuje!");
    return;
  }

  // každý nový = user + startovní XP
  users.push({ 
    username, 
    password, 
    role: "user", 
    xp: 0, 
    level: 1, 
    lastLogin: null 
  });

  localStorage.setItem("users", JSON.stringify(users));
  alert("Registrace úspěšná! Nyní se přihlas.");
});


// --- Přihlášení ---
document.getElementById("login-form").addEventListener("submit", e => {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert("Špatné jméno nebo heslo!");
    return;
  }

  // XP bonus 1x denně
  const today = new Date().toDateString();
  if (user.lastLogin !== today) {
    user.xp += 20; // denní bonus XP
    user.lastLogin = today;

    // přepočet levelu
    user.level = Math.floor(user.xp / 100) + 1;

    alert(`Vítej zpět, ${user.username}! Získáváš +20 XP 🎉`);
  }

  currentUser = user;
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  localStorage.setItem("users", JSON.stringify(users));

  updateUI();
});

// --- Oznámení ---
announceForm.addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("announce-title").value;
  const text = document.getElementById("announce-text").value;

  announcements.push({ title, text, time: new Date().toLocaleString() });
  localStorage.setItem("announcements", JSON.stringify(announcements));

  // 📡 Odeslání na Discord webhook
  sendToDiscord(title, text);

  document.getElementById("announce-title").value = "";
  document.getElementById("announce-text").value = "";
  renderAnnouncements();
});

// --- Oznameni čti ---
function renderAnnouncements() {
  announceContainer.innerHTML = "";
  announcements.slice().reverse().forEach(a => {
    const div = document.createElement("div");
    div.className = "announcement";
    div.innerHTML = `<h4>${a.title}</h4><p>${a.text}</p><small>${a.time}</small>`;
    announceContainer.appendChild(div);
  });
}

// --- UPDATE UI ---
function updateUI() {
  if (currentUser) {
    userCard.style.display = "block";
    usernameDisplay.textContent = currentUser.username;

    roleDisplay.textContent = currentUser.role === "admin" ? "Admin" : "User";

    // XP a level
    const xpForLevel = (currentUser.level - 1) * 100;
    const nextLevelXp = currentUser.level * 100;
    const progress = ((currentUser.xp - xpForLevel) / (nextLevelXp - xpForLevel)) * 100;

    document.getElementById("xp-progress").style.width = progress + "%";
    document.getElementById("xp-text").textContent = `Level ${currentUser.level} | ${currentUser.xp} XP`;

    logoutBtn.style.display = "block";
    navLogin.style.display = "none";

    // Admin-only
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = currentUser.role === "admin" ? "block" : "none";
    });
  } else {
    userCard.style.display = "none";
    logoutBtn.style.display = "none";
    navLogin.style.display = "block";
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "none";
    });
  }

  renderAnnouncements();
}


// Init
updateUI();


// --- DISCORD WEBHOOK ---
function sendToDiscord(title, text) {
  // ⚠️ Sem vlož svou webhook URL
  const webhookURL = "https://discord.com/api/webhooks/1413910639826571334/xSE4UxoebvyW4yxwAbNbwArEATbLWEx-3agf5a10zj0Wf3GiJEATYsHRt1x1lwnqr09X";

  const payload = {
    username: "GameBot",
    avatar_url: "https://cdn-icons-png.flaticon.com/512/3069/3069186.png",
    embeds: [
      {
        title: `📢 ${title}`,
        description: text,
        color: 0x8b5cf6,
        footer: {
          text: "Herní Komunita • " + new Date().toLocaleString()
        }
      }
    ]
  };

  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(res => {
    if (!res.ok) {
      console.error("❌ Nepodařilo se odeslat na Discord", res.statusText);
    } else {
      console.log("✅ Oznámení odesláno na Discord!");
    }
  });
}

const navUsers = document.getElementById("nav-users");
const usersSection = document.getElementById("users-section");

navUsers.addEventListener("click", () => {
  homeSection.style.display = "none";
  loginSection.style.display = "none";
  usersSection.style.display = "block";
  renderUsers();
});

function renderUsers() {
  const container = document.getElementById("users-list");
  container.innerHTML = "";

  // spočítáme kolik je adminů
  const adminCount = users.filter(u => u.role === "admin").length;

  users.forEach((u, index) => {
    const div = document.createElement("div");
    div.className = "user-row";

    // pokud je tento uživatel admin a je poslední → disable změnu role
    const disable = (u.role === "admin" && adminCount === 1) ? "disabled" : "";

    // pokud je admin → přidej ikonku štítu
    const icon = u.role === "admin" 
      ? `<img src="shield-red.png" class="role-icon" alt="admin">`
      : "";

    div.innerHTML = `
      <span>${u.username} ${icon}</span>
      <select data-index="${index}" ${disable}>
        <option value="user" ${u.role === "user" ? "selected" : ""}>User</option>
        <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
      </select>
    `;

    container.appendChild(div);
  });

  // Event pro změnu role
  container.querySelectorAll("select").forEach(sel => {
    sel.addEventListener("change", e => {
      const i = e.target.dataset.index;
      users[i].role = e.target.value;
      localStorage.setItem("users", JSON.stringify(users));

      if (currentUser && currentUser.username === users[i].username) {
        currentUser.role = users[i].role;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        updateUI();
      }
      renderUsers(); // znovu překreslit
    });
  });
}

function updateUI() {
  if (currentUser) {
    userCard.style.display = "block";
    usernameDisplay.textContent = currentUser.username;
    roleDisplay.textContent = currentUser.role === "admin" ? "Admin" : "User";

    logoutBtn.style.display = "block";
    navLogin.style.display = "none";

    // Admin-only
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = currentUser.role === "admin" ? "block" : "none";
    });
  } else {
    userCard.style.display = "none";
    logoutBtn.style.display = "none";
    navLogin.style.display = "block";
    document.querySelectorAll(".admin-only").forEach(el => {
      el.style.display = "none";
    });
  }

  renderAnnouncements();
}
