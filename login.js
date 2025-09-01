
document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const nameInput = document.getElementById("player-name");
  const playerDisplay = document.getElementById("player-display");

 
  // Styling voor login knop
loginBtn.style.backgroundColor = "#701C1A"; // PointPay-blauw
loginBtn.style.color = "white";
loginBtn.style.border = "none";
loginBtn.style.borderRadius = "6px";
loginBtn.style.padding = "6px 12px";
loginBtn.style.fontSize = "14px";
loginBtn.style.cursor = "pointer";
loginBtn.style.marginTop = "5px";

// Styling voor logout knop
logoutBtn.style.backgroundColor = "#701C1A"; // PointPay-blauw
logoutBtn.style.color = "white";
logoutBtn.style.border = "none";
logoutBtn.style.borderRadius = "6px";
logoutBtn.style.padding = "6px 12px";
logoutBtn.style.fontSize = "14px";
logoutBtn.style.cursor = "pointer";
logoutBtn.style.marginTop = "5px";

  

  const savedName = sessionStorage.getItem("currentPlayer");
  if (savedName) {
    window.currentPlayer = savedName;
    playerDisplay.textContent = "Player: " + savedName;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    nameInput.style.display = "none";
  }

  loginBtn.addEventListener("click", function () {
    const name = nameInput.value.trim();
    if (name !== "") {
      window.currentPlayer = name;
      sessionStorage.setItem("currentPlayer", name);
      playerDisplay.textContent = "Player: " + name;
      nameInput.style.display = "none";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      window.readyToLaunch = true;
    } else {
      alert("Vul je naam in om te starten.");
    }
  });

  logoutBtn.addEventListener("click", function () {
    window.currentPlayer = null;
    sessionStorage.removeItem("currentPlayer");
    playerDisplay.textContent = "Player";
    nameInput.value = "";
    nameInput.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    window.readyToLaunch = false;
  });
});
