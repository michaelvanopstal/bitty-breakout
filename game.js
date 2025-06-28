const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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




let speedBoostActive = false;
let speedBoostStart = 0;
const speedBoostDuration = 30000;
const speedBoostMultiplier = 1.5;

balls.push({
  x: canvas.width / 2,
  y: canvas.height - paddleHeight - 10,
  dx: 10,
  dy: -10,
  radius: 8,
  isMain: true
});





const bonusBricks = [
  { col: 5, row: 3, type: "rocket" },
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


const paddleExplodeSound = new Audio("paddle_explode.mp3");

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


let speedMultiplier = (speedBoostActive && Date.now() - speedBoostStart < speedBoostDuration) ? speedBoostMultiplier : 1.5;

let rocketActive = false; // Voor nu altijd zichtbaar om te testen
let rocketX = 0;
let rocketY = 0;

  
console.log("keydown-handler wordt nu actief");

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);

function keyDownHandler(e) {
  console.log("Toets ingedrukt:", e.key);

  // 🛡️ Voorkom acties als gebruiker in een inputveld of knop zit
  if (["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement.tagName)) return;

  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }

  if ((e.key === "ArrowUp" || e.key === "Up" || e.code === "Space") && !ballLaunched) {
    ballLaunched = true;
    ballMoving = true;

    // 🎯 Speel schiet-geluid af
    shootSound.currentTime = 0;
    shootSound.play();

    balls[0].dx = 0;
    balls[0].dy = -6;

    if (!timerRunning) startTimer(); // ✅ Timer starten bij eerste afschot

    score = 0;
    document.getElementById("scoreDisplay").textContent = "score 0 pxp.";
  }

  if ((e.code === "ArrowUp" || e.code === "Space") && rocketActive && rocketAmmo > 0 && !rocketFired) {
    rocketFired = true;
    rocketAmmo--;

    // 🔊 Speel afvuurgeluid
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

      document.getElementById("scoreDisplay").textContent = "score 0 pxp.";
      document.getElementById("timeDisplay").textContent = "time 00:00";

      flagsOnPaddle = false;
      flyingCoins = [];
    }

    ballMoving = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}


function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}


function drawBricks() {
  const totalBricksWidth = brickColumnCount * brickWidth;
  const offsetX = (canvas.width - totalBricksWidth) / 2;

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const brickX = offsetX + c * brickWidth;
        const brickY = r * brickHeight;

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

      // Haal bonusinfo op (inclusief eventueel "stone")
      const bonus = bonusBricks.find(b => b.col === c && b.row === r);
      const brickType = bonus ? bonus.type : "normal";

      // Type instellen
      bricks[c][r].type = brickType;

      // Extra eigenschappen voor stone blokken
      if (brickType === "stone") {
        bricks[c][r].hits = 0;
        bricks[c][r].hasDroppedBag = false;
      } else {
        delete bricks[c][r].hits;
        delete bricks[c][r].hasDroppedBag;
      }
    }
  }
}



