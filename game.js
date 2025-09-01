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
let rocketAmmo = 0; // aantal raketten dat nog afgevuurd mag worden
let balls = []; // array van actieve ballen
let doublePointsActive = false;
let doublePointsStartTime = 0;
let doublePointsDuration = 60000; // 1 minuut in millisecondenlet imagesLoaded = 0;
let imagesLoaded = 0;
let pointPopups = []; // voor 10+ of 20+ bij muntjes
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

// 🌟 Level 2 overgang
let levelTransitionActive = false;
let transitionOffsetY = -300;

let levelMessageAlpha = 0;
let levelMessageTimer = 0;
let levelMessageVisible = false;
let resetOverlayActive = false;
let ballTrail = []; // Array om eerdere balposities te bewaren
const maxTrailLength = 10;

let machineGunActive = false;
let machineGunGunX = 0;
let machineGunGunY = 0;
let machineGunBullets = [];
let machineGunShotsFired = 0;
let machineGunDifficulty = 2; // 1 = makkelijk, 2 = normaal, 3 = moeilijk
let machineGunCooldownActive = false;
let machineGunStartTime = 0;
let machineGunCooldownTime = 30000; // 30 sec cooldown
let machineGunBulletInterval = 500; // aanpasbaar per difficulty
let machineGunLastShot = 0;
let paddleDamageZones = []; // array van kapotgemaakte stukken
let machineGunYOffset = 140; // minimale afstand tussen paddle en machinegun
let minMachineGunY = 0;     // bovenste limiet (canvasrand)

// ❤️ Hartjes-systeem
let heartsCollected = 0;               // aantal verzamelde hartjes (reset bij 10)
let heartBlocks = [];                  // blokken met verborgen hartjes
let fallingHearts = [];                // actieve vallende hartjes
let heartPopupTimer = 0;               // timer voor popup “Wow! 10 hearts – extra life!”
let heartBoardX = 20;
let heartBoardY = 20;


let speedBoostActive = false;
let speedBoostStart = 0;
const speedBoostDuration = 30000;
const speedBoostMultiplier = 1.5;

balls.push({
  x: canvas.width / 2,
  y: canvas.height - paddleHeight - 10,
  dx: 0,
  dy: -6,
  radius: 8,
  isMain: true
});







const bonusBricks = [
  { col: 5, row: 3, type: "rocket" },  { col: 2, row: 12, type: "machinegun" },
  { col: 8, row: 4, type: "power" },
  { col: 2, row: 7, type: "doubleball" },
  { col: 4, row: 7, type: "2x" },
  { col: 2, row: 3, type: "speed" },
  { col: 3, row: 14, type: "stone" },
  { col: 4, row: 14, type: "stone" },
  { col: 5, row: 14, type: "stone" },
  { col: 0, row: 8, type: "stone" },
  { col: 1, row: 8, type: "stone" },
  { col: 2, row: 8, type: "stone" },
  { col: 8, row: 5, type: "stone" },
  { col: 7, row: 6, type: "stone" },
  { col: 6, row: 7, type: "stone" },
];
// 📦 PXP layout voor level 2 (alleen steen-blokken)
const pxpMap = [
  { col: 0, row: 5 },   { col: 0, row: 8 },      { col: 0, row: 14 },   { col: 0, row: 13 },   { col: 5, row: 3, type: "rocket" }, 
  { col: 1, row: 5 },   { col: 1, row: 8 },      { col: 1, row: 14 },   { col: 1, row: 13 },   { col: 8, row: 4, type: "power" },        
  { col: 2, row: 5 },   { col: 2, row: 8 },      { col: 2, row: 14 },   { col: 2, row: 13 },   { col: 2, row: 3, type: "speed" },         
  { col: 3, row: 5 },   { col: 3, row: 8 },      { col: 3, row: 14 },   { col: 3, row: 13 },   { col: 4, row: 7, type: "2x" },
  { col: 4, row: 5 },   { col: 4, row: 8 },      { col: 4, row: 14 },   { col: 4, row: 13 },   { col: 2, row: 7, type: "doubleball" },         
  { col: 5, row: 5 },   { col: 5, row: 8 },      { col: 5, row: 14 },   { col: 5, row: 13 },               
  { col: 6, row: 5 },   { col: 6, row: 8 },      { col: 6, row: 14 },   { col: 6, row: 13 },                   
  { col: 7, row: 5 },   { col: 7, row: 8 },      { col: 7, row: 14 },   { col: 7, row: 13 },                                       
  { col: 8, row: 5 },   { col: 8, row: 8 },      { col: 8, row: 14 },   { col: 8, row: 13 },                              
                                                                  
];

