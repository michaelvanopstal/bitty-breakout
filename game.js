const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let elapsedTime = 0;
let timerInterval = null;
let timerRunning = false;
let score = 0;
let ballRadius = 8;
let ballLaunched = false;
let paddleHeight = 15;
let paddleWidth = 120;
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




let speedBoostActive = false;
let speedBoostStart = 0;
const speedBoostDuration = 30000;
const speedBoostMultiplier = 1;

balls.push({
  x: canvas.width / 2,
  y: canvas.height - paddleHeight - 10,
  dx: 6,
  dy: -6,
  radius: 8,
  isMain: true
});




const bonusBricks = [
  { col: 6, row: 8, type: "rocket" },
  { col: 8, row: 6, type: "power" },
  { col: 2, row: 9, type: "doubleball" },
  { col: 4, row: 7, type: "2x" },
  { col: 5, row: 10, type: "speed" }

];

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



let speedMultiplier = (speedBoostActive && Date.now() - speedBoostStart < speedBoostDuration) ? speedBoostMultiplier : 1;

let rocketActive = false; // Voor nu altijd zichtbaar om te testen
let rocketX = 0;
let rocketY = 0;

  

console.log("keydown-handler wordt nu actief");

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler);

function keyDownHandler(e) {
  console.log("Toets ingedrukt:", e.key);

  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;

if ((e.key === "ArrowUp" || e.key === "Up") && !ballLaunched) {
  ballLaunched = true;
  ballMoving = true;

  // 🎯 Speel schiet-geluid af
  shootSound.currentTime = 0;
  shootSound.play();

  balls[0].dx = 0;
  balls[0].dy = -6;
  if (!timerRunning) startTimer();
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
    resetBall();    // ✅ Zorg dat dit hier staat
    resetPaddle();
    startTime = new Date();
    gameOver = false;
    document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";
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
         default:
         ctx.drawImage(blockImg, brickX, brickY, brickWidth, brickHeight);
         break;
         case "speed":
         ctx.drawImage(speedImg, brickX, brickY, brickWidth, brickHeight);
         break;

        
        }
      }
    }
  }
}

function drawPointPopups() {
  pointPopups.forEach(p => {
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = `rgba(255, 215, 0, ${p.alpha})`; // goudkleurig + fading
    ctx.fillText(p.value, p.x, p.y);
    p.y -= 1;
    p.alpha -= 0.02;
  });

  // Verwijder vervaagde popups
  pointPopups = pointPopups.filter(p => p.alpha > 0);
}


function resetBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;

      // Bonusblok opnieuw instellen
      const bonus = bonusBricks.find(b => b.col === c && b.row === r);
      bricks[c][r].type = bonus ? bonus.type : "normal";
    }
  }
}