function drawPaddle() {
  if (paddleExploding) return; // Verberg paddle tijdens explosie
  ctx.drawImage(pointpayPaddleImg, paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}



function resetBall() {
  balls = [{
    x: paddleX + paddleWidth / 2 - ballRadius,
    y: canvas.height - paddleHeight - ballRadius * 2,
    dx: 0,
    dy: -10,
    radius: ballRadius,
    isMain: true
  }];
  ballLaunched = false;
  ballMoving = false;
}


function resetPaddle() {
  paddleX = (canvas.width - paddleWidth) / 2;
  resetBall();  // maakt de eerste bal aan
  draw();

}


function drawPaddleFlags() {
  if (flagsOnPaddle && Date.now() - flagTimer < 20000) {
    ctx.drawImage(vlagImgLeft, paddleX - 5, canvas.height - paddleHeight - 40, 45, 45);
    ctx.drawImage(vlagImgRight, paddleX + paddleWidth - 31, canvas.height - paddleHeight - 40, 45, 45);
  } else if (flagsOnPaddle && Date.now() - flagTimer >= 20000) {
    flagsOnPaddle = false;
  }
}


function shootFromFlags() {
  const coinSpeed = 8;

  // Linkervlag
  flyingCoins.push({
    x: paddleX - 5 + 12,
    y: canvas.height - paddleHeight - 40,
    dy: -coinSpeed,
    active: true
  });

  // Rechtervlag
  flyingCoins.push({
    x: paddleX + paddleWidth - 19 + 12,
    y: canvas.height - paddleHeight - 40,
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
              document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

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
          document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

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
    time: timeFormatted
  };

  let highscores = JSON.parse(localStorage.getItem("highscores")) || [];

  if (!highscores.some(h => h.name === newScore.name && h.score === newScore.score && h.time === newScore.time)) {
    highscores.push(newScore);
  }

  highscores.sort((a, b) => {
    if (b.score === a.score) {
      const [amin, asec] = a.time.split(":").map(Number);
      const [bmin, bsec] = b.time.split(":").map(Number);
      return (amin * 60 + asec) - (bmin * 60 + bsec);
    }
    return b.score - a.score;
  });

  highscores = highscores.slice(0, 10);
  localStorage.setItem("highscores", JSON.stringify(highscores));

  const list = document.getElementById("highscore-list");
  if (list) {
    list.innerHTML = "";
    highscores.forEach((entry, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1} ${entry.name} - ${entry.score} pxp - ${entry.time}`;
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

          document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";
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

    const coinBottom = coin.y + coin.radius;
    const paddleTop = canvas.height - paddleHeight;

    // Paddle vangt muntje
    if (
      coinBottom >= paddleTop &&
      coinBottom <= canvas.height &&
      coin.x + coin.radius > paddleX &&
      coin.x < paddleX + paddleWidth
    ) {
      coin.active = false;

      const earned = doublePointsActive ? 20 : 10;
      score += earned;
      document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

      coinSound.currentTime = 0;
      coinSound.play();

      pointPopups.push({
        x: coin.x,
        y: coin.y,
        value: "+" + earned + " pxp",
        alpha: 1
      });
    }

    // Coin valt uit beeld zonder vangst
    else if (coinBottom > canvas.height) {
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
              document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

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
          document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

          spawnCoin(b.x, b.y);
        }
      }
    }
  });
}


function spawnExtraBall(originBall) {
  const speed = Math.sqrt(originBall.dx ** 2 + originBall.dy ** 2);

  // Huidige bal krijgt een lichte afwijking
  originBall.dx = -1;
  originBall.dy = -Math.abs(speed);

  // Tweede bal gaat recht omhoog
  balls.push({
    x: originBall.x,
    y: originBall.y,
    dx: 0,
    dy: -speed,
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



function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  collisionDetection();
  drawCoins();
  checkCoinCollision();
  drawBricks();
  drawPaddle();
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
      ball.y = canvas.height - paddleHeight - ballRadius * 2;
    }

    if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
      ball.dx *= -1;
      wallSound.currentTime = 0;
      wallSound.play();
    }
    if (ball.y < ball.radius) {
      ball.dy *= -1;
      wallSound.currentTime = 0;
      wallSound.play();
    }

    if (
      ball.y + ball.dy > canvas.height - paddleHeight - ball.radius &&
      ball.y + ball.dy < canvas.height + 2 &&
      ball.x + ball.radius > paddleX &&
      ball.x - ball.radius < paddleX + paddleWidth
    ) {
      const hitPos = (ball.x - paddleX) / paddleWidth;
      const angle = (hitPos - 0.5) * Math.PI / 2;
      const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
      ball.dx = speed * Math.sin(angle);
      ball.dy = -Math.abs(speed * Math.cos(angle));

      wallSound.currentTime = 0;
      wallSound.play();
    }


    
 if (ball.y + ball.dy > canvas.height) {
   balls.splice(index, 1);

  if (balls.length === 0 && !paddleExploding) {
    triggerPaddleExplosion(); // 💥 start explosie + animatie + reset
    return;
  } else if (ball.isMain && balls.length > 0) {
    balls[0].isMain = true;
  }

  return;
}



    ctx.drawImage(ballImg, ball.x, ball.y, ball.radius * 2, ball.radius * 2);
  });

  // Paddle bewegen
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 7;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 7;
  }

  if (rocketActive && !rocketFired && rocketAmmo > 0) {
    rocketX = paddleX + paddleWidth / 2 - 12;
    rocketY = canvas.height - paddleHeight - 48;
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

  if (speedBoostActive && Date.now() - speedBoostStart >= speedBoostDuration) {
  speedBoostActive = false;
}

// Zakjes tekenen en vangen
for (let i = pxpBags.length - 1; i >= 0; i--) {
  let bag = pxpBags[i];
  bag.y += bag.dy;

  ctx.drawImage(pxpBagImg, bag.x - 20, bag.y, 40, 40);

  const bagBottom = bag.y + 40;
  const paddleTop = canvas.height - paddleHeight;

  if (
    bagBottom >= paddleTop &&
    bagBottom <= canvas.height &&
    bag.x > paddleX &&
    bag.x < paddleX + paddleWidth
  ) {
    pxpBagSound.currentTime = 0;
    pxpBagSound.play(); // 🎵 Speel geluid als zakje wordt gevangen

    const earned = doublePointsActive ? 160 : 80;
    score += earned;
    document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

    pointPopups.push({
      x: bag.x,
      y: bag.y,
      value: "+" + earned + " pxp",
      alpha: 1
    });

    pxpBags.splice(i, 1);
  } else if (bag.y > canvas.height) {
    pxpBags.splice(i, 1);
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

// 🧱 Steenpuin tekenen – altijd uitvoeren
stoneDebris.forEach(p => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(140, 120, 100, ${p.alpha})`; // Bruin-grijze kleur
  ctx.fill();
  p.x += p.dx;
  p.y += p.dy;
  p.alpha -= 0.02;
});
stoneDebris = stoneDebris.filter(p => p.alpha > 0);

// Extra updates onderaan draw()
smokeParticles = smokeParticles.filter(p => p.alpha > 0);

requestAnimationFrame(draw);
} // ⬅️ Deze sluit de draw() functie correct af




function onImageLoad() {
  imagesLoaded++;
  console.log("Afbeelding geladen:", imagesLoaded);

  if (imagesLoaded === 16) {
    resetBricks();  // <-- deze toevoegen!
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

    if (!timerRunning) startTimer();
    score = 0;
    document.getElementById("scoreDisplay").textContent = "score 0 pxp.";
  }
});



function startTimer() {
  if (timerRunning) return; // ✅ voorkomt dubbele timers
  timerRunning = true;
  timerInterval = setInterval(() => {
    elapsedTime++;
    const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const seconds = String(elapsedTime % 60).padStart(2, '0');
    document.getElementById("timeDisplay").textContent = "time " + minutes + ":" + seconds;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  elapsedTime = 0;
  document.getElementById("timeDisplay").textContent = "time 00:00";
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
  paddleExploding = true;
  paddleExplosionParticles = [];

  // Maak 50 deeltjes aan die uit elkaar vliegen
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

  const paddleExplodeSound = new Audio("paddle_explode.mp3");
  paddleExplodeSound.play();

  // ⏱️ Na 1 seconde paddle resetten + alles wissen
  setTimeout(() => {
    stopTimer();               // ⏹️ Timer stoppen en terug op 00:00 zetten
    ballReleased = false;      // ⛔ Timer pas starten bij volgende afvuuractie

    paddleExploding = false;
    paddleExplosionParticles = [];

    speedBoostActive = false;
    doublePointsActive = false;
    flagsOnPaddle = false;
    rocketActive = false;
    rocketFired = false;
    rocketAmmo = 0;
    flyingCoins = [];
    smokeParticles = [];
    explosions = [];
    coins = [];
    pxpBags = [];

    saveHighscore();
    resetBricks();
    resetBall();
  }, 1000);
}