const resetBallSound = new Audio("resetball.mp3");


const levelUpSound = new Audio("levelup.mp3");
const paddleExplodeSound = new Audio("paddle_explode.mp3");
const gameOverSound = new Audio("gameover.mp3");

const doubleBallSound = new Audio("double_ball.mp3");
const speedBoostSound = new Audio("speed_boost.mp3");
const rocketReadySound = new Audio("rocket_ready.mp3");
const flagsActivatedSound = new Audio("flags_activated.mp3");
const doublePointsSound = new Audio("double_points.mp3");

const bricksSound = new Audio("bricks.mp3");
const pxpBagSound = new Audio("pxpbagsound_mp3.mp3");

const rocketLaunchSound = new Audio("launch.mp3");
const rocketExplosionSound = new Audio("explosion.mp3"); // als dat de juiste is

const laserSound = new Audio("laser.mp3"); // voeg dit bestand toe in je project
const coinSound = new Audio("money.mp3");
const shootSound = new Audio("shoot_arcade.mp3");
const wallSound = new Audio("tick.mp3");
const blockSound = new Audio("tock.mp3");

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

  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  } else if (e.key === "Up" || e.key === "ArrowUp") {
    upPressed = true;
  } else if (e.key === "Down" || e.key === "ArrowDown") {
    downPressed = true;
  }

  // 🎯 Actie: bal afschieten (alleen bij omhoogtoets of spatie) als bal nog niet gelanceerd is
  if ((e.key === "ArrowUp" || e.code === "Space") && !ballLaunched) {
    ballLaunched = true;
    ballMoving = true;

    shootSound.currentTime = 0;
    shootSound.play();

    balls[0].dx = 0;
    balls[0].dy = -6;

    if (!timerRunning) startTimer(); // ✅ Start timer bij eerste afschot
  }

  if ((e.code === "ArrowUp" || e.code === "Space") && rocketActive && rocketAmmo > 0 && !rocketFired) {
    rocketFired = true;
    rocketAmmo--;
    rocketLaunchSound.currentTime = 0;
    rocketLaunchSound.play();
  }

  if (flagsOnPaddle && (e.code === "Space" || e.code === "ArrowUp")) {
    shootFromFlags();
  }

 if (!ballMoving && (e.code === "ArrowUp" || e.code === "Space")) {
  if (lives <= 0) {
    lives = 3;
    score = 0;
    level = 1;
    resetBricks();
    resetBall();
    resetPaddle();
    startTime = new Date();
    gameOver = false;

    updateScoreDisplay(); // 👈 juiste regel
    document.getElementById("timeDisplay").textContent = "00:00";


    flagsOnPaddle = false;
    flyingCoins = [];
  }

  ballMoving = true;
 }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  } else if (e.key === "Up" || e.key === "ArrowUp") {
    upPressed = false;
  } else if (e.key === "Down" || e.key === "ArrowDown") {
    downPressed = false;
  }
}

function updateScoreDisplay() {
  document.getElementById("scoreDisplay").textContent = score;
}