function drawPaddle() {
  ctx.drawImage(pointpayPaddleImg, paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
}



function resetBall() {
  balls = [{
    x: paddleX + paddleWidth / 2 - ballRadius,
    y: canvas.height - paddleHeight - ballRadius * 2,
    dx: 0,
    dy: -6,
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
          // ➕ Activeer bonus indien van toepassing
          switch (b.type) {
            case "power":
              flagsOnPaddle = true;
              flagTimer = Date.now();
              break;
            case "rocket":
              rocketActive = true;
              rocketAmmo += 3;
              break;
            case "doubleball":
              spawnExtraBall(balls[0]);
              break;
            case "2x":
              doublePointsActive = true;
              doublePointsStartTime = Date.now();
              break;
            case "speed":
              speedBoostActive = true;
              speedBoostStart = Date.now();
              break;
          }

          // ❌ Blok uitschakelen
          b.status = 0;
          b.type = "normal";

          // 🪙 Puntentelling en feedback
          const earned = doublePointsActive ? 20 : 10;
          score += earned;
          document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

          // 💰 Speel munt-geluid
          coinSound.currentTime = 0;
          coinSound.play();

          // ✨ Punt-popup laten zien
          pointPopups.push({
            x: coin.x,
            y: coin.y,
            value: "+" + earned,
            alpha: 1
          });

          // 🧹 Zet muntje uit
          coin.active = false;

          return;
        }
      }
    }
  });
}



  

  function saveHighscore() {
  const timeText = document.getElementById("timeDisplay").textContent.replace("time ", "");
  const highscore = {
    name: window.currentPlayer || "Unknown",
    score: score,
   time: timeText
    
  };

  let highscores = JSON.parse(localStorage.getItem("highscores")) || [];
  if (!highscores.some(h => h.name === highscore.name && h.score === highscore.score && h.time === highscore.time)) {
    highscores.push(highscore);
  }
  highscores.sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
  highscores = highscores.slice(0, 10);
  localStorage.setItem("highscores", JSON.stringify(highscores));

  const list = document.getElementById("highscore-list");
  list.innerHTML = "";
  highscores.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1} ${entry.name} - ${entry.score} pxp - ${entry.time}`;
    list.appendChild(li);
  });
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

      if (b.status === 1 &&
          rocketX + 12 > b.x &&
          rocketX + 12 < b.x + brickWidth &&
          rocketY < b.y + brickHeight &&
          rocketY + 48 > b.y) {

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

            // ➕ Activeer bonus als het een bonusblok is
            switch (target.type) {
              case "power":
                flagsOnPaddle = true;
                flagTimer = Date.now();
                break;
              case "rocket":
                rocketActive = true;
                rocketAmmo += 3;
                break;
              case "doubleball":
                spawnExtraBall(balls[0]); // neem eerste bal als basis
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


        // Stop bonus als ammo op is
        if (rocketAmmo <= 0) {
          rocketActive = false;
        }

        return;
      }
    }
  }
}

function checkCoinCollision() {
  coins.forEach((coin) => {
    if (
      coin.active &&
      coin.y + coin.radius > canvas.height - paddleHeight &&
      coin.x > paddleX &&
      coin.x < paddleX + paddleWidth
    ) {
      const earned = doublePointsActive ? 20 : 10;
      score += earned;
      coin.active = false;

      // 🎵 Speel geld-geluid
      coinSound.currentTime = 0;
      coinSound.play();

      // ✨ Toon +10 of +20 boven muntje
      pointPopups.push({
        x: coin.x,
        y: coin.y,
        value: "+" + earned,
        alpha: 1
      });

      document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";
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
          // 🎯 Speel blok-geluid
          blockSound.currentTime = 0;
          blockSound.play();

          // Richting van bal omkeren
          ball.dy = -ball.dy;

          // ➕ Activeer bonus indien van toepassing
          switch (b.type) {
            case "power":
              flagsOnPaddle = true;
              flagTimer = Date.now();
              break;
            case "rocket":
              rocketActive = true;
              rocketAmmo = 3;
              break;
            case "doubleball":
              spawnExtraBall(ball);
              break;
            case "2x":
              doublePointsActive = true;
              doublePointsStartTime = Date.now();
              break;
            case "speed":
              speedBoostActive = true;
              speedBoostStart = Date.now();
              break;
          }

          // Blok verwijderen
          b.status = 0;
          b.type = "normal";

          // Score verhogen
          score += doublePointsActive ? 20 : 10;
          document.getElementById("scoreDisplay").textContent = "score " + score + " pxp.";

          // 💰 Muntje spawnen (zonder geluid hier)
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
  // Verplaats bal (met eventuele slow-motion)
  if (ballLaunched) {
    let speedMultiplier = (speedBoostActive && Date.now() - speedBoostStart < speedBoostDuration)
      ? speedBoostMultiplier
      : 1;
    ball.x += ball.dx * speedMultiplier;
    ball.y += ball.dy * speedMultiplier;
  } else {
    ball.x = paddleX + paddleWidth / 2 - ballRadius;
    ball.y = canvas.height - paddleHeight - ballRadius * 2;
  }

  // Muurbotsing
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

  // Paddle-botsing
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

  // Bal uit beeld → leven verloren
  if (ball.y + ball.dy > canvas.height) {
    balls.splice(index, 1);

    if (balls.length === 0) {
      // 🔁 Reset bonussen en tijdelijke effecten
      speedBoostActive = false;
      doublePointsActive = false;
      flagsOnPaddle = false;
      rocketActive = false;
      rocketFired = false;
      rocketAmmo = 0;
      flyingCoins = [];
      smokeParticles = [];
      explosions = [];

      saveHighscore();
      resetBricks();
      resetBall();
      return; // stop de draw-loop (wordt opnieuw gestart)
    } else if (ball.isMain) {
      balls[0].isMain = true;
    }

    return; // skip deze bal (hij is verwijderd)
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

smokeParticles = smokeParticles.filter(p => p.alpha > 0);


requestAnimationFrame(draw);
}




function onImageLoad() {
  imagesLoaded++;
  console.log("Afbeelding geladen:", imagesLoaded);

  if (imagesLoaded === 12) {
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




document.addEventListener("mousedown", function () {
  if (rocketActive && rocketAmmo > 0 && !rocketFired) {
    rocketFired = true;
    rocketAmmo--;

    rocketLaunchSound.currentTime = 0;
    rocketLaunchSound.play();
  }
});

// ✅ StartTimer-functie los hieronder
function startTimer() {
  timerRunning = true;
  timerInterval = setInterval(() => {
    elapsedTime++;
    const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
    const seconds = String(elapsedTime % 60).padStart(2, '0');
    document.getElementById("timeDisplay").textContent = "time " + minutes + ":" + seconds;
  }, 1000);
}
