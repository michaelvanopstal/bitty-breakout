const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const paddleCanvas = document.createElement("canvas");
const paddleCtx = paddleCanvas.getContext("2d");

let elapsedTime = 0;
let timerInterval = null;
let timerRunning = false;
let score = 0;
let ballRadius = 8;
let ballLaunched = false;
let paddleHeight = 15;
let paddleWidth = 100;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let flagsOnPaddle = false;
let flagTimer = 0;
let flyingCoins = [];
let lives = 3;
let level = 1;
let gameOver = false;
let ballMoving = false;
let rocketFired = false;
let rocketSpeed = 10;
let smokeParticles = [];
let explosions = [];
let secondBallDuration = 60000; // 1 minuut in ms
let rocketAmmo = 0;             // aantal raketten
let balls = [];                 // actieve ballen
let doublePointsActive = false;
let doublePointsStartTime = 0;
const doublePointsDuration = 60000; // 1 minuut in milliseconden
let imagesLoaded = 0;               // ← eigen regel
let pointPopups = [];
let pxpBags = [];
let paddleExploding = false;
let paddleExplosionParticles = [];
let stoneDebris = [];
let animationFrameId = null;
let showGameOver = false;
let gameOverAlpha = 0;
let gameOverTimer = 0;
let resetTriggered = false;
let previousBallPos = {};
let paddleY = canvas.height - paddleHeight - 0; // beginpositie onderaan
const paddleSpeed = 6;
let downPressed = false;
let upPressed = false;
let paddleFreeMove = false;

// 🪨 Stonefall
let fallingStones = [];
let stoneHitOverlayTimer = 0;
let stoneHitLock = false;
let stoneClearRequested = false;
// 🎯 Stone–paddle botsing (SOFT-stand, centrale waarden)
const STONE_COLLISION = {
  hitboxScaleLarge: 0.90,
  hitboxScaleSmall: 0.84,
  minPenLargeFrac: 0.30,
  minPenSmallFrac: 0.35,
  debounceLarge: 1,
  debounceSmall: 2,
  minHorizOverlapFrac: 0.30
};

// 🌟 Levelovergang
let levelTransitionActive = false;
let transitionOffsetY = -300;

let resetOverlayActive = false;
let ballTrail = [];
const maxTrailLength = 10;

let machineGunActive = false;
let machineGunGunX = 0;
let machineGunGunY = 0;
let machineGunBullets = [];
let machineGunShotsFired = 0;
let machineGunDifficulty = 2;
let machineGunCooldownActive = false;
let machineGunStartTime = 0;
let machineGunCooldownTime = 30000;
let machineGunBulletInterval = 500;
let machineGunLastShot = 0;
let paddleDamageZones = [];
let machineGunYOffset = 140;
let minMachineGunY = 0;

// 🧲 Magnet bonus
let magnetActive = false;
let magnetEndTime = 0;           // ms timestamp
let magnetStrength = 0.35;       // aantrekkings-"accel"
let magnetMaxSpeed = 7.5;        // limiet voor trekkende snelheid
let magnetCatchRadius = 22;      // auto-catch radius rond paddle

let fallingCoins = [];
let fallingBags = [];

// ⭐ Sterren & Invincible-schild
let starsCollected = 0;       // 0..10
let invincibleActive = false; // schild aan/uit
let invincibleEndTime = 0;    // ms timestamp einde


const AURA_HEX       = "#FFD700";           // jouw paddle aura hoofdkleur
const AURA_RGB       = "255,215,0";         // zelfde in RGB
const AURA_EDGE_HEX  = "rgba(255,140,0,0.9)"; // warme rand voor tekststroke
const AURA_SOFT_GLOW = "rgba(255,215,0,0.20)";
const AURA_SPARK_RGB = "255,240,150";       // lichtere vonkjes (warm wit/goud)

let starPowerFX = { active: false, t0: 0, duration: 3000, stars: [], particles: [] };
let fxCanvas = null, fxCtx = null;

// ❌ Foute kruisen
let badCrossesCaught = 0;


// ❤️ Hartjes-systeem
let heartsCollected = 0;
let heartPopupTimer = 0;
let fallingHearts = [];

// === DROPS SYSTEM: globals ===
let fallingDrops = []; // actieve losse drops (niet uit bricks)
let dropConfig = null; // actieve scheduler-config
let dropsSpawned = 0;
let lastDropAt = 0;
// Goed verspreide X-posities (zonder clusteren)
let dropSeed = Math.random();
let dropIndex = 0;
const GOLDEN_RATIO_CONJUGATE = 0.61803398875;
const recentSpawnXs = [];
let gridColIndex = 0;

// Handige helper: paddle-bounds per frame
function getPaddleBounds() {
  return {
    left: paddleX,
    right: paddleX + paddleWidth,
    top: paddleY,
    bottom: paddleY + paddleHeight,
  };
}

// ⭐ SFX: ster gepakt
const starCatchSfx = new Audio("starbutton.mp3");
starCatchSfx.preload = "auto";
starCatchSfx.loop = false;
starCatchSfx.volume = 0.85; // pas aan naar smaak

// === Bomb Token & Rain ===
let bombsCollected = 0;
let bombRain = []; // actieve vallende bommen tijdens de regen
const BOMB_TOKEN_TARGET = 10;   // 10 verzamelen
const BOMB_RAIN_COUNT  = 12;    // dan 20 laten vallen

// === BOMB / BITTY SFX ===
const SFX = (() => {
  const map = {
    bombPickup:       new Audio('bom.mp3'),
    bittyActivation:  new Audio('bitty-activatio.mp3'),
  };
  for (const a of Object.values(map)) {
    a.preload = 'auto';
    a.volume = 0.9;
    a.crossOrigin = 'anonymous';
  }
  return {
    play(name) {
      const a = map[name];
      if (!a) return;
      try {
        a.currentTime = 0;
        a.play();
      } catch {
        try { a.cloneNode(true).play(); } catch {}
      }
    }
  };
})();



// voorkomt dubbele 'bittyActivation' als intro -> rain elkaar snel volgen
let _bittyActivationLock = false;

let electricBursts = [];

let speedBoostActive = false;
let speedBoostStart = 0;
const speedBoostDuration = 30000;
const speedBoostMultiplier = 1.5;

let thunder1 = new Audio("thunder1.mp3");
let thunder2 = new Audio("thunder2.mp3");
let thunder3 = new Audio("thunder3.mp3");
let thunderSounds = [thunder1, thunder2, thunder3];

// 🎆 Firework rockets + particles
let fireworksRockets = [];   // opstijgende pijlen
let fireworksParticles = []; // vonken na exploderen


// 🧮 Flags
let stonefallHitsThisGame = 0;
let rockWarnPlayed = false;
let rockWarnTriggerIndex = Math.random() < 0.5 ? 1 : 3; // 1e of 3e keer

balls.push({
  x: canvas.width / 2,
  y: canvas.height - paddleHeight - 10,
  dx: 0,
  dy: -6,
  radius: 8,
  isMain: true
});

// 🎉 Level overlay + confetti/vuurwerk (ENKEL HIER de levelMessage-variabelen)
let confetti = [];
let levelMessageVisible = false;
let levelMessageText = "";
let levelMessageAlpha = 0;
let levelMessageTimer = 0;
const LEVEL_MESSAGE_DURATION = 180;

// 🧱 Paddle-size bonus
let paddleSizeEffect = null; // { type: "long"|"small", end: timestamp, multiplier: number }
let paddleBaseWidth = 100;   // actuele 'basis' breedte voor dit level (zonder tijdelijke bonus)
const PADDLE_LONG_DURATION  = 30000;
const PADDLE_SMALL_DURATION = 30000;

// ==========================================================
// 🎙️ VOICE-OVER: single-channel + cooldown
// ==========================================================
const VO_COOLDOWN_MS = 3000;    // minimaal 3s tussen voices
let voIsPlaying = false;        // speelt er nu een voice?
let voLockedUntil = 0;          // tot wanneer blokkeren (ms sinds pageload)


// === BITTY BOMB: Intro + Explosie VFX ===
let bittyBomb = {
  active: false,
  phase: "idle",   // "idle" | "countdown" | "done"
  start: 0,
  lastTick: 0,
  countdownFrom: 3,
  queuedRain: 0
};

let bombVisuals = null;

const BOMB_VFX = {
  FLASH_START: 500,   // ms
  FLASH_END:   800,
  FLAME_START: 700,
  FLAME_END:   1600,
  BOLT_START:  900,
  BOLT_END:    1600,
  SMOKE_START: 900,
  END:         1800
};

function randRange(a, b) { return a + Math.random() * (b - a); }
function lerp(a, b, t) { return a + (b - a) * t; }


function playVoiceOver(audio, opts = {}) {
  const { cooldown = VO_COOLDOWN_MS } = opts;
  const now = performance.now();

  // Gate dicht? → overslaan
  if (voIsPlaying || now < voLockedUntil) return false;

  voIsPlaying = true; // ⛓️ meteen locken, zodat dezelfde tik geen tweede VO kan starten
  try {
    audio.currentTime = 0;
    audio.onended = () => {
      voIsPlaying = false;
      voLockedUntil = performance.now() + cooldown; // cooldown NA afloop
    };
    audio.play().catch(() => {
      // Als play faalt, meteen unlock + korte cooldown om spam te voorkomen
      voIsPlaying = false;
      voLockedUntil = performance.now() + 500;
    });
  } catch (e) {
    voIsPlaying = false;
    voLockedUntil = performance.now() + 500;
  }
  return true;
}

function updateBonusPowerPanel(stars, bombs, crosses, hearts) {
  // als je 'hearts' vergeet mee te geven, pakken we de globale
  if (typeof hearts !== "number") {
    hearts = typeof heartsCollected === "number" ? heartsCollected : 0;
  }

  // ⭐
  const s  = document.getElementById("bp-stars-liquid");
  const sv = document.getElementById("bp-stars-value");

  // 💣
  const b  = document.getElementById("bp-bombs-liquid");
  const bv = document.getElementById("bp-bombs-value");

  // ❌
  const c  = document.getElementById("bp-cross-liquid");
  const cv = document.getElementById("bp-cross-value");

  // ❤️
  const h  = document.getElementById("bp-hearts-liquid");
  const hv = document.getElementById("bp-hearts-value");

  // ⭐ sterren
  if (s && sv) {
    const pct = Math.min(1, (stars || 0) / 10) * 100;
    s.style.width = pct + "%";
    sv.textContent = (stars || 0) + "/10";

    const row = s.closest(".bp-row");
    if ((stars || 0) >= 10 && row) {
      row.classList.add("flash");
      setTimeout(() => row.classList.remove("flash"), 500);
    }
  }

  // 💣 bommen
  if (b && bv) {
    const pct = Math.min(1, (bombs || 0) / 10) * 100;
    b.style.width = pct + "%";
    bv.textContent = (bombs || 0) + "/10";

    const row = b.closest(".bp-row");
    if ((bombs || 0) >= 10 && row) {
      row.classList.add("flash");
      setTimeout(() => row.classList.remove("flash"), 500);
    }
  }

  // ❌ kruis
  if (c && cv) {
    const pct = Math.min(1, (crosses || 0) / 3) * 100;
    c.style.width = pct + "%";
    cv.textContent = (crosses || 0) + "/3";

    const row = c.closest(".bp-row");
    if ((crosses || 0) >= 3 && row) {
      row.classList.add("flash");
      setTimeout(() => row.classList.remove("flash"), 500);
    }
  }

  // ❤️ hartjes
  if (h && hv) {
    const pct = Math.min(1, (hearts || 0) / 10) * 100;
    h.style.width = pct + "%";
    hv.textContent = (hearts || 0) + "/10";

    const row = h.closest(".bp-row");
    if ((hearts || 0) >= 10 && row) {
      row.classList.add("flash");
      setTimeout(() => row.classList.remove("flash"), 500);
    }
  }
}


function stopStarAura(immediate = false) {
  try {
    if (immediate) {
      starAuraSound.pause();
      starAuraSound.currentTime = 0;
      return;
    }
    // zachte fade-out
    if (typeof fadeOutAndStop === "function") {
      fadeOutAndStop(starAuraSound, 300);
    } else {
      starAuraSound.pause();
      starAuraSound.currentTime = 0;
    }
  } catch (e) {}
}

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}


function nextWellDistributedX(margin = 40, minSpacing = 70) {
  // quasi-random met golden ratio; voorkomt clustering
  let tries = 0;
  let x;
  const usable = canvas.width - margin * 2;
  while (true) {
    dropSeed = (dropSeed + GOLDEN_RATIO_CONJUGATE) % 1;
    x = margin + dropSeed * usable;
    const tooClose = recentSpawnXs.some(px => Math.abs(px - x) < minSpacing);
    if (!tooClose || tries++ > 6) break;
  }
  recentSpawnXs.push(x);
  if (recentSpawnXs.length > 5) recentSpawnXs.shift();
  return x;
}

function nextGridX(margin = 40, columns = 8, jitterPx = 18) {
  const usable = canvas.width - margin * 2;
  const colW = usable / Math.max(1, columns);
  const col = (gridColIndex++ % Math.max(1, columns));
  const base = margin + col * colW + colW / 2;
  const jitter = (Math.random() * 2 - 1) * jitterPx;
  let x = base + jitter;

  // kleine anti-cluster
  const tooClose = recentSpawnXs.some(px => Math.abs(px - x) < Math.min(70, colW * 0.75));
  if (tooClose) x += (colW * 0.5 * (Math.random() < 0.5 ? -1 : 1));

  x = clamp(x, margin, canvas.width - margin);
  recentSpawnXs.push(x);
  if (recentSpawnXs.length > 5) recentSpawnXs.shift();
  return x;
}

function chooseSpawnX(cfg) {
  const margin = cfg.xMargin || 0;

  // 1) kies X volgens modus
  let x = (cfg.mode === "grid")
    ? nextGridX(margin, cfg.gridColumns, cfg.gridJitterPx)
    : nextWellDistributedX(margin, cfg.minSpacing);

  // 2) optioneel vermijden boven paddle
  if (cfg.avoidPaddle) {
    const padL = paddleX;
    const padR = paddleX + paddleWidth;
    const extra = (cfg.avoidMarginPx != null) ? cfg.avoidMarginPx : (paddleWidth * 0.6 + 30);
    const forbidL = padL - extra;
    const forbidR = padR + extra;

    if (x >= forbidL && x <= forbidR) {
      // duw X naar de dichtstbijzijnde vrije kant
      const leftRoom  = Math.max(margin, forbidL - 8);
      const rightRoom = Math.min(canvas.width - margin, forbidR + 8);
      if (Math.abs(x - leftRoom) < Math.abs(x - rightRoom)) {
        x = leftRoom - Math.random() * 40;
      } else {
        x = rightRoom + Math.random() * 40;
      }
      x = clamp(x, margin, canvas.width - margin);
    }
  }

  return x;
}


function ensureFxCanvas() {
  if (fxCanvas) return;
  fxCanvas = document.createElement('canvas');
  fxCanvas.style.position = 'fixed';
  fxCanvas.style.top = '0';
  fxCanvas.style.left = '0';
  fxCanvas.style.width = '100vw';
  fxCanvas.style.height = '100vh';
  fxCanvas.style.pointerEvents = 'none';
  fxCanvas.style.zIndex = '9999';
  document.body.appendChild(fxCanvas);
  fxCtx = fxCanvas.getContext('2d');

  const resizeFx = () => { fxCanvas.width = innerWidth; fxCanvas.height = innerHeight; };
  addEventListener('resize', resizeFx);
  resizeFx();
}

function startStarPowerCelebration() {
  ensureFxCanvas();

  // 🔊 One-shot SFX bij start van de celebration (letters + sterren)
  try {
    if (typeof playOnceSafe === "function") {
      playOnceSafe(starPowerSfx);
    } else {
      starPowerSfx?.pause?.();
      if (starPowerSfx) starPowerSfx.currentTime = 0;
      starPowerSfx?.play?.();
    }
  } catch (e) {}

  starPowerFX.active = true;
  starPowerFX.t0 = performance.now();
  starPowerFX.stars = [];
  starPowerFX.particles = [];

  const W = fxCanvas.width, H = fxCanvas.height;
  const N = 10;

  for (let i = 0; i < N; i++) {
    const dir = (i % 2 === 0) ? 1 : -1;
    const y = (H * 0.15) + (i / (N - 1)) * (H * 0.7);
    const speed = (W / 2.2) + Math.random() * (W / 1.8);
    const amp   = 18 + Math.random() * 24;
    const freq  = 1.5 + Math.random() * 1.5;
    const startX = dir === 1 ? -80 : W + 80;
    const vx = dir * speed;

    starPowerFX.stars.push({
      x: startX, y, vx, vy: 0,
      r: 0, vr: (Math.random() * 2 - 1) * 0.015,
      scale: 0.7 + Math.random() * 0.6,
      amp, freq, t: Math.random() * 1000, dir
    });
  }
}


function renderStarPowerFX() {
  if (!starPowerFX.active || !fxCtx) return;

  const now = performance.now();
  const dt = Math.min(33, now - (renderStarPowerFX._prev || now));
  renderStarPowerFX._prev = now;

  const tElapsed = now - starPowerFX.t0;
  const W = fxCanvas.width, H = fxCanvas.height;

  // Clear + subtiele donkerte zodat neon beter "pop"t (heel licht!)
  fxCtx.clearRect(0, 0, W, H);
  fxCtx.fillStyle = "rgba(0,0,0,0.12)";
  fxCtx.fillRect(0, 0, W, H);

  // Sterren + stardust
  for (const s of starPowerFX.stars) {
    s.t += dt * 0.001;
    const yOffset = Math.sin(s.t * s.freq * 2 * Math.PI) * s.amp;
    s.x += s.vx * (dt / 1000);
    s.y += yOffset * 0.02;
    s.r += s.vr * dt;

    // Ster tekenen met neon-glow (zelfde aura-kleur)
    fxCtx.save();
    fxCtx.translate(s.x, s.y);
    fxCtx.rotate(s.r);
    const size = 56 * s.scale;

    // zachte glow ring onder de ster
    const grd = fxCtx.createRadialGradient(0, 0, size * 0.15, 0, 0, size * 0.9);
    grd.addColorStop(0.00, `rgba(${AURA_RGB},0.30)`);
    grd.addColorStop(0.50, `rgba(${AURA_RGB},0.12)`);
    grd.addColorStop(1.00, `rgba(${AURA_RGB},0.00)`);
    fxCtx.globalCompositeOperation = 'lighter';
    fxCtx.fillStyle = grd;
    fxCtx.beginPath();
    fxCtx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
    fxCtx.fill();

    // ster zelf
    fxCtx.globalAlpha = 0.96;
    fxCtx.drawImage(starImg, -size/2, -size/2, size, size);
    fxCtx.restore();

    // Stardust (zelfde neon goud, iets lichter voor sparkle)
    for (let k = 0; k < 3; k++) {
      starPowerFX.particles.push({
        x: s.x,
        y: s.y,
        vx: (Math.random() - 0.5) * 80,
        vy: (Math.random() - 0.5) * 80 + 20,
        life: 600,
        age: 0,
        r: 1.5 + Math.random() * 2.5
      });
    }
  }

  for (let i = starPowerFX.particles.length - 1; i >= 0; i--) {
    const p = starPowerFX.particles[i];
    p.age += dt;
    if (p.age >= p.life) { starPowerFX.particles.splice(i, 1); continue; }
    const a = 1 - (p.age / p.life);
    p.x += p.vx * (dt / 1000);
    p.y += p.vy * (dt / 1000);

    fxCtx.save();
    fxCtx.globalCompositeOperation = 'lighter';
    fxCtx.globalAlpha = a * 0.95;

    const grd = fxCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.2);
    grd.addColorStop(0, `rgba(${AURA_SPARK_RGB},1)`);       // kern (licht)
    grd.addColorStop(1, `rgba(${AURA_RGB},0)`);             // uitwaaien
    fxCtx.fillStyle = grd;
    fxCtx.beginPath();
    fxCtx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
    fxCtx.fill();
    fxCtx.restore();
  }

  // Titel “Bitty STAR POWER!” met identieke neon-styling
  const fadeIn = Math.min(1, tElapsed / 300);
  const fadeOut = Math.min(1, Math.max(0, (starPowerFX.duration - tElapsed) / 300));
  const alpha = Math.min(fadeIn, fadeOut);

  fxCtx.save();
  fxCtx.globalAlpha = alpha;
  const title = "Bitty STAR POWER!";
  fxCtx.font = `bold ${Math.round(Math.min(W, H) * 0.08)}px Arial`;
  fxCtx.textAlign = "center";
  fxCtx.textBaseline = "middle";

  // multi-pass glow in AURA-kleur
  fxCtx.fillStyle = `rgba(${AURA_RGB},0.22)`;
  for (let g = 0; g < 5; g++) {
    fxCtx.fillText(title, W / 2, H * 0.25);
  }

  // kern + warme rand (zoals je aura-edge)
  fxCtx.fillStyle = AURA_HEX;
  fxCtx.strokeStyle = AURA_EDGE_HEX;
  fxCtx.lineWidth = 4;
  fxCtx.strokeText(title, W / 2, H * 0.25);
  fxCtx.fillText(title, W / 2, H * 0.25);

  fxCtx.restore();

  // einde
  if (tElapsed >= starPowerFX.duration) {
    starPowerFX.active = false;
    fxCtx.clearRect(0, 0, W, H);
  }
}