function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
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
          case "stone":
            if (b.hits === 0) {
              ctx.drawImage(stone1Img, brickX, brickY, brickWidth, brickHeight);
            } else if (b.hits === 1) {
              ctx.drawImage(stone2Img, brickX, brickY, brickWidth, brickHeight);
            } else {
              ctx.drawImage(dollarPxpImg, brickX, brickY, brickWidth, brickHeight);
            }
            break;
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
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;

      let brickType = "normal"; // ✅ slechts één keer

      const bonus = bonusBricks.find(b => b.col === c && b.row === r);
      let pxp = pxpMap.find(p => p.col === c && p.row === r);

      if (level === 2 && pxp) {
        brickType = pxp.type || "stone"; // 👈 gebruik type indien aanwezig, anders "stone"
      } else if (bonus) {
        brickType = bonus.type;
      }

      bricks[c][r].type = brickType;

      // Extra eigenschappen voor stone blokken
      if (brickType === "stone") {
        bricks[c][r].hits = 0;
        bricks[c][r].hasDroppedBag = false;
      } else {
        delete bricks[c][r].hits;
        delete bricks[c][r].hasDroppedBag;
      }

      // 🔄 Reset hartje voor elk blokje (veilig)
      bricks[c][r].hasHeart = false;
      bricks[c][r].heartDropped = false;
    }
  }

  // ✅ Plaats 4 willekeurige hartjes onder normale blokjes
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
}




function resetBall() {
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

  // 🧱 Zorg dat bij level 1 blokken direct zichtbaar zijn
  if (level === 1) {
    levelTransitionActive = false;
    transitionOffsetY = 0;
  }
}

function resetPaddle(skipBallReset = false, skipCentering = false) {
  // 🎯 Zet paddle terug in het midden (alleen als NIET geskiped en NIET machinegun)
  if (!skipCentering && !machineGunCooldownActive && !machineGunActive) {
    paddleX = (canvas.width - paddleWidth) / 2;
  }

  // 🔁 Reset paddle-tekening inclusief schadeherstel
  paddleCanvas.width = paddleWidth;
  paddleCanvas.height = paddleHeight;
  paddleCtx.clearRect(0, 0, paddleWidth, paddleHeight);
  paddleCtx.drawImage(pointpayPaddleImg, 0, 0, paddleWidth, paddleHeight);

  // 🟢 Bal resetten als dat moet
  if (!skipBallReset && !machineGunCooldownActive && !machineGunActive) {
    resetBall();  // maakt de eerste bal aan
  }
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

          // 💖 Hartje laten vallen als dit blokje er eentje heeft
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

          // 🪨 Gedrag voor stenen blokken
          if (b.type === "stone") {
            bricksSound.currentTime = 0;
            bricksSound.play();

            b.hits++;

            // 🧱 Puin genereren
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

            return;
          }

          // 🎁 Bonusacties met geluid
          switch (b.type) {
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

              // Zet gun direct boven paddle met juiste offset
              machineGunGunX = paddleX + paddleWidth / 2 - 30;
              const gunStartY = Math.max(paddleY - machineGunYOffset, minMachineGunY);
              machineGunGunY = gunStartY;

              b.status = 0;
              b.type = "normal";
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
          }

          b.status = 0;
          b.type = "normal";

          const earned = doublePointsActive ? 20 : 10;
          score += earned;
          updateScoreDisplay(); // 👈 aangepaste regel

          spawnCoin(b.x, b.y);
        }
      }
    }
  });
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
  collisionDetection();
  drawCoins();
  drawFallingHearts();
  drawHeartPopup();
  checkCoinCollision();
  drawPaddleFlags();
  drawFlyingCoins();
  checkFlyingCoinHits();
  drawPointPopups();

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


  // ✅ Na de loop: check of alle ballen weg zijn
  if (balls.length === 0 && !paddleExploding) {
    triggerPaddleExplosion(); // pas nu verlies van leven
  }

 drawBricks();

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

if (upPressed) {
  const newY = paddleY - paddleSpeed;
  if (newY > 0 && !isPaddleBlockedVertically(newY)) {
    paddleY = newY;
  }
}

