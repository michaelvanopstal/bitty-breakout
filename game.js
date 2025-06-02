
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let ballRadius = 8;
let dx = 4;
let dy = -4;
let ballLaunched = false;
        stopTimer();
        timerStarted = false;
let x;
let y;
let paddleHeight = 10;
let paddleWidth = 100;
let paddleX = 0;
let rightPressed = false;
let leftPressed = false;

const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = canvas.width / brickColumnCount;
const brickHeight = 60;

const bricks = [];
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
document.addEventListener("click", () => {
  if (!ballLaunched) ballLaunched = true;
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "ArrowUp" || e.key === "Up") && !ballLaunched) ballLaunched = true;
});

function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
}

function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) paddleX = relativeX - paddleWidth / 2;
}

function drawBricks() {
  const img = new Image();
  img.src = "block_logo.png";
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * brickWidth;
        const brickY = r * brickHeight;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.drawImage(img, brickX, brickY, brickWidth, brickHeight);
      }
    }
  }
}

function drawBall() {
  const img = new Image();
  img.src = "ball_logo.png";
  ctx.drawImage(img, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.closePath();
}

function drawScore() {
  const scoreDiv = document.getElementById("scoreDisplay");
  if (scoreDiv) {
    scoreDiv.innerHTML = "Score: " + score + " pxp";
  }
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        const ballLeft = x - ballRadius;
        const ballRight = x + ballRadius;
        const ballTop = y - ballRadius;
        const ballBottom = y + ballRadius;

        if (
          ballRight > b.x &&
          ballLeft < b.x + brickWidth &&
          ballBottom > b.y &&
          ballTop < b.y + brickHeight
        ) {
          dy = -dy;
          b.status = 0;
          score += 10;
        }
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();

  if (!timerStarted && ballLaunched) {
    startTimer();
    timerStarted = true;
  }

  let steps = 4;
  for (let i = 0; i < steps; i++) {
    if (ballLaunched) {
      x += dx / steps;
      y += dy / steps;
      collisionDetection();
    } else {
      x = paddleX + paddleWidth / 2;
      y = canvas.height - paddleHeight - ballRadius - 2;
    }

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
    if (y + dy < ballRadius) dy = -dy;
    else if (y + dy > canvas.height - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        let hitPoint = x - (paddleX + paddleWidth / 2);
        dx = hitPoint * 0.3;
        dx = Math.max(-6, Math.min(6, dx));
        dy = -Math.abs(dy);
      } else {
        ballLaunched = false;
        stopTimer();
        timerStarted = false;
        score = 0;
        for (let c = 0; c < brickColumnCount; c++) {
          for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
          }
        }
        x = paddleX + paddleWidth / 2;
        y = canvas.height - paddleHeight - ballRadius - 2;
      }
    }

    dx = Math.max(-6, Math.min(6, dx));
    dy = Math.max(-6, Math.min(6, dy));
  }

  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
  else if (leftPressed && paddleX > 0) paddleX -= 7;

  requestAnimationFrame(draw);
}

draw();


// TIMER VARIABELEN
let timerStarted = false;
let timerInterval;
let startTime;

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const timerDiv = document.getElementById("timerDisplay");
    if (timerDiv) timerDiv.textContent = elapsedTime;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}
