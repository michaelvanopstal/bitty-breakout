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

// 🌟 Levelovergang
let levelTransitionActive = false;
let transitionOffsetY = -300;

// (NIET NOG EENS levelMessageAlpha/Timer/Visible hier – die komen in het confetti-blok)

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


// ❤️ Hartjes-systeem
let heartsCollected = 0;
let heartBlocks = [];
let fallingHearts = [];
let heartPopupTimer = 0;
let heartBoardX = 20;
let heartBoardY = 20;

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
    ballSpeed: 6 + 0.2 * i,                 // start snelheid
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


const tntBeepSound = new Audio("tnt_beep.mp3");
tntBeepSound.volume = 0.7;
const tntExplodeSound = new Audio("tnt_explode.mp3");
tntExplodeSound.volume = 0.9;





const rockWarning = new Audio("bitty_watch_out.mp3"); // jouw MP3-bestand
rockWarning.volume = 0.85;

const customBrickWidth = 70;   // pas aan zoals jij wilt
const customBrickHeight = 25;  // pas aan zoals jij wilt
const brickRowCount = 15;
const brickColumnCount = 9;
const brickWidth = customBrickWidth;
const brickHeight = customBrickHeight;


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

const heartBoardImg = new Image();
heartBoardImg.src = "heart_board.png";

const heartImg = new Image();
heartImg.src = "heart.png"; // zorg dat je dit bestand hebt!


const machinegunBlockImg = new Image();
machinegunBlockImg.src = "machinegun_block.png";

const machinegunGunImg = new Image();
machinegunGunImg.src = "machinegun_gun.png";

const lifeImg = new Image();
lifeImg.src = "level.png";

const dollarPxpImg = new Image();
dollarPxpImg.src = "dollarpxp.png";


const doubleBallImg = new Image();
doubleBallImg.src = "2 balls.png";  // upload dit naar dezelfde map


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



const stoneLargeImg  = new Image(); 
stoneLargeImg.src  = "stone_large.png";

const paddleLongBlockImg = new Image();
paddleLongBlockImg.src = "paddlelong.png";   // jouw upload

const paddleSmallBlockImg = new Image();
paddleSmallBlockImg.src = "paddlesmall.png"; // jouw upload

const magnetImg = new Image();
magnetImg.src = "magnet.png"; // voeg dit plaatje toe aan je project


// 🧨 TNT blok
const tntImg = new Image();      
tntImg.src = "tnt.png";

const tntBlinkImg = new Image(); 
tntBlinkImg.src = "tnt_blink.png";



// Vergeet niet je 'expected' imagesLoaded maximale aantal met +4 te verhogen.





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

    shootSound.currentTime = 0;
    shootSound.play();

    balls[0].dx = 0;
    balls[0].dy = -6;

    if (!timerRunning) startTimer();
  }

  // 🔫 Raket afvuren (alleen met spatie)
  if (e.code === "Space" && rocketActive && rocketAmmo > 0 && !rocketFired) {
    rocketFired = true;
    rocketAmmo--;
    rocketLaunchSound.currentTime = 0;
    rocketLaunchSound.play();
  }

  // 🎯 Schieten met vlaggetjes (alleen met spatie)
  if (flagsOnPaddle && e.code === "Space") {
    shootFromFlags();
  }

  // 🧪 Extra beveiliging bij opnieuw starten na Game Over (alleen met spatie)
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

      updateScoreDisplay();
      document.getElementById("timeDisplay").textContent = "00:00";

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

  // ⬇️ HIER alles per brick resetten
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      b.status = 1;

      // type bepalen uit levelmap
      const defined = currentMap.find(p => p.col === c && p.row === r);
      const brickType = defined ? defined.type : "normal";
      b.type = brickType;

      // type-specifiek resetten
      if (brickType === "stone" || brickType === "silver") {
        b.hits = 0;
        b.hasDroppedBag = false;
      } else {
        delete b.hits;
        delete b.hasDroppedBag;
      }

      // 🧨 TNT goed initialiseren (en opruimen wanneer geen TNT)
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

  assignHeartBlocks();
}