if (downPressed) {
  const newY = paddleY + paddleSpeed;
  if (newY + paddleHeight < canvas.height && !isPaddleBlockedVertically(newY)) {
    paddleY = newY;
  }
}

  drawPaddle();


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
    ctx.fillStyle = `rgba(255, 165, 0, ${e.alpha})`;
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
  score += 500;
  pointPopups.push({
    x: paddleX + paddleWidth / 2,
    y: canvas.height - 30,
    value: "+500",
    alpha: 1
  });

  resetPaddle(true, true); // ✅ geen ball reset, geen centrering
}

// 💀 Paddle vernietigd?
if ((machineGunActive || machineGunCooldownActive) && paddleDamageZones.length >= 10) {
  machineGunActive = false;
  machineGunCooldownActive = false;
  // Paddle-explosie volgt automatisch bij ball loss
}


    
    // ✨ Leveltekst weergeven
if (levelMessageVisible) {
  ctx.save();
  ctx.globalAlpha = levelMessageAlpha;
  ctx.fillStyle = "#00ffff";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`PointPay Breakout Level ${level}`, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

// 🎬 Overgangstimer & animatie
if (levelTransitionActive) {
  levelMessageAlpha = 1;

  levelMessageTimer++;

  if (levelMessageTimer >= 360) {
    levelMessageVisible = false;
    levelTransitionActive = false;
  }

  if (transitionOffsetY < 0) {
    transitionOffsetY += 2;
  } else {
    transitionOffsetY = 0;
  }
}


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
  if (imagesLoaded === 21) {
    resetBricks();
    updateLivesDisplay(); // ✅ laat bij start meteen levens zien
    resetPaddle(); // 🔥 paddletekening klaarzetten
    draw();
  }
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

  shootSound.currentTime = 0;
  shootSound.play();

  balls[0].dx = 0;
  balls[0].dy = -6;

  if (!timerRunning) startTimer(); // ✅ Alleen timer starten

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
    if (!resetTriggered) { // ✅ Alleen aftrekken als het GEEN reset is
      lives--;
      updateLivesDisplay();
    }

    pauseTimer(); 
  
    paddleExploding = true;
    paddleExplosionParticles = [];

    // ❌ Machinegun direct stoppen bij levenverlies
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

      resetTriggered = false; // ✅ reset na normale explosie

      resetPaddle(); // visuele schade weg
    }, 1000);

  } else {
    // ✅ Laatste leven: eerst paddle laten ontploffen
    paddleExploding = true;

    machineGunActive = false;
    machineGunCooldownActive = false;


    gameOverSound.currentTime = 0;
    gameOverSound.play(); // 🔊 Speel "GAME OVER" geluid

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

    // ⏱️ Wacht 1 seconde, daarna reset
    setTimeout(() => {
      saveHighscore();
      stopTimer();

      lives = 3;
      updateLivesDisplay();

      score = 0;
      level = 1;
      elapsedTime = 0;

      paddleExploding = false;
      paddleExplosionParticles = [];

      // ✅ Essentiële resets
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

      resetBricks();
      resetBall();
      resetPaddle();

      updateScoreDisplay(); // 👈 aangepaste regel
      document.getElementById("timeDisplay").textContent = "00:00";


      resetTriggered = false; // ✅ reset ook hier voor zekerheid
    }, 1000);
  }
}

function startLevelTransition() {
  level++;

  resetAllBonuses(); // ⬅️ Voeg deze regel toe

  levelUpSound.currentTime = 0;
  levelUpSound.play();

  levelMessageAlpha = 0;
  levelMessageTimer = 0;
  levelMessageVisible = true;
  levelTransitionActive = true;

  resetBricks();
  transitionOffsetY = -300;

  ballLaunched = false;
  ballMoving = false;

  balls = [{
    x: paddleX + paddleWidth / 2 - ballRadius,
    y: paddleY - ballRadius * 2,
    dx: 0,
    dy: -6,
    radius: ballRadius,
    isMain: true
  }];
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

