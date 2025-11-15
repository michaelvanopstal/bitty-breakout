document.addEventListener("DOMContentLoaded", function () {
  const loginBtn       = document.getElementById("login-btn");
  const logoutBtn      = document.getElementById("logout-btn");
  const nameInput      = document.getElementById("player-name");
  const playerDisplay  = document.getElementById("player-display");
  const avatarInput    = document.getElementById("player-avatar");       // <input type="file">
  const avatarImgSmall = document.getElementById("player-avatar-small"); // klein icoontje HUD

  // ========== STYLING KNOPPEN (zoals jij al had) ==========
  if (loginBtn) {
    loginBtn.style.backgroundColor = "#701C1A";
    loginBtn.style.color = "white";
    loginBtn.style.border = "none";
    loginBtn.style.borderRadius = "6px";
    loginBtn.style.padding = "6px 12px";
    loginBtn.style.fontSize = "14px";
    loginBtn.style.cursor = "pointer";
    loginBtn.style.marginTop = "5px";
  }

  if (logoutBtn) {
    logoutBtn.style.backgroundColor = "#701C1A";
    logoutBtn.style.color = "white";
    logoutBtn.style.border = "none";
    logoutBtn.style.borderRadius = "6px";
    logoutBtn.style.padding = "6px 12px";
    logoutBtn.style.fontSize = "14px";
    logoutBtn.style.cursor = "pointer";
    logoutBtn.style.marginTop = "5px";
  }

  // tijdelijk geheugen voor gekozen avatar (dataURL) vóór login
  let tempAvatarData = null;

  // ===== helper: alles toepassen op UI + globals + storage =====
  function applyLogin(name, avatarData) {
    const finalName   = (name && name.trim()) ? name.trim() : "Player";
    const finalAvatar = avatarData || null;

    // globaal beschikbaar voor game / highscores
    window.currentPlayer       = finalName;
    window.currentPlayerAvatar = finalAvatar;

    // player label
    if (playerDisplay) {
      // jij had "Player: naam"
      playerDisplay.textContent = "Player: " + finalName;
    }

    // klein icoontje naast Player
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
      // jouw oude gedrag: naam in sessionStorage
      sessionStorage.setItem("currentPlayer", finalName);

      // extra: ook naam + avatar in localStorage (voor highscores / later)
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
      nameInput.style.display = "none"; // zoals jij deed na login
    }
    if (loginBtn)  loginBtn.style.display  = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";

    // avatar Input mag zichtbaar blijven, maar kan ook verstopt worden:
    // if (avatarInput) avatarInput.style.display = "none";
  } else {
    // Default: nog geen player → label op "Player"
    window.currentPlayer       = null;
    window.currentPlayerAvatar = null;
    if (playerDisplay) playerDisplay.textContent = "Player";
    if (avatarImgSmall) {
      avatarImgSmall.src = "";
      avatarImgSmall.style.display = "none";
    }
    if (logoutBtn) logoutBtn.style.display = "none";
    if (loginBtn)  loginBtn.style.display  = "inline-block";
    if (nameInput) nameInput.style.display = "inline-block";
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

  // ===== Login-knop =====
  if (loginBtn) {
    loginBtn.addEventListener("click", function () {
      if (!nameInput) return;

      const name = nameInput.value.trim();
      if (name === "") {
        alert("Vul eerst een player name in.");
        return;
      }

      // naam + (tijdelijk gekozen) avatar toepassen
      applyLogin(name, tempAvatarData);

      nameInput.style.display = "none";
      loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";

      // jouw oude flag
      window.readyToLaunch = true;
    });
  }

  // ===== Logout-knop =====
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      window.currentPlayer       = null;
      window.currentPlayerAvatar = null;
      window.readyToLaunch       = false;

      // storage leegmaken
      try {
        sessionStorage.removeItem("currentPlayer");
        localStorage.removeItem("playerName");
        localStorage.removeItem("playerAvatar");
      } catch (e) {}

      // UI reset
      if (playerDisplay) playerDisplay.textContent = "Player";
      if (nameInput) {
        nameInput.value = "";
        nameInput.style.display = "inline-block";
      }
      if (loginBtn)  loginBtn.style.display  = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";

      if (avatarImgSmall) {
        avatarImgSmall.src = "";
        avatarImgSmall.style.display = "none";
      }

      tempAvatarData = null;

      // avatar-input kun je weer tonen
      if (avatarInput) {
        avatarInput.value = "";
        // avatarInput.style.display = "inline-block"; // als je hem had verstopt
      }
    });
  }
});
