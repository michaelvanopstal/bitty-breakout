
let score = 0;
function updateScore() {
  document.getElementById("score-value").textContent = score;
  score++;
}
setInterval(updateScore, 1000);