// 🔧 Hulp-functie om 4 hartjes te verdelen
function assignHeartBlocks() {
  heartBlocks = [];

  let normalBricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brick = bricks[c][r];
      if (brick.status === 1 && brick.type === "normal") {
        normalBricks.push(brick);
      }
    }
  }

  for (let i = 0; i < 4 && normalBricks.length > 0; i++) {
    const index = Math.floor(Math.random() * normalBricks.length);
    const brick = normalBricks.splice(index, 1)[0];
    brick.hasHeart = true;
    brick.heartDropped = false;
    heartBlocks.push(brick); // eventueel handig voor later
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

  ctx.drawImage(paddleCanvas, paddleX, paddleY);
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


function resetAllBonuses() {
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

  flagsOnPaddle = false;
  flagTimer = 0;

  rocketActive = false;
  rocketAmmo = 0;
  rocketFired = false;

  machineGunActive = false;
  machineGunCooldownActive = false;
  machineGunBullets = [];
  machineGunShotsFired = 0;
  paddleDamageZones = [];

  doublePointsActive = false;
  doublePointsStartTime = 0;

  speedBoostActive = false;
  speedBoostStart = 0;

  flyingCoins = [];
  smokeParticles = [];
  explosions = [];
  coins = [];
  pxpBags = []; 

  machineGunGunX = 0;
  machineGunGunY = 0;



  if (typeof stopPaddleSizeEffect === "function" && paddleSizeEffect) stopPaddleSizeEffect();

  stopMagnet();

}



function resetBall() {
  balls = [{
    x: paddleX + paddleWidth / 2 - ballRadius,
    y: paddleY - ballRadius * 2,
    dx: 0,
    dy: -(LEVELS[Math.max(0, Math.min(TOTAL_LEVELS - 1, (level - 1)))]?.params?.ballSpeed ?? 6),

    radius: ballRadius,
    isMain: true
  }];
  ballLaunched = false;
  ballMoving = false;

  // 🔒 Paddle weer vergrendeld tot hernieuwde afschot
  paddleFreeMove = false;

  // 🧱 Zorg dat bij level 1 blokken direct zichtbaar zijn
  if (level === 1) {
    levelTransitionActive = false;
    transitionOffsetY = 0;
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
  fallingHearts.forEach((heart, i) => {
    // 🚀 Beweging
    heart.y += heart.dy;

    // 💖 Pulserend formaat
    const size = 24 + Math.sin(heart.pulse) * 2;
    heart.pulse += 0.2;

    // ✨ Teken hartje
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

      // ⬇️ HTML teller updaten
     document.getElementById("heartCount").textContent = heartsCollected;

     coinSound.currentTime = 0;
     coinSound.play();

     // ✅ Beloning bij 10 hartjes
    if (heartsCollected >= 10) {
      heartsCollected = 0;
      lives++;
      updateLivesDisplay();
      heartPopupTimer = 100;

    // Reset HTML teller ook!
    document.getElementById("heartCount").textContent = heartsCollected;
  }
}

    // 💨 Verwijder uit array als buiten beeld of al gepakt
    if (heart.y > canvas.height || heart.collected) {
      fallingHearts.splice(i, 1);
    }
  });
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

   if (s.img && s.img.complete) {
  ctx.drawImage(s.img, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
} else {
  // Fallback ook de grote steen
  ctx.drawImage(stoneLargeImg, s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
}


    // ===== beweging (bewaar vorige Y vóór we s.y updaten) =====
    if (s.prevY == null) s.prevY = s.y;
    s.prevY = s.y;          // vorige frame Y opslaan
    s.y += s.dy;            // val

    // ---- Botsing met paddle (alleen bij écht contact) ----
    if (s.framesInside == null) s.framesInside = 0;

    // Basisradius (ingeschreven cirkel)
    const baseRadius = s.size * 0.42;

    // Categorieën: large houden zoals het nu fijn voelt
    const isLarge = s.size >= 100;

    // Tunables
    const hitboxScale     = isLarge ? 0.90 : 0.82;                    // iets kleinere hitbox voor kleiner
    const minPenetration  = isLarge ? Math.min(12, baseRadius * 0.40)
                                    : Math.min(18, baseRadius * 0.55); // dieper in paddle voor kleiner
    const debounceFrames  = isLarge ? 2 : 3;
    const minHorizOverlap = isLarge ? (baseRadius * 0.30)
                                    : (baseRadius * 0.40);

    const r = baseRadius * hitboxScale;

    // Paddle-bounds
    const paddleLeft = paddleX;
    const paddleTop  = paddleY;
    const paddleW    = paddleWidth;
    const paddleH    = paddleHeight;

    // 1) Cirkel vs rect overlap
    const intersects = circleIntersectsRect(s.x, s.y, r, paddleLeft, paddleTop, paddleW, paddleH);

    // 2) Voldoende verticale diepte in de paddle
    const penetrates = (s.y + r) >= (paddleTop + minPenetration);

    // 3) Alleen neerwaartse hits
    const falling = s.dy > 0;

    // 4) Genoeg horizontale overlap – geen rand-tikjes
    const stoneLeft  = s.x - r;
    const stoneRight = s.x + r;
    const overlapX   = Math.max(0, Math.min(stoneRight, paddleLeft + paddleW) - Math.max(stoneLeft, paddleLeft));
    const wideEnough = overlapX >= minHorizOverlap;

    // Echte hit als aan alle vier voldaan is
    const realHitNow = intersects && penetrates && falling && wideEnough;

    if (realHitNow) {
      s.framesInside++;
    } else {
      s.framesInside = 0;
    }

    // Pas botsing laten tellen na drempel-frames
    if (s.framesInside >= debounceFrames) {
      spawnStoneDebris(s.x, s.y);
      s.active = false;
      stoneHitOverlayTimer = 18;

      // ❗ éénmalige logica per salvo
      if (!stoneHitLock) {
        stoneHitLock = true;

        if (typeof triggerPaddleExplosion === "function") {
          triggerPaddleExplosion();
        }

        // na de loop alle stenen wissen (veilig)
        stoneClearRequested = true;

        // kleine cooldown voordat volgende salvo weer leven kan kosten
        setTimeout(() => { stoneHitLock = false; }, 1200);
      }

      continue;
    }

    // onder uit beeld → vergruizen
    if (s.y - s.size / 2 > canvas.height) {
      spawnStoneDebris(s.x, canvas.height - 10);
      s.active = false;
    }
  }

  // ná de iteratie: in één keer alle stenen wissen (voorkomt loop issues)
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
  // 🎙️ Lazy init van voice line + state (1× per game)
  if (typeof window.rockWarnState === "undefined") {
    window.rockWarnState = {
      played: false,                          // al afgespeeld in deze game?
      hits: 0,                                // aantal *geraakte* stonefall-blokken
      triggerIndex: Math.random() < 0.5 ? 1 : 3,  // 1e of 3e keer
      audio: (() => {
        try {
          const a = new Audio("bitty_watch_out.mp3"); // zet jouw mp3-bestandsnaam/pad
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

          // 💖 Hartje laten vallen
          if (b.hasHeart && !b.heartDropped) {
            fallingHearts.push({
              x: b.x + brickWidth / 2 - 12,
              y: b.y + brickHeight,
              dy: 2,
              collected: false,
              alpha: 1,
              pulse: 0
            });
            b.heartDropped = true;
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
                b.tntArmed   = true;
                b.tntStart   = performance.now();
                b.tntBeepNext = b.tntStart; // als je beeps gebruikt
                try { tntBeepSound.currentTime = 0; tntBeepSound.play(); } catch {}
              }
              return; // ➜ heel belangrijk: voorkom gedeelde cleanup
            }

            case "stonefall": {
              // ✨ Direct bij 1e hit: laat stenen vallen en verwijder het blok
              const midX = b.x + brickWidth / 2;
              const midY = b.y + brickHeight / 2;
              triggerStonefall(midX, midY);

              if (!RWS.played) {
                RWS.hits++;
                if (RWS.hits === RWS.triggerIndex && RWS.audio) {
                  const ok = playVoiceOver(RWS.audio, { cooldown: 3000, skipIfLocked: true });
                  if (ok) RWS.played = true; // alleen markeren als het echt heeft gespeeld
                }
              }

              b.status = 0;                                // blok meteen weg
              const earned = doublePointsActive ? 20 : 10; // zelfde puntentelling als voorheen
              score += earned;
              updateScoreDisplay();

              spawnCoin(b.x, b.y);                         // beloning consistent houden
              b.type = "normal";
              // geen return; → na de switch blijft de gedeelde cleanup lopen,
              // net als voorheen, zodat gedrag/score consistent blijft
              break;
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

          // 🔽 Gedeelde cleanup (voor alle reguliere bonussen)
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
  drawHeartPopup();
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
if (
  ball.y + ball.radius > paddleY &&
  ball.y - ball.radius < paddleY + paddleHeight &&
  ball.x + ball.radius > paddleX &&
  ball.x - ball.radius < paddleX + paddleWidth
) {
  let reflect = true;

  if (machineGunActive || machineGunCooldownActive) {
    const segmentWidth = paddleWidth / 10;
    for (let i = 0; i < 10; i++) {
      const segX = paddleX + i * segmentWidth;
      const isDamaged = paddleDamageZones.some(hitX =>
        hitX >= segX && hitX <= segX + segmentWidth
      );

      const ballCenterX = ball.x;
      if (
        ballCenterX >= segX &&
        ballCenterX < segX + segmentWidth &&
        isDamaged
      ) {
        reflect = false;
        break;
      }
    }
  }

  if (reflect) {
    const hitPos = (ball.x - paddleX) / paddleWidth;
    const angle = (hitPos - 0.5) * Math.PI / 2;
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx = speed * Math.sin(angle);
    ball.dy = -Math.abs(speed * Math.cos(angle));

    wallSound.currentTime = 0;
    wallSound.play();
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
  machineGunBullets.forEach((bullet, i) => {
    bullet.y += bullet.dy;
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
    } else if (bullet.y > canvas.height) {
      machineGunBullets.splice(i, 1);
    }
  });

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
  // NIET levelMessageAlpha forceren en NIET nogmaals levelMessageTimer++
  if (transitionOffsetY < 0) {
    transitionOffsetY += 2;
  } else {
    transitionOffsetY = 0;
    levelTransitionActive = false;
  }
}


// 🎆 Fireworks (raketten + vonken)
drawFireworks();

// 🎊 Confetti bovenop de scene tekenen
drawConfetti();


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

  animationFrameId = requestAnimationFrame(draw);
} // ✅ Sluit function draw() correct af

function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === 30) {
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
heartBoardImg.onload = onImageLoad;
silver1Img.onload = onImageLoad;
silver2Img.onload = onImageLoad;
paddleLongBlockImg.onload = onImageLoad;
paddleSmallBlockImg.onload = onImageLoad;
magnetImg.onload = onImageLoad;
stoneBlockImg.onload  = onImageLoad;
stoneLargeImg.onload  = onImageLoad;
tntImg.onload = onImageLoad;
tntBlinkImg.onload = onImageLoad;


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
  if (lives > 1) {
    if (!resetTriggered) {
      lives--;
      updateLivesDisplay();
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

      // 💖 Alleen hier hartjes resetten bij Game Over
      heartsCollected = 0;
      document.getElementById("heartCount").textContent = heartsCollected;

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
  if (typeof resetAllBonuses === "function") resetAllBonuses();

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