function renderBittyBombIntro() {
  if (!bittyBomb.active) return;

  const now = performance.now();
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;

  if (bittyBomb.phase === "countdown") {
    const elapsed = now - bittyBomb.start;
    const secs = Math.floor(elapsed / 1000);
    const remain = Math.max(0, bittyBomb.countdownFrom - secs);
    const blinkOn = (Math.floor(elapsed/500) % 2) === 0;

    // 👇 overlay weggehaald

    // tekst + nummer in cirkel
    const title = "BITTY BOMB  ACTIVATED !";
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "bold 40px Arial";
    ctx.fillStyle = blinkOn ? "rgba(180,180,180,1)" : "rgba(120,120,120,1)";
    ctx.strokeStyle = "rgba(50,50,50,0.7)";
    ctx.lineWidth = 3;
    ctx.strokeText(title, cx, cy - 60);
    ctx.fillText(title,  cx, cy - 60);

    ctx.beginPath();
    ctx.arc(cx, cy + 10, 28, 0, Math.PI*2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = blinkOn ? "rgba(200,200,200,0.9)" : "rgba(160,160,160,0.9)";
    ctx.stroke();

    ctx.font = "bold 34px Arial";
    ctx.fillStyle = "rgba(220,220,220,1)";
    ctx.fillText(String(Math.max(1, remain)), cx, cy + 10);

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "rgba(170,170,170,1)";
    ctx.fillText(`${title} ${Math.max(1, remain)}.`, cx, cy + 60);
    ctx.restore();

    if (remain <= 0) {
      bittyBomb.phase = "done";
      bittyBomb.active = false;
      startBombVisuals(() => startBombRain(bittyBomb.queuedRain));
      try {
        (thunderSounds?.[Math.floor(Math.random()*thunderSounds.length)] || thunder1).play();
      } catch {}
    }
  }
}

// ❤️ full-screen heart celebration
let heartCelebration = {
  active: false,
  t0: 0,
  hearts: []
};

function triggerHeartCelebration() {
  // zorg dat overlay er is
  ensureFxCanvas();

  // 🎵 speel nu jouw nieuwe bitty-level-up mp3
  try {
    bittyLevelUpSfx.currentTime = 0;
    bittyLevelUpSfx.play();
  } catch (e) {}

  const W = fxCanvas.width;
  const H = fxCanvas.height;

  heartCelebration.active = true;
  heartCelebration.t0 = performance.now();
  heartCelebration.hearts = [];

  // 👇 nieuw: kort het levelup-plaatje laten zien
  heartCelebration.showMascot = true;
  heartCelebration.mascotStart = performance.now();

  const count = 50;
  for (let i = 0; i < count; i++) {
    heartCelebration.hearts.push({
      x: Math.random() * W,
      y: -40 - Math.random() * 200,
      dx: (Math.random() - 0.5) * 1.2,
      dy: 2 + Math.random() * 2.5,
      size: 32 + Math.random() * 26,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (-1 + Math.random() * 2) * 0.04,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

function drawHeartCelebration() {
  if (!heartCelebration.active || !fxCtx) return;

  const now = performance.now();
  const elapsed = now - heartCelebration.t0;
  const W = fxCanvas.width;
  const H = fxCanvas.height;

  // duur van de animatie
  const DURATION = 4000; // 4 sec
  if (elapsed > DURATION) {
    heartCelebration.active = false;
    return;
  }

  // 0..1
  const progress = elapsed / DURATION;
  const fade = 1 - progress;

  // canvas leegmaken
  fxCtx.clearRect(0, 0, W, H);
 
  // 👇 NIEUW: jouw levelup-plaatje 2 seconden tonen op originele grootte
  if (
    heartCelebration.showMascot &&
    typeof heartLevelupImg !== "undefined" &&
    heartLevelupImg.complete
  ) {
    const POP_DURATION = 2000; // 2 sec
    const popElapsed = now - heartCelebration.mascotStart;
    if (popElapsed < POP_DURATION) {
      const a = 1 - popElapsed / POP_DURATION; // fade-out

      // originele grootte
      let drawW = heartLevelupImg.width;
      let drawH = heartLevelupImg.height;

      // veiligheidscheck: als het groter is dan canvas, dan passend maken
      const maxW = W * 0.9;
      const maxH = H * 0.9;
      if (drawW > maxW) {
        const f = maxW / drawW;
        drawW *= f;
        drawH *= f;
      }
      if (drawH > maxH) {
        const f = maxH / drawH;
        drawW *= f;
        drawH *= f;
      }

      fxCtx.save();
      fxCtx.globalAlpha = a * fade;
      fxCtx.drawImage(
        heartLevelupImg,
        (W - drawW) / 2,
        (H - drawH) / 2 + 20, // mag je nog tunen
        drawW,
        drawH
      );
      fxCtx.restore();
    } else {
      heartCelebration.showMascot = false;
    }
  }


  // hartjes tekenen
  for (const h of heartCelebration.hearts) {
    // bewegen
    h.x += h.dx;
    h.y += h.dy;
    h.rot += h.rotSpeed;
    h.pulse += 0.25;

    // we RESPAWNEN NIET meer → als ze uit beeld zijn, tekenen we ze gewoon niet
    if (h.y > H + 80) continue;

    // aura
    fxCtx.save();
    fxCtx.translate(h.x, h.y);

    const auraR = h.size * (0.55 + 0.15 * Math.sin(h.pulse));
    const auraGrad = fxCtx.createRadialGradient(0, 0, 4, 0, 0, auraR);
    fxCtx.globalAlpha = 0.7 * fade;
    auraGrad.addColorStop(0, "rgba(255,180,220,0.9)");
    auraGrad.addColorStop(0.6, "rgba(255,120,200,0.35)");
    auraGrad.addColorStop(1, "rgba(255,120,200,0)");
    fxCtx.fillStyle = auraGrad;
    fxCtx.beginPath();
    fxCtx.ellipse(0, 0, auraR, auraR * 0.7, 0, 0, Math.PI * 2);
    fxCtx.fill();
    fxCtx.restore();

    // hartje zelf
    fxCtx.save();
    fxCtx.translate(h.x, h.y);
    fxCtx.rotate(h.rot);
    fxCtx.globalAlpha = fade;
    fxCtx.drawImage(heartImg, -h.size / 2, -h.size / 2, h.size, h.size);
    fxCtx.restore();
  }
}


function showLevelBanner(text) {
  levelMessageText = text;
  levelMessageVisible = true;
  levelMessageAlpha = 1;
  levelMessageTimer = 0;
}

function spawnConfetti(n = 160) {
  for (let i = 0; i < n; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      dx: (-1 + Math.random() * 2) * 1.5,
      dy: 2 + Math.random() * 3,
      size: 3 + Math.random() * 4,
      rot: Math.random() * Math.PI * 2,
      drot: -0.05 + Math.random() * 0.1,
    });
  }
}

function drawConfetti() {
  for (let i = confetti.length - 1; i >= 0; i--) {
    const p = confetti[i];
    p.x += p.dx;
    p.y += p.dy;
    p.rot += p.drot;
    if (p.y > canvas.height + 30) { confetti.splice(i, 1); continue; }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = 0.9;
    const colors = ["#ffd700", "#ff4d4d", "#4dff88", "#66a3ff", "#ff66ff"];
    ctx.fillStyle = colors[i % colors.length];
    if (i % 2 === 0) {
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function spawnFireworks(bursts = 6) {
  // gebruikt je bestaande explosions-rendering als die er is
  if (!Array.isArray(explosions)) return;
  for (let i = 0; i < bursts; i++) {
    const cx = canvas.width * (0.1 + Math.random() * 0.8);
    const cy = canvas.height * (0.1 + Math.random() * 0.4);
    explosions.push({ x: cx, y: cy, radius: 10, alpha: 1, color: "white" });
    explosions.push({ x: cx, y: cy, radius: 14, alpha: 1, color: "orange" });
  }
}

function triggerLevelCelebration(lvl, opts = {}) {
  showLevelBanner(`Bitty Bitcoin Mascot — Level ${lvl}`);
  spawnConfetti(opts.confettiCount ?? 160);

  // 🚀 nieuw: gebruik rockets-optie (of schaal mee met level)
  const rockets = opts.rockets ?? Math.min(14, 6 + Math.floor(lvl / 2));
  if (rockets > 0) spawnFireworkRockets(rockets);

  if (!opts.skipFireworks) spawnFireworks(6);

  try { levelUpSound?.pause?.(); levelUpSound.currentTime = 0; levelUpSound?.play?.(); } catch (e) {}
}


function spawnFireworkRockets(count = 8) {
  for (let i = 0; i < count; i++) {
    const x = canvas.width * (0.1 + Math.random() * 0.8);
    fireworksRockets.push({
      x,
      y: canvas.height + 10,       // start nét onder het scherm
      vx: (-1 + Math.random() * 2) * 1.2, // lichte scheefstand L/R
      vy: -(6 + Math.random() * 3),       // kracht omhoog
      ax: 0,
      ay: 0.12,                     // “zwaartekracht”
      color: ["#ffdf33","#ff6a00","#66a3ff","#ff66ff","#4dff88"][Math.floor(Math.random()*5)],
      trail: [],                    // kleine rook/vonk trail
      life: 60 + Math.floor(Math.random()*30), // frames tot auto-explode fallback
      exploded: false
    });
  }
}

function explodeFirework(x, y, baseColor) {
  const n = 48 + Math.floor(Math.random()*24); // 48–72 vonken
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI*2) * (i / n) + Math.random() * 0.25;
    const speed = 2 + Math.random() * 3.5;
    fireworksParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ay: 0.08,                    // lichte zwaartekracht op vonken
      alpha: 1,
      decay: 0.015 + Math.random()*0.02,
      size: 2 + Math.random()*2,
      color: baseColor
    });
  }
  // optioneel: gebruik je bestaande explosions voor extra “pop”
  explosions?.push?.({ x, y, radius: 12, alpha: 1, color: "white" });
  explosions?.push?.({ x, y, radius: 16, alpha: 1, color: "orange" });
}

function drawFireworks() {
  // 🚀 Update & teken rockets
  for (let i = fireworksRockets.length - 1; i >= 0; i--) {
    const r = fireworksRockets[i];
    // fysica
    r.vx += r.ax;
    r.vy += r.ay;
    r.x += r.vx;
    r.y += r.vy;
    r.life--;

    // trail bijhouden (max 12 punten)
    r.trail.push({ x: r.x, y: r.y });
    if (r.trail.length > 12) r.trail.shift();

    // explodeer op “apex” (wanneer vy > 0) of als backup op life==0
    if (!r.exploded && (r.vy > 0 || r.life <= 0 || r.y < canvas.height*0.15)) {
      r.exploded = true;
      explodeFirework(r.x, r.y, r.color);
      fireworksRockets.splice(i, 1);
      continue;
    }

    // tekenen (trail + kop)
    ctx.save();
    // trail (fading line)
    ctx.beginPath();
    for (let t = 0; t < r.trail.length; t++) {
      const p = r.trail[t];
      const a = t / r.trail.length;
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + a*0.5})`;
      if (t === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // rocket head
    ctx.beginPath();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = r.color;
    ctx.arc(r.x, r.y, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // ✨ Update & teken particles
  for (let i = fireworksParticles.length - 1; i >= 0; i--) {
    const p = fireworksParticles[i];
    p.vy += p.ay;
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;

    if (p.alpha <= 0 || p.y > canvas.height + 40) {
      fireworksParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // performance guard
  if (fireworksParticles.length > 2000) {
    fireworksParticles.splice(0, fireworksParticles.length - 2000);
  }
  if (fireworksRockets.length > 60) {
    fireworksRockets.splice(0, fireworksRockets.length - 60);
  }
}

function getPaddleCenter() {
  const cx = paddleX + paddleWidth / 2;
  const cy = paddleY + paddleHeight / 2;
  return { cx, cy };
}

// en gebruik:
function activateMagnet(durationMs = 20000) {
  magnetActive = true;
  magnetEndTime = performance.now() + durationMs;
  try { magnetSound.currentTime = 0; magnetSound.play(); } catch(e){}
}


function stopMagnet() {
  if (!magnetActive) return;
  magnetActive = false;
}

// Zet dit bovenin bij je helpers
function getBallCenter(ball) {
  return { cx: ball.x + ball.radius, cy: ball.y + ball.radius };
}
function activateInvincibleShield(ms = 30000) {
  invincibleActive = true;
  invincibleEndTime = performance.now() + ms;
  try {
    if (starAuraSound.paused) {
      starAuraSound.currentTime = 0;
      starAuraSound.play();
    }
  } catch (e) {}
}





const bonusBricks = [
  { col: 5, row: 3, type: "rocket" },  { col: 2, row: 12, type: "machinegun" }, 
  { col: 4, row: 0, type: "paddle_small" },{ col: 7, row: 10, type: "paddle_long" },


  { col: 4, row: 4, type: "magnet" },{ col: 4, row: 10, type: "tnt" },{ col: 1, row: 1, type: "tnt" },{ col: 7, row: 1, type: "tnt" },




  { col: 8, row: 4, type: "power" },   { col: 4, row: 14, type: "stonefall" },

  { col: 2, row: 7, type: "doubleball" }, { col: 7, row: 14, type: "silver" },{ col: 8, row: 14, type: "silver" },{ col: 6, row: 14, type: "silver" },
  { col: 0, row: 14, type: "silver" }, { col: 1, row: 14, type: "silver" }, { col: 2, row: 14, type: "silver" },


  { col: 4, row: 7, type: "2x" },         
  { col: 2, row: 3, type: "speed" },       { col: 2, row: 2, type: "stonefall" },      
  { col: 3, row: 14, type: "stone" },      { col: 1, row: 2, type: "stonefall" },
  { col: 4, row: 14, type: "stone" },      { col: 0, row: 2, type: "stonefall" },
  { col: 5, row: 14, type: "stone" },      { col: 6, row: 2, type: "stonefall" },
  { col: 0, row: 8, type: "stone" },       { col: 7, row: 2, type: "stonefall" },
  { col: 1, row: 8, type: "stone" },       { col: 8, row: 2, type: "stonefall" },
  { col: 2, row: 8, type: "stone" },
  { col: 8, row: 5, type: "stone" },
  { col: 7, row: 6, type: "stone" },
  { col: 6, row: 7, type: "stone" },
];
// 📦 PXP layout voor level 2 (alleen steen-blokken)
const pxpMap = [
  { col: 0, row: 4, type: "silver" }, { col: 0, row: 5 },   { col: 0, row: 8 },      { col: 0, row: 14 },     { col: 5, row: 3, type: "rocket" },{ col: 4, row: 10, type: "stonefall" },{ col: 1, row: 8, type: "tnt" },
  { col: 1, row: 4, type: "silver" }, { col: 1, row: 5 },   { col: 1, row: 8 },      { col: 1, row: 14 },     { col: 8, row: 5, type: "power" },   { col: 5, row: 11, type: "stonefall" }, { col: 7, row: 8, type: "tnt" },    
  { col: 2, row: 4, type: "silver" }, { col: 2, row: 5 },   { col: 2, row: 8 },      { col: 2, row: 14 },     { col: 3, row: 3, type: "speed" },      { col: 6, row: 12, type: "stonefall" }, { col: 1, row: 1, type: "tnt" },  
  { col: 3, row: 4, type: "silver" }, { col: 3, row: 5 },   { col: 3, row: 8 },      { col: 3, row: 14 },     { col: 4, row: 7, type: "2x" },       { col: 7, row: 13, type: "stonefall" },{ col: 7, row: 1, type: "tnt" },
  { col: 4, row: 4, type: "silver" }, { col: 4, row: 5 },   { col: 4, row: 8 },      { col: 4, row: 14 },     { col: 1, row: 7, type: "doubleball" },  { col: 8, row: 14, type: "stonefall" },       
  { col: 5, row: 4, type: "silver" }, { col: 5, row: 5 },   { col: 5, row: 8 },      { col: 5, row: 14 },      { col: 0, row: 14, type: "stonefall" },     { col: 2, row: 8, type: "stone" },   
  { col: 6, row: 4, type: "silver" }, { col: 6, row: 5 },   { col: 6, row: 8 },      { col: 6, row: 14 },       { col: 1, row: 13, type: "stonefall" },    { col: 4, row: 0, type: "paddle_small" },         
  { col: 7, row: 4, type: "silver" }, { col: 7, row: 5 },   { col: 7, row: 8 },      { col: 7, row: 14 },        { col: 2, row: 12, type: "stonefall" },    { col: 7, row: 10, type: "paddle_long" },                            
  { col: 8, row: 4, type: "silver" }, { col: 8, row: 5 },   { col: 8, row: 8 },      { col: 8, row: 14 },         { col: 3, row: 11, type: "stonefall" },        { col: 4, row: 13, type: "magnet" },               
  { col: 0, row: 7, type: "stone" },  { col: 1, row: 1, type: "stone" },                                                                                                                                                         
  { col: 1, row: 6, type: "stone" },  
  { col: 2, row: 2, type: "stone" },
  { col: 2, row: 7, type: "stone" },  
  { col: 7, row: 1, type: "stone" }, 
  { col: 6, row: 2, type: "stone" },
  { col: 8, row: 0, type: "stone" },
  { col: 7, row: 1, type: "stone" },
  { col: 6, row: 2, type: "stone" },
  { col: 8, row: 7, type: "stone" },
  { col: 7, row: 6, type: "stone" },
  { col: 6, row: 7, type: "stone" },
  { col: 0, row: 0, type: "stone" },  
  { col: 0, row: 14, type: "stone" },
];

// 🌋 Level 3 layout (voorbeeld)
const level3Map = [
  // Rand van stenen (stevig)
  { col: 0, row: 0, type: "stone" }, { col: 1, row: 0, type: "stone" }, { col: 2, row: 0, type: "stone" },
  { col: 3, row: 0, type: "stone" }, { col: 4, row: 0, type: "stone" }, { col: 5, row: 0, type: "stone" },
  { col: 6, row: 0, type: "stone" }, { col: 7, row: 0, type: "stone" }, { col: 8, row: 0, type: "stone" },
  { col: 0, row: 14, type: "stone" }, { col: 1, row: 14, type: "stone" }, { col: 2, row: 14, type: "stone" },
  { col: 3, row: 14, type: "stone" }, { col: 4, row: 14, type: "stone" }, { col: 5, row: 14, type: "stone" },
  { col: 6, row: 14, type: "stone" }, { col: 7, row: 14, type: "stone" }, { col: 8, row: 14, type: "stone" },

  // Zijwanden
  { col: 0, row: 4, type: "stone" }, { col: 0, row: 5, type: "stone" }, { col: 0, row: 6, type: "stone" },
  { col: 8, row: 4, type: "stone" }, { col: 8, row: 5, type: "stone" }, { col: 8, row: 6, type: "stone" },

  // Diagonalen van silver (2 hits + elektriciteitseffect)
  { col: 1, row: 3, type: "silver" }, { col: 2, row: 4, type: "silver" }, { col: 3, row: 5, type: "silver" },
  { col: 4, row: 6, type: "silver" }, { col: 5, row: 5, type: "silver" }, { col: 6, row: 4, type: "silver" },
  { col: 7, row: 3, type: "silver" },

  // Bonussen verspreid
  { col: 4, row: 2, type: "machinegun" },{ col: 7, row: 1, type: "tnt" },
  { col: 2, row: 2, type: "doubleball" },{ col: 8, row: 7, type: "tnt" },
  { col: 6, row: 2, type: "speed" },     { col: 1, row: 1, type: "tnt" },
  { col: 1, row: 8, type: "2x" },         { col: 1, row: 8, type: "tnt" },
  { col: 7, row: 8, type: "2x" },
  { col: 4, row: 9, type: "rocket" },
  { col: 5, row: 10, type: "paddle_long" },
  { col: 0, row: 10, type: "paddle_small" },
  { col: 7, row: 4, type: "magnet" },

  // Stonefall “valstrikken” (3 hits + laat stenen vallen)
  { col: 3, row: 8, type: "stonefall" },
  { col: 5, row: 8, type: "stonefall" },
];

// ===== Levels-config – 20 levels eenvoudig schaalbaar =====
const TOTAL_LEVELS = 20;

// Stop je bestaande maps als basis in level 1-3
const level1Map = (typeof bonusBricks !== "undefined" ? bonusBricks : []);
const level2Map = (typeof pxpMap !== "undefined" ? pxpMap : []);
// level3Map bestaat al bij jou

// Helper: maak lege map
function createEmptyMap() { return []; }

// Centrale tabel met 20 entries (maps + optionele params)
const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, i) => ({
  map: createEmptyMap(),
  params: {
    // basis-schaal: elke 5 levels mini-stapjes, pas vrij aan
    ballSpeed: 7 + 0.2 * i,                 // start snelheid
    paddleWidth: 100 - Math.floor(i / 4) * 4, // per 4 levels -4px, min later clampen
    machineGunDifficulty: Math.min(1 + Math.floor(i / 7), 3) // 1..3
  }
}));

// Zet jouw bestaande 1–3 in de centrale tabel (behoud huidig gedrag)
LEVELS[0].map = level1Map;
LEVELS[1].map = level2Map;
LEVELS[2].map = (typeof level3Map !== "undefined" ? level3Map : []);

// 🔧 Makkelijk bonusblokken plaatsen:
function addBonus(levelNumber, col, row, type="normal") {
  const idx = levelNumber - 1;
  if (!LEVELS[idx]) return;
  LEVELS[idx].map.push({ col, row, type });
}

function addBonuses(levelNumber, entries) {
  entries.forEach(e => addBonus(levelNumber, e.col, e.row, e.type));
}

// ---------- LEVEL 4: “Band + traps” (zet voort op L2’s band, introduceert extra traps)
addBonuses(4, [
  // band midden (rows 4-5), accenten silver
  { col: 2, row: 4, type: "silver" }, { col: 3, row: 4, type: "silver" }, { col: 5, row: 4, type: "silver" }, { col: 6, row: 4, type: "silver" },
  { col: 2, row: 5 }, { col: 3, row: 5 }, { col: 5, row: 5 }, { col: 6, row: 5 },

  // vroege valstrikken
  { col: 1, row: 2, type: "stonefall" }, { col: 7, row: 2, type: "stonefall" }, { col: 1, row: 11, type: "stonefall" }, { col: 7, row: 11, type: "stonefall" },
  { col: 4, row: 9, type: "stonefall" },

  // diagonale stones richting midden
  { col: 0, row: 8, type: "stone" }, { col: 1, row: 7, type: "stone" }, { col: 7, row: 7, type: "stone" }, { col: 8, row: 8, type: "stone" }, { col: 4, row: 11, type: "stone" },
  { col: 3, row: 12, type: "stone" }, { col: 5, row: 12, type: "stone" },   // ⬅️ komma toegevoegd hier

  // bonussen op accenten
  { col: 4, row: 3, type: "machinegun" }, { col: 4, row: 6, type: "rocket" }, { col: 1, row: 6, type: "doubleball" },  { col: 8, row: 4, type: "magnet" },
  { col: 7, row: 6, type: "speed" }, { col: 4, row: 8, type: "2x" }, { col: 8, row: 5, type: "power" },{ col: 3, row: 13, type: "paddle_long" },
  { col: 1, row: 5, type: "paddle_small" },{ col: 3, row: 14, type: "tnt" },{ col: 4, row: 14, type: "tnt" },{ col: 5, row: 14, type: "tnt" },

]);

// ---------- LEVEL 5: “Diagonaal ruit + zware onderlijn (silver/stone mix)”
addBonuses(5, [
  // diagonalen silver
  {col:2,row:3,type:"silver"},{col:3,row:4,type:"silver"},{col:5,row:4,type:"silver"},{col:6,row:3,type:"silver"},
  // onderlijn stevig
  {col:0,row:14,type:"stone"},{col:1,row:14,type:"silver"},{col:2,row:14,type:"stone"},{col:1,row:4,type:"stone"},{col:2,row:4,type:"stone"},{col:6,row:4,type:"stone"},{col:7,row:4,type:"stone"},
  {col:7,row:5,type:"stone"},{col:8,row:5,type:"stone"},{col:0,row:5,type:"stone"},{col:1,row:5,type:"stone"},
  {col:6,row:14,type:"silver"},{col:7,row:14,type:"stone"},{col:8,row:14,type:"silver"},
  // traps midden
  {col:3,row:8,type:"stonefall"},{col:5,row:8,type:"stonefall"},{col:0,row:0,type:"stonefall"},{col:1,row:1,type:"stonefall"},
  {col:8,row:0,type:"stonefall"},{col:7,row:1,type:"stonefall"},
  // bonussen
  {col:4,row:2,type:"machinegun"},{col:1,row:7,type:"doubleball"},{col:7,row:7,type:"speed"},  { col: 4, row: 12, type: "magnet" },
  {col:4,row:9,type:"rocket"},{col:4,row:6,type:"2x"},{col:8,row:4,type:"power"},{ col: 6, row: 6, type: "paddle_long" },
  { col: 8, row: 1, type: "paddle_small" },{ col: 3, row: 10, type: "tnt" },{ col: 4, row: 10, type: "tnt" },{ col: 5, row: 10, type: "tnt" }

]);

// ---------- LEVEL 6: “Zijwanden + band + X-traps”
addBonuses(6, [
  // zijwanden stone
  {col:0,row:5,type:"stone"},{col:0,row:6,type:"stone"},{col:8,row:5,type:"stone"},{col:8,row:6,type:"stone"},{col:2,row:10,type:"stone"},
  {col:1,row:11,type:"stone"},{col:0,row:12,type:"stone"},{col:6,row:10,type:"stone"},{col:7,row:11,type:"stone"},{col:8,row:12,type:"stone"},
  // band row 4/5
  {col:1,row:4,type:"silver"},{col:2,row:4},{col:6,row:4},{col:3,row:9,type:"silver"},{col:4,row:9,type:"silver"},{col:5,row:9,type:"silver"},
  {col:2,row:5},{col:3,row:5},{col:5,row:5},{col:6,row:5},
  // X traps
  {col:3,row:3,type:"stonefall"},{col:5,row:3,type:"stonefall"},{col:2,row:2,type:"stonefall"},{col:1,row:1,type:"stonefall"},{col:0,row:0,type:"stonefall"},
  {col:3,row:7,type:"stonefall"},{col:6,row:2,type:"stonefall"},{col:7,row:1,type:"stonefall"},{col:8,row:0,type:"stonefall"},{col:5,row:7,type:"stonefall"},
  // bonussen
  {col:4,row:2,type:"machinegun"},{col:1,row:7,type:"doubleball"},{col:7,row:7,type:"rocket"},
  {col:4,row:8,type:"speed"},{col:4,row:6,type:"2x"},{col:0,row:4,type:"power"},{ col: 1, row: 4, type: "tnt" },{ col: 1, row: 5, type: "tnt" },{ col: 1, row: 6, type: "tnt" },
]);

// ---------- LEVEL 7: “Rand + diagonale silver + middenval”
addBonuses(7, [
  // top/bottom hoeken stone
  {col:0,row:0,type:"stone"},{col:8,row:0,type:"stone"},{col:0,row:14,type:"stone"},{col:8,row:14,type:"stone"},{col:4,row:14,type:"stone"},
  {col:4,row:13,type:"stone"},{col:4,row:12,type:"stone"},
  // diagonalen silver
  {col:1,row:3,type:"silver"},{col:2,row:4,type:"silver"},{col:6,row:4,type:"silver"},{col:7,row:3,type:"silver"},
  {col:1,row:14,type:"silver"},{col:2,row:14,type:"silver"},{col:3,row:14,type:"silver"},{col:5,row:14,type:"silver"},
  {col:6,row:14,type:"silver"},{col:7,row:14,type:"silver"},
  // middenval
  {col:4,row:7,type:"stonefall"},{col:3,row:8,type:"stonefall"},{col:5,row:8,type:"stonefall"},{col:3,row:11,type:"stonefall"},{col:5,row:11,type:"stonefall"},
  // bonussen (kruis)
  {col:4,row:2,type:"machinegun"},{col:4,row:5,type:"doubleball"},{col:4,row:9,type:"rocket"},
  {col:2,row:6,type:"2x"},{col:6,row:6,type:"speed"},{col:4,row:11,type:"power"}
]);

// ---------- LEVEL 8: “Driebanden (4/8/12) + traps aan zijkant”
addBonuses(8, [
  // banden
  {col:1,row:4,type:"silver"},{col:2,row:4,type:"silver"},{col:3,row:4,type:"silver"},{col:5,row:4,type:"silver"},{col:6,row:4,type:"silver"},{col:7,row:4,type:"silver"},
  {col:1,row:8,type:"silver"},{col:2,row:8,type:"silver"},{col:3,row:8,type:"silver"},{col:5,row:8,type:"silver"},{col:6,row:8,type:"silver"},{col:7,row:8,type:"silver"},
  {col:1,row:12,type:"silver"},{col:2,row:12,type:"silver"},{col:6,row:12,type:"silver"},{col:7,row:12,type:"silver"},{col:3,row:12,type:"silver"},{col:5,row:12,type:"silver"},
  // traps zijkant
  {col:0,row:6,type:"stonefall"},{col:8,row:6,type:"stonefall"},{col:1,row:6,type:"stonefall"},{col:2,row:6,type:"stonefall"},{col:3,row:6,type:"stonefall"},
  {col:4,row:6,type:"stonefall"},{col:5,row:6,type:"stonefall"},{col:6,row:6,type:"stonefall"},{col:7,row:6,type:"stonefall"},
  // bonussen
  {col:4,row:3,type:"machinegun"},{col:4,row:7,type:"doubleball"},{col:4,row:5,type:"2x"}, { col: 5, row: 10, type: "paddle_long" },
  { col: 0, row: 10, type: "paddle_small" },
  {col:4,row:0,type:"speed"},{col:4,row:11,type:"rocket"},{col:8,row:0,type:"power"},
  // ankers stone
  {col:0,row:9,type:"stone"},{col:8,row:9,type:"stone"},{col:1,row:9,type:"stone"},{col:2,row:9,type:"stone"},{col:3,row:9,type:"stone"},{col:4,row:9,type:"stone"},{col:5,row:9,type:"stone"},
  {col:6,row:9,type:"stone"},{col:7,row:9,type:"stone"}
]);

// ---------- LEVEL 9: “Ruit + zware baseline”
addBonuses(9, [
  // ruit silver
  {col:4,row:2,type:"silver"},
  {col:3,row:3,type:"silver"},{col:5,row:3,type:"silver"},
  {col:2,row:4,type:"silver"},{col:6,row:4,type:"silver"},
  // baseline
  {col:1,row:14,type:"stone"},{col:2,row:14,type:"silver"},{col:3,row:14,type:"stone"},{col:3,row:13,type:"stone"},
  {col:3,row:12,type:"stone"},{col:3,row:11,type:"stone"},{col:3,row:10,type:"stone"},
  {col:1,row:13,type:"stone"},{col:1,row:12,type:"stone"},{col:1,row:11,type:"stone"},{col:1,row:10,type:"stone"},
  {col:5,row:14,type:"stone"},{col:6,row:14,type:"silver"}, {col:5,row:14,type:"stone"}, {col:5,row:13,type:"stone"}, {col:5,row:12,type:"stone"}, {col:5,row:11,type:"stone"}, {col:5,row:10,type:"stone"},
   {col:7,row:14,type:"stone"}, {col:7,row:13,type:"stone"},{col:7,row:12,type:"stone"},{col:7,row:11,type:"stone"},{col:7,row:10,type:"stone"},
  // traps
  {col:2,row:7,type:"stonefall"},{col:6,row:7,type:"stonefall"},
  // bonussen
  {col:4,row:1,type:"machinegun"},{col:1,row:6,type:"doubleball"},{col:7,row:6,type:"rocket"},
  {col:4,row:8,type:"2x"},{col:3,row:5,type:"speed"},{col:8,row:5,type:"power"}, { col: 5, row: 10, type: "paddle_long" },
  { col: 0, row: 10, type: "paddle_small" },
  // anker stones
  {col:0,row:8,type:"stone"},{col:8,row:8,type:"stone"}
]);

// ---------- LEVEL 10: “Volle rand (top/bottom) + middenkruis”
addBonuses(10, [
  // rand top/bottom
  {col:0,row:0,type:"stone"},{col:1,row:0,type:"stone"},{col:7,row:0,type:"stone"},{col:8,row:0,type:"stone"},
  {col:0,row:14,type:"stone"},{col:1,row:14,type:"silver"},{col:7,row:14,type:"silver"},{col:8,row:14,type:"stone"},{col:4,row:14,type:"stone"},{col:8,row:13,type:"stone"},{col:8,row:12,type:"stone"},
  // kruis midden
  {col:4,row:3,type:"silver"},{col:4,row:6,type:"stone"},{col:4,row:9,type:"silver"},
  {col:2,row:6,type:"stone"},{col:6,row:6,type:"stone"},
  // traps
  {col:3,row:7,type:"stonefall"},{col:5,row:7,type:"stonefall"},{col:0,row:7,type:"stonefall"},{col:1,row:7,type:"stonefall"},{col:7,row:7,type:"stonefall"},{col:8,row:7,type:"stonefall"},{col:2,row:12,type:"stonefall"},
  {col:3,row:11,type:"stonefall"},{col:5,row:12,type:"stonefall"},{col:6,row:13,type:"stonefall"},
  // bonussen
  {col:4,row:1,type:"machinegun"},{col:3,row:5,type:"doubleball"},{col:5,row:5,type:"rocket"}, { col: 5, row: 8, type: "paddle_long" },
  { col: 0, row: 10, type: "paddle_small" },
  {col:4,row:8,type:"speed"},{col:4,row:11,type:"2x"},{col:8,row:4,type:"power"}
]);

// ---------- LEVEL 11: “Zijwanden + diagonaal silver + middencorridor”
addBonuses(11, [
  // zijwanden
  {col:0,row:4,type:"stone"},{col:0,row:5,type:"stone"},{col:8,row:4,type:"stone"},{col:8,row:5,type:"stone"},{col:0,row:13,type:"stone"},
  {col:1,row:13,type:"stone"},{col:2,row:13,type:"stone"},{col:6,row:13,type:"stone"},{col:7,row:13,type:"stone"},{col:8,row:13,type:"stone"},
  // diagonale silver
  {col:1,row:3,type:"silver"},{col:2,row:4,type:"silver"},{col:6,row:4,type:"silver"},{col:7,row:3,type:"silver"},
  // middencorridor traps
  {col:4,row:6,type:"stonefall"},{col:4,row:8,type:"stonefall"},{col:3,row:11,type:"stonefall"},{col:3,row:10,type:"stonefall"},
  {col:3,row:9,type:"stonefall"},{col:4,row:9,type:"stonefall"},{col:4,row:12,type:"stonefall"},{col:5,row:9,type:"stonefall"},
  {col:5,row:11,type:"stonefall"},{col:5,row:12,type:"stonefall"},
  // bonussen
  {col:4,row:2,type:"machinegun"},{col:3,row:6,type:"doubleball"},{col:5,row:6,type:"rocket"}, { col: 5, row: 1, type: "paddle_long" },
  { col: 5, row: 10, type: "paddle_small" },
  {col:2,row:7,type:"2x"},{col:6,row:7,type:"speed"},{col:4,row:10,type:"power"},
  // ankers
  {col:1,row:8,type:"stone"},{col:7,row:8,type:"stone"}
]);

// ---------- LEVEL 12: “Driebanden compact + valkuilen onder”
addBonuses(12, [
  // compacte banden
  {col:2,row:4,type:"silver"},{col:3,row:4,type:"silver"},{col:5,row:4,type:"silver"},{col:6,row:4,type:"silver"},
  {col:2,row:5,type:"silver"},{col:6,row:5,type:"silver"},
  {col:3,row:8,type:"silver"},{col:4,row:8,type:"silver"},{col:5,row:8,type:"silver"},

  // valkuilen
  {col:3,row:9,type:"stonefall"},{col:5,row:9,type:"stonefall"},{col:4,row:9,type:"stonefall"},
  {col:3,row:7,type:"stonefall"},{col:3,row:6,type:"stonefall"},{col:5,row:7,type:"stonefall"},
  {col:5,row:6,type:"stonefall"},{col:5,row:5,type:"stonefall"},{col:4,row:5,type:"stonefall"},{col:3,row:5,type:"stonefall"},

  // bonussen
  {col:4,row:3,type:"machinegun"},{col:1,row:6,type:"doubleball"},{col:7,row:6,type:"rocket"}, { col: 2, row: 10, type: "paddle_long" },
  { col: 0, row: 4, type: "paddle_small" },
  {col:4,row:6,type:"2x"},{col:4,row:7,type:"speed"},{col:4,row:11,type:"power"},

  // ankers
  {col:0,row:8,type:"stone"},{col:8,row:8,type:"stone"},{col:0,row:0,type:"stone"},
  {col:8,row:0,type:"stone"},{col:3,row:14,type:"stone"},{col:4,row:14,type:"stone"},{col:5,row:14,type:"stone"},
  {col:0,row:14,type:"stone"},{col:8,row:14,type:"stone"}
]);


// ---------- LEVEL 13: “Ruit groot + zware zijkanten”
addBonuses(13, [
  // ruit silver
  {col:4,row:2,type:"silver"},{col:3,row:3,type:"silver"},{col:5,row:3,type:"silver"},
  {col:2,row:4,type:"silver"},{col:6,row:4,type:"silver"},

  // zijkanten
  {col:0,row:6,type:"stone"},{col:8,row:6,type:"stone"},

  // traps
  {col:2,row:7,type:"stonefall"},{col:6,row:7,type:"stonefall"},
  {col:3,row:14,type:"stonefall"},{col:4,row:14,type:"stonefall"},{col:5,row:14,type:"stonefall"},

  // bonussen
  {col:4,row:1,type:"machinegun"},{col:1,row:6,type:"doubleball"},{col:7,row:6,type:"rocket"}, { col: 8, row: 3, type: "paddle_long" },
  { col: 3, row: 5, type: "paddle_small" },
  {col:4,row:9,type:"2x"},{col:3,row:5,type:"speed"},{col:4,row:3,type:"power"},

  // extra baseline ankers
  {col:1,row:14,type:"stone"},{col:7,row:14,type:"stone"},{col:2,row:9,type:"stone"},
  {col:3,row:10,type:"stone"},{col:4,row:11,type:"stone"},{col:5,row:10,type:"stone"},{col:6,row:9,type:"stone"}
]);

// ---------- LEVEL 14: “Volle rand + middenruit + valpoort”
addBonuses(14, [
  // rand (verzwaard)
  {col:0,row:0,type:"stone"},{col:8,row:0,type:"stone"},{col:0,row:14,type:"stone"},{col:8,row:14,type:"stone"},
  // middenruit silver
  {col:4,row:3,type:"silver"},{col:3,row:4,type:"silver"},{col:5,row:4,type:"silver"},{col:4,row:5,type:"silver"},
  // valpoort
  {col:3,row:7,type:"stonefall"},{col:4,row:7,type:"stonefall"},{col:5,row:7,type:"stonefall"},{col:2,row:12,type:"stonefall"},{col:3,row:13,type:"stonefall"},
  {col:4,row:14,type:"stonefall"},{col:5,row:13,type:"stonefall"},{col:6,row:12,type:"stonefall"},
  // bonussen
  {col:4,row:2,type:"machinegun"},{col:2,row:6,type:"doubleball"},{col:6,row:6,type:"rocket"}, { col: 2, row: 5, type: "paddle_long" },
  { col: 3, row: 10, type: "paddle_small" },
  {col:4,row:6,type:"2x"},{col:4,row:9,type:"speed"},{col:4,row:4,type:"power"},
  // ankers
  {col:1,row:8,type:"stone"},{col:7,row:8,type:"stone"}
]);

// ---------- LEVEL 15: “Driebanden strak + heavy baseline”
addBonuses(15, [
  // banden 4,6,8
 
  // silver blocks
  {col:2,row:4,type:"silver"},
  {col:3,row:4,type:"silver"},
  {col:5,row:4,type:"silver"},
  {col:6,row:4,type:"silver"},
  {col:5,row:8,type:"silver"},
  {col:3,row:8,type:"silver"},
  {col:3,row:14,type:"silver"},
  {col:5,row:14,type:"silver"},

  // baseline
  {col:1,row:6,type:"stone"},
  {col:2,row:6,type:"stone"},
  {col:6,row:6,type:"stone"},
  {col:7,row:6,type:"stone"},
  {col:2,row:8,type:"stone"},
  {col:6,row:8,type:"stone"},
  {col:2,row:14,type:"stone"},
  {col:6,row:14,type:"stone"},
  {col:0,row:6,type:"stone"},
  {col:8,row:6,type:"stone"},

  // traps
  {col:0,row:7,type:"stonefall"},
  {col:1,row:7,type:"stonefall"},
  {col:2,row:7,type:"stonefall"},
  {col:3,row:7,type:"stonefall"},
  {col:4,row:7,type:"stonefall"},
  {col:5,row:7,type:"stonefall"},
  {col:6,row:7,type:"stonefall"},
  {col:7,row:7,type:"stonefall"},
  {col:8,row:7,type:"stonefall"},

  // bonussen
  {col:4,row:3,type:"machinegun"},
  {col:1,row:5,type:"doubleball"},
  {col:7,row:5,type:"rocket"},
  {col:4,row:5,type:"2x"},
  {col:4,row:9,type:"speed"},
  {col:8,row:4,type:"power"},
  { col: 4, row: 8, type: "paddle_long" },
  { col: 0, row: 1, type: "paddle_small" }

]);

// ---------- LEVEL 16: “Zijwanden lang + X-traps + middenas”
addBonuses(16, [
  // zijwanden lang
  {col:0,row:4,type:"stone"},{col:0,row:5,type:"stone"},{col:0,row:6,type:"stone"},
  {col:8,row:4,type:"stone"},{col:8,row:5,type:"stone"},{col:8,row:6,type:"stone"},
  {col:4,row:6,type:"stone"},{col:0,row:0,type:"stone"},{col:1,row:0,type:"stone"},{col:2,row:0,type:"stone"},{col:3,row:0,type:"stone"},{col:4,row:0,type:"stone"},
  {col:5,row:0,type:"stone"},{col:6,row:0,type:"stone"},{col:7,row:0,type:"stone"},{col:8,row:0,type:"stone"},
  // X-traps
  {col:3,row:5,type:"stonefall"},{col:5,row:5,type:"stonefall"},
  {col:3,row:7,type:"stonefall"},{col:5,row:7,type:"stonefall"},
  // middenas (silver/stone afwisselend)
  {col:4,row:3,type:"silver"},{col:4,row:9,type:"silver"},{col:0,row:11,type:"silver"},{col:1,row:11,type:"silver"},{col:2,row:11,type:"silver"},
  {col:3,row:11,type:"silver"},{col:4,row:11,type:"silver"},{col:5,row:11,type:"silver"},{col:6,row:11,type:"silver"},{col:7,row:11,type:"silver"},
  {col:8,row:11,type:"silver"},{col:0,row:14,type:"silver"},{col:1,row:14,type:"silver"},{col:2,row:14,type:"silver"},{col:3,row:14,type:"silver"},
  {col:4,row:14,type:"silver"},{col:5,row:14,type:"silver"},{col:6,row:14,type:"silver"},{col:7,row:14,type:"silver"},{col:8,row:14,type:"silver"},
  // bonussen
  {col:4,row:2,type:"machinegun"},{col:2,row:6,type:"doubleball"},{col:6,row:6,type:"rocket"},
  {col:4,row:8,type:"2x"},{col:3,row:6,type:"speed"},{col:4,row:11,type:"power"}, { col: 1, row: 7, type: "paddle_long" },
  { col: 8, row: 7, type: "paddle_small" }
]);

// ---------- LEVEL 17: “H-frame (zoals jouw stijl) + middenmix”
addBonuses(17, [
  // H-palen
  {col:1,row:3,type:"stone"},{col:1,row:6,type:"stone"},{col:1,row:9,type:"stone"},
  {col:7,row:3,type:"stone"},{col:7,row:6,type:"stone"},{col:7,row:9,type:"stone"},
  {col:4,row:14,type:"stone"},{col:4,row:13,type:"stone"},{col:4,row:12,type:"stone"},
  // dwarsbalk silver
  {col:3,row:6,type:"silver"},{col:4,row:6,type:"silver"},{col:5,row:6,type:"silver"},{col:4,row:3,type:"silver"},
  {col:4,row:0,type:"silver"},{col:4,row:2,type:"silver"},{col:5,row:2,type:"silver"},{col:4,row:4,type:"silver"},
  {col:3,row:2,type:"silver"},{col:4,row:1,type:"silver"},{col:5,row:6,type:"silver"},
  // traps
  {col:4,row:7,type:"stonefall"},{col:3,row:5,type:"stonefall"},{col:1,row:12,type:"stonefall"},{col:2,row:12,type:"stonefall"},
  {col:1,row:11,type:"stonefall"},{col:2,row:11,type:"stonefall"},{col:6,row:12,type:"stonefall"},{col:7,row:12,type:"stonefall"},
  {col:6,row:11,type:"stonefall"},{col:7,row:11,type:"stonefall"},{col:5,row:5,type:"stonefall"},
  // bonussen
  {col:2,row:6,type:"machinegun"},{col:2,row:5,type:"doubleball"},{col:6,row:5,type:"rocket"},
  {col:4,row:5,type:"2x"},{col:5,row:7,type:"speed"},{col:4,row:10,type:"power"}, { col: 1, row: 1, type: "paddle_long" },
  { col: 8, row: 10, type: "paddle_small" }
]);

// ---------- LEVEL 18: “X/ruit gecombineerd + zware hoeken”
addBonuses(18, [
  // zijwanden/top & ruggengraat (stones)
  {col:0,row:4,type:"stone"},{col:0,row:5,type:"stone"},{col:0,row:6,type:"stone"},
  {col:8,row:4,type:"stone"},{col:8,row:5,type:"stone"},{col:8,row:6,type:"stone"},
  {col:4,row:13,type:"stone"},{col:4,row:14,type:"stone"},
  {col:2,row:0,type:"stone"},{col:3,row:0,type:"stone"},{col:4,row:0,type:"stone"},
  {col:5,row:0,type:"stone"},{col:6,row:0,type:"stone"},

  // verticale ruggengraat + dwarsbalk (silver)
  {col:4,row:1,type:"silver"},{col:4,row:2,type:"silver"},{col:4,row:3,type:"silver"},
  {col:4,row:4,type:"silver"},{col:4,row:5,type:"silver"},{col:4,row:6,type:"silver"},
  {col:4,row:7,type:"silver"},{col:4,row:8,type:"silver"},
  {col:2,row:5,type:"silver"},{col:3,row:5,type:"silver"},
  {col:5,row:5,type:"silver"},{col:6,row:5,type:"silver"},

  // traps (stonefall) – bredere band mid/lager
  {col:1,row:10,type:"stonefall"},{col:2,row:10,type:"stonefall"},
  {col:6,row:10,type:"stonefall"},{col:7,row:10,type:"stonefall"},
  {col:1,row:11,type:"stonefall"},{col:2,row:11,type:"stonefall"},
  {col:6,row:11,type:"stonefall"},{col:7,row:11,type:"stonefall"},
  {col:3,row:7,type:"stonefall"},{col:5,row:7,type:"stonefall"},
  {col:3,row:9,type:"stonefall"},{col:5,row:9,type:"stonefall"},
  {col:4,row:10,type:"stonefall"},{col:4,row:12,type:"stonefall"},

  // bonussen (iets dieper/risicovoller geplaatst)
  {col:1,row:6,type:"machinegun"},
  {col:2,row:4,type:"doubleball"},
  {col:6,row:4,type:"rocket"},
  {col:4,row:9,type:"2x"},
  {col:5,row:8,type:"speed"},
  {col:4,row:11,type:"power"},
  { col: 5, row: 10, type: "paddle_long" },
  { col: 5, row: 6, type: "paddle_small" }
]);

// ---------- LEVEL 19: “Rand dicht + valraster midden”
addBonuses(19, [
  // spiral frame — corners as stone (off-center)
  {col:0,row:1,type:"stone"},
  {col:8,row:1,type:"stone"},
  {col:7,row:6,type:"stone"},
  {col:1,row:6,type:"stone"},
  {col:2,row:2,type:"stone"},
  {col:6,row:2,type:"stone"},
  {col:6,row:5,type:"stone"},
  {col:2,row:5,type:"stone"},

  // spiral edges — sparse silver segments
  {col:2,row:1,type:"silver"},
  {col:3,row:1,type:"silver"},
  {col:4,row:1,type:"silver"},
  {col:6,row:1,type:"silver"},
  {col:7,row:3,type:"silver"},
  {col:7,row:5,type:"silver"},
  {col:5,row:6,type:"silver"},
  {col:3,row:6,type:"silver"},
  {col:1,row:5,type:"silver"},
  {col:1,row:3,type:"silver"},
  {col:4,row:2,type:"silver"},
  {col:6,row:4,type:"silver"},
  {col:4,row:5,type:"silver"},
  {col:2,row:4,type:"silver"},
  {col:5,row:1,type:"silver"},

  // mid/low sine-belt traps + central pressure
  {col:0,row:8,type:"stonefall"},
  {col:1,row:9,type:"stonefall"},
  {col:2,row:10,type:"stonefall"},
  {col:3,row:11,type:"stonefall"},
  {col:4,row:12,type:"stonefall"},
  {col:5,row:11,type:"stonefall"},
  {col:6,row:10,type:"stonefall"},
  {col:7,row:9,type:"stonefall"},
  {col:8,row:8,type:"stonefall"},
  {col:2,row:13,type:"stonefall"},
  {col:4,row:13,type:"stonefall"},
  {col:6,row:13,type:"stonefall"},
  {col:4,row:10,type:"stonefall"},
  {col:4,row:11,type:"stonefall"},

  // bonuses — placed deeper/riskier
  {col:0,row:9,type:"machinegun"},
  {col:2,row:7,type:"doubleball"},
  {col:6,row:7,type:"rocket"},
  {col:4,row:9,type:"2x"},
  {col:5,row:8,type:"speed"},
  {col:3,row:12,type:"power"},
  { col: 5, row: 10, type: "paddle_long" },
  { col: 4, row: 11, type: "paddle_small" }
]);


// ---------- LEVEL 20: “Finale — volle mix, middendruk + dubbele valpoort”
addBonuses(20, [
  // --- DIAMOND OUTLINE (STONE) ---
  {col:4,row:1,type:"stone"},
  {col:3,row:2,type:"stone"},{col:5,row:2,type:"stone"},
  {col:2,row:3,type:"stone"},{col:6,row:3,type:"stone"},
  {col:1,row:4,type:"stone"},{col:7,row:4,type:"stone"},
  {col:0,row:5,type:"stone"},{col:8,row:5,type:"stone"},
  {col:1,row:6,type:"stone"},{col:7,row:6,type:"stone"},
  {col:1,row:8,type:"stone"},{col:7,row:8,type:"stone"},
  {col:0,row:9,type:"stone"},{col:8,row:9,type:"stone"},
  {col:1,row:10,type:"stone"},{col:7,row:10,type:"stone"},
  {col:2,row:11,type:"stone"},{col:6,row:11,type:"stone"},
  {col:3,row:12,type:"stone"},{col:5,row:12,type:"stone"},
  {col:4,row:13,type:"stone"},

  // --- FACETS (SILVER) ---
  {col:3,row:4,type:"silver"},{col:5,row:4,type:"silver"},
  {col:2,row:5,type:"silver"},{col:4,row:5,type:"silver"},{col:6,row:5,type:"silver"},
  {col:3,row:6,type:"silver"},{col:5,row:6,type:"silver"},
  {col:2,row:7,type:"silver"},{col:4,row:7,type:"silver"},{col:6,row:7,type:"silver"},
  {col:3,row:8,type:"silver"},{col:5,row:8,type:"silver"},
  {col:2,row:9,type:"silver"},{col:4,row:9,type:"silver"},{col:6,row:9,type:"silver"},
  {col:3,row:10,type:"silver"},{col:5,row:10,type:"silver"},

  // --- TRAPS (STONEFALL) HALO + CENTER PRESSURE ---
  {col:4,row:3,type:"stonefall"},
  {col:4,row:4,type:"stonefall"},
  {col:0,row:6,type:"stonefall"},{col:8,row:6,type:"stonefall"},
  {col:0,row:8,type:"stonefall"},{col:8,row:8,type:"stonefall"},
  {col:4,row:8,type:"stonefall"},
  {col:6,row:6,type:"stonefall"},
  {col:3,row:9,type:"stonefall"},{col:5,row:9,type:"stonefall"},
  {col:2,row:10,type:"stonefall"},{col:6,row:10,type:"stonefall"},
  {col:2,row:12,type:"stonefall"},{col:6,row:12,type:"stonefall"},
  {col:4,row:12,type:"stonefall"},{col:2,row:6,type:"stonefall"},

  // --- BONUSSEN (DIEP/RISICOVOL) ---
  {col:4,row:2,type:"machinegun"},
  {col:2,row:8,type:"doubleball"},
  {col:6,row:8,type:"rocket"},
  {col:4,row:10,type:"2x"},
  {col:4,row:11,type:"speed"},
  {col:4,row:6,type:"power"},
  { col: 2, row: 3, type: "paddle_long" },
  { col: 8, row: 8, type: "paddle_small" }
]);



// (Optioneel) kleine fine-tuning van moeilijkheid per eindlevels:
LEVELS[16-1].params.machineGunDifficulty = 2; // L16 iets pittiger
LEVELS[18-1].params.machineGunDifficulty = 3; // L18 max
LEVELS[20-1].params.machineGunDifficulty = 3; // L20 max


const resetBallSound = new Audio("resetball.mp3");

// ❤️ nieuwe hart-sfx
const heartPickupSfx = new Audio("heart sound.mp3"); // speelt bij 1 hartje
heartPickupSfx.preload = "auto";
heartPickupSfx.volume = 0.9;

const heartLevelSfx = new Audio("level.mp3"); // speelt bij 10 hartjes / level up
heartLevelSfx.preload = "auto";
heartLevelSfx.volume = 0.95;


const levelUpSound = new Audio("levelup.mp3");
const paddleExplodeSound = new Audio("paddle_explode.mp3");
const gameOverSound = new Audio("gameover.mp3");

const doubleBallSound = new Audio("double_ball.mp3");
const speedBoostSound = new Audio("speed_boost.mp3");
const rocketReadySound = new Audio("rocket_ready.mp3");
const flagsActivatedSound = new Audio("flags_activated.mp3");
const doublePointsSound = new Audio("double_points.mp3");
const magnetSound = new Audio("magnet.mp3");
const bricksSound = new Audio("bricks.mp3");
const pxpBagSound = new Audio("pxpbagsound_mp3.mp3");

const rocketLaunchSound = new Audio("launch.mp3");
const rocketExplosionSound = new Audio("explosion.mp3"); // als dat de juiste is

const laserSound = new Audio("laser.mp3"); // voeg dit bestand toe in je project
const coinSound = new Audio("money.mp3");
const shootSound = new Audio("shoot_arcade.mp3");
const wallSound = new Audio("tick.mp3");
const blockSound = new Audio("tock.mp3");

const wrongSfx = new Audio("wrong.mp3");
wrongSfx.preload = "auto";
wrongSfx.volume = 1.0;


const tntBeepSound = new Audio("tnt_beep.mp3");
tntBeepSound.volume = 0.7;
const tntExplodeSound = new Audio("tnt_explode.mp3");
tntExplodeSound.volume = 0.9;

const bittyLevelUpSfx = new Audio("bitty-level-up.mp3");
bittyLevelUpSfx.preload = "auto";
bittyLevelUpSfx.volume = 1.0; // mag je aanpasse

const stonefallVoiceEvery = 5;
const rockWarning = new Audio("bitty_watch_out.mp3"); // jouw MP3-bestand




rockWarning.volume = 0.85;

const customBrickWidth = 70;   // pas aan zoals jij wilt
const customBrickHeight = 25;  // pas aan zoals jij wilt
const brickRowCount = 15;
const brickColumnCount = 9;
const brickWidth = customBrickWidth;
const brickHeight = customBrickHeight;


const starAuraSound = new Audio("starsound.mp3");
starAuraSound.preload = "auto";
starAuraSound.loop = true;
starAuraSound.volume = 0.45; // pas aan naar smaak

const starPowerSfx = new Audio("starpoweractivation.mp3");
starPowerSfx.preload = "auto";
starPowerSfx.loop = false;
starPowerSfx.volume = 0.85;   // pas aan naar smaak

// kleine helpers
function playOnceSafe(audio) {
  try { audio.currentTime = 0; audio.play(); } catch (e) {}
}
function fadeOutAndStop(audio, ms = 350) {
  const startVol = audio.volume;
  const steps = 12;
  let i = 0;
  const iv = setInterval(() => {
    i++;
    audio.volume = Math.max(0, startVol * (1 - i/steps));
    if (i >= steps) {
      clearInterval(iv);
      try { audio.pause(); } catch (e) {}
      audio.volume = startVol; // reset voor volgende keer
    }
  }, Math.max(10, ms/steps));
}


const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    // standaardtype
    let type = "normal";

    // check of deze positie een bonusblok is
    const bonus = bonusBricks.find(b => b.col === c && b.row === r);
    if (bonus) type = bonus.type;

    // blok aanmaken met extra gegevens
    bricks[c][r] = {
      x: 0,
      y: 0,
      col: c,    // ← kolompositie (voor gedrag of debug)
      row: r,    // ← rijpositie
      status: 1,
      type: type
    };
  }
}



const silver1Img = new Image();
silver1Img.src = "silver1.png";

const silver2Img = new Image();
silver2Img.src = "silver2.png";

const heartImg = new Image();
heartImg.src = "heart.png"; // zorg dat je dit bestand hebt!

const heartLevelupImg = new Image();
heartLevelupImg.src = "levelup.png";

const machinegunBlockImg = new Image();
machinegunBlockImg.src = "machinegun_block.png";

const machinegunGunImg = new Image();
machinegunGunImg.src = "machinegun_gun.png";

const lifeImg = new Image();
lifeImg.src = "level.png";

const dollarPxpImg = new Image();
dollarPxpImg.src = "dollarpxp.png";

const bombTokenImg = new Image();
bombTokenImg.src = "bom.png"; 


const doubleBallImg = new Image();
doubleBallImg.src = "2 balls.png";  // upload dit naar dezelfde map

const badCrossImg = new Image();
badCrossImg.src = "bad_cross.png";  // jouw bestandsnaam

const blockImg = new Image();
blockImg.src = "block_logo.png";

const ballImg = new Image();
ballImg.src = "ball_logo.png";

const vlagImgLeft = new Image();
vlagImgLeft.src = "vlaggetje1.png";

const vlagImgRight = new Image();
vlagImgRight.src = "vlaggetje2.png";

const shootCoinImg = new Image();
shootCoinImg.src = "3.png";

const powerBlockImg = new Image(); // Voor bonusblok type 'power'
powerBlockImg.src = "power_block_logo.png";

const powerBlock2Img = new Image(); // Voor bonusblok type 'rocket'
powerBlock2Img.src = "signalblock2.png";

const rocketImg = new Image();
rocketImg.src = "raket1.png";

const doublePointsImg = new Image();
doublePointsImg.src = "2x.png";

const speedImg = new Image();
speedImg.src = "speed.png";

const pointpayPaddleImg = new Image();
pointpayPaddleImg.src = "balkje.png";

const stone1Img = new Image();
stone1Img.src = "stone1.png";

const stone2Img = new Image();
stone2Img.src = "stone2.png";

const pxpBagImg = new Image();
pxpBagImg.src = "pxp_bag.png"; // of "bag.png"

const stoneBlockImg  = new Image();
stoneBlockImg.src  = "stone_block.png";

// 🧨 TNT blok
const tntImg = new Image();      
tntImg.src = "tnt.png";

const tntBlinkImg = new Image(); 
tntBlinkImg.src = "tnt_blink.png";

// ⭐ Star (vallende ster)
const starImg = new Image();
starImg.src = "stars.png"; // zet stars.png naast je game-bestanden

const stoneLargeImg  = new Image(); 
stoneLargeImg.src  = "stone_large.png";

const paddleLongBlockImg = new Image();
paddleLongBlockImg.src = "paddlelong.png";   // jouw upload

const paddleSmallBlockImg = new Image();
paddleSmallBlockImg.src = "paddlesmall.png"; // jouw upload

const magnetImg = new Image();
magnetImg.src = "magnet.png"; // voeg dit plaatje toe aan je project

// === GEBALANCEERDE DROP-BAG ===
const DROP_BOMB  = "bomb_token";
const DROP_STAR  = "star";
const DROP_HEART = "heart";
const DROP_CROSS = "bad_cross";

function shuffleArray(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const dropManager = {
  bag: [],
  refill() {
    const arr = [
      DROP_BOMB,
      DROP_STAR, DROP_STAR,
      DROP_HEART, DROP_HEART,
      DROP_BOMB, DROP_BOMB,
      DROP_STAR,
      DROP_BOMB,
      DROP_HEART, DROP_HEART,
      DROP_CROSS, DROP_CROSS,
      DROP_STAR
    ];

    const firstShuffle = shuffleArray(arr);
    const grouped = [];
    for (let i = 0; i < firstShuffle.length; i += 3) {
      const chunk = firstShuffle.slice(i, i + 3);
      grouped.push(...shuffleArray(chunk));
    }
    this.bag = grouped;
  },
  next() {
    if (this.bag.length === 0) {
      this.refill();
    }
    return this.bag.shift();
  }
};


// === DROPS SYSTEM: item type registry ===
// Elk type definieert hoe het eruit ziet + wat er gebeurt bij catch/miss
const DROP_TYPES = {
  coin: {
    draw(drop, ctx) {
      ctx.drawImage(coinImg, drop.x - 12, drop.y - 12, 24, 24);
    },
    onCatch(drop) {
      const earned = doublePointsActive ? 20 : 10;
      score += earned;
      updateScoreDisplay?.();
      coinSound.currentTime = 0;
      coinSound.play();
      pointPopups.push({ x: drop.x, y: drop.y, value: "+" + earned, alpha: 1 });
    },
    onMiss(drop) {
      // niks; gewoon weg
    },
  },

  heart: {
    draw(drop, ctx) {
      const size = 24 + Math.sin(drop.t) * 2;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(heartImg, drop.x - size / 2, drop.y - size / 2, size, size);
      ctx.globalAlpha = 1;
    },
    onTick(drop, dt) {
      drop.t += 0.2;
    },
   onCatch(drop) {
  heartsCollected++;

  // NIEUW: display-balk updaten
  if (typeof updateBonusPowerPanel === "function") {
    updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught, heartsCollected);
  }

  // eventueel nog je oude geluid
  try {
    if (typeof heartPickupSfx !== "undefined" && heartPickupSfx) {
      heartPickupSfx.currentTime = 0;
      heartPickupSfx.play();
    }
  } catch (e) {}

  // bij 10 hartjes -> 1 leven + reset meter
  if (heartsCollected >= 10) {
    heartsCollected = 0;
    lives++;
    updateLivesDisplay?.();

    // display opnieuw met 0 hartjes
    if (typeof updateBonusPowerPanel === "function") {
      updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught, heartsCollected);
    }

    triggerHeartCelebration?.();
  }
},

    onMiss(drop) {},
  },

  bag: {
    draw(drop, ctx) {
      ctx.drawImage(pxpBagImg, drop.x - 20, drop.y - 20, 40, 40);
    },
    onCatch(drop) {
      const earned = doublePointsActive ? 160 : 80;
      score += earned;
      updateScoreDisplay?.();
      pxpBagSound.currentTime = 0;
      pxpBagSound.play();
      pointPopups.push({ x: drop.x, y: drop.y, value: "+" + earned, alpha: 1 });
    },
    onMiss(drop) {},
  },

  bomb: {
    draw(drop, ctx) {
      const s = 26;
      const blink = (Math.floor(performance.now() / 200) % 2 === 0);
      const img = blink ? tntBlinkImg : tntImg;
      ctx.drawImage(img, drop.x - s / 2, drop.y - s / 2, s, s);
    },
    onCatch(drop) {
      SFX.play("bombPickup");
      bombsCollected++;
      pointPopups.push({
        x: drop.x,
        y: drop.y,
        value: `Bomb ${bombsCollected}/10`,
        alpha: 1,
      });

      if (bombsCollected >= 10) {
        bombsCollected = 0;
        triggerBittyBombIntro(20);
      }

      if (lives > 1) {
        lives--;
        updateLivesDisplay?.();
        pointPopups.push({
          x: drop.x,
          y: drop.y,
          value: "−1 life",
          alpha: 1,
        });
      } else {
        triggerPaddleExplosion?.();
      }

      try {
        tntExplodeSound.currentTime = 0;
        tntExplodeSound.play();
      } catch {}
    },
    onMiss(drop) {},
  },

 // ⬇️ jouw nieuwe kruis komt hierbinnen, niet als nieuwe const
bad_cross: {
  draw(drop, ctx) {
    const s = 40;
    if (badCrossImg && badCrossImg.complete) {
      ctx.drawImage(badCrossImg, drop.x - s / 2, drop.y - s / 2, s, s);
    } else {
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.strokeStyle = "#ff3300";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(14, 14);
      ctx.moveTo(14, -14);
      ctx.lineTo(-14, 14);
      ctx.stroke();
      ctx.restore();
    }
    drop.noMagnet = true;
  },
  onCatch(drop) {
    try {
      wrongSfx.currentTime = 0;
      wrongSfx.play();
    } catch {}
    badCrossesCaught++;
    pointPopups.push({
      x: drop.x,
      y: drop.y,
      value: `❌ ${badCrossesCaught}/3`,
      alpha: 1,
    });

    // ✅ meteen de display laten meegaan
    if (typeof updateBonusPowerPanel === "function") {
      updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);
    }

    if (badCrossesCaught >= 3) {
      badCrossesCaught = 0;
      heartsCollected = 0;
      starsCollected = 0;
      bombsCollected = 0;
      pointPopups.push({
        x: canvas.width / 2,
        y: 90,
        value: "BONUS VAL SYSTEEM GERESSET!",
        alpha: 1,
      });
      const hcEl = document.getElementById("heartCount");
      if (hcEl) hcEl.textContent = heartsCollected;

      // ✅ na reset ook de display terug naar 0/0/0
      if (typeof updateBonusPowerPanel === "function") {
        updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);
      }
    }
  },
  onMiss(drop) {},
},

  paddle_long: {
    draw(drop, ctx) {
      ctx.drawImage(paddleLongBlockImg, drop.x - 35, drop.y - 12, 70, 24);
    },
    onCatch(drop) {
      startPaddleSizeEffect?.("long");
    },
    onMiss(drop) {},
  },

  paddle_small: {
    draw(drop, ctx) {
      ctx.drawImage(paddleSmallBlockImg, drop.x - 35, drop.y - 12, 70, 24);
    },
    onCatch(drop) {
      startPaddleSizeEffect?.("small");
    },
    onMiss(drop) {},
  },

  speed: {
    draw(drop, ctx) {
      ctx.drawImage(speedImg, drop.x - 35, drop.y - 12, 70, 24);
    },
    onCatch(drop) {
      speedBoostActive = true;
      speedBoostStart = Date.now();
      speedBoostSound.currentTime = 0;
      speedBoostSound.play();
    },
    onMiss(drop) {},
  },

  magnet: {
    draw(drop, ctx) {
      ctx.drawImage(magnetImg, drop.x - 35, drop.y - 12, 70, 24);
    },
    onCatch(drop) {
      activateMagnet?.(20000);
    },
    onMiss(drop) {},
  },

bomb_token: {
  draw(drop, ctx) {
    const s = 28;
    const img =
      bombTokenImg && bombTokenImg.complete ? bombTokenImg : tntImg;
    drop.t = (drop.t || 0) + 0.16;
    const k = 1 + 0.08 * Math.sin(drop.t * 6);
    const size = s * k;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, drop.x - size / 2, drop.y - size / 2, size, size);
    ctx.restore();
  },
  onCatch(drop) {
    SFX.play("bombPickup");
    bombsCollected++;
    pointPopups.push({
      x: drop.x,
      y: drop.y,
      value: `Bomb ${bombsCollected}/${BOMB_TOKEN_TARGET}`,
      alpha: 1,
    });

    // ✅ update HTML-display
    updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);

    if (bombsCollected >= BOMB_TOKEN_TARGET) {
      bombsCollected = 0;

      // ✅ opnieuw updaten na reset
      updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);

      triggerBittyBombIntro(BOMB_RAIN_COUNT);
    }
  },
  onMiss(drop) {},
},

star: {
  draw(drop, ctx) {
    drop.t = (drop.t || 0) + 0.016;
    const base = 28;
    const pulse = 1 + 0.12 * Math.sin(drop.t * 8);
    const size = base * pulse;
    ctx.save();
    ctx.globalAlpha = 0.9 + 0.1 * Math.sin(drop.t * 8);
    ctx.drawImage(starImg, drop.x - size / 2, drop.y - size / 2, size, size);
    ctx.restore();
  },
  onCatch(drop) {
    try {
      if (typeof playOnceSafe === "function") {
        playOnceSafe(starCatchSfx);
      } else {
        starCatchSfx.pause();
        starCatchSfx.currentTime = 0;
        starCatchSfx.play();
      }
    } catch (e) {}
    starsCollected++;
    pointPopups.push({
      x: drop.x,
      y: drop.y,
      value: "⭐+1",
      alpha: 1,
    });

    // ✅ update HTML-display
    updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);

    if (starsCollected >= 10) {
      starsCollected = 0;

      // ✅ opnieuw updaten na reset
      updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);

      startStarPowerCelebration();
      activateInvincibleShield(30000);
    }
  },
  onMiss(drop) {},
},
}; // ✅ sluit het hele const DROP_TYPES object correct af




function updateAndDrawDrops() {
  // ——— Scheduler ———
  const now = performance.now();
  const dt  = Math.min(50, now - (updateAndDrawDrops._prev || now));
  updateAndDrawDrops._prev = now;

  if (dropConfig) {
    // watchdog: voorkom lange stilte
    if (dropConfig.maxSilenceMs && now - lastDropAt > dropConfig.maxSilenceMs) {
      updateAndDrawDrops._nextDueMs = 0;
    }

    // stop met spawnen na totale duur (bestaande items blijven vallen)
    if (updateAndDrawDrops._spawnEndAt && now >= updateAndDrawDrops._spawnEndAt) {
      dropConfig.continuous = false;
    }

    // volgende spawn moment aftellen
    if (updateAndDrawDrops._nextDueMs != null) {
      updateAndDrawDrops._nextDueMs -= dt;
    }

    const canSpawnMore = !dropConfig.maxItems || (dropsSpawned < dropConfig.maxItems);
    if (dropConfig.continuous && canSpawnMore && (updateAndDrawDrops._nextDueMs != null) && updateAndDrawDrops._nextDueMs <= 0) {
      const nMin = Math.max(1, dropConfig.perSpawnMin | 0);
      const nMax = Math.max(nMin, dropConfig.perSpawnMax | 0);
      const count = nMin + Math.floor(Math.random() * (nMax - nMin + 1));

      for (let i = 0; i < count && (!dropConfig.maxItems || dropsSpawned < dropConfig.maxItems); i++) {
        spawnRandomDrop(); // gebruikt chooseSpawnX + typepicker
      }

      lastDropAt = now;
      dropConfig._eventsSpawned = (dropConfig._eventsSpawned | 0) + 1;

      const iMin = Math.max(100, dropConfig.minIntervalMs | 0);
      const iMax = Math.max(iMin, dropConfig.maxIntervalMs | 0);
      updateAndDrawDrops._nextDueMs = iMin + Math.random() * (iMax - iMin);
    }
  }

  // ——— Items updaten + tekenen ———
  for (let i = fallingDrops.length - 1; i >= 0; i--) {
    const d = fallingDrops[i];
    if (!d || d.active === false) { fallingDrops.splice(i, 1); continue; }

    // basisval en optionele snelheidsvelden (magnet kan vx/vy invullen)
    d.t = (d.t || 0) + (dt / 16.7);
    d.y += (d.dy || (dropConfig?.speed || 2.5));
    if (d.vx) d.x += d.vx;
    if (d.vy) d.y += d.vy;

    // tekenen via type-definitie
    const def = DROP_TYPES[d.type] || DROP_TYPES.coin;
    try { def.draw && def.draw(d, ctx); } catch (e) {}

    // catch/miss detectie
    const pb = getPaddleBounds(); // {left,right,top,bottom}
    const size = 28;              // generieke AABB voor overlap
    const l = d.x - size / 2, r = d.x + size / 2, t = d.y - size / 2, b = d.y + size / 2;

    const overlap =
      d.__forceCatch || (
        r >= pb.left && l <= pb.right && b >= pb.top && t <= pb.bottom
      );

    if (overlap) {
      try { def.onCatch && def.onCatch(d); } catch (e) {}
      fallingDrops.splice(i, 1);
      continue;
    }

    // onder uit beeld → gemist
    if (d.y > canvas.height + 40) {
      try { def.onMiss && def.onMiss(d); } catch (e) {}
      fallingDrops.splice(i, 1);
    }
  }
}



let rocketActive = false; // Voor nu altijd zichtbaar om te testen
let rocketX = 0;
let rocketY = 0;

  
console.log("keydown-handler wordt nu actief");

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);

// 🔽 Tooltip gedrag reset-knop
const resetBtn = document.getElementById("resetBallBtn");
const tooltip = document.getElementById("resetTooltip");

resetBtn.addEventListener("mouseenter", () => {
  tooltip.style.display = "block";
});

resetBtn.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});

function keyDownHandler(e) {
  console.log("Toets ingedrukt:", e.key);

  // 🛡️ Voorkom acties als gebruiker in een inputveld of knop zit
  if (["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement.tagName)) return;

  // 🚗 Bewegingstoetsen
  if (
    e.key === "Right" || e.key === "ArrowRight" || e.key === ">" || e.key === "."
  ) {
    rightPressed = true;

  } else if (
    e.key === "Left" || e.key === "ArrowLeft" || e.key === "<" || e.key === ","
  ) {
    leftPressed = true;

  } else if (
    e.key === "Up" || e.key === "ArrowUp"
  ) {
    // ↑ alleen voor balkje omhoog
    upPressed = true;

  } else if (
    e.key === "Down" || e.key === "ArrowDown"
  ) {
    downPressed = true;
  }

  // 🎯 Actie: bal afschieten (alleen met spatie) als bal nog niet gelanceerd is
  if (e.code === "Space" && !ballLaunched) {
    ballLaunched = true;
    ballMoving = true;
    paddleFreeMove = true; // ✅ Laat paddle vrij bewegen na eerste schot

    // sound
    if (typeof shootSound !== "undefined") {
      shootSound.currentTime = 0;
      shootSound.play();
    }

    // 🔥 snelheid uit huidige level halen
    const lvlIndex = Math.max(0, Math.min(TOTAL_LEVELS - 1, level - 1));
    const lvl = LEVELS[lvlIndex];
    const launchSpeed =
      (lvl && lvl.params && typeof lvl.params.ballSpeed === "number")
        ? lvl.params.ballSpeed
        : 6; // fallback als er niks staat

    // bal omhoog schieten met level-snelheid
    balls[0].dx = 0;
    balls[0].dy = -launchSpeed;

    // timer starten
    if (!timerRunning && typeof startTimer === "function") {
      startTimer();
    }
  }

  // 🔫 Raket afvuren (ook spatie, maar alleen als raket actief is)
  if (e.code === "Space" && rocketActive && rocketAmmo > 0 && !rocketFired) {
    rocketFired = true;
    rocketAmmo--;
    if (typeof rocketLaunchSound !== "undefined") {
      rocketLaunchSound.currentTime = 0;
      rocketLaunchSound.play();
    }
  }

  // 🎯 Schieten met vlaggetjes (spatie)
  if (flagsOnPaddle && e.code === "Space") {
    if (typeof shootFromFlags === "function") {
      shootFromFlags();
    }
  }

  // 🧪 Extra beveiliging bij opnieuw starten na Game Over (spatie)
  if (!ballMoving && e.code === "Space") {
    if (lives <= 0) {
      lives = 3;
      score = 0;
      level = 1;
      resetBricks();
      resetBall();
      resetPaddle();
      startTime = new Date();
      gameOver = false;

      if (typeof updateScoreDisplay === "function") {
        updateScoreDisplay();
      }

      const timeEl = document.getElementById("timeDisplay");
      if (timeEl) timeEl.textContent = "00:00";

      flagsOnPaddle = false;
      flyingCoins = [];
    }

    ballMoving = true;
  }
}


function keyUpHandler(e) {
  if (
    e.key === "Right" || e.key === "ArrowRight" || e.key === ">" || e.key === "."
  ) {
    rightPressed = false;

  } else if (
    e.key === "Left" || e.key === "ArrowLeft" || e.key === "<" || e.key === ","
  ) {
    leftPressed = false;

  } else if (
    e.key === "Up" || e.key === "ArrowUp"
  ) {
    upPressed = false;

  } else if (
    e.key === "Down" || e.key === "ArrowDown"
  ) {
    downPressed = false;
  }
}

// 🖱️ Muis/touchpad: alleen links-rechts sturen (NOOIT paddleY aanpassen)
function mouseMoveHandler(e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;

  // Alleen horizontaal: centreer paddle op muis-X, binnen canvas-grenzen
  if (mouseX > 0 && mouseX < canvas.width) {
    const newX = mouseX - paddleWidth / 2;
    if (!isPaddleBlockedHorizontally(newX)) {
      paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, newX));
    }
  }

  // ⚠️ Geen e.clientY, geen mouseY en geen wijzigingen aan paddleY hier.
}

function updateScoreDisplay() {
  document.getElementById("scoreDisplay").textContent = score;
}


function drawBricks() {
  const totalBricksWidth = brickColumnCount * brickWidth;
  const offsetX = Math.floor((canvas.width - totalBricksWidth) / 2 - 3);

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const brickX = offsetX + c * brickWidth;
        const brickY = r * brickHeight + (levelTransitionActive ? transitionOffsetY : 0);

        b.x = brickX;
        b.y = brickY;

        switch (b.type) {
          case "2x":
            ctx.drawImage(doublePointsImg, brickX, brickY, brickWidth, brickHeight);
            break;

          case "rocket":
            ctx.drawImage(powerBlock2Img, brickX, brickY, brickWidth, brickHeight);
            break;

          case "power":
            ctx.drawImage(powerBlockImg, brickX, brickY, brickWidth, brickHeight);
            break;

          case "doubleball":
            ctx.drawImage(doubleBallImg, brickX, brickY, brickWidth, brickHeight);
            break;

          case "machinegun":
            ctx.drawImage(machinegunBlockImg, brickX, brickY, brickWidth, brickHeight);
            break;

          case "speed":
            ctx.drawImage(speedImg, brickX, brickY, brickWidth, brickHeight);
            break;

            case "magnet":
            ctx.drawImage(magnetImg, brickX, brickY, brickWidth, brickHeight);
            break;

            case "paddle_long":
            ctx.drawImage(paddleLongBlockImg, brickX, brickY, brickWidth, brickHeight);
            break;

            case "paddle_small":
            ctx.drawImage(paddleSmallBlockImg, brickX, brickY, brickWidth, brickHeight);
            break;

          case "silver":
            if (!b.hits || b.hits === 0) {
              ctx.drawImage(silver1Img, brickX, brickY, brickWidth, brickHeight);
            } else if (b.hits === 1) {
              ctx.drawImage(silver2Img, brickX, brickY, brickWidth, brickHeight);
            }
            break;

          case "stone":
            if (b.hits === 0) {
              ctx.drawImage(stone1Img, brickX, brickY, brickWidth, brickHeight);
            } else if (b.hits === 1) {
              ctx.drawImage(stone2Img, brickX, brickY, brickWidth, brickHeight);
            } else {
              ctx.drawImage(dollarPxpImg, brickX, brickY, brickWidth, brickHeight);
            }
            break;

              case "stonefall":
  if (stoneBlockImg && stoneBlockImg.complete) {
    ctx.drawImage(stoneBlockImg, brickX, brickY, brickWidth, brickHeight);
  } else {
    ctx.fillStyle = "#6f6b66";
    ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
    ctx.strokeStyle = "#5a554f";
    ctx.strokeRect(brickX + 0.5, brickY + 0.5, brickWidth - 1, brickHeight - 1);
  }
  break;

            case "tnt": {
  const armed = !!b.tntArmed;
  const blink = armed && (Math.floor(performance.now() / 200) % 2 === 0);
  const img = blink ? tntBlinkImg : tntImg;

  if (img.complete) {
    ctx.drawImage(img, brickX, brickY, brickWidth, brickHeight);
  } else {
    ctx.fillStyle = blink ? "#ff5555" : "#bb0000";
    ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("TNT", brickX + brickWidth / 2, brickY + brickHeight / 2 + 4);
  }
  break;
}

            
          default:
            ctx.drawImage(blockImg, brickX, brickY, brickWidth, brickHeight);
            break;
        }
      }
    }
  }
}

function startDrops(config) {
  dropConfig = Object.assign({
    // timing
    continuous: true,          // blijf spawnen zolang timer/limieten het toestaan
    durationMs: null,          // ⏱️ totale spawn-duur; null = onbeperkt
    minIntervalMs: 900,        // minimale tijd tussen spawn-events
    maxIntervalMs: 1800,       // maximale tijd tussen spawn-events
    startDelayMs: 800,

    // hoeveelheid
    perSpawnMin: 1,            // min items per event
    perSpawnMax: 1,            // max items per event
    maxItems: null,            // ⛔ hard cap op totaal aantal items; null = geen cap

    // val/plaatsing
    speed: 3.0,
    xMargin: 40,
    mode: "well",              // "well" | "grid"
    gridColumns: 8,            // mag ook [5,6]
    gridJitterPx: 18,
    avoidPaddle: true,
    avoidMarginPx: 40,
    minSpacing: 70,
    maxSilenceMs: 4000,        // watchdog

    // ✅ beschikbare droptypes
    types: ["heart", "star", "bomb_token", "bad_cross"],

    // fallback set
    typeQuota: null,           // { heart: 5, bomb: 2 } → exact zoveel keer in totaal
    typeWeights: null          // { coin:5, heart:2, bomb:1 } → gewogen random
  }, config || {});

  // normaliseer arrays
  if (!Array.isArray(dropConfig.gridColumns))
    dropConfig.gridColumns = [ dropConfig.gridColumns ];
  if (!Array.isArray(dropConfig.types) || dropConfig.types.length === 0)
    dropConfig.types = ["heart", "star", "bomb_token", "bad_cross"];

  // interne tellers
  dropsSpawned = 0;
  dropConfig._eventsSpawned = 0;
  const now = performance.now();
  lastDropAt = now;
  updateAndDrawDrops._nextDueMs = dropConfig.startDelayMs || 0;
  updateAndDrawDrops._sinceLastSpawn = 0;
  updateAndDrawDrops._spawnEndAt = (dropConfig.durationMs != null)
    ? (now + dropConfig.durationMs)
    : null;

  // grid/well helpers
  gridColumnsIndex = 0;

  // === oude random-picker behouden (veiligheid, niet meer gebruikt) ===
  dropConfig._pickType = (function initTypePicker(cfg) {
    // QUOTA
    if (cfg.typeQuota && typeof cfg.typeQuota === "object") {
      const pool = [];
      for (const [t, n] of Object.entries(cfg.typeQuota)) {
        const count = Math.max(0, n|0);
        for (let i = 0; i < count; i++) pool.push(t);
      }
      const fallback = cfg.types.slice();
      return function pickWithQuota() {
        if (pool.length > 0) {
          const idx = Math.floor(Math.random() * pool.length);
          return pool.splice(idx, 1)[0];
        }
        return fallback[Math.floor(Math.random() * fallback.length)];
      };
    }

    // WEIGHTS
    if (cfg.typeWeights && typeof cfg.typeWeights === "object") {
      const entries = Object.entries(cfg.typeWeights)
        .map(([type, w]) => ({ type, weight: Math.max(0, Number(w) || 0) }))
        .filter(e => e.weight > 0);
      const base = (entries.length ? entries : cfg.types.map(t => ({ type:t, weight:1 })));
      const total = base.reduce((s, e) => s + e.weight, 0);

      return function pickWeighted() {
        let r = Math.random() * total;
        for (const e of base) {
          if (r < e.weight) return e.type;
          r -= e.weight;
        }
        return base[base.length - 1].type;
      };
    }

    // fallback uniform random
    const arr = cfg.types.slice();
    return function pickUniform() {
      return arr[Math.floor(Math.random() * arr.length)];
    };
  })(dropConfig);

  // 💥 GEBALANCEERDE DROP-MANAGER resetten bij start
  if (typeof dropManager !== "undefined" && dropManager && typeof dropManager.refill === "function") {
    dropManager.refill();
  }
}


function spawnRandomDrop() {
  if (!dropConfig) return;

  if (!ballLaunched && !ballMoving) {
    return;
  }

  // 🎯 in plaats van dropConfig._pickType():
  const type = dropManager.next();

  const x = chooseSpawnX(dropConfig);

  fallingDrops.push({
    type,
    x,
    y: -20 - Math.random() * 30,
    dy: dropConfig.speed || 2.5,
    vx: 0,
    vy: 0,
    t: 0,
    active: true
  });
  dropsSpawned++;
}


function triggerBittyBombIntro(n) {
  // — stap 4: lock + geluid precies bij start van de bonus
  _bittyActivationLock = true; // voorkomt dubbele afspeling
  SFX.play('bittyActivation'); // speelt "bitty-activatio.mp3"

  // Bestaande logica
  bittyBomb.active = true;
  bittyBomb.phase = "countdown";
  bittyBomb.start = performance.now();
  bittyBomb.lastTick = 0;
  bittyBomb.queuedRain = n || 20;

  try {
    tntBeepSound.currentTime = 0;
    tntBeepSound.play();
  } catch {}
}




function startBombRain(n = 13) {
  // — stap 4: speel 'bittyActivation' alleen als er géén intro net speelde
  if (!_bittyActivationLock) {
    SFX.play('bittyActivation');
  }
  _bittyActivationLock = false;

  // verzamel alle actieve bricks
  const pool = [];
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b?.status === 1) pool.push({ c, r, x: b.x, y: b.y });
    }
  }
  if (!pool.length) return;

  // shuffle compact
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const t = pool[i];
    const delay   = 150 + Math.random() * 1400;   // door elkaar
    const startX  = t.x + brickWidth/2 + (Math.random()*80 - 40);
    const startY  = -40 - Math.random() * 200;    // verschillende hoogtes
    const targetY = t.y - 14;                      // nét voor de steen
    const speed   = 3.2 + Math.random() * 1.8;

    bombRain.push({
      x: startX, y: startY, vx: 0, vy: speed,
      targetY, col: t.c, row: t.r,
      startAt: performance.now() + delay,
      exploded: false
    });
  }

  // leuk: voice of sfx kan hier
  try { tntBeepSound.currentTime = 0; tntBeepSound.play(); } catch {}
}





function drawPointPopups() {
  pointPopups.forEach((p, index) => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`; // ✅ goudkleurig
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.value, p.x, p.y);

    // Animeren
    p.y -= 0.5;
    p.alpha -= 0.01;

    if (p.alpha <= 0) {
      pointPopups.splice(index, 1);
    }
  });

  ctx.globalAlpha = 1; // Transparantie resetten
}
function resetBricks() {
  const def = LEVELS[Math.max(0, Math.min(TOTAL_LEVELS - 1, (level - 1)))];
  const currentMap = (def && Array.isArray(def.map)) ? def.map : [];
  const p = def?.params || {};
  const targetPaddleWidth = Math.max(60, Math.min(140, p.paddleWidth ?? 100));
  paddleBaseWidth = targetPaddleWidth;

  // event. size-effect opruimen
  if (paddleSizeEffect) {
    stopPaddleSizeEffect();
  } else {
    const centerX = paddleX + paddleWidth / 2;
    paddleWidth = paddleBaseWidth;
    paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, centerX - paddleWidth / 2));
    if (typeof redrawPaddleCanvas === 'function') redrawPaddleCanvas();
  }

  // alle bricks resetten
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      b.status = 1;

      const defined = currentMap.find(p => p.col === c && p.row === r);
      const brickType = defined ? defined.type : "normal";
      b.type = brickType;

      if (brickType === "stone" || brickType === "silver") {
        b.hits = 0;
        b.hasDroppedBag = false;
      } else {
        delete b.hits;
        delete b.hasDroppedBag;
      }

      // 🧨 TNT reset
      if (brickType === "tnt") {
        b.tntArmed = false;
        b.tntStart = 0;
        b.tntBeepNext = 0;
      } else {
        delete b.tntArmed;
        delete b.tntStart;
        delete b.tntBeepNext;
      }

      // hearts reset
      b.hasHeart = false;
      b.heartDropped = false;
    }
  }

  // bommenregen opruimen bij levelstart (voortgang teller behouden)
  if (typeof bombRain !== 'undefined') bombRain = [];

  // drops resetten
  if (typeof fallingDrops !== 'undefined') fallingDrops = [];
  if (typeof dropsSpawned !== 'undefined') dropsSpawned = 0;
  if (typeof lastDropAt !== 'undefined') lastDropAt = performance.now();

  const lvl = level || 1;

  // ======= ÉÉN enkele startDrops per level =======
  startDrops({
    continuous: true,
    minIntervalMs: (lvl <= 3) ? 1200 : (lvl <= 10) ? 900 : 800,
    maxIntervalMs: (lvl <= 3) ? 2600 : (lvl <= 10) ? 2200 : 1800,
    speed:        (lvl <= 3) ? 2.5  : (lvl <= 10) ? 3.0  : 3.4,

    // ✅ hier aangepast: nu ook bad_cross inbegrepen
    types: ["heart", "star", "bomb_token", "bad_cross"],

    // ✅ typeWeights als object in plaats van array
    typeWeights: {
      heart: 3,
      star: 2,
      bomb_token: 1,
      bad_cross: 1
    },

    xMargin: 40,
    startDelayMs: (lvl <= 3) ? 800 : (lvl <= 10) ? 600 : 500,
    mode: (lvl > 10) ? "grid" : "well",
    gridColumns: 8,
    gridJitterPx: 16,
    avoidPaddle: (lvl > 10),
    avoidMarginPx: 40,
    minSpacing: 70
  });

  // ✅ HTML / display in sync brengen na level reset
  if (typeof updateBonusPowerPanel === "function") {
    updateBonusPowerPanel(starsCollected, bombsCollected, badCrossesCaught);
  }
}





