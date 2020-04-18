'use strict';

const btnStartSnake = document.querySelector('#start-snake');
const game = document.querySelector('.game');

btnStartSnake.addEventListener('click', () => {
  btnStartSnake.classList.add('hide');
  initGame(game);
});

function initGame(container) {
  const grid = 16;
  const width = grid * 25;
  const height = grid * 25;
  const colorSnake = '#204051';
  const colorFood = '#ff0000';

  container.insertAdjacentHTML('afterbegin', `
    <div class="game__field-bg">
      <canvas
        class="game__field"
        width="${width}"
        height="${height}"
      ></canvas>
    </div>
  `);
  requestAnimationFrame(loop);

  const canvas = container.querySelector('.game__field');
  const context = canvas.getContext('2d');

  let speed = 0;
  let speedRate = 10;
  let score = 0;
  let live = 3;
  let cooldown = false;

  const snake = {};
  const apple = {};

  resetGame();
  drawScorePanel(score, live);

  document.addEventListener('keydown', handleKeyPress);

  function loop() {
    requestAnimationFrame(loop);

    if (++speed < speedRate) {
      return;
    }
    speed = 0;

    clearField();
    moveSnake();
    drawSnake();
    drawApple();
    checkCollisions();
  }

  function handleKeyPress(e) {
    if (cooldown) {
      return false;
    }

    if ((e.key === 'ArrowUp' || e.keyCode === 87) && !(snake.dy > 0)) {
      setVelocity(0, -grid);
    }

    if ((e.key === 'ArrowDown' || e.keyCode === 83) && !(snake.dy < 0)) {
      setVelocity(0, grid);
    }

    if ((e.key === 'ArrowLeft' || e.keyCode === 65) && !(snake.dx > 0)) {
      setVelocity(-grid, 0);
    }

    if ((e.key === 'ArrowRight' || e.keyCode === 68) && !(snake.dx < 0)) {
      setVelocity(grid, 0);
    }

    cooldown = true;

    setTimeout(() => {
      cooldown = false;
    }, 100);
  }

  function setVelocity(x, y) {
    snake.dx = x;
    snake.dy = y;
  }

  function moveSnake() {
    snake.x += snake.dx;
    snake.y += snake.dy;

    if (snake.x < 0) {
      snake.x = canvas.width - grid;
    } else if (snake.x >= canvas.width) {
      snake.x = 0;
    }

    if (snake.y < 0) {
      snake.y = canvas.height - grid;
    } else if (snake.y >= canvas.height) {
      snake.y = 0;
    }
  }

  function drawSnake() {
    snake.cells.unshift(
      {
        x: snake.x,
        y: snake.y,
      }
    );

    if (snake.cells.length > snake.length) {
      snake.cells.pop();
    }
  }

  function drawApple() {
    context.fillStyle = colorFood;
    context.fillRect(apple.x, apple.y, grid - 1, grid - 1);
  }

  function checkCollisions() {
    context.fillStyle = colorSnake;

    snake.cells.forEach(function(cell, index) {
      context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

      checkAppleCollision(cell);
      checkSelfCollision(cell, index);
    });
  }

  function checkAppleCollision(cell) {
    if (cell.x === apple.x && cell.y === apple.y) {
      snake.length++;
      updateScore(score);
      resetApple();
    }
  }

  function checkSelfCollision(cell, index) {
    for (let i = index + 1; i < snake.cells.length; i++) {
      if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
        updateLive();
      }
    }
  }

  function resetApple() {
    apple.x = getRandomCoord();
    apple.y = getRandomCoord();
  }

  function resetSnake() {
    snake.x = 160;
    snake.y = 160;
    snake.cells = [];
    snake.length = 4;
    snake.dx = grid;
    snake.dy = 0;
  }

  function resetGame() {
    const congrat = container.querySelector('.game__congrat');
    const scorePanel = container.querySelector('.game__score-panel');

    if (congrat) {
      congrat.remove();
    }

    if (scorePanel) {
      scorePanel.remove();
    }

    speed = 0;
    speedRate = 10;
    score = 0;
    live = 3;

    resetApple();
    resetSnake();
  }

  function clearField() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawScorePanel() {
    canvas.insertAdjacentHTML('beforebegin', `
      <section class="game__score-panel">
        <div class="game__score">
          Score:
          <span class="game__score-value">${score}</span>
        </div>
        <div class="game__live">Live:
          <span class="game__live-value">${live}</span>
        </div>
      </section>
    `);
  }

  function updateScore() {
    const value = container.querySelector('.game__score-value');

    score++;
    value.innerHTML = score;
    updateSpeed();
  }

  function updateLive() {
    const value = container.querySelector('.game__live-value');

    resetSnake();
    resetApple();
    updateSpeed(10);

    live--;
    value.innerHTML = live;

    if (live === 0) {
      endGame();
    }
  }

  function updateSpeed(rate) {
    if (rate) {
      speedRate = rate;
    }

    if (score % 5 === 0 && speedRate > 1) {
      speedRate--;
    }
  }

  function getRandomCoord() {
    const min = 0;
    const max = canvas.width / grid;
    const randomNum = Math.floor(Math.random() * (max - min)) + min;
    const randomCoord = randomNum * grid;

    return randomCoord;
  }

  function endGame() {
    const scoreBlock = container.querySelector('.game__score');
    const liveBlock = container.querySelector('.game__live');

    canvas.remove();
    liveBlock.remove();
    scoreBlock.classList.add('game__score--center');
    btnStartSnake.classList.remove('hide');

    container.insertAdjacentHTML('afterbegin', `
      <div class="game__congrat">
        <img src="./images/snake.svg" class="game__image">
        <h2>Congratulation!</h2>
      </div>
    `);
  }
}
