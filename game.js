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


// ❤️ Hartjes-systeem
let heartsCollected = 0;
let heartBlocks = [];
let fallingHearts = [];
let heartPopupTimer = 0;
let heartBoardX = 20;
let heartBoardY = 20;

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

// === COLLECTOR SYSTEM (stars/bombs/x) ===
const GOAL_STARS = 10;
const GOAL_BOMBS = 10;

// vervangbare icoontjes (laad je eigen images als je wil)
let hudStarIcon = typeof starImg !== "undefined" ? starImg : null;
let hudBombIcon = typeof tntImg  !== "undefined" ? tntImg  : null;
let hudXIcon    = null; // bv. redCrossImg; blijft null => teken we vectorisch

const collector = {
  stars: 0,
  bombs: 0,
  x: 0,           // we tellen X ook bij voor UI; effect = reset
  invincibleUntil: 0
};

// paddle-invincibility helpers
function activateInvinciblePaddle(ms = 20000) {
  collector.invincibleUntil = performance.now() + ms;
  flashSetPopup?.("⭐ Invincible Paddle " + Math.round(ms/1000) + "s");
}

function isPaddleInvincible() {
  return performance.now() < collector.invincibleUntil;
}

function addStar(n = 1) {
  collector.stars = Math.min(GOAL_STARS, collector.stars + n);
  if (collector.stars >= GOAL_STARS) {
    activateInvinciblePaddle(20000); // 20s shield
    collector.stars = 0;             // reset de sterrenteller
  }
}

function explodeRandomBricks(n = 35) {
  // 30–40 bricks (standaard 35). Pas aan als je wil.
  const kill = Math.max(0, n|0);
  const pool = [];
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (!b) continue;
      if (b.status !== 1) continue;            // alleen levende
      if (b.type === "steel") continue;        // filter onbreekbaar (pas aan)
      pool.push({c,r,b});
    }
  }
  for (let i = 0; i < kill && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const {c,r,b} = pool.splice(idx,1)[0];
    b.status = 0;
    score += 10;
    pointPopups?.push?.({
      x: (c+0.5)*brickWidth + brickOffsetLeft,
      y: (r+0.5)*brickHeight + brickOffsetTop,
      value: "+10", alpha: 1
    });
  }
  updateScoreDisplay?.();
}

function addBomb(n = 1) {
  collector.bombs = Math.min(GOAL_BOMBS, collector.bombs + n);
  if (collector.bombs >= GOAL_BOMBS) {
    // 30–40 bricks: kies random in deze range
    const count = 30 + Math.floor(Math.random()*11);
    flashSetPopup?.("💣 BOOM! -" + count + " bricks");
    explodeRandomBricks(count);
    collector.bombs = 0; // reset bommen-teller
  }
}

function addX(n = 1) {
  collector.x += n;
  collector.stars = 0;
  collector.bombs = 0;
  flashSetPopup?.("❌ Progress reset");
}



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



const stonefallVoiceEvery = 5;
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

// 🧨 TNT blok
const tntImg = new Image();      
tntImg.src = "tnt.png";

const tntBlinkImg = new Image(); 
tntBlinkImg.src = "tnt_blink.png";


const stoneLargeImg  = new Image(); 
stoneLargeImg.src  = "stone_large.png";

const paddleLongBlockImg = new Image();
paddleLongBlockImg.src = "paddlelong.png";   // jouw upload

const paddleSmallBlockImg = new Image();
paddleSmallBlockImg.src = "paddlesmall.png"; // jouw upload

const magnetImg = new Image();
magnetImg.src = "magnet.png"; // voeg dit plaatje toe aan je project

