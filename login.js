document.addEventListener("DOMContentLoaded", function () {
  const loginToggle   = document.getElementById("login-toggle");
  const loginOverlay  = document.getElementById("login-overlay");
  const loginCloseBtn = document.getElementById("login-close");

  const loginBtn       = document.getElementById("login-btn");
  const logoutBtn      = document.getElementById("logout-btn");
  const nameInput      = document.getElementById("player-name");
  const playerDisplay  = document.getElementById("player-display");
  const avatarInput    = document.getElementById("player-avatar");
  const avatarImgSmall = document.getElementById("player-avatar-small");

  // tijdelijk geheugen voor gekozen avatar (dataURL) vóór login
  let tempAvatarData = null;

  // ===== helpers voor popup =====
  function showLoginPopup() {
    if (loginOverlay) {
      loginOverlay.classList.add("show");
    }
  }

  function hideLoginPopup() {
    if (loginOverlay) {
      loginOverlay.classList.remove("show");
    }
  }

  // ===== helper: alles toepassen op UI + globals + storage =====
  function applyLogin(name, avatarData) {
    const finalName   = (name && name.trim()) ? name.trim() : "Player";
    const finalAvatar = avatarData || null;

    // globaal beschikbaar voor game / highscores
    window.currentPlayer       = finalName;
    window.currentPlayerAvatar = finalAvatar;

    // HUD: Player + naam
    if (playerDisplay) {
      playerDisplay.textContent = "Player: " + finalName;
    }

    // Klein avatar-icoontje links van Player
    if (avatarImgSmall) {
      if (finalAvatar) {
        avatarImgSmall.src = finalAvatar;
        avatarImgSmall.style.display = "block";
      } else {
        avatarImgSmall.src = "";
        avatarImgSmall.style.display = "none";
      }
    }

    // opslaan
    try {
      sessionStorage.setItem("currentPlayer", finalName);
      localStorage.setItem("playerName", finalName);

      if (finalAvatar) {
        localStorage.setItem("playerAvatar", finalAvatar);
      } else {
        localStorage.removeItem("playerAvatar");
      }
    } catch (e) {
      console.warn("Kon playerName/playerAvatar niet in storage zetten:", e);
    }
  }

  // ===== Init: kijken of er al iemand is ingelogd =====
  const savedNameSession = sessionStorage.getItem("currentPlayer");
  const savedNameLocal   = localStorage.getItem("playerName");
  const savedAvatar      = localStorage.getItem("playerAvatar");

  const initialName = savedNameSession || savedNameLocal || null;

  if (initialName) {
    applyLogin(initialName, savedAvatar);
    if (nameInput) {
      nameInput.value = initialName;
    }
    window.readyToLaunch = true;
    if (logoutBtn) logoutBtn.style.display = "inline-block";
    if (loginBtn)  loginBtn.style.display  = "inline-block"; // mag zichtbaar blijven in popup
  } else {
    window.currentPlayer       = null;
    window.currentPlayerAvatar = null;
    window.readyToLaunch       = false;

    if (playerDisplay) playerDisplay.textContent = "Player";
    if (avatarImgSmall) {
      avatarImgSmall.src = "";
      avatarImgSmall.style.display = "none";
    }
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn)  loginBtn.style.display  = "inline-block";
  }

  // ===== Avatar kiezen (voor login) =====
  if (avatarInput) {
    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Kies alsjeblieft een afbeelding voor je avatar.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        tempAvatarData = reader.result; // dataURL

        // meteen alvast laten zien linksboven
        if (avatarImgSmall) {
          avatarImgSmall.src = tempAvatarData;
          avatarImgSmall.style.display = "block";
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // ===== Login-knop in popup =====
  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      if (!nameInput) return;

      const name = nameInput.value.trim();
      if (name === "") {
        alert("Vul eerst een player name in.");
        return;
      }

      applyLogin(name, tempAvatarData);
      window.readyToLaunch = true;

      if (logoutBtn) logoutBtn.style.display = "inline-block";

      hideLoginPopup();
    });
  }

  // ===== Logout-knop in popup =====
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      window.currentPlayer       = null;
      window.currentPlayerAvatar = null;
      window.readyToLaunch       = false;

      try {
        sessionStorage.removeItem("currentPlayer");
        localStorage.removeItem("playerName");
        localStorage.removeItem("playerAvatar");
      } catch (e) {}

      if (playerDisplay) playerDisplay.textContent = "Player";
      if (avatarImgSmall) {
        avatarImgSmall.src = "";
        avatarImgSmall.style.display = "none";
      }

      if (nameInput) {
        nameInput.value = "";
      }

      if (logoutBtn) logoutBtn.style.display = "none";
      if (loginBtn)  loginBtn.style.display  = "inline-block";

      tempAvatarData = null;

      hideLoginPopup();
    });
  }

  // ===== Login-toggle knop (kleine knop rechtsboven) =====
  if (loginToggle) {
    loginToggle.addEventListener("click", () => {
      // als er al een naam is, toon die gewoon in het veld
      if (nameInput && window.currentPlayer) {
        nameInput.value = window.currentPlayer;
      }
      showLoginPopup();
    });
  }

  // ===== X-knopje in popup =====
  if (loginCloseBtn) {
    loginCloseBtn.addEventListener("click", () => {
      hideLoginPopup();
    });
  }

  // Optioneel: ESC sluit popup
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideLoginPopup();
    }
  });
});