// === Dev helper: snel naar elk level springen ===
function goToLevel(n, opts = {}) {
  const cfg = Object.assign({
    resetScore: false,
    resetLives: false,
    centerPaddle: true,
    clearEffects: true
  }, opts);

  // Clamp naar 1..TOTAL_LEVELS
  const target = Math.max(1, Math.min(typeof TOTAL_LEVELS !== "undefined" ? TOTAL_LEVELS : 20, n));
  level = target;

  // Bonussen/overlays stoppen (alleen als die helpers/variabelen bestaan)
  if (typeof pauseTimer === "function") pauseTimer();
  if (typeof resetAllBonuses === "function") resetAllBonuses();

  // Optioneel: score/lives resetten
  if (cfg.resetScore) {
    score = 0;
    if (typeof updateScoreDisplay === "function") updateScoreDisplay();
  }
  if (cfg.resetLives) {
    lives = 3;
    if (typeof updateLivesDisplay === "function") updateLivesDisplay();
  }

  // Effect- en deeltjesbuffers leegmaken (veilig, alleen als ze bestaan)
  try { explosions = []; } catch(e){}
  try { smokeParticles = []; } catch(e){}
  try { flyingCoins = []; } catch(e){}
  try { coins = []; } catch(e){}
  try { pxpBags = []; } catch(e){}
  try { paddleExplosionParticles = []; } catch(e){}

  // Bricks + paddle + ball klaarzetten voor dit level
  resetBricks();
  if (cfg.centerPaddle && typeof resetPaddle === "function") resetPaddle();
  if (typeof balls !== "undefined") balls = [];  // bal(len) hard reset voor schone start
  resetBall();

  // UI tijd resetten (optioneel)
  try {
    elapsedTime = 0;
    const timeEl = document.getElementById("timeDisplay");
    if (timeEl) timeEl.textContent = "00:00";
  } catch(e){}

  // Klaar. Speler schiet zelf de bal weg; timer start bij jouw afschiet-logica.
  console.log(`Jumped to level ${level}`);
}