// === DROPS SYSTEM: item type registry ===
// Elk type definieert hoe het eruit ziet + wat er gebeurt bij catch/miss
const DROP_TYPES = {

  // 💰 COIN
  coin: {
    draw(drop, ctx) {
      ctx.drawImage(coinImg, drop.x - 12, drop.y - 12, 24, 24);
    },
    onCatch(drop) {
      const earned = doublePointsActive ? 20 : 10;
      score += earned;
      updateScoreDisplay?.();
      coinSound.currentTime = 0; coinSound.play();
      pointPopups.push({ x: drop.x, y: drop.y, value: "+" + earned, alpha: 1 });
    },
    onMiss(drop) {},
  },

  // ❤️ HEART (voor test behouden)
  heart: {
    draw(drop, ctx) {
      const size = 24 + Math.sin(drop.t) * 2;
      ctx.globalAlpha = 0.95;
      ctx.drawImage(heartImg, drop.x - size/2, drop.y - size/2, size, size);
      ctx.globalAlpha = 1;
    },
    onTick(drop, dt) { drop.t += 0.2; },
    onCatch(drop) {
      heartsCollected++;
      document.getElementById("heartCount").textContent = heartsCollected;
      coinSound.currentTime = 0; coinSound.play();
      if (heartsCollected >= 10) {
        heartsCollected = 0;
        lives++;
        updateLivesDisplay?.();
        heartPopupTimer = 100;
        document.getElementById("heartCount").textContent = heartsCollected;
      }
    },
    onMiss(drop) {},
  },

  // 🎒 BAG (nog even behouden voor compatibiliteit)
  bag: {
    draw(drop, ctx) {
      ctx.drawImage(pxpBagImg, drop.x - 20, drop.y - 20, 40, 40);
    },
    onCatch(drop) {
      const earned = doublePointsActive ? 160 : 80;
      score += earned;
      updateScoreDisplay?.();
      pxpBagSound.currentTime = 0; pxpBagSound.play();
      pointPopups.push({ x: drop.x, y: drop.y, value: "+" + earned, alpha: 1 });
    },
    onMiss(drop) {},
  },

  // 💣 NORMALE BOMB (oude systeem)
  bomb: {
    draw(drop, ctx) {
      const s = 26;
      const blink = (Math.floor(performance.now()/200) % 2 === 0);
      const img = blink ? tntBlinkImg : tntImg;
      ctx.drawImage(img, drop.x - s/2, drop.y - s/2, s, s);
    },
    onCatch(drop) {
      if (lives > 1) {
        lives--;
        updateLivesDisplay?.();
        pointPopups.push({ x: drop.x, y: drop.y, value: "−1 life", alpha: 1 });
      } else {
        triggerPaddleExplosion?.();
      }
      try { tntExplodeSound.currentTime = 0; tntExplodeSound.play(); } catch {}
    },
    onMiss(drop) {},
  },

  // 🟡⭐ NIEUW: STAR TOKEN
  star_token: {
    draw(drop, ctx) {
      const s = 26;
      if (typeof starImg !== "undefined" && starImg) {
        ctx.drawImage(starImg, drop.x - s/2, drop.y - s/2, s, s);
      } else {
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    onCatch(drop) {
      addStar?.(1);            // voegt ster toe
      score += 5;              // kleine scorebonus
      updateScoreDisplay?.();
    },
    onMiss(drop) {},
  },

  // 💣 NIEUW: BOMB TOKEN (voor brick-explosie bij 10x)
  bomb_token: {
    draw(drop, ctx) {
      const s = 26;
      const blink = (Math.floor(performance.now() / 200) % 2 === 0);
      const img = blink && typeof tntBlinkImg !== "undefined" ? tntBlinkImg : tntImg;
      if (img) ctx.drawImage(img, drop.x - s/2, drop.y - s/2, s, s);
      else {
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    onCatch(drop) {
      addBomb?.(1);
      score += 5;
      updateScoreDisplay?.();
    },
    onMiss(drop) {},
  },

  // ❌ NIEUW: RED X TOKEN (reset alle voortgang)
  x_token: {
    draw(drop, ctx) {
      const s = 24;
      ctx.save();
      ctx.translate(drop.x, drop.y);
      ctx.fillStyle = "#d00";
      ctx.fillRect(-s/2, -5, s, 10);
      ctx.fillRect(-5, -s/2, 10, s);
      ctx.restore();
    },
    onCatch(drop) {
      addX?.(1);               // reset alle tellerprogress
      try { tntExplodeSound.currentTime = 0; tntExplodeSound.play(); } catch {}
    },
    onMiss(drop) {},
  },

  // 🧱 PADDLE POWERUPS
  paddle_long: {
    draw(drop, ctx) { ctx.drawImage(paddleLongBlockImg, drop.x - 35, drop.y - 12, 70, 24); },
    onCatch(drop) { startPaddleSizeEffect?.("long"); },
    onMiss(drop) {},
  },

  paddle_small: {
    draw(drop, ctx) { ctx.drawImage(paddleSmallBlockImg, drop.x - 35, drop.y - 12, 70, 24); },
    onCatch(drop) { startPaddleSizeEffect?.("small"); },
    onMiss(drop) {},
  },

  // ⚡ SPEED BOOST
  speed: {
    draw(drop, ctx) { ctx.drawImage(speedImg, drop.x - 35, drop.y - 12, 70, 24); },
    onCatch(drop) {
      speedBoostActive = true;
      speedBoostStart = Date.now();
      speedBoostSound.currentTime = 0;
      speedBoostSound.play();
    },
    onMiss(drop) {},
  },

  // 🧲 MAGNET
  magnet: {
    draw(drop, ctx) { ctx.drawImage(magnetImg, drop.x - 35, drop.y - 12, 70, 24); },
    onCatch(drop) { activateMagnet?.(20000); },
    onMiss(drop) {},
  },
};




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

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

function drawCollectorPanel() {
  // positie: onder je chatbox rechts. Pas aan naar jouw layout.
  const panelW = 220, panelH = 120;
  const x = canvas.width - panelW - 16; // 16px marge rechts
  const y = 110;                        // onder je chatbox header (schat)
  const pad = 10;

  // achtergrond (chatbox-achtig)
  drawRoundedRect(ctx, x, y, panelW, panelH, 14);
  ctx.fillStyle = "rgba(255, 193, 7, 0.15)"; // warm geel/oranje tint
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(140, 90, 10, 0.6)";
  ctx.stroke();

  ctx.save();
  ctx.translate(x + pad, y + pad);

  // titel
  ctx.fillStyle = "#3b2508";
  ctx.font = "bold 14px Arial";
  ctx.fillText("Collector", 0, 0);

  // rij helper
  const rowY = (i)=> 18 + i*32;

  // ROW 1 - STARS (geel)
  // icon
  if (hudStarIcon) ctx.drawImage(hudStarIcon, 0, rowY(0)-2, 20, 20);
  else { ctx.fillStyle="#ffd54f"; ctx.beginPath(); ctx.arc(10, rowY(0)+8, 8, 0, Math.PI*2); ctx.fill(); }
  // label
  ctx.fillStyle = "#654321";
  ctx.font = "12px Arial";
  ctx.fillText("Stars", 26, rowY(0));
  // bar
  const w = panelW - pad*2 - 26;
  const h = 10;
  const fillStars = w * (collector.stars / GOAL_STARS);
  ctx.fillStyle = "#eee"; ctx.fillRect(26, rowY(0)+12, w, h);
  ctx.fillStyle = "#ffca28"; ctx.fillRect(26, rowY(0)+12, fillStars, h);
  ctx.strokeStyle = "#a67c00"; ctx.strokeRect(26, rowY(0)+12, w, h);
  // text value
  ctx.fillStyle = "#5b4600";
  ctx.fillText(`${collector.stars}/${GOAL_STARS}`, 26 + w - 40, rowY(0));

  // ROW 2 - BOMBS (zwart)
  if (hudBombIcon) ctx.drawImage(hudBombIcon, 0, rowY(1)-2, 20, 20);
  else { ctx.fillStyle="#222"; ctx.beginPath(); ctx.arc(10, rowY(1)+8, 8, 0, Math.PI*2); ctx.fill(); }
  ctx.fillStyle = "#333"; ctx.fillText("Bombs", 26, rowY(1));
  const fillBombs = w * (collector.bombs / GOAL_BOMBS);
  ctx.fillStyle = "#eee"; ctx.fillRect(26, rowY(1)+12, w, h);
  ctx.fillStyle = "#111"; ctx.fillRect(26, rowY(1)+12, fillBombs, h);
  ctx.strokeStyle = "#555"; ctx.strokeRect(26, rowY(1)+12, w, h);
  ctx.fillStyle = "#111";
  ctx.fillText(`${collector.bombs}/${GOAL_BOMBS}`, 26 + w - 40, rowY(1));

  // ROW 3 - X (rood)
  if (hudXIcon) ctx.drawImage(hudXIcon, 0, rowY(2)-2, 20, 20);
  else { ctx.fillStyle="#d12"; ctx.fillRect(0, rowY(2)-2, 20, 20); ctx.fillStyle="#fff"; ctx.fillRect(6, rowY(2)+2, 8, 12); }
  ctx.fillStyle = "#6b1212"; ctx.fillText("X", 26, rowY(2));
  const fillX = Math.min(w, collector.x * (w / GOAL_STARS)); // optioneel schaal; of maak eigen goal
  ctx.fillStyle = "#eee"; ctx.fillRect(26, rowY(2)+12, w, h);
  ctx.fillStyle = "#d32f2f"; ctx.fillRect(26, rowY(2)+12, fillX, h);
  ctx.strokeStyle = "#8e1818"; ctx.strokeRect(26, rowY(2)+12, w, h);

  ctx.restore();
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
    maxItems: null,            // ⛔ hard cap op totaal aantal items (over alle events); null = geen cap

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

    // item-keuze
    types: ["coin","heart","bag"], // fallback set
    typeQuota: null,           // { heart: 5, bomb: 2 } → exact zoveel keer in totaal
    typeWeights: null          // { coin:5, heart:2, bomb:1 } → gewogen random
  }, config || {});

  // normaliseer
  if (!Array.isArray(dropConfig.gridColumns)) dropConfig.gridColumns = [ dropConfig.gridColumns ];
  if (!Array.isArray(dropConfig.types) || dropConfig.types.length === 0) dropConfig.types = ["coin","heart","bag"];

  // interne tellers
  dropsSpawned = 0;                   // aantal items gespawnd (telt individuele items)
  dropConfig._eventsSpawned = 0;      // aantal spawn-events
  const now = performance.now();
  lastDropAt = now;
  updateAndDrawDrops._nextDueMs = dropConfig.startDelayMs || 0;
  updateAndDrawDrops._sinceLastSpawn = 0;
  updateAndDrawDrops._spawnEndAt = (dropConfig.durationMs != null) ? (now + dropConfig.durationMs) : null;

  // grid/well helpers
  gridColumnsIndex = 0;

  // === type picker opzetten ===
  dropConfig._pickType = (function initTypePicker(cfg) {
    // 1) QUOTA: exact aantal keren per type
    if (cfg.typeQuota && typeof cfg.typeQuota === "object") {
      const pool = [];
      for (const [t, n] of Object.entries(cfg.typeQuota)) {
        const count = Math.max(0, n|0);
        for (let i = 0; i < count; i++) pool.push(t);
      }
      // zorg dat bekende types nog bestaan als quota op is
      const fallback = cfg.types.slice();
      return function pickWithQuota() {
        if (pool.length > 0) {
          const idx = Math.floor(Math.random() * pool.length);
          return pool.splice(idx, 1)[0];
        }
        // quota op → fallback naar types
        return fallback[Math.floor(Math.random() * fallback.length)];
      };
    }

    // 2) WEIGHTS: gewogen random
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
        return base[base.length - 1].type; // fallback
      };
    }

    // 3) Eenvoudig uniform random uit types
    const arr = cfg.types.slice();
    return function pickUniform() {
      return arr[Math.floor(Math.random() * arr.length)];
    };
  })(dropConfig);
}


