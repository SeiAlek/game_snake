'use strict';

const btnStartSnake = document.querySelector('#start-snake');
const game = document.querySelector('.game');

btnStartSnake.addEventListener('click', () => {
  btnStartSnake.classList.add('hide');
  initGame(game, 16);
});

function initGame(container, grid) {
  const width = grid * 25;
  const height = grid * 30;
  const colorSnake = '#204051';
  const colorFood = '#ff0000';
  const fpsBase = 5;

  document.addEventListener('keydown', handleKeyPress);

  canvasInit();

  const canvas = container.querySelector('.game__field');
  const context = canvas.getContext('2d');

  let fps = fpsBase;
  let score = 0;
  let live = 3;
  let cooldown = false;

  const snake = {
    setVelocity(x, y) {
      this.dx = x;
      this.dy = y;
    },

    moving() {
      this.x += snake.dx;
      this.y += snake.dy;

      if (this.x < 0) {
        this.x = canvas.width - grid;
      } else if (this.x >= canvas.width) {
        this.x = 0;
      }

      if (this.y < 0) {
        this.y = canvas.height - grid;
      } else if (this.y >= canvas.height) {
        this.y = 0;
      }
    },

    handleLength() {
      this.cells.unshift(
        {
          x: snake.x,
          y: snake.y,
        }
      );

      if (this.cells.length > this.length) {
        this.cells.pop();
      }
    },

    drawing() {
      context.fillStyle = colorSnake;

      this.cells.forEach((cell, index) => {
        context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        this.checkAppleCollision(cell);
        this.checkSelfCollision(cell, index);
      });
    },

    checkAppleCollision(cell) {
      if (cell.x === apple.x && cell.y === apple.y) {
        this.length++;
        updateScore(score);
        apple.reset();
      }
    },

    checkSelfCollision(cell, index) {
      for (let i = index + 1; i < this.cells.length; i++) {
        if (cell.x === this.cells[i].x && cell.y === this.cells[i].y) {
          updateLive();
        }
      }
    },

    reset() {
      this.x = 160;
      this.y = 160;
      this.cells = [];
      this.length = 4;
      this.dx = grid;
      this.dy = 0;
    },
  };

  const apple = {
    drawing() {
      context.fillStyle = colorFood;
      context.fillRect(this.x, this.y, grid - 1, grid - 1);
    },

    reset() {
      this.x = getRandomCoord();
      this.y = getRandomCoord();
    },
  };

  resetGame();
  drawScorePanel(score, live);
  loop();

  function loop() {
    setTimeout(function() {
      requestAnimationFrame(loop);
      clearField();
      snake.moving();
      snake.handleLength();
      apple.drawing();
      snake.drawing();
    }, 1000 / fps);
  }

  function handleKeyPress(e) {
    if (cooldown) {
      return false;
    }

    if ((e.key === 'ArrowUp' || e.keyCode === 87) && !(snake.dy > 0)) {
      snake.setVelocity(0, -grid);
    }

    if ((e.key === 'ArrowDown' || e.keyCode === 83) && !(snake.dy < 0)) {
      snake.setVelocity(0, grid);
    }

    if ((e.key === 'ArrowLeft' || e.keyCode === 65) && !(snake.dx > 0)) {
      snake.setVelocity(-grid, 0);
    }

    if ((e.key === 'ArrowRight' || e.keyCode === 68) && !(snake.dx < 0)) {
      snake.setVelocity(grid, 0);
    }

    cooldown = true;

    setTimeout(() => {
      cooldown = false;
    }, 100);
  }

  function clearField() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function canvasInit() {
    container.insertAdjacentHTML('afterbegin', `
      <div class="game__field-bg">
        <canvas
          class="game__field"
          width="${width}"
          height="${height}"
        ></canvas>
      </div>
    `);
  }

  function drawScorePanel() {
    container.insertAdjacentHTML('afterbegin', `
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

    snake.reset();
    apple.reset();
    updateSpeed(fpsBase);

    live--;
    value.innerHTML = live;

    if (live === 0) {
      endGame();
    }
  }

  function updateSpeed(rate) {
    if (rate) {
      fps = rate;
    }

    if (score % 5 === 0) {
      fps++;
    }
  }

  function getRandomCoord() {
    const min = 0;
    const max = canvas.width / grid;
    const randomNum = Math.floor(Math.random() * (max - min)) + min;
    const randomCoord = randomNum * grid;

    return randomCoord;
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

    fps = fpsBase;
    score = 0;
    live = 3;

    apple.reset();
    snake.reset();
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