function drawHeartPopup() {
  if (heartPopupTimer > 0) {
    ctx.save();
    ctx.globalAlpha = heartPopupTimer / 100;
    ctx.fillStyle = "#ff66aa";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Wow! 10 hearts – extra life!", canvas.width / 2, 60);
    ctx.restore();

    heartPopupTimer--;
  }
}

function drawPaddle() {
  if (paddleExploding) return;

  // basis
  ctx.drawImage(paddleCanvas, paddleX, paddleY);

  // 🛡️ Ronde, pulserende gouden energie-aura
  if (invincibleActive) {
    const cx = paddleX + paddleWidth / 2;
    const cy = paddleY + paddleHeight / 2;

    // kies een cirkelradius die de paddle ruim omvat
    const rBase = Math.hypot(paddleWidth, paddleHeight) * 0.65;
    const t = performance.now() * 0.002;

    ctx.save();

    // 1) zachte radiale gloed
    const rPulse = rBase * (1 + 0.06 * Math.sin(t * 6));
    const g1 = ctx.createRadialGradient(cx, cy, rPulse * 0.2, cx, cy, rPulse);
    g1.addColorStop(0.00, "rgba(255,215,0,0.35)");
    g1.addColorStop(0.50, "rgba(255,215,0,0.15)");
    g1.addColorStop(1.00, "rgba(255,215,0,0.00)");
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.arc(cx, cy, rPulse, 0, Math.PI * 2);
    ctx.fill();

    // 2) buitenrand met lichte flikkering
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "rgba(255,215,0,0.9)";
    ctx.shadowColor = "rgba(255,215,0,0.7)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy, rPulse * (0.92 + 0.02 * Math.sin(t * 10)), 0, Math.PI * 2);
    ctx.stroke();

    // 3) twee roterende energie-bogen (geeft “plasma” gevoel)
    const arcR = rPulse * 0.92;
    const arcLen = Math.PI * 0.6; // 108°
    ctx.shadowBlur = 22;
    for (let k = 0; k < 2; k++) {
      const phase = t * (k ? 1.2 : -1.3) + k * Math.PI * 0.5;
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "rgba(255,223,0,0.95)";
      ctx.arc(cx, cy, arcR, phase, phase + arcLen);
      ctx.stroke();
    }

    // 4) subtiele vonkjes
    const sparks = 10;
    ctx.globalAlpha = 0.8;
    for (let i = 0; i < sparks; i++) {
      const ang = t * 7 + (i * (Math.PI * 2 / sparks));
      const r = rPulse * (0.85 + 0.1 * Math.sin(t * 5 + i));
      const sx = cx + Math.cos(ang) * r;
      const sy = cy + Math.sin(ang) * r;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,240,150,0.95)";
      ctx.fill();
    }

    ctx.restore();
  }
}