// VERVANG JE OUDE FUNCTIE door deze:
function spawnRandomDrop() {
  if (!dropConfig) return;

  // typekeuze via picker (quota/gewichten) of fallback
  const type = dropConfig._pickType
    ? dropConfig._pickType()
    : (dropConfig.types?.[0] || "coin");

  // X bepalen volgens gekozen modus (well/grid) + avoidPaddle
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

// VERVANG JE OUDE FUNCTIE door deze:
function updateAndDrawDrops() {
  // --- SPAWNER TICK (binnen de functie!) ---
  if (dropConfig) {
    const now = performance.now();
    const dt = Math.max(0, now - (updateAndDrawDrops._lastTickAt || now));
    updateAndDrawDrops._lastTickAt = now;
    updateAndDrawDrops._sinceLastSpawn = (updateAndDrawDrops._sinceLastSpawn || 0) + dt;

    const withinTimer = (updateAndDrawDrops._spawnEndAt == null) || (now < updateAndDrawDrops._spawnEndAt);
    const underItemCap = (dropConfig.maxItems == null) || (dropsSpawned < dropConfig.maxItems);

    // plan eerste interval indien nodig
    if (updateAndDrawDrops._nextDueMs == null) {
      const span0 = Math.max(0, dropConfig.maxIntervalMs - dropConfig.minIntervalMs);
      updateAndDrawDrops._nextDueMs = dropConfig.minIntervalMs + Math.random() * span0;
      lastDropAt = now;
    }

    const elapsed = now - lastDropAt;
    const due = (elapsed >= updateAndDrawDrops._nextDueMs);
    const watchdogDue = (updateAndDrawDrops._sinceLastSpawn >= (dropConfig.maxSilenceMs || 5000));

    if (withinTimer && underItemCap && (due || watchdogDue)) {
      // burst-grootte bepalen
      const minN = Math.max(1, dropConfig.perSpawnMin || 1);
      const maxN = Math.max(minN, dropConfig.perSpawnMax || minN);
      let burst = (minN === maxN) ? minN : (Math.floor(Math.random() * (maxN - minN + 1)) + minN);

      // respecteer maxItems (hard cap)
      if (dropConfig.maxItems != null) {
        const remain = dropConfig.maxItems - dropsSpawned;
        if (remain <= 0) burst = 0;
        else burst = Math.min(burst, remain);
      }

      for (let k = 0; k < burst; k++) spawnRandomDrop();

      dropConfig._eventsSpawned = (dropConfig._eventsSpawned || 0) + 1;
      lastDropAt = now;
      updateAndDrawDrops._sinceLastSpawn = 0;

      // nieuw interval plannen
      const span1 = Math.max(0, dropConfig.maxIntervalMs - dropConfig.minIntervalMs);
      updateAndDrawDrops._nextDueMs = dropConfig.minIntervalMs + Math.random() * span1;
    }
  }

  // Als er (nog) niets actief valt, stop na de spawner (die blijft wél lopen)
  if (!fallingDrops || fallingDrops.length === 0) return;

  // --- UPDATE + RENDER ---
  for (let i = fallingDrops.length - 1; i >= 0; i--) {
    const d = fallingDrops[i];
    if (!d || !d.active) { fallingDrops.splice(i, 1); continue; }

    const def = DROP_TYPES[d.type];
    if (def?.onTick) def.onTick(d, 16); // ~16ms/frame

    // instant magnet-catch (als magnet een __forceCatch vlag zet)
    if (d.__forceCatch) {
      def?.onCatch?.(d);
      d.active = false;
      fallingDrops.splice(i, 1);
      continue;
    }

    // beweging
    d.y += d.dy;
    if (typeof d.vx === "number") d.x += d.vx;
    if (typeof d.vy === "number") d.y += d.vy;

    // tekenen
    if (def?.draw) def.draw(d, ctx);
    else {
      ctx.beginPath();
      ctx.arc(d.x, d.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffd700";
      ctx.fill();
    }

    // collision met paddle (ruwe bbox)
    const pb = getPaddleBounds();
    const w = 26, h = 26;
    const left = d.x - w/2, right = d.x + w/2, top = d.y - h/2, bottom = d.y + h/2;
    const overlap = (right >= pb.left && left <= pb.right && bottom >= pb.top && top <= pb.bottom);

    if (overlap) {
      def?.onCatch?.(d);
      d.active = false;
      fallingDrops.splice(i, 1);
      continue;
    }

    // onder uit beeld?
    if (d.y - 30 > canvas.height) {
      def?.onMiss?.(d);
      d.active = false;
      fallingDrops.splice(i, 1);
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

  // =========================
  // DROPS SYSTEM: reset & start per level
  // =========================
  // opruimen van eerdere drops/scheduler state
  if (typeof fallingDrops !== 'undefined') {
    fallingDrops = [];
  }
  if (typeof dropsSpawned !== 'undefined') {
    dropsSpawned = 0;
  }
  if (typeof lastDropAt !== 'undefined') {
    lastDropAt = performance.now();
  }
  // (dropConfig wordt in startDrops gezet)

  const lvl = level || 1;

  // Voorbeeldconfiguraties per level-range.
  // Pas gerust aan naar jouw pacing.
  if (lvl <= 3) {
    startDrops({
     continuous: true,  
      minIntervalMs: 1200,
      maxIntervalMs: 2600,
      speed: 2.5,
      types: ["coin", "heart", "bag"], // veilige startersmix
      xMargin: 40,
      startDelayMs: 800,
      mode: "well",          // goed gespreide x-waarden (geen grid)
      avoidPaddle: false,
      minSpacing: 70
    });
  } else if (lvl <= 10) {
    startDrops({
      continuous: true,  
      minIntervalMs: 900,
      maxIntervalMs: 2200,
      speed: 3.0,
      types: ["coin", "heart", "bag", "paddle_long", "speed", "magnet"],
      xMargin: 40,
      startDelayMs: 600,
      mode: "well",
      avoidPaddle: false,
      minSpacing: 70
    });
  } else {
    startDrops({
    continuous: true,  
      minIntervalMs: 800,
      maxIntervalMs: 1800,
      speed: 3.4,
      types: ["coin", "heart", "bag", "paddle_long", "speed", "magnet", "bomb"], // bomb erbij voor extra spanning
      xMargin: 40,
      startDelayMs: 500,
      mode: "grid",          // nette kolommen in hogere levels
      gridColumns: 8,
      gridJitterPx: 16,
      avoidPaddle: true,     // eerlijker: niet direct boven de paddle spawnen
      avoidMarginPx: 40,
      minSpacing: 70
    });
  }
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
      spawnStoneDebris(s.x, s.y);
      s.active = false;
      stoneHitOverlayTimer = 18;

      if (!stoneHitLock) {
        stoneHitLock = true;
        if (typeof triggerPaddleExplosion === "function") triggerPaddleExplosion();
        stoneClearRequested = true;
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

  // ⭐️⭐️⭐️ STEP 5 – Invincible Paddle overlay (lichte gloed boven achtergrond)
  if (isPaddleInvincible()) {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffd54f";        // goudgele tint
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // A) Time-out check heel vroeg in draw()
  if (magnetActive && performance.now() >= magnetEndTime) {
    stopMagnet();
  }

  // B) Toepassen op arrays (na physics update van items, vóór render)
  applyMagnetToArray(fallingHearts);
  applyMagnetToArray(coins);
  applyMagnetToArray(pxpBags);
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
    let steps = 3;
    for (let i = 1; i <= steps; i++) {
      let px = last.x + (ball.x - last.x) * (i / steps);
      let py = last.y + (ball.y - last.y) * (i / steps);
      ball.trail.push({ x: px, y: py });
    }
    while (ball.trail.length > 20) ball.trail.shift();

    // Veiliger links/rechts
    if (ball.x <= ball.radius + 1 && ball.dx < 0) {
      ball.x = ball.radius + 1;
      ball.dx *= -1;
      wallSound.currentTime = 0; wallSound.play();
    }
    if (ball.x >= canvas.width - ball.radius - 1 && ball.dx > 0) {
      ball.x = canvas.width - ball.radius - 1;
      ball.dx *= -1;
      wallSound.currentTime = 0; wallSound.play();
    }

    // Veiliger bovenkant
    if (ball.y <= ball.radius + 1 && ball.dy < 0) {
      ball.y = ball.radius + 1;
      ball.dy *= -1;
      wallSound.currentTime = 0; wallSound.play();
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
      const localX = Math.round(cx - paddleX);
      const sampleHalf = Math.max(1, Math.floor(ball.radius));
      let opaqueHit = false;
      const px = Math.max(0, Math.min(paddleWidth - 1, localX));
      for (let dy = -sampleHalf; dy <= sampleHalf; dy++) {
        const localY = Math.max(0, Math.min(paddleHeight - 1, Math.round((cy - paddleY) + dy)));
        const a = paddleCtx.getImageData(px, localY, 1, 1).data[3];
        if (a > 10) { opaqueHit = true; break; }
      }

      if (opaqueHit) {
        const hitPos = (cx - paddleX) / paddleWidth;
        const angle  = (hitPos - 0.5) * Math.PI / 2;
        const speed  = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = speed * Math.sin(angle);
        ball.dy = -Math.abs(speed * Math.cos(angle));
        ball.y = paddleY - (ball.radius * 2) - 1;
        wallSound.currentTime = 0; wallSound.play();
      }
      // anders: pure gat → bal valt door
    }
  });

  // ⭐️⭐️⭐️ STEP 5b – Paddle-aura tekenen vóór paddle zelf
  if (isPaddleInvincible()) {
    const auraR = (paddleWidth * 0.65);
    const cx = paddleX + paddleWidth / 2;
    const cy = paddleY + paddleHeight / 2;
    const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, auraR);
    g.addColorStop(0, "rgba(255,213,79,0.55)");
    g.addColorStop(1, "rgba(255,213,79,0.00)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPaddle();  // paddle tekenen na de aura

  // (je overige UI/HUD-calls hieronder laten staan)
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


  drawMagnetAura(ctx);
  drawMagnetHUD(ctx);
  updateAndDrawDrops();

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
  // 🛡️ Invincible: geen leven verliezen, geen explosie-flow
  if (typeof isPaddleInvincible === "function" && isPaddleInvincible()) {
    // bal direct terug op de paddle en doorgaan met spelen
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
    paddleFreeMove = false;
    resetTriggered = false;
    // laat magnet/speed/score etc. gewoon lopen; niets afstraffen
    if (typeof redrawPaddleCanvas === "function") redrawPaddleCanvas();
    return; // ⬅️ heel belangrijk: hier stoppen zodat er geen leven afgaat
  }

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