function drawMagnetAura(ctx) {
  if (!magnetActive) return; // alleen tekenen als hij aanstaat

  // centrum van paddle berekenen
  const cx = paddleX + paddleWidth / 2;
  const cy = paddleY + paddleHeight / 2;

  // klein pulserend effect
  const t = performance.now() * 0.004;
  const radius = Math.max(paddleWidth, paddleHeight) * 0.75 + 6 * Math.sin(t);

  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
  grad.addColorStop(0, "rgba(135,206,250,0.25)");
  grad.addColorStop(1, "rgba(135,206,250,0.0)"); // buitenkant transparant
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMagnetHUD(ctx) {
  if (!magnetActive) return;
  const msLeft = Math.max(0, magnetEndTime - performance.now());
  const sLeft = Math.ceil(msLeft / 1000);
  // ...
}

function resetAllBonuses(opts = {}) {
  const { keepStar = false } = opts;

  // 🔁 Ballen en bonussen resetten
  balls = [{
    x: paddleX + paddleWidth / 2 - ballRadius,
    y: paddleY - ballRadius * 2,
    dx: 0,
    dy: -6,
    radius: ballRadius,
    isMain: true
  }];
  ballLaunched = false;
  ballMoving = false;

  // 🏳️ vlaggenbonus uit
  flagsOnPaddle = false;
  flagTimer = 0;

  // 🚀 raket uit
  rocketActive = false;
  rocketAmmo = 0;
  rocketFired = false;

  // 🔫 machinegun uit
  machineGunActive = false;
  machineGunCooldownActive = false;
  machineGunBullets = [];
  machineGunShotsFired = 0;
  paddleDamageZones = [];
  machineGunGunX = 0;
  machineGunGunY = 0;

  // ✖️ 2x points uit
  doublePointsActive = false;
  doublePointsStartTime = 0;

  // 🏃 speed boost uit
  speedBoostActive = false;
  speedBoostStart = 0;

  // 🧹 losse effecten leeg
  flyingCoins = [];
  smokeParticles = [];
  explosions = [];
  coins = [];
  pxpBags = [];

  // 🛶 paddle-size-effect stoppen
  if (typeof stopPaddleSizeEffect === "function" && paddleSizeEffect) {
    stopPaddleSizeEffect();
  }

  // 🧲 magneet uit
  stopMagnet?.();

  // ⭐️ STER / INVINCIBLE alleen uitzetten als we 'm níet willen houden
  if (!keepStar) {
    // (dit voorkomt dat autolance in het nieuwe level nog afgaat)
    invincibleActive = false;
    invincibleEndTime = 0;
    // aura/geluid meteen stoppen als functie bestaat
    if (typeof stopStarAura === "function") {
      stopStarAura(true);
    }
    // ook eventuel fullscreen star FX uit
    if (typeof starPowerFX !== "undefined" && starPowerFX) {
      starPowerFX.active = false;
    }
  }

  // 💣 BITTY BOMB / BOMB RAIN resetten
  // zo komt er geen regen meer in het volgende level als hij net bezig was
  if (typeof bittyBomb !== "undefined") {
    bittyBomb.active = false;
    bittyBomb.phase = "idle";
    bittyBomb.queuedRain = 0;
  }
  if (typeof bombRain !== "undefined") {
    bombRain = []; // regen stoppen
  }
  if (typeof _bittyActivationLock !== "undefined") {
    _bittyActivationLock = false;
  }

  // 🚫 heel belangrijk: ook de visuals killen, anders kan er later tóch nog een rain starten
  if (typeof bombVisuals !== "undefined") {
    bombVisuals = null;
  }

  // (belangrijk:) we laten bombsCollected / starsCollected met rust,
  // zodat je “punten/tokens” wél meeneemt, maar de ACTIE niet.
}



function resetBall() {
  // 🎯 huidige level ophalen
  const lvlIndex = Math.max(0, Math.min(TOTAL_LEVELS - 1, level - 1));
  const lvl = LEVELS[lvlIndex];
  const speed = (lvl && lvl.params && typeof lvl.params.ballSpeed === "number")
    ? lvl.params.ballSpeed
    : 6; // fallback

  // 🏐 bal opnieuw op de paddle parkeren
  balls = [{
    x: paddleX + paddleWidth / 2 - ballRadius,
    y: paddleY - ballRadius * 2,
    dx: 0,
    dy: -speed,          // 🔥 startsnelheid van dit level
    radius: ballRadius,
    isMain: true
  }];

  // standaard reset-stand
  ballLaunched = false;
  ballMoving = false;

  // 🔒 Paddle weer vergrendeld tot hernieuwde afschot
  paddleFreeMove = false;

  // 🧱 Zorg dat bij level 1 blokken direct zichtbaar zijn
  if (level === 1) {
    levelTransitionActive = false;
    transitionOffsetY = 0;
  }

  // 🛡️ Tijdens STAR-bonus: bal meteen weer de lucht in (spel loopt door)
  if (invincibleActive) {
    setTimeout(() => {
      // alleen autolancen als de bonus nog actief is en de bal nog geparkeerd staat
      if (!invincibleActive || balls.length === 0) return;

      const b = balls[0];

      // zekerheid: exact boven paddle leggen
      b.x = paddleX + paddleWidth / 2 - ballRadius;
      b.y = paddleY - ballRadius * 2;

      // klein horizontaal zetje voor natuurlijk gevoel
      if (Math.abs(b.dx) < 0.5) {
        b.dx = (Math.random() < 0.5 ? -1 : 1) * 2;
      }

      // ⚠️ hier NIET de oude dy pakken (die kan 0 zijn door resetPaddle),
      // maar opnieuw de level-snelheid ophalen
      const lvlIndex2 = Math.max(0, Math.min(TOTAL_LEVELS - 1, level - 1));
      const lvl2 = LEVELS[lvlIndex2];
      const launchSpeed = (lvl2 && lvl2.params && typeof lvl2.params.ballSpeed === "number")
        ? lvl2.params.ballSpeed
        : 6;

      b.dy = -launchSpeed;   // altijd met volle level-snelheid omhoog

      ballLaunched   = true;
      ballMoving     = true;
      paddleFreeMove = true;
    }, 200);
  }
}


function resetPaddle(skipBallReset = false, skipCentering = false) {
  // 🔐 Niet centreren/resetten tijdens machinegun-fase
  const gunLocked = (typeof machineGunCooldownActive !== "undefined" && machineGunCooldownActive)
                 || (typeof machineGunActive !== "undefined" && machineGunActive);

  // 🎯 Paddle terug naar midden-onder (als niet geskiped en niet gelockt)
  if (!skipCentering && !gunLocked) {
    // center X
    paddleX = (canvas.width - paddleWidth) / 2;

    // bottom Y (met fallback marge van 12 px als constante niet bestaat)
    const margin = (typeof PADDLE_MARGIN_BOTTOM !== "undefined") ? PADDLE_MARGIN_BOTTOM : 12;
    paddleY = canvas.height - paddleHeight - margin;

    // besturing netjes resetten
    upPressed = false;
    downPressed = false;
    leftPressed = false;
    rightPressed = false;

    // na levenverlies: geen vrije muis Y-beweging
    paddleFreeMove = false;
  }

  // 🧽 Reset paddle-tekening inclusief schadeherstel
  paddleCanvas.width = paddleWidth;
  paddleCanvas.height = paddleHeight;
  paddleCtx.clearRect(0, 0, paddleWidth, paddleHeight);
  paddleCtx.drawImage(pointpayPaddleImg, 0, 0, paddleWidth, paddleHeight);

  // 🟢 Bal resetten en op paddle leggen (als niet geskiped en niet gelockt)
  if (!skipBallReset && !gunLocked) {
    // Als je een helper hebt die expliciet op de paddle centreert, gebruik die:
    if (typeof resetBallOnPaddle === "function") {
      resetBallOnPaddle();
    } else {
      // anders je bestaande resetBall() en dan zeker weten centreren
      resetBall?.();

      if (typeof balls !== "undefined" && balls.length > 0) {
        balls[0].x = paddleX + paddleWidth / 2;
        balls[0].y = paddleY - ballRadius - 1; // net boven de paddle
        balls[0].dx = 0;
        balls[0].dy = 0;
      }

      if (typeof ballLaunched !== "undefined") ballLaunched = false;
      if (typeof ballMoving  !== "undefined") ballMoving  = false;
    }
  }
}

function redrawPaddleCanvas() {
  // tekent huidige paddleWidth opnieuw op paddleCanvas (en wist schade)
  paddleCanvas.width = paddleWidth;
  paddleCanvas.height = paddleHeight;
  paddleCtx.clearRect(0, 0, paddleWidth, paddleHeight);
  paddleCtx.globalCompositeOperation = 'source-over';
  paddleCtx.drawImage(pointpayPaddleImg, 0, 0, paddleWidth, paddleHeight);

  // bij resize: damage-zones leeg, anders kloppen gaten niet meer
  if (Array.isArray(paddleDamageZones)) paddleDamageZones = [];
}

function applyPaddleWidthFromMultiplier(mult) {
  const centerX = paddleX + paddleWidth / 2;

  paddleWidth = Math.round(paddleBaseWidth * mult);
  // houd center vast en clamp binnen canvas
  paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, centerX - paddleWidth / 2));

  redrawPaddleCanvas();
}

function startPaddleSizeEffect(type) {
  // type: "long" | "small"
  const now = Date.now();
  if (type === "long") {
    paddleSizeEffect = { type, end: now + PADDLE_LONG_DURATION, multiplier: 2.0 };
    applyPaddleWidthFromMultiplier(2.0);
  } else {
    paddleSizeEffect = { type, end: now + PADDLE_SMALL_DURATION, multiplier: 0.5 };
    applyPaddleWidthFromMultiplier(0.5);
  }
}

function stopPaddleSizeEffect() {
  paddleSizeEffect = null;
  // terug naar basisbreedte van het level
  const centerX = paddleX + paddleWidth / 2;
  paddleWidth = paddleBaseWidth;
  paddleX = Math.max(0, Math.min(canvas.width - paddleWidth, centerX - paddleWidth / 2));
  redrawPaddleCanvas();
}



function drawLivesOnCanvas() {
  for (let i = 0; i < lives; i++) {
    const iconSize = 30;
    const spacing = 10;
    const x = 10 + i * (iconSize + spacing); // linksboven
    const y = 10;

    ctx.drawImage(lifeImg, x, y, iconSize, iconSize);
  }
}


function drawPaddleFlags() {
  if (flagsOnPaddle && Date.now() - flagTimer < 20000) {
    ctx.drawImage(vlagImgLeft, paddleX - 5, paddleY - 40, 45, 45);
    ctx.drawImage(vlagImgRight, paddleX + paddleWidth - 31, paddleY - 40, 45, 45);
  } else if (flagsOnPaddle && Date.now() - flagTimer >= 20000) {
    flagsOnPaddle = false;
  }
}


function shootFromFlags() {
  const coinSpeed = 8;

  // Linkervlag
  flyingCoins.push({
    x: paddleX - 5 + 12,
    y: paddleY - 40,
    dy: -coinSpeed,
    active: true
  });

  // Rechtervlag
  flyingCoins.push({
    x: paddleX + paddleWidth - 19 + 12,
   y: paddleY - 40,
    dy: -coinSpeed,
    active: true
  });

  // 🔫 Speel laser-geluid als bonus actief is
  if (flagsOnPaddle && Date.now() - flagTimer < 20000) {
    laserSound.currentTime = 0;
    laserSound.play();
  }
}

function checkFlyingCoinHits() {
  flyingCoins.forEach((coin) => {
    if (!coin.active) return;

    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];

        if (
          b.status === 1 &&
          coin.x > b.x &&
          coin.x < b.x + brickWidth &&
          coin.y > b.y &&
          coin.y < b.y + brickHeight
        ) {
          // 🪨 Als het een stenen blok is
          if (b.type === "stone") {
            b.hits = (b.hits || 0) + 1;

            // 🔸 Steenpuin toevoegen
            for (let i = 0; i < 5; i++) {
              stoneDebris.push({
                x: b.x + brickWidth / 2,
                y: b.y + brickHeight / 2,
                dx: (Math.random() - 0.5) * 3,
                dy: (Math.random() - 0.5) * 3,
                radius: Math.random() * 2 + 1,
                alpha: 1
              });
            }

            if (b.hits === 1 || b.hits === 2) {
              spawnCoin(b.x + brickWidth / 2, b.y);
            }

            if (b.hits >= 3) {
              b.status = 0;

              if (!b.hasDroppedBag) {
                spawnPxpBag(b.x + brickWidth / 2, b.y + brickHeight);
                b.hasDroppedBag = true;
              }

              const earned = doublePointsActive ? 120 : 60;
              score += earned;
              updateScoreDisplay(); // 👈 aangepaste regel

              pointPopups.push({
                x: b.x + brickWidth / 2,
                y: b.y,
                value: "+" + earned,
                alpha: 1
              });
            }

            coin.active = false;
            return;
          }

          // 🎁 Activeer bonus indien van toepassing + geluid
          switch (b.type) {
            case "power":
            case "flags":
              flagsOnPaddle = true;
              flagTimer = Date.now();
              flagsActivatedSound.play();
              break;
            case "rocket":
              rocketActive = true;
              rocketAmmo += 3;
              rocketReadySound.play();
              break;
            case "doubleball":
              spawnExtraBall(balls[0]);
              doubleBallSound.play();
              break;
            case "2x":
              doublePointsActive = true;
              doublePointsStartTime = Date.now();
              doublePointsSound.play();
              break;
            case "speed":
              speedBoostActive = true;
              speedBoostStart = Date.now();
              speedBoostSound.play();
              break;
              case "magnet":
              activateMagnet(20000);
              break;

          }

          b.status = 0;
          b.type = "normal";

          const earned = doublePointsActive ? 20 : 10;
          score += earned;
          updateScoreDisplay(); // 👈 aangepaste regel

          coinSound.currentTime = 0;
          coinSound.play();

          pointPopups.push({
            x: coin.x,
            y: coin.y,
            value: "+" + earned,
            alpha: 1
          });

          coin.active = false;
          return;
        }
      }
    }
  });
}

function saveHighscore() {
  const playerName = window.currentPlayer || "Unknown";

  const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
  const seconds = String(elapsedTime % 60).padStart(2, '0');
  const timeFormatted = `${minutes}:${seconds}`;

  const newScore = {
    name: playerName,
    score: score,
    time: timeFormatted,
    level: level || 1  // fallback naar level 1 als het niet gedefinieerd is
  };

  let highscores = JSON.parse(localStorage.getItem("highscores")) || [];

  // 🔒 Voeg alleen toe als deze combinatie nog niet bestaat
  const isDuplicate = highscores.some(h =>
    h.name === newScore.name &&
    h.score === newScore.score &&
    h.time === newScore.time &&
    h.level === newScore.level
  );

  if (!isDuplicate) {
    highscores.push(newScore);
  }

  // 🏆 Sorteer op score, daarna op snelste tijd
  highscores.sort((a, b) => {
    if (b.score === a.score) {
      const [amin, asec] = a.time.split(":").map(Number);
      const [bmin, bsec] = b.time.split(":").map(Number);
      return (amin * 60 + asec) - (bmin * 60 + bsec);
    }
    return b.score - a.score;
  });

  // ✂️ Beperk tot top 10
  highscores = highscores.slice(0, 10);
  localStorage.setItem("highscores", JSON.stringify(highscores));

  // 📋 Toon in de highscorelijst
  const list = document.getElementById("highscore-list");
  if (list) {
    list.innerHTML = "";
    highscores.forEach((entry, index) => {
      const lvl = entry.level || 1;
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${entry.name} — ${entry.score} — ${entry.time} — Level ${lvl}`;
      list.appendChild(li);
    });
  }
}

const coinImg = new Image();
coinImg.src = "pxp coin perfect_clipped_rev_1.png";
let coins = [];

function spawnCoin(x, y) {
  coins.push({ x: x + brickWidth / 2 - 12, y: y, radius: 12, active: true });
}

function drawCoins() {
  coins.forEach(coin => {
    if (coin.active) {
      ctx.drawImage(coinImg, coin.x, coin.y, 24, 24);
      coin.y += 2;
    }
  });
}
function drawFallingHearts() {
  // we lopen achteruit zodat we veilig kunnen splicen
  for (let i = fallingHearts.length - 1; i >= 0; i--) {
    const heart = fallingHearts[i];

    // 🚀 Beweging
    heart.y += heart.dy;

    // 💖 Pulserend formaat
    const size = 24 + Math.sin(heart.pulse) * 2;
    heart.pulse += 0.2;

    // ✨ AURA rondom vallend hartje
    ctx.save();
    ctx.translate(heart.x + size / 2, heart.y + size / 2);
    const tAura = performance.now() / 300 + i * 0.2;
    const auraAlpha = 0.35 + 0.25 * Math.sin(tAura * 2);
    const auraR = (size * 0.6) + 5;

    ctx.rotate(tAura * 0.4);
    ctx.globalAlpha = auraAlpha;
    const grad = ctx.createRadialGradient(0, 0, auraR * 0.15, 0, 0, auraR);
    grad.addColorStop(0, "rgba(255,180,220,0.9)");
    grad.addColorStop(0.4, "rgba(255,120,200,0.4)");
    grad.addColorStop(1, "rgba(255,120,200,0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, auraR, auraR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ✨ Teken hartje zelf
    ctx.globalAlpha = heart.alpha;
    ctx.drawImage(heartImg, heart.x, heart.y, size, size);
    ctx.globalAlpha = 1;

    // 🔲 Paddle-bounding box
    const paddleLeft = paddleX;
    const paddleRight = paddleX + paddleWidth;
    const paddleTop = paddleY;
    const paddleBottom = paddleY + paddleHeight;

    // 🟥 Heart-bounding box
    const heartLeft = heart.x;
    const heartRight = heart.x + size;
    const heartTop = heart.y;
    const heartBottom = heart.y + size;

    // 🎯 Check of paddle het hartje vangt
    const isOverlap =
      heartRight >= paddleLeft &&
      heartLeft <= paddleRight &&
      heartBottom >= paddleTop &&
      heartTop <= paddleBottom;

    if (isOverlap && !heart.collected) {
      heart.collected = true;
      heartsCollected++;

      // display bijwerken
      if (typeof updateBonusPowerPanel === "function") {
        updateBonusPowerPanel(
          starsCollected,
          bombsCollected,
          badCrossesCaught,
          heartsCollected
        );
      }

      // 🎵 nieuw: eigen hartje-geluid
      try {
        if (typeof heartPickupSfx !== "undefined" && heartPickupSfx) {
          heartPickupSfx.currentTime = 0;
          heartPickupSfx.play();
        }
      } catch {}

      // ✅ Beloning bij 10 hartjes
      if (heartsCollected >= 10) {
        heartsCollected = 0;
        lives++;
        updateLivesDisplay?.();

        // display opnieuw tonen met 0 hartjes
        if (typeof updateBonusPowerPanel === "function") {
          updateBonusPowerPanel(
            starsCollected,
            bombsCollected,
            badCrossesCaught,
            heartsCollected
          );
        }

        // 🚀 nieuwe fullscreen intro
        triggerHeartCelebration?.();
      }
    }

    // 💨 Verwijder uit array als buiten beeld of al gepakt
    if (heart.y > canvas.height || heart.collected) {
      fallingHearts.splice(i, 1);
    }
  }
}



function tryCatchItem(item) {
  // Hearts worden in drawFallingHearts() al via overlap verwerkt,
  // coins via checkCoinCollision(), bags in de zakje-loop.
  // Daarom doen we hier alleen een "instant-catch" fallback:
  item.__forceCatch = true; // marker; afhandeling volgt in bestaande catch-logica
}

function applyMagnetToArray(items) {
  if (!magnetActive || !items || !items.length) return;
  const { cx, cy } = getPaddleCenter();

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    
    if (it.noMagnet || it.type === "bad_cross") continue;


    // Bepaal itempositievelden
    let ix = it.x, iy = it.y;
    if (typeof ix !== "number" || typeof iy !== "number") continue;

    const dx = cx - ix;
    const dy = cy - iy;
    const dist = Math.hypot(dx, dy);

    // auto-catch heel dichtbij
    if (dist <= magnetCatchRadius) {
      tryCatchItem(it);
      continue;
    }

    // snelheid-velden (optioneel) opbouwen
    it.vx = (it.vx || 0) + (dx / (dist || 1)) * magnetStrength;
    it.vy = (it.vy || 0) + (dy / (dist || 1)) * magnetStrength;

    // clamp
    const sp = Math.hypot(it.vx, it.vy);
    if (sp > magnetMaxSpeed) {
      const k = magnetMaxSpeed / (sp || 1);
      it.vx *= k; it.vy *= k;
    }

    // positie bijwerken
    it.x += it.vx;
    it.y += it.vy;
  }
}


// 🪨 Eenvoudige en stabiele botsing: cirkel vs paddle (rect)
function circleIntersectsRect(cx, cy, r, rx, ry, rw, rh) {
  // Bereken het dichtstbijzijnde punt op de paddle
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  // Afstand tussen cirkelcentrum en dat punt
  const dx = cx - closestX;
  const dy = cy - closestY;

  // Alleen true als de randen elkaar echt raken
  return (dx * dx + dy * dy) <= (r * r);
}

function pickRandomRockSprite() {
  // Altijd de grote steen gebruiken (visueel consistent)
  return { img: stoneLargeImg, size: 102 + Math.random() * 16 }; // ~102–118
}




function triggerStonefall(originX, originY) {
  // Altijd 3 stenen laten vallen
  const count = 2;

  for (let i = 0; i < count; i++) {
    const rock = pickRandomRockSprite(); // levert nu altijd stoneLargeImg

    fallingStones.push({
      x: originX + (Math.random() - 0.5) * 20,  // lichte spreiding
      y: originY + 10,
      dy: 1.8 + Math.random() * 1.2,                // val­snelheid
      size: rock.size,
      img: rock.img,                            // sprite
      active: true,
      shattered: false,

      // 🔧 nieuwe eigenschappen voor betere paddle-botsing
      framesInside: 0,       // telt frames dat steen overlapt met paddle
      hitboxScale: 0.9,      // 90% van diameter voor realistische hitbox
      minPenetration: null   // wordt berekend bij eerste collision-check
    });
  }
}



function drawFallingStones() {
  for (let i = fallingStones.length - 1; i >= 0; i--) {
    const s = fallingStones[i];
    if (!s.active) {
      fallingStones.splice(i, 1);
      continue;
    }

    // Tekenen
    if (s.img && s.img.complete) {
      ctx.drawImage(s.img, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    } else {
      ctx.drawImage(stoneLargeImg, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }

    // ===== beweging =====
    if (s.prevY == null) s.prevY = s.y;
    if (s.prevX == null) s.prevX = s.x;
    const prevX = s.prevX;
    const prevY = s.prevY;
    s.prevX = s.x;
    s.prevY = s.y;
    s.y += s.dy; // val

    // ---- Botsing met paddle ----
    if (s.framesInside == null) s.framesInside = 0;

    const baseRadius = s.size * 0.42;
    const isLarge = s.size >= 100;

    // ⛏️ lees SOFT uit centrale settings
    const hitboxScale         = isLarge ? STONE_COLLISION.hitboxScaleLarge : STONE_COLLISION.hitboxScaleSmall;
    const minPenetrationFrac  = isLarge ? STONE_COLLISION.minPenLargeFrac  : STONE_COLLISION.minPenSmallFrac;
    const debounceFrames      = isLarge ? STONE_COLLISION.debounceLarge    : STONE_COLLISION.debounceSmall;
    const minHorizOverlapFrac = STONE_COLLISION.minHorizOverlapFrac;

    const r = baseRadius * hitboxScale;

    // Paddle-bounds
    const paddleLeft   = paddleX;
    const paddleTop    = paddleY;
    const paddleW      = paddleWidth;
    const paddleH      = paddleHeight;
    const paddleRight  = paddleLeft + paddleW;
    const paddleBottom = paddleTop + paddleH;

    // 1) Directe overlap
    const intersects = circleIntersectsRect(s.x, s.y, r, paddleLeft, paddleTop, paddleW, paddleH);

    // 1b) Swept (anti-tunneling) – segment tegen vergrote rect
    const extLeft   = paddleLeft   - r;
    const extRight  = paddleRight  + r;
    const extTop    = paddleTop    - r;
    const extBottom = paddleBottom + r;
    const dx = s.x - prevX, dy = s.y - prevY;
    let t0 = 0, t1 = 1;
    const clip = (p, q) => {
      if (p === 0) return q >= 0;
      const t = q / p;
      if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
      return true;
    };
    let sweptHit = false;
    if (
      clip(-dx, prevX - extLeft) &&
      clip( dx, extRight - prevX) &&
      clip(-dy, prevY - extTop) &&
      clip( dy, extBottom - prevY)
    ) sweptHit = (t0 <= t1);

    // 2) Basisvoorwaarden
    const falling = s.dy > 0;
    const prevBottom = prevY + r;
    const nowBottom  = s.y + r;
    const enterTol   = Math.max(4, Math.min(16, Math.abs(dy) * 1.5));
    const enteredFromAbove = (prevBottom <= paddleTop + enterTol);

    // 3) Overlapmetrics
    const stoneLeft  = s.x - r;
    const stoneRight = s.x + r;
    const overlapX   = Math.max(0, Math.min(stoneRight, paddleRight) - Math.max(stoneLeft, paddleLeft));
    const minOverlapSoft = Math.max(6, Math.min(r * minHorizOverlapFrac, paddleW * 0.5)); // drempel in SOFT

    // ========= Verticale hit-pad (SOFT) =========
    const minPenetrationPx = Math.max(4, Math.min(r * 0.50, r * minPenetrationFrac, paddleH * 0.8));
    const penetrates       = nowBottom >= (paddleTop + minPenetrationPx);

    // kleine guard tegen rand-graze
    const edgeGuardV    = Math.min(Math.max(4, paddleW * 0.06), 14);
    const centerInsideV = (s.x >= paddleLeft + edgeGuardV) && (s.x <= paddleRight - edgeGuardV);

    const cornerRejectV = intersects && (overlapX < Math.min(r * 0.28, paddleW * 0.25))
                        && (nowBottom < (paddleTop + minPenetrationPx * 1.1));

    const verticalHit = (intersects || sweptHit)
      && enteredFromAbove
      && falling
      && penetrates
      && (overlapX >= minOverlapSoft)
      && centerInsideV
      && !cornerRejectV;

    // ========= Side-hit pad (SOFT) =========
    // voorwaarden:
    // - directe of swept overlap
    // - vallend
    // - steen-centrum y ongeveer binnen verticale band van paddle (met marge)
    // - wat strenger op overlap in X om echte “side contact” te waarborgen
    const sideBandTol = Math.min(12, Math.max(6, r * 0.25)); // verticale marge boven/onder paddle
    const centerInVerticalBand =
      (s.y >= paddleTop - sideBandTol) && (s.y <= paddleBottom + sideBandTol);

    const minOverlapSide = Math.max(8, Math.min(r * 0.45, paddleW * 0.6)); // iets strenger dan vertical
    const wideEnoughSide = overlapX >= minOverlapSide;

    // corner-reject voor side: alleen reject als overlap echt klein is
    const cornerRejectS = (intersects || sweptHit) && (overlapX < Math.min(r * 0.22, paddleW * 0.20));

    const sideHit = (intersects || sweptHit)
      && falling
      && centerInVerticalBand
      && wideEnoughSide
      && !cornerRejectS;

    // ✅ Echte hit als één van beide paden waar is
    const contactNow = verticalHit || sideHit;

    if (contactNow) s.framesInside++;
    else s.framesInside = 0;

    // Botsing telt na drempel-frames
   if (s.framesInside >= debounceFrames) {
  if (invincibleActive) {
    // 🛡️ Tijdens sterren-bonus: NIET exploderen — gewoon reflecteren en doorgaan
    // eenvoudige bounce omhoog + lichte zij-afwijking obv contactpunt
    const paddleLeft  = paddleX;
    const paddleRight = paddleX + paddleWidth;
    const rel = ((s.x - paddleLeft) / (paddleRight - paddleLeft)) - 0.5; // -0.5..+0.5

    s.vy = -Math.max(6, Math.abs(s.vy || 6));
    s.vx = (s.vx || 0) + rel * 2;

    // zet steen net boven de paddle om “plakken” te voorkomen
    const r = s.size / 2;
    s.y = paddleY - r - 1;

    // klein visueel tikje
    stoneHitOverlayTimer = 10;
  } else {
    // normaal gedrag (zoals je had)
    spawnStoneDebris(s.x, s.y);
    s.active = false;
    stoneHitOverlayTimer = 18;

    if (!stoneHitLock) {
      stoneHitLock = true;
      if (typeof triggerPaddleExplosion === "function") triggerPaddleExplosion();
      stoneClearRequested = true;
      setTimeout(() => { stoneHitLock = false; }, 1200);
    }
  }
  continue;
}


    // onder uit beeld → vergruizen
    if (s.y - s.size / 2 > canvas.height) {
      spawnStoneDebris(s.x, canvas.height - 10);
      s.active = false;
    }
  }

  // ná de iteratie: alle stenen wissen (indien aangevinkt)
  if (stoneClearRequested) {
    fallingStones.length = 0;
    stoneClearRequested = false;
  }
}




function updateTNTs() {
  const now = performance.now();
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (!b || b.status !== 1 || b.type !== "tnt" || !b.tntArmed) continue;

      const elapsed = now - b.tntStart;
      const timeToExplode = 10000; // 10 sec

      // 🚩 Eerst: meteen exploderen als de timer op is (géén beep meer)
      if (elapsed >= timeToExplode) {
        explodeTNT(c, r);
        continue; // skip verdere beeps
      }

      // ⏱️ Dan pas: volgende beep plannen/afspelen
      if (now >= b.tntBeepNext) {
        try {
          tntBeepSound.currentTime = 0;
          tntBeepSound.play();
        } catch {}
        const remain = Math.max(0, timeToExplode - elapsed);
        const interval = Math.max(120, remain / 10);
        b.tntBeepNext = now + interval;
      }
    }
  }
}


function explodeTNT(col, row) {
  // 1) Hard: beep stoppen en explode-sound resetten
  try { tntBeepSound.pause(); tntBeepSound.currentTime = 0; } catch {}
  try { tntExplodeSound.currentTime = 0; tntExplodeSound.play(); } catch {}

  // 2) Guard: center ophalen en valideren
  const center = bricks?.[col]?.[row];
  if (!center || center.status !== 1) return;

  // voorkom dubbele triggers
  if (center.tntArmed) center.tntArmed = false;

  // 3) Buren matrix (8 richtingen)
  const dirs = [
    [ 0,-1],[ 1,-1],[ 1, 0],[ 1, 1],
    [ 0, 1],[-1, 1],[-1, 0],[-1,-1]
  ];

  // 4) Center & buren “wegblazen”
  //    (status = 0; raak niet buiten het grid)
  for (let i = 0; i < dirs.length; i++) {
    const dx = dirs[i][0], dy = dirs[i][1];
    const c = col + dx, r = row + dy;
    if (c < 0 || r < 0 || c >= brickColumnCount || r >= brickRowCount) continue;
    const n = bricks[c][r];
    if (n && n.status === 1) {
      n.status = 0;
      if (n.tntArmed) n.tntArmed = false; // schakel evt. ketting-beep uit
    }
  }
  center.status = 0;

  // 5) Explosiepositie robuust bepalen:
  //    Gebruik center.x/center.y als ze bestaan, anders reken ze uit
  //    met standaard breakout-variabelen.
  //    PAS AAN als jouw variabelen anders heten.
  const bx = (typeof center.x === "number")
    ? center.x
    : (brickOffsetLeft + col * (brickWidth + brickPadding));
  const by = (typeof center.y === "number")
    ? center.y
    : (brickOffsetTop  + row * (brickHeight + brickPadding));

  // 6) Explosie-effect pushen (zorg dat explosions bestaat)
  if (!Array.isArray(explosions)) window.explosions = [];
  explosions.push({
    x: bx + brickWidth / 2,
    y: by + brickHeight / 2,
    radius: 22,
    alpha: 1,
    color: "orange"
  });
}

// 🔇 TNT: stop alle geluiden en ontkoppel timers
function stopAndDisarmAllTNT() {
  try { tntBeepSound.pause(); tntBeepSound.currentTime = 0; } catch {}
  try { tntExplodeSound.pause?.(); tntExplodeSound.currentTime = 0; } catch {}

  // alle TNT blokken doorlopen en disarmen
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks?.[c]?.[r];
      if (!b) continue;
      if (b.type === "tnt") {
        b.tntArmed   = false;
        b.tntStart   = 0;
        b.tntBeepNext = 0;
      }
    }
  }
}

function updateAndDrawBombRain() {
  const now = performance.now();
  for (let i = bombRain.length - 1; i >= 0; i--) {
    const b = bombRain[i];
    if (now < b.startAt) continue;

    // vallen
    b.y += b.vy;

    // tekenen
    const img = (bombTokenImg && bombTokenImg.complete) ? bombTokenImg : tntImg;
    ctx.drawImage(img, b.x - 14, b.y - 14, 28, 28);

    // geland?
    if (!b.exploded && b.y >= b.targetY) {
      b.exploded = true;

      // veilige guard: bestaat target nog?
      if (bricks?.[b.col]?.[b.row]?.status === 1) {
        explodeTNT(b.col, b.row);  // wist center + buren
      } else {
        // fallback: zoek dichtstbijzijnde nog-actieve brick in buurt
        let best = null, bestD = Infinity;
        for (let c = 0; c < brickColumnCount; c++) {
          for (let r = 0; r < brickRowCount; r++) {
            const bx = bricks[c][r];
            if (bx?.status !== 1) continue;
            const dx = (bx.x + brickWidth/2) - b.x;
            const dy = (bx.y + brickHeight/2) - b.y;
            const d2 = dx*dx + dy*dy;
            if (d2 < bestD) { bestD = d2; best = { c, r }; }
          }
        }
        if (best) explodeTNT(best.c, best.r);
      }

      // leuke rook + knal die je al tekent
      try { tntExplodeSound.currentTime = 0; tntExplodeSound.play(); } catch {}
      // laat sprite verdwijnen na knal
      bombRain.splice(i, 1);
    }

    // buiten beeld/fail-safe
    if (b.y > canvas.height + 40) bombRain.splice(i, 1);
  }
}



function drawFlyingCoins() {
  flyingCoins.forEach((coin) => {
    if (coin.active) {
      ctx.drawImage(shootCoinImg, coin.x - 12, coin.y - 12, 24, 24);
      coin.y += coin.dy;
    }
  });
  
  flyingCoins = flyingCoins.filter(coin => coin.y > -24 && coin.active);
}

function checkRocketCollision() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      let b = bricks[c][r];

      if (
        b.status === 1 &&
        rocketX + 12 > b.x &&
        rocketX + 12 < b.x + brickWidth &&
        rocketY < b.y + brickHeight &&
        rocketY + 48 > b.y
      ) {
        let hitSomething = false;

        const targets = [
          [c, r],
          [c - 1, r],
          [c + 1, r],
          [c, r + 1]
        ];

        targets.forEach(([col, row]) => {
          if (
            col >= 0 && col < brickColumnCount &&
            row >= 0 && row < brickRowCount &&
            bricks[col][row].status === 1
          ) {
            const target = bricks[col][row];

            // 🪨 Gedrag voor stenen blokken
            if (target.type === "stone") {
              target.hits = (target.hits || 0) + 1;

              // 🔸 Puin toevoegen
              for (let i = 0; i < 5; i++) {
                stoneDebris.push({
                  x: target.x + brickWidth / 2,
                  y: target.y + brickHeight / 2,
                  dx: (Math.random() - 0.5) * 3,
                  dy: (Math.random() - 0.5) * 3,
                  radius: Math.random() * 2 + 1,
                  alpha: 1
                });
              }

              if (target.hits === 1 || target.hits === 2) {
                spawnCoin(target.x + brickWidth / 2, target.y);
              }

              if (target.hits >= 3) {
                target.status = 0;

                if (!target.hasDroppedBag) {
                  spawnPxpBag(target.x + brickWidth / 2, target.y + brickHeight);
                  target.hasDroppedBag = true;
                }

                const earned = doublePointsActive ? 120 : 60;
                score += earned;

                pointPopups.push({
                  x: target.x + brickWidth / 2,
                  y: target.y,
                  value: "+" + earned,
                  alpha: 1
                });
              }

              hitSomething = true;
              return;
            }

            // 🎁 Bonusacties + geluid
            switch (target.type) {
              case "power":
              case "flags":
                flagsOnPaddle = true;
                flagTimer = Date.now();
                flagsActivatedSound.play();
                break;
              case "rocket":
                rocketActive = true;
                rocketAmmo += 3;
                rocketReadySound.play();
                break;
              case "doubleball":
                spawnExtraBall(balls[0]);
                doubleBallSound.play();
                break;
              case "2x":
                doublePointsActive = true;
                doublePointsStartTime = Date.now();
                doublePointsSound.play();
                break;
              case "speed":
                speedBoostActive = true;
                speedBoostStart = Date.now();
                speedBoostSound.play();
                break;
            }

            target.status = 0;
            target.type = "normal";
            score += doublePointsActive ? 20 : 10;
            hitSomething = true;
          }
        });

        if (hitSomething) {
          rocketExplosionSound.currentTime = 0;
          rocketExplosionSound.play();

          updateScoreDisplay(); // 👈 aangepaste regel
          rocketFired = false;

          explosions.push({
            x: rocketX + 12,
            y: rocketY,
            radius: 10,
            alpha: 1
          });
        } else {
          rocketFired = false;
        }

        if (rocketAmmo <= 0) {
          rocketActive = false;
        }

        return;
      }
    }
  }
}




function checkCoinCollision() {
  coins.forEach(coin => {
    if (!coin.active) return;

    const coinLeft = coin.x;
    const coinRight = coin.x + coin.radius * 2;
    const coinTop = coin.y;
    const coinBottom = coin.y + coin.radius * 2;

    const paddleLeft = paddleX;
    const paddleRight = paddleX + paddleWidth;
    const paddleTop = paddleY;
    const paddleBottom = paddleY + paddleHeight;

    const isOverlap =
      coinRight >= paddleLeft &&
      coinLeft <= paddleRight &&
      coinBottom >= paddleTop &&
      coinTop <= paddleBottom;

    if (isOverlap) {
      coin.active = false;

      const earned = doublePointsActive ? 20 : 10;
      score += earned;
      updateScoreDisplay(); // 👈 aangepaste regel

      coinSound.currentTime = 0;
      coinSound.play();

      pointPopups.push({
        x: coin.x,
        y: coin.y,
        value: "+" + earned,
        alpha: 1
      });
    } else if (coinBottom > canvas.height) {
      coin.active = false;
    }
  });
}


function collisionDetection() {
  // 🔧 Instelling: hoe vaak moet hij "watch out..." zeggen (1x per X hits)
  const stonefallVoiceEvery = 5; // ← verander dit getal naar wens

  // 🎙️ Lazy init van voice line + state (1× per game)
  if (typeof window.rockWarnState === "undefined") {
    window.rockWarnState = {
      hits: 0,
      audio: (() => {
        try {
          const a = new Audio("bitty_watch_out.mp3"); // zet juiste pad/bestandsnaam
          a.volume = 0.85;
          return a;
        } catch (e) { return null; }
      })()
    };
  }
  const RWS = window.rockWarnState;

  balls.forEach(ball => {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];

        if (
          b.status === 1 &&
          ball.x > b.x &&
          ball.x < b.x + brickWidth &&
          ball.y > b.y &&
          ball.y < b.y + brickHeight
        ) {
          blockSound.currentTime = 0;
          blockSound.play();

          ball.dy = -ball.dy;
          if (ball.dy < 0) {
            ball.y = b.y - ball.radius - 1;
          } else {
            ball.y = b.y + brickHeight + ball.radius + 1;
          }

          // 🪨 Steen-blok gedrag
          if (b.type === "stone") {
            bricksSound.currentTime = 0;
            bricksSound.play();
            b.hits++;

            for (let i = 0; i < 5; i++) {
              stoneDebris.push({
                x: b.x + brickWidth / 2,
                y: b.y + brickHeight / 2,
                dx: (Math.random() - 0.5) * 3,
                dy: (Math.random() - 0.5) * 3,
                radius: Math.random() * 2 + 1,
                alpha: 1
              });
            }

            if (b.hits === 1 || b.hits === 2) {
              spawnCoin(b.x + brickWidth / 2, b.y);
            }

            if (b.hits >= 3) {
              b.status = 0;

              if (!b.hasDroppedBag) {
                spawnPxpBag(b.x + brickWidth / 2, b.y + brickHeight);
                b.hasDroppedBag = true;
              }

              const earned = doublePointsActive ? 120 : 60;
              score += earned;
              updateScoreDisplay();

              pointPopups.push({
                x: b.x + brickWidth / 2,
                y: b.y,
                value: "+" + earned,
                alpha: 1
              });
            }

            return; // klaar met deze hit
          }

          // 🪙 Gedrag voor silver blokken
          if (b.type === "silver") {
            b.hits = (b.hits || 0) + 1;

            if (b.hits === 1) {
              // silver2.png tekenen gebeurt in drawBricks()
            } else if (b.hits >= 2) {
              b.status = 0;

              triggerSilverExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2);

              const earned = doublePointsActive ? 150 : 75;
              score += earned;
              updateScoreDisplay();

              pointPopups.push({
                x: b.x + brickWidth / 2,
                y: b.y,
                value: "+" + earned,
                alpha: 1
              });
            }

            return; // klaar met deze hit
          }

          // 🎁 Bonusacties
          switch (b.type) {

            // 🧨 TNT — arm bij 1e hit, laat staan (knipper/beep via updateTNTs), geen cleanup hieronder
            case "tnt": {
              if (!b.tntArmed) {
                b.tntArmed    = true;
                b.tntStart    = performance.now();
                b.tntBeepNext = b.tntStart; // als je beeps gebruikt
                try { tntBeepSound.currentTime = 0; tntBeepSound.play(); } catch (e) {}
              }
              return; // ➜ heel belangrijk: voorkom gedeelde cleanup
            }

            case "stonefall": {
              // ✨ Direct bij hit: laat stenen vallen
              const midX = b.x + brickWidth / 2;
              const midY = b.y + brickHeight / 2;
              triggerStonefall(midX, midY);

              // ✅ Voice 1× per X stonefall-hits (instelbaar bovenaan)
              RWS.hits++;
              if (RWS.hits >= stonefallVoiceEvery) {
                try {
                  const a = new Audio("bitty_watch_out.mp3");
                  a.volume = 0.9;
                  a.play().catch(() => {});
                } catch (e) {}
                RWS.hits = 0; // reset teller
              }

              // 🔒 Eigen cleanup + punten en daarna STOPPEN (geen gedeelde cleanup!)
              b.status = 0;                                // blok meteen weg
              const earned = doublePointsActive ? 20 : 10; // punten
              score += earned;
              updateScoreDisplay();
              spawnCoin(b.x, b.y);                         // beloning
              return; // <<< voorkomt dat andere cases/cleanup nog lopen
            }

            case "power":
            case "flags":
              flagsOnPaddle = true;
              flagTimer = Date.now();
              flagsActivatedSound.play();
              break;

            case "machinegun":
              machineGunActive = true;
              machineGunShotsFired = 0;
              machineGunBullets = [];
              paddleDamageZones = [];
              machineGunLastShot = Date.now();
              machineGunStartTime = Date.now();
              machineGunGunX = paddleX + paddleWidth / 2 - 30;
              machineGunGunY = Math.max(paddleY - machineGunYOffset, minMachineGunY);
              b.status = 0;
              b.type = "normal";
              break;

            case "paddle_long":
              startPaddleSizeEffect("long");
              break;

            case "paddle_small":
              startPaddleSizeEffect("small");
              break;

            case "magnet":
              activateMagnet(20000);
              break;

            case "rocket":
              rocketActive = true;
              rocketAmmo = 3;
              rocketReadySound.play();
              break;

            case "doubleball":
              spawnExtraBall(ball);
              doubleBallSound.play();
              break;

            case "2x":
              doublePointsActive = true;
              doublePointsStartTime = Date.now();
              doublePointsSound.play();
              break;

            case "speed":
              speedBoostActive = true;
              speedBoostStart = Date.now();
              speedBoostSound.play();
              break;
          } // <-- einde switch

          // 🔽 Gedeelde cleanup (voor alle reguliere bonussen, NIET stonefall/tnt/silver/stone)
          b.status = 0;

          let earned = (b.type === "normal") ? 5 : (doublePointsActive ? 20 : 10);
          score += earned;
          updateScoreDisplay();

          b.type = "normal";
          spawnCoin(b.x, b.y);
        } // <-- einde IF hit
      } // <-- einde for r
    } // <-- einde for c
  }); // <-- einde balls.forEach
} // <-- einde function


// === BITTY BOMB VFX (enige set, geen duplicaten!) ===
function drawBolt(ctx, x1, y1, x2, y2, opts = {}) {
  const {
    depth = 4,
    roughness = 18,
    forks = 2,
    forkChance = 0.45,
    forkAngle = Math.PI / 6,
    shrink = 0.65
  } = opts;

  // jaggedLine hoort BINNEN drawBolt te staan
  function jaggedLine(x1, y1, x2, y2, d, r) {
    const pts = [{x:x1, y:y1}, {x:x2, y:y2}];
    for (let i = 0; i < d; i++) {
      const arr = [pts[0]];
      for (let j = 0; j < pts.length - 1; j++) {
        const a = pts[j], b = pts[j+1];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const dx = b.x - a.x, dy = b.y - a.y;
        const nx = -dy, ny = dx;
        const off = (Math.random() - 0.5) * r;
        const mag = Math.hypot(nx, ny) || 1;
        arr.push({x: mx + nx * off / mag, y: my + ny * off / mag});
        arr.push(b);
      }
      pts.splice(0, pts.length, ...arr);
      r *= 0.55;
    }
    return pts;
  }

  const pts = jaggedLine(x1, y1, x2, y2, depth, roughness);

  // glow (blauw) + core (wit)
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(140,190,255,0.65)";
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.restore();

  // forks
  if (forks > 0 && Math.random() < forkChance) {
    const p = pts[Math.floor(lerp(1, pts.length - 2, Math.random()))];
    const ang = Math.atan2(y2 - y1, x2 - x1) + randRange(-forkAngle, forkAngle);
    const len = Math.hypot(x2 - x1, y2 - y1) * shrink * randRange(0.6, 1.0);
    const fx = p.x + Math.cos(ang) * len;
    const fy = p.y + Math.sin(ang) * len;
    drawBolt(ctx, p.x, p.y, fx, fy, {
      depth: Math.max(2, depth - 1),
      roughness: Math.max(6, roughness * 0.6),
      forks: forks - 1,
      forkChance: forkChance * 0.7,
      forkAngle,
      shrink
    });
  }
}

function startBombVisuals(afterCb) {
  const now = performance.now();
  bombVisuals = {
    t0: now,
    done: false,
    afterCb,
    ringR: 0,
    ringAlpha: 0.55,
    flames: [],
    sparks: [],
    smoke: []
  };
}

function updateAndDrawBombVisuals(ctx) {
  if (!bombVisuals || bombVisuals.done) return;

  const now = performance.now();
  const t   = now - bombVisuals.t0;
  const W   = canvas.width, H = canvas.height;
  const cx  = W/2, cy = H/2;

  // FLASH (0.5–0.8s)
  if (t >= BOMB_VFX.FLASH_START && t <= BOMB_VFX.FLASH_END) {
    const k = (t - BOMB_VFX.FLASH_START) / (BOMB_VFX.FLASH_END - BOMB_VFX.FLASH_START);
    const r = (0.2 + 0.8*k) * Math.hypot(W, H) * 0.55;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0.00, "rgba(255,255,255,0.95)");
    g.addColorStop(0.35, "rgba(255,245,200,0.45)");
    g.addColorStop(1.00, "rgba(255,180, 80,0.0)");
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    bombVisuals.ringR = r * 0.55; bombVisuals.ringAlpha = 0.55;
  }

  // SHOCKWAVE-RING
  if (bombVisuals.ringAlpha > 0) {
    bombVisuals.ringR += 10 + bombVisuals.ringR * 0.015;
    bombVisuals.ringAlpha *= 0.94;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,255,255,${bombVisuals.ringAlpha})`;
    ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, bombVisuals.ringR, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = `rgba(255,200,120,${bombVisuals.ringAlpha*0.6})`;
    ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, bombVisuals.ringR, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // FLAMES (0.7–1.6s)
  if (t >= BOMB_VFX.FLAME_START && t <= BOMB_VFX.FLAME_END) {
    for (let i = 0; i < 24; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = randRange(2.0, 5.0);
      bombVisuals.flames.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd * randRange(0.7, 1.3),
        vy: Math.sin(ang) * spd * randRange(0.7, 1.3),
        r: randRange(2.0, 4.0),
        life: randRange(500, 900),
        born: now
      });
    }
  }
  for (let i = bombVisuals.flames.length - 1; i >= 0; i--) {
    const p = bombVisuals.flames[i];
    const age = now - p.born, k = Math.max(0, 1 - age / p.life);
    p.x += p.vx; p.y += p.vy; p.vx *= 0.992; p.vy = p.vy * 0.992 + 0.025;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*5);
    grad.addColorStop(0.00, `rgba(255,235,170,${0.90*k})`);
    grad.addColorStop(0.35, `rgba(255,160, 60,${0.60*k})`);
    grad.addColorStop(1.00, `rgba(255, 80,  0,0)`);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(p.x, p.y, p.r*4, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    if (age >= p.life) bombVisuals.flames.splice(i, 1);
  }

  // SPARKS (0.75–1.2s)
  if (t >= 750 && t <= 1200) {
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = randRange(4.0, 8.0);
      bombVisuals.sparks.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: randRange(180, 320),
        born: now
      });
    }
  }
  for (let i = bombVisuals.sparks.length - 1; i >= 0; i--) {
    const s = bombVisuals.sparks[i];
    const age = now - s.born, k = Math.max(0, 1 - age / s.life);
    s.x += s.vx; s.y += s.vy; s.vx *= 0.985; s.vy = s.vy * 0.985 + 0.015;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255,255,180,${0.9*k})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx*1.8, s.y - s.vy*1.8); ctx.stroke();
    ctx.restore();
    if (age >= s.life) bombVisuals.sparks.splice(i, 1);
  }

  // SMOKE (na-gloed)
  if (t >= BOMB_VFX.SMOKE_START) {
    for (let i = 0; i < 4; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = randRange(0.6, 1.4);
      bombVisuals.smoke.push({
        x: cx + Math.cos(ang) * randRange(0, 8),
        y: cy + Math.sin(ang) * randRange(0, 8),
        vx: Math.cos(ang) * spd * 0.4,
        vy: Math.sin(ang) * spd * 0.4 - 0.05,
        r: randRange(6, 10),
        alpha: 0.35,
        grow: randRange(0.06, 0.12)
      });
    }
  }
  for (let i = bombVisuals.smoke.length - 1; i >= 0; i--) {
    const m = bombVisuals.smoke[i];
    m.x += m.vx; m.y += m.vy; m.vx *= 0.995; m.vy *= 0.995;
    m.r += m.grow; m.alpha *= 0.96;
    ctx.save(); ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(160,170,180,${m.alpha})`;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    if (m.alpha < 0.03) bombVisuals.smoke.splice(i, 1);
  }

  // BOLTS (centrum → randen)
  if (t >= BOMB_VFX.BOLT_START && t <= BOMB_VFX.BOLT_END) {
    const count = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const edge = Math.floor(Math.random() * 4);
      let tx, ty;
      if (edge === 0) { tx = Math.random() * W; ty = -20; }
      else if (edge === 1) { tx = W + 20; ty = Math.random() * H; }
      else if (edge === 2) { tx = Math.random() * W; ty = H + 20; }
      else { tx = -20; ty = Math.random() * H; }
      drawBolt(ctx, cx, cy, tx, ty, {
        depth: 4, roughness: 16, forks: 2, forkChance: 0.5, forkAngle: Math.PI/5, shrink: 0.65
      });
    }
  }

  // Einde → start regen
  if (t >= BOMB_VFX.END) {
    const cb = bombVisuals.afterCb;
    bombVisuals.done = true;
    bombVisuals.afterCb = null;
    if (cb) cb();
  }
}






function spawnExtraBall(originBall) {
  // Huidige bal krijgt een lichte afwijking
  originBall.dx = -1;
  originBall.dy = -6;

  // Tweede bal gaat recht omhoog met vaste snelheid
  balls.push({
    x: originBall.x,
    y: originBall.y,
    dx: 0,
    dy: -6,
    radius: ballRadius,
    isMain: false
  });
}

function spawnPxpBag(x, y) {
  pxpBags.push({
    x: x,
    y: y,
    dy: 2,
    caught: false
  });
}

function isPaddleBlockedVertically(newY) {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brick = bricks[c][r];
      if (!brick || brick.status !== 1) continue;

      const brickLeft = brick.x;
      const brickRight = brick.x + brickWidth;
      const brickTop = brick.y;
      const brickBottom = brick.y + brickHeight;

      const paddleLeft = paddleX;
      const paddleRight = paddleX + paddleWidth;
      const paddleTop = newY;
      const paddleBottom = newY + paddleHeight;

      if (
        paddleRight > brickLeft &&
        paddleLeft < brickRight &&
        paddleBottom > brickTop &&
        paddleTop < brickBottom
      ) {
        return true; // botsing
      }
    }
  }
  return false;
}


function isPaddleBlockedHorizontally(newX) {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brick = bricks[c][r];
      if (!brick || brick.status !== 1) continue;

      const brickLeft = brick.x;
      const brickRight = brick.x + brickWidth;
      const brickTop = brick.y;
      const brickBottom = brick.y + brickHeight;

      const paddleLeft = newX;
      const paddleRight = newX + paddleWidth;
      const paddleTop = paddleY;
      const paddleBottom = paddleY + paddleHeight;

      if (
        paddleRight > brickLeft &&
        paddleLeft < brickRight &&
        paddleBottom > brickTop &&
        paddleTop < brickBottom
      ) {
        return true; // botsing
      }
    }
  }
  return false;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawElectricBursts(); // 🔄 VOORAF tekenen, zodat het ONDER alles ligt

  collisionDetection();
  drawCoins();
  drawFallingHearts();
  drawFallingStones();  
  drawHeartCelebration();

  checkCoinCollision();
  drawPaddleFlags();
  drawFlyingCoins();
  checkFlyingCoinHits();
  drawPointPopups();


// A) Time-out check heel vroeg in draw()
if (magnetActive && performance.now() >= magnetEndTime) {
  stopMagnet();
}

// B) Toepassen op arrays (na physics update van items, vóór render)
applyMagnetToArray(fallingHearts);
applyMagnetToArray(coins);     // muntjes worden al aangestuurd via 'coins'
applyMagnetToArray(pxpBags);   // zakjes vallen in 'pxpBags'
applyMagnetToArray(fallingDrops);


if (paddleSizeEffect && Date.now() > paddleSizeEffect.end) {
  stopPaddleSizeEffect();
}

  if (doublePointsActive && Date.now() - doublePointsStartTime > doublePointsDuration) {
    doublePointsActive = false;
  }

  balls.forEach((ball, index) => {
    if (ballLaunched) {
      let speedMultiplier = (speedBoostActive && Date.now() - speedBoostStart < speedBoostDuration)
        ? speedBoostMultiplier : 1;
      ball.x += ball.dx * speedMultiplier;
      ball.y += ball.dy * speedMultiplier;
    } else {
       ball.x = paddleX + paddleWidth / 2 - ballRadius;
       ball.y = paddleY - ballRadius * 2;

    }
    
    if (!ball.trail) ball.trail = [];

    let last = ball.trail[ball.trail.length - 1] || { x: ball.x, y: ball.y };
    let steps = 3; // hoe meer hoe vloeiender
    for (let i = 1; i <= steps; i++) {
    let px = last.x + (ball.x - last.x) * (i / steps);
    let py = last.y + (ball.y - last.y) * (i / steps);
    ball.trail.push({ x: px, y: py });
  }

    while (ball.trail.length > 20) {
    ball.trail.shift();
 }


    // Veiliger links/rechts
    if (ball.x <= ball.radius + 1 && ball.dx < 0) {
      ball.x = ball.radius + 1;
      ball.dx *= -1;
      wallSound.currentTime = 0;
      wallSound.play();
    }
    if (ball.x >= canvas.width - ball.radius - 1 && ball.dx > 0) {
      ball.x = canvas.width - ball.radius - 1;
      ball.dx *= -1;
      wallSound.currentTime = 0;
      wallSound.play();
    }

    // Veiliger bovenkant
    if (ball.y <= ball.radius + 1 && ball.dy < 0) {
      ball.y = ball.radius + 1;
      ball.dy *= -1;
      wallSound.currentTime = 0;
      wallSound.play();
    }
// 1) Eerst broad-phase met bal-middelpunt
const { cx, cy } = getBallCenter(ball);

if (
  cy + ball.radius > paddleY &&
  cy - ball.radius < paddleY + paddleHeight &&
  cx + ball.radius > paddleX &&
  cx - ball.radius < paddleX + paddleWidth
) {
  // 2) Pixel-precies check op paddleCanvas alpha
  //    We testen een klein verticaal kolommetje rond de raaklijn,
  //    zodat de bal niet per ongeluk door mag als een gat nét naast het midden zit.
  const localX = Math.round(cx - paddleX);                 // in paddleCanvas-coördinaten
  const sampleHalf = Math.max(1, Math.floor(ball.radius)); // aantal pixels boven/onder om te testen
  let opaqueHit = false;

 const edgeMargin = 2;
 const px = Math.max(edgeMargin, Math.min(paddleWidth - 1 - edgeMargin, localX));


  for (let dy = -sampleHalf; dy <= sampleHalf; dy++) {
    const localY = Math.max(0, Math.min(paddleHeight - 1, Math.round((cy - paddleY) + dy)));
    const a = paddleCtx.getImageData(px, localY, 1, 1).data[3]; // alpha kanaal
    if (a > 10) { // >10 om randen/transparantie te ontzien
      opaqueHit = true;
      break;
    }
  }

  if (opaqueHit) {
    // 3) Reflectie zoals je al had, maar gebruik middelpunt
    const hitPos = (cx - paddleX) / paddleWidth; // 0..1
    const angle  = (hitPos - 0.5) * Math.PI / 2;
    const speed  = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);

    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));

    // Zet de bal net boven de paddle met linkerboven-positie
    ball.y = paddleY - (ball.radius * 2) - 1;

    wallSound.currentTime = 0;
    wallSound.play();
  } else {
    // 4) Pure "gat": géén reflectie → bal valt erdoorheen
    // (niets doen hier; de standaard logica laat ‘m door)
  }
}




    if (ball.y + ball.dy > canvas.height) {
      balls.splice(index, 1); // verwijder bal zonder actie
    }
// ✨ Gouden smalle energie-staart (taps en iets smaller dan bal)
// ✨ Rechte gouden energie-staart — iets groter dan de bal en 2x zo lang
if (ball.trail.length >= 2) {
  const head = ball.trail[ball.trail.length - 1]; // meest recente positie
  const tail = ball.trail[0]; // oudste positie (ver weg van bal)

  ctx.save();

  const gradient = ctx.createLinearGradient(
    head.x + ball.radius, head.y + ball.radius,
    tail.x + ball.radius, tail.y + ball.radius
  );

  ctx.lineWidth = ball.radius * 2.0; // iets kleiner dan 2.2
  gradient.addColorStop(0, "rgba(255, 215, 0, 0.6)");
  gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

  ctx.beginPath();
  ctx.moveTo(head.x + ball.radius, head.y + ball.radius);
  ctx.lineTo(tail.x + ball.radius, tail.y + ball.radius);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = ball.radius * 2.2; // net iets groter dan de bal
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

    ctx.drawImage(ballImg, ball.x, ball.y, ball.radius * 2, ball.radius * 2);
  });


  if (resetOverlayActive) {
    if (Date.now() % 1000 < 500) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  // 🔴 Korte hit-flash bij steen op paddle
if (stoneHitOverlayTimer > 0) {
  ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  stoneHitOverlayTimer--;
}


  // ✅ Na de loop: check of alle ballen weg zijn
  if (balls.length === 0 && !paddleExploding) {
    triggerPaddleExplosion(); // pas nu verlies van leven
  }

drawBricks();
updateTNTs();


  
if (leftPressed) {
  const newX = paddleX - paddleSpeed;
  if (newX > 0 && !isPaddleBlockedHorizontally(newX)) {
    paddleX = newX;
  }
}

if (rightPressed) {
  const newX = paddleX + paddleSpeed;
  if (newX + paddleWidth < canvas.width && !isPaddleBlockedHorizontally(newX)) {
    paddleX = newX;
  }
}

// 🔁 Alleen omhoogbeweging beperken tot na afschieten
if (upPressed) {
  const newY = paddleY - paddleSpeed;

  if (paddleFreeMove) {
    if (newY > 0 && !isPaddleBlockedVertically(newY)) {
      paddleY = newY;
    }
  }
}

if (downPressed) {
  const newY = paddleY + paddleSpeed;
  if (newY + paddleHeight < canvas.height && !isPaddleBlockedVertically(newY)) {
    paddleY = newY;
  }
}


  drawPaddle();
  drawMagnetAura(ctx);
  drawMagnetHUD(ctx);
  updateAndDrawDrops();
  updateAndDrawBombRain();

  if (rocketActive && !rocketFired && rocketAmmo > 0) {
    rocketX = paddleX + paddleWidth / 2 - 12;
    rocketY = paddleY - 48; // ✅ boven de paddle, waar die zich ook bevindt
    ctx.drawImage(rocketImg, rocketX, rocketY, 30, 65);
  }

  if (rocketFired) {
    rocketY -= rocketSpeed;

    smokeParticles.push({
      x: rocketX + 15,
      y: rocketY + 65,
      radius: Math.random() * 6 + 4,
      alpha: 1
    });

    if (rocketY < -48) {
      rocketFired = false;
      if (rocketAmmo <= 0) {
        rocketActive = false;
      }
    } else {
      ctx.drawImage(rocketImg, rocketX, rocketY, 30, 65);
      checkRocketCollision();
    }
  } // ✅ DIT is de juiste afsluitende accolade voor rocketFired-block

  // 🔁 Start level 2 zodra alle blokjes weg zijn
  if (bricks.every(col => col.every(b => b.status === 0)) && !levelTransitionActive) {
    startLevelTransition();
  }

 // Explosies tekenen
explosions.forEach(e => {
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
  ctx.fillStyle = e.color === "white"
    ? `rgba(255, 255, 255, ${e.alpha})`
    : `rgba(255, 165, 0, ${e.alpha})`;
  ctx.fill();
  e.radius += 2;
  e.alpha -= 0.05;
});
explosions = explosions.filter(e => e.alpha > 0);

  // Rook tekenen
  smokeParticles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 150, 150, ${p.alpha})`;
    ctx.fill();
    p.y += 1;
    p.radius += 0.3;
    p.alpha -= 0.02;
  });
  smokeParticles = smokeParticles.filter(p => p.alpha > 0);

  if (speedBoostActive && Date.now() - speedBoostStart >= speedBoostDuration) {
    speedBoostActive = false;
  }

  // Zakjes tekenen en vangen
for (let i = pxpBags.length - 1; i >= 0; i--) {
  let bag = pxpBags[i];
  bag.y += bag.dy;

  ctx.drawImage(pxpBagImg, bag.x - 20, bag.y, 40, 40);

  // Bounding box van zakje
  const bagLeft = bag.x - 20;
  const bagRight = bag.x + 20;
  const bagTop = bag.y;
  const bagBottom = bag.y + 40;

  // Bounding box van paddle (gebruik huidige Y!)
  const paddleLeft = paddleX;
  const paddleRight = paddleX + paddleWidth;
  const paddleTop = paddleY;
  const paddleBottom = paddleY + paddleHeight;

  // Controleer volledige overlapping
  const isOverlap =
    bagRight >= paddleLeft &&
    bagLeft <= paddleRight &&
    bagBottom >= paddleTop &&
    bagTop <= paddleBottom;

  if (isOverlap) {
    pxpBagSound.currentTime = 0;
    pxpBagSound.play();

    const earned = doublePointsActive ? 160 : 80;
    score += earned;
    updateScoreDisplay(); // 👈 aangepaste regel

    pointPopups.push({
      x: bag.x,
      y: bag.y,
      value: "+" + earned,
      alpha: 1
    });

    pxpBags.splice(i, 1);
  } else if (bag.y > canvas.height) {
    pxpBags.splice(i, 1); // uit beeld
  }
}

if (machineGunActive && !machineGunCooldownActive) {
  // 📍 Instelbare offset tussen paddle en gun
  const verticalOffset = machineGunYOffset;
  const minY = 0;                  // bovenste limiet
  const maxY = paddleY - 10;       // optioneel: niet te dicht bij paddle

  // Targetposities voor X en Y
  const targetX = paddleX + paddleWidth / 2 - 30;
  let targetY = paddleY - verticalOffset;
  targetY = Math.max(minY, targetY);
  targetY = Math.min(targetY, maxY);

  const followSpeed = machineGunDifficulty === 1 ? 1 : machineGunDifficulty === 2 ? 2 : 3;

  // 🟢 Volg paddle horizontaal
  if (machineGunGunX < targetX) machineGunGunX += followSpeed;
  else if (machineGunGunX > targetX) machineGunGunX -= followSpeed;

  // 🟢 Volg paddle verticaal
  if (machineGunGunY < targetY) machineGunGunY += followSpeed;
  else if (machineGunGunY > targetY) machineGunGunY -= followSpeed;

  // 🔫 Teken geweer
  ctx.drawImage(machinegunGunImg, machineGunGunX, machineGunGunY, 60, 60);

  // 🔥 Vuur kogels
  if (Date.now() - machineGunLastShot > machineGunBulletInterval && machineGunShotsFired < 30) {
    machineGunBullets.push({
      x: machineGunGunX + 30,
      y: machineGunGunY + 60,
      dy: 6
    });
    machineGunShotsFired++;
    machineGunLastShot = Date.now();
    shootSound.currentTime = 0;
    shootSound.play();
  }

// 💥 Verwerk kogels
for (let i = machineGunBullets.length - 1; i >= 0; i--) {
  const bullet = machineGunBullets[i];

  // pos update (val terug op vy als dy niet bestaat)
  const dy = (typeof bullet.dy === "number") ? bullet.dy : (bullet.vy ?? 0);
  bullet.y += dy;

  // teken kogel
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();

  // 🎯 Check botsing met paddle
  if (
    bullet.y >= paddleY &&
    bullet.x >= paddleX &&
    bullet.x <= paddleX + paddleWidth
  ) {
    if (invincibleActive) {
      // 🛡️ tijdens sterren-bonus: geen schade — kogel weg (of reflecteer)
      // Reflect-optie (i.p.v. verwijderen):
      // bullet.vy = -Math.abs(dy || 6); continue;
      machineGunBullets.splice(i, 1);
      continue;
    }

    const hitX = bullet.x - paddleX;
    const radius = 6;

    if (!paddleDamageZones.some(x => Math.abs(x - bullet.x) < paddleWidth / 10)) {
      paddleDamageZones.push(bullet.x);

      // ❗ GAT MAKEN
      paddleCtx.globalCompositeOperation = 'destination-out';
      paddleCtx.beginPath();
      paddleCtx.arc(hitX, paddleHeight / 2, radius, 0, Math.PI * 2);
      paddleCtx.fill();
      paddleCtx.globalCompositeOperation = 'source-over';
    }

    machineGunBullets.splice(i, 1);
    continue;
  }

  // buiten beeld? weg ermee
  if (bullet.y > canvas.height) {
    machineGunBullets.splice(i, 1);
    continue;
  }
}


  // ⏳ Start cooldown als alle 30 kogels zijn afgevuurd
  if (machineGunShotsFired >= 30 && machineGunBullets.length === 0 && !machineGunCooldownActive) {
    machineGunCooldownActive = true;
    machineGunStartTime = Date.now();
  }
}

if (machineGunCooldownActive && Date.now() - machineGunStartTime > machineGunCooldownTime) {
  machineGunCooldownActive = false;
  machineGunActive = false;
  paddleDamageZones = [];

  // ✅ +500 punten en UI direct bijwerken
  score += 500;
  if (typeof updateScoreDisplay === 'function') updateScoreDisplay();

  pointPopups.push({
    x: paddleX + paddleWidth / 2,
    y: canvas.height - 30,
    value: "+500",
    alpha: 1
  });

  resetPaddle(true, true); // ✅ geen ball reset, geen centrering
}

// 💀 Paddle “vernietigd” tijdens machinegun? → stop kogels, laat 30s-timer/cooldown doorlopen
if ((machineGunActive || machineGunCooldownActive) && paddleDamageZones.length >= 10) {
  machineGunBullets = []; // stop vuren
}



// ✨ Levelbanner + fade-out
if (levelMessageVisible) {
  ctx.save();
  ctx.globalAlpha = levelMessageAlpha;
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    levelMessageText || `Bitty Bitcoin Mascot — Level ${level}`,
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.restore();

  // ⏱️ 3s volledig zichtbaar, daarna ~2s fade-out
  levelMessageTimer++;

  const visibleTime = 180; // 3s @ 60 FPS
  const fadeTime    = 120; // ~2s fade

  if (levelMessageTimer <= visibleTime) {
    levelMessageAlpha = 1;
  } else {
    const fadeProgress = (levelMessageTimer - visibleTime) / fadeTime;
    levelMessageAlpha = Math.max(0, 1 - fadeProgress);
  }

  if (levelMessageTimer >= visibleTime + fadeTime) {
    levelMessageVisible = false;
  }
}

// 🎬 Overgangstimer & animatie
if (levelTransitionActive) {
  if (transitionOffsetY < 0) {
    transitionOffsetY += 2;
  } else {
    transitionOffsetY = 0;
    levelTransitionActive = false;
  }
}

// 🛡️ Check of STAR-bonus afgelopen is
if (invincibleActive && performance.now() >= invincibleEndTime) {
  invincibleActive = false;
  stopStarAura(false);   // fade-out
}

// ✅ ZOLANG de ster actief is, moet het geluid gewoon aanstaan
if (invincibleActive) {
  try {
    if (starAuraSound.paused) {
      starAuraSound.currentTime = 0;
      starAuraSound.play();
    }
  } catch (e) {}
}

// 🔒 Fail-safe: als er om welke reden dan ook géén shield is, mag de aura-sound niet spelen
if (!invincibleActive && !starAuraSound.paused) {
  stopStarAura(false);   // fade-out (of true voor instant)
}


// 🎆 Fireworks (raketten + vonken)
drawFireworks();

// 🎊 Confetti bovenop de scene tekenen
drawConfetti();
renderStarPowerFX(); // 🌟 full-screen star celebration overlay

if (showGameOver) {
  ctx.save();
  ctx.globalAlpha = gameOverAlpha;
  ctx.fillStyle = "#B0B0B0";
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  ctx.restore();

  if (gameOverTimer < 60) {
    gameOverAlpha += 0.05; // fade-in
  } else if (gameOverTimer >= 60 && gameOverTimer < 120) {
    gameOverAlpha -= 0.05; // fade-out
  }

  gameOverTimer++;

  if (gameOverTimer >= 120) {
    showGameOver = false;
  }

  // 🛑 Extra safety: stop aura-geluid bij game over of hard reset
  try { fadeOutAndStop(starAuraSound, 200); } catch (e) {}
}



  // 🎇 Paddle-explosie tekenen
  if (paddleExploding) {
    paddleExplosionParticles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 100, 0, ${p.alpha})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      p.alpha -= 0.02;
    });

    paddleExplosionParticles = paddleExplosionParticles.filter(p => p.alpha > 0);
  }
  
  if (resetOverlayActive) {
  if (Date.now() % 1000 < 500) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

  // 🧱 Steenpuin tekenen
  stoneDebris.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(140, 120, 100, ${p.alpha})`;
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;
  });

  stoneDebris = stoneDebris.filter(p => p.alpha > 0);

  renderBittyBombIntro();
  updateAndDrawBombVisuals(ctx);



  animationFrameId = requestAnimationFrame(draw);
} // ✅ Sluit function draw() correct af

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === 33) {
    // Normale spelstart
    level = 1;                // start op level 1
    score = 0;
    lives = 3;

    updateLivesDisplay?.(); 
    resetBricks();
    resetPaddle?.();
    resetBall();              // bal met juiste startsnelheid (via LEVELS params)
    updateScoreDisplay?.();

    // Timer pas starten wanneer jij de bal afschiet—blijft zoals je nu hebt
    draw();                   // start render-loop
  }
}

// 🎙️ Init Bitty-voice-line bij eerste spelstart
  if (typeof window.rockWarnState === "undefined") {
    window.rockWarnState = {
      played: false,
      hits: 0,
      triggerIndex: Math.random() < 0.5 ? 1 : 3,
      audio: (() => {
        try {
          const a = new Audio("bitty_watch_out.mp3"); // jouw mp3-bestand
          a.volume = 0.85;
          return a;
        } catch (e) { return null; }
      })()
    };
  }


blockImg.onload = onImageLoad;
ballImg.onload = onImageLoad;
powerBlockImg.onload = onImageLoad;
powerBlock2Img.onload = onImageLoad;
rocketImg.onload = onImageLoad;
doubleBallImg.onload = onImageLoad;
doublePointsImg.onload = onImageLoad;
vlagImgLeft.onload = onImageLoad;
vlagImgRight.onload = onImageLoad;
shootCoinImg.onload = onImageLoad;
speedImg.onload = onImageLoad;
pointpayPaddleImg.onload = onImageLoad;
stone1Img.onload = onImageLoad;
stone2Img.onload = onImageLoad;
pxpBagImg.onload = onImageLoad;
dollarPxpImg.onload = onImageLoad;
machinegunBlockImg.onload = onImageLoad;
machinegunGunImg.onload = onImageLoad;
coinImg.onload = onImageLoad;
heartImg.onload = onImageLoad; 
silver1Img.onload = onImageLoad;
silver2Img.onload = onImageLoad;
paddleLongBlockImg.onload = onImageLoad;
paddleSmallBlockImg.onload = onImageLoad;
magnetImg.onload = onImageLoad;
stoneBlockImg.onload  = onImageLoad;
stoneLargeImg.onload  = onImageLoad;
tntImg.onload = onImageLoad;
tntBlinkImg.onload = onImageLoad;
starImg.onload = onImageLoad;
bombTokenImg.onload = onImageLoad;
badCrossImg.onload = onImageLoad;
heartLevelupImg.onload = onImageLoad;

// 🧠 Tot slot: als je een aparte loader-functie hebt, roep die één keer aan
if (typeof loadStonefallImages === "function") {
  loadStonefallImages();
}


document.addEventListener("mousedown", function (e) {
  // 🛡️ Alleen reageren als er op het canvas geklikt wordt
  if (e.target.tagName !== "CANVAS") return;

  // 🔫 Raket afvuren
  if (rocketActive && rocketAmmo > 0 && !rocketFired) {
    rocketFired = true;
    rocketAmmo--;
    rocketLaunchSound.currentTime = 0;
    rocketLaunchSound.play();
  }

  // 🎯 Bal afschieten met muisklik (trackpad)
  if (!ballLaunched && !ballMoving) {
    ballLaunched = true;
    ballMoving = true;
    paddleFreeMove = true; // ✅ Na eerste schot mag paddle omhoog bewegen

    shootSound.currentTime = 0;
    shootSound.play();

    balls[0].dx = 0;
    balls[0].dy = -6;

    if (!timerRunning) startTimer(); // ✅ Start timer bij eerste schot
  }
});


function startTimer() {
  if (timerRunning) return; // ✅ voorkomt dubbele timers
  timerRunning = true;
  timerInterval = setInterval(() => {
    elapsedTime++;
    const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const seconds = String(elapsedTime % 60).padStart(2, '0');
    document.getElementById("timeDisplay").textContent = minutes + ":" + seconds;

  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  elapsedTime = 0;
  document.getElementById("timeDisplay").textContent = "00:00";

}
function pauseTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function spawnStoneDebris(x, y) {
  for (let i = 0; i < 8; i++) {
    stoneDebris.push({
      x: x,
      y: y,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      radius: Math.random() * 2 + 1,
      alpha: 1
    });
  }
}

function triggerPaddleExplosion() {
  // 🛡️ STAR-bonus actief: geen life loss, geen pauze, alleen bal terug op paddle
  if (invincibleActive) {
    resetBall?.();   // centreer/park de bal op de paddle (jouw bestaande functie)
    return;
  }

  if (lives > 1) {
    if (!resetTriggered) {
      lives--;
      updateLivesDisplay?.();
      // 💖 Hartjes blijven behouden – reset alleen bij game over
    }

    pauseTimer();

    paddleExploding = true;
    paddleExplosionParticles = [];

    machineGunActive = false;
    machineGunCooldownActive = false;
    

    for (let i = 0; i < 50; i++) {
      paddleExplosionParticles.push({
        x: paddleX + paddleWidth / 2,
        y: canvas.height - paddleHeight / 2,
        dx: (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * 10,
        radius: Math.random() * 4 + 2,
        alpha: 1
      });
    }

    paddleExplodeSound.currentTime = 0;
    paddleExplodeSound.play();

    // 🧲 Magnet stoppen bij leven-verlies
    stopMagnet();

    setTimeout(() => {
      paddleExploding = false;
      paddleExplosionParticles = [];

      balls = [{
        x: paddleX + paddleWidth / 2 - ballRadius,
        y: paddleY - ballRadius * 2,
        dx: 0,
        dy: -6,
        radius: ballRadius,
        isMain: true
      }];

      ballLaunched = false;
      ballMoving = false;
      paddleFreeMove = false; // ⛓️ paddle weer vergrendeld

      resetTriggered = false;
      resetPaddle();
    }, 1000);

  } else {
    // Laatste leven → GAME OVER
    paddleExploding = true;

    machineGunActive = false;
    machineGunCooldownActive = false;

    // 🔇 TNT direct stilzetten bij GAME OVER
    try { if (typeof tntBeepSound !== "undefined" && tntBeepSound) { tntBeepSound.pause(); tntBeepSound.currentTime = 0; } } catch {}
    try { if (typeof tntExplodeSound !== "undefined" && tntExplodeSound?.pause) { tntExplodeSound.pause(); tntExplodeSound.currentTime = 0; } } catch {}
    if (typeof bricks !== "undefined" && typeof brickColumnCount !== "undefined" && typeof brickRowCount !== "undefined") {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks?.[c]?.[r];
          if (b && b.type === "tnt") {
            b.tntArmed = false;
            b.tntStart = 0;
            b.tntBeepNext = 0;
            if ("tntCountdown" in b) b.tntCountdown = 0;
          }
        }
      }
    }

    gameOverSound.currentTime = 0;
    gameOverSound.play();

    paddleExplosionParticles = [];

    for (let i = 0; i < 50; i++) {
      paddleExplosionParticles.push({
        x: paddleX + paddleWidth / 2,
        y: canvas.height - paddleHeight / 2,
        dx: (Math.random() - 0.5) * 10,
        dy: (Math.random() - 0.5) * 10,
        radius: Math.random() * 4 + 2,
        alpha: 1
      });
    }
    paddleExplodeSound.currentTime = 0;
    paddleExplodeSound.play();

    setTimeout(() => {
      saveHighscore();
      stopTimer();

      lives = 3;
      updateLivesDisplay();

      // 💖⭐💣❌ alle bonus-meters resetten bij Game Over
      heartsCollected = 0;
      starsCollected = 0;
      bombsCollected = 0;
      badCrossesCaught = 0;

      // als het oude element nog bestaat, leegzetten (kan straks weg)
      const hc = document.getElementById("heartCount");
      if (hc) hc.textContent = heartsCollected;

      // display meteen mee laten gaan
      if (typeof updateBonusPowerPanel === "function") {
        updateBonusPowerPanel(
          starsCollected,
          bombsCollected,
          badCrossesCaught,
          heartsCollected
        );
      }

      score = 0;
      level = 1;
      elapsedTime = 0;

      paddleExploding = false;
      paddleExplosionParticles = [];

      // 🧲 Magnet stoppen bij Game Over
      stopMagnet();

      // ⏩ Alle tijdelijke effecten/arrays resetten
      speedBoostActive = false;
      speedBoostStart = 0;
      doublePointsActive = false;
      doublePointsStartTime = 0;
      flagsOnPaddle = false;
      rocketActive = false;
      rocketFired = false;
      rocketAmmo = 0;
      flyingCoins = [];
      smokeParticles = [];
      explosions = [];
      coins = [];
      pxpBags = [];
      showGameOver = true;
      gameOverAlpha = 0;
      gameOverTimer = 0;

      paddleFreeMove = false; // ⛓️ paddle opnieuw vergrendeld

      resetBricks();
      resetBall();
      resetPaddle();

      updateScoreDisplay();
      document.getElementById("timeDisplay").textContent = "00:00";

      // 🎙️ Reset Bitty-waarschuwing voor nieuwe game (1× per game, random op 1e/3e hit)
      if (window.rockWarnState) {
        window.rockWarnState.played = false;
        window.rockWarnState.hits = 0;
        window.rockWarnState.triggerIndex = Math.random() < 0.5 ? 1 : 3;
      }

      resetTriggered = false;
    }, 1000);
  }
}


function startLevelTransition() {
  // ✅ Wincheck vóór level++ (we zitten aan het einde van het laatste level)
  if (level >= TOTAL_LEVELS) {
    // 🚩 WIN: zelfde reset-flow als game over, maar "You Win"
    saveHighscore();
    pauseTimer?.();

    // Korte win-overlay (optioneel; laat staan als je explosions gebruikt)
    explosions?.push({ x: canvas.width / 2, y: canvas.height / 2, radius: 10, alpha: 1, color: "white" });

    // Reset naar beginstaat
    lives = 3;
    updateLivesDisplay?.();
    heartsCollected = 0;
    const heartCountEl = document.getElementById("heartCount");
    if (heartCountEl) heartCountEl.textContent = heartsCollected;

    score = 0;
    level = 1;
    elapsedTime = 0;

    // Flags/bonussen terug naar neutraal
    paddleExploding = false;
    paddleExplosionParticles = [];
    speedBoostActive = false;
    doublePointsActive = false;
    flagsOnPaddle = false;
    rocketActive = false;
    rocketFired = false;
    rocketAmmo = 0;

    // Diverse arrays leegmaken (alleen als ze bestaan)
    flyingCoins = [];
    smokeParticles = [];
    explosions = [];
    coins = [];
    pxpBags = [];

    paddleFreeMove = false;

    resetBricks();
    resetBall();
    resetPaddle?.();
    updateScoreDisplay?.();

    const timeEl = document.getElementById("timeDisplay");
    if (timeEl) timeEl.textContent = "00:00";

    // 🔔 Terug op Level 1: klein momentje (geen vuurwerk, geen raketten)
    triggerLevelCelebration(level, { skipFireworks: true, confettiCount: 120, rockets: 0 });

    return;
  }

  // 👇 Volgend level
  level++;

  // Alle tijdelijke bonussen/cooldowns resetten als je daar een helper voor hebt
  if (typeof resetAllBonuses === "function") {
  // als de ster nog bezig was op het moment van overgang, niet uitzetten
  resetAllBonuses({ keepStar: invincibleActive });
}

  // Bricks voor het nieuwe level klaarzetten
  resetBricks();

  // Bal herstarten met level-afhankelijke snelheid
  resetBall();

  // (Optioneel) Paddle centreren en UI bijwerken, alleen als je die helpers hebt:
  resetPaddle?.();
  updateScoreDisplay?.();

  // 🔔 Vier het nieuwe level met banner + confetti + raketten (+ je bestaande bursts)
  //    Raket-aantal schaalt lichtjes mee met het level.
  const rockets = Math.min(14, 6 + Math.floor(level / 2));
  triggerLevelCelebration(level, { rockets, confettiCount: 160 });
}

function updateLivesDisplay() {
  const display = document.getElementById("livesDisplay");
  if (!display) return;

  display.innerHTML = "";

  for (let i = 0; i < lives; i++) {
    const img = document.createElement("img");
    img.src = "level.png";
    img.style.width = "28px";
    img.style.height = "28px";
    display.appendChild(img);
  }
}

function drawElectricBursts() {
  for (let i = electricBursts.length - 1; i >= 0; i--) {
    const e = electricBursts[i];
    const pts = e.points;
    if (!pts || pts.length < 2) continue;

    // Flikker-effect per straal (zoals stroboscoop)
    const flicker = 0.7 + Math.sin(Date.now() * e.flickerSpeed + e.flickerPhase * 1000) * 0.3;

    ctx.strokeStyle = e.color.replace("ALPHA", (e.alpha * flicker).toFixed(2));
    ctx.lineWidth = e.width * flicker;

    // Glow instellen
    ctx.shadowBlur = 10;
    ctx.shadowColor = e.color.replace("ALPHA", "0.4");

    // Hoofdstraal tekenen
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let p = 1; p < pts.length; p++) {
      ctx.lineTo(pts[p].x, pts[p].y);
    }
    ctx.stroke();

    // Vertakkingen tekenen (indien aanwezig)
    if (e.forks) {
      e.forks.forEach(fork => {
        ctx.beginPath();
        ctx.moveTo(pts[Math.floor(pts.length / 2)].x, pts[Math.floor(pts.length / 2)].y);
        fork.forEach(fp => {
          ctx.lineTo(fp.x, fp.y);
        });
        ctx.stroke();
      });
    }

    // Glow uitschakelen voor volgende canvas-elementen
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";

    // Langzaam vervagen
    e.alpha -= 0.03;
    if (e.alpha <= 0) {
      electricBursts.splice(i, 1);
    }
  }
}



function getRandomElectricColor() {
  const colors = [
    "rgba(255, 255, 255, ALPHA)", // wit
    "rgba(0, 200, 255, ALPHA)",   // neon blauw
    "rgba(255, 50, 50, ALPHA)",   // roodachtig
    "rgba(255, 255, 100, ALPHA)"  // geelachtig
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}


function triggerSilverExplosion(x, y) {
  // Zilveren steensplinters vanuit middelpunt
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;

    stoneDebris.push({
      x: x,
      y: y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      radius: Math.random() * 3 + 2,
      alpha: 1,
      type: "silver"
    });
  }

  // 🎧 Dondergeluid direct bij start van de explosie
 const sound = thunderSounds[Math.floor(Math.random() * thunderSounds.length)];
 sound.currentTime = 0;
 sound.volume = 0.8;
 sound.play();


  // Witte flitsen + elektriciteit over canvas
  for (let i = 0; i < 15; i++) {
    const burstX = Math.random() * canvas.width;
    const burstY = Math.random() * canvas.height;

    // Witte flits
    explosions.push({
      x: burstX,
      y: burstY,
      radius: Math.random() * 30 + 10,
      alpha: 1,
      color: "white"
    });

    // 6 stralen per flits
    for (let j = 0; j < 6; j++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 40 + Math.random() * 60;
      const segments = 5 + Math.floor(Math.random() * 5);
      const color = getRandomElectricColor();
      const flickerSpeed = 0.02 + Math.random() * 0.05;

      let points = [];
      let prevX = burstX;
      let prevY = burstY;

      for (let s = 0; s < segments; s++) {
        const segLen = length / segments;
        const deviation = (Math.random() - 0.5) * 20;
        const nextX = prevX + Math.cos(angle) * segLen + Math.cos(angle + Math.PI / 2) * deviation;
        const nextY = prevY + Math.sin(angle) * segLen + Math.sin(angle + Math.PI / 2) * deviation;

        points.push({ x: nextX, y: nextY });
        prevX = nextX;
        prevY = nextY;
      }

      // Optionele zijtak (fork)
      let forks = [];
      if (Math.random() < 0.5) {
        const forkStart = points[Math.floor(points.length / 2)];
        const forkAngle = angle + (Math.random() < 0.5 ? -1 : 1) * (Math.PI / 3);
        let forkPoints = [];
        let forkX = forkStart.x;
        let forkY = forkStart.y;
        for (let f = 0; f < 3; f++) {
          const segLen = length / 6;
          const dev = (Math.random() - 0.5) * 20;
          const nx = forkX + Math.cos(forkAngle) * segLen + Math.cos(forkAngle + Math.PI / 2) * dev;
          const ny = forkY + Math.sin(forkAngle) * segLen + Math.sin(forkAngle + Math.PI / 2) * dev;
          forkPoints.push({ x: nx, y: ny });
          forkX = nx;
          forkY = ny;
        }
        forks.push(forkPoints);
      }

      electricBursts.push({
        points: points,
        forks: forks,
        width: 1 + Math.random() * 1.5,
        alpha: 1,
        flickerSpeed: flickerSpeed,
        flickerPhase: Math.random(),
        color: color
      });
    }
  }
}



function triggerBallReset() {
  const btn = document.getElementById("resetBallBtn");
  btn.disabled = true;
  btn.textContent = "RESETTING...";

  resetBallSound.currentTime = 0;
  resetBallSound.play();

  resetOverlayActive = true;

  // 🛡️ Als we maar 1 leven hebben, verhoog tijdelijk het leven naar 2 zodat paddleExplode geen Game Over triggert
  const originalLives = lives;
  if (lives === 1) {
    lives = 2; // tijdelijk "faken"
  }

  resetTriggered = true; // 🟢 flag zodat paddleExplode weet: geen leven aftrekken

  // ⏱️ 6.5 sec: bal weg + explosie
  setTimeout(() => {
    paddleExplodeSound.currentTime = 0;
    paddleExplodeSound.play();

    balls.forEach(ball => {
      for (let i = 0; i < 30; i++) {
        stoneDebris.push({
          x: ball.x + ball.radius,
          y: ball.y + ball.radius,
          dx: (Math.random() - 0.5) * 8,
          dy: (Math.random() - 0.5) * 8,
          radius: Math.random() * 4 + 2,
          alpha: 1
        });
      }
    });

    balls = [];
  }, 6500);

  // ⏱️ 10 sec: bal reset op paddle
  setTimeout(() => {
    balls = [{
      x: paddleX + paddleWidth / 2 - ballRadius,
      y: paddleY - ballRadius * 2,
      dx: 0,
      dy: -6,
      radius: ballRadius,
      isMain: true
    }];
    ballLaunched = false;
    ballMoving = false;
    resetOverlayActive = false;
    btn.disabled = false;
    btn.textContent = "RESET\nBALL";

    // 🧠 Zet leven weer terug als het tijdelijk op 2 stond
    if (originalLives === 1) {
      lives = 1;
    }

    resetTriggered = false; // ❗ flag weer uitzetten
  }, 10000);
}

// 🟢 BELANGRIJK: knop koppelen aan functie
document.getElementById("resetBallBtn").addEventListener("click", triggerBallReset);

