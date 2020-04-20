'use strict';

const btnStartSnake = document.querySelector('#start-snake');
const game = document.querySelector('.game');

btnStartSnake.addEventListener('click', (e) => {
  btnStartSnake.classList.add('hide');

  initGame(game, 16);
});

function initGame(container, grid = 16) {
  const clientHeight = document.documentElement.clientHeight;
  const clientWidth = document.documentElement.clientWidth;

  let width = grid * 30;
  let height = grid * 40;
  const colorSnake = '#204051';
  const colorFood = '#ff0000';
  const fpsBase = 5;

  if (clientWidth < 768) {
    width = clientWidth - (clientWidth % grid);
  }

  if (clientHeight < 1024 && clientWidth < 768) {
    height = (clientHeight - (clientHeight % grid)) - (grid * 6);
  }

  canvasInit();

  const canvas = container.querySelector('.game__field');
  const context = canvas.getContext('2d');

  let fps = fpsBase;
  let cooldown = false;
  let pause = false;

  const user = {
    score: 0,
    live: 3,

    reset() {
      this.score = 0;
      this.live = 3;
    },
  };

  const swipe = {
    threshold: grid * 2,

    setRotationCoords(x, y) {
      this.initX = x;
      this.initY = y;
    },
  };

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
        updateScore(user.score);
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
  drawControlPanel(user.score, user.live);
  loop();

  document.addEventListener('keydown', handleKeyPress);
  container.addEventListener('touchstart', handleTouchStart);
  container.addEventListener('touchmove', handleTouch);
  container.addEventListener('touchend', handleTouchEnd);

  document.addEventListener('click', pauseGame);
  document.addEventListener('click', restartGame);

  function loop() {
    if (pause) {
      return;
    }

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

    if ((e.key === 'ArrowUp' || e.keyCode === 87) && (snake.dy === 0)) {
      snake.setVelocity(0, -grid);
    }

    if ((e.key === 'ArrowDown' || e.keyCode === 83) && (snake.dy === 0)) {
      snake.setVelocity(0, grid);
    }

    if ((e.key === 'ArrowLeft' || e.keyCode === 65) && (snake.dx === 0)) {
      snake.setVelocity(-grid, 0);
    }

    if ((e.key === 'ArrowRight' || e.keyCode === 68) && (snake.dx === 0)) {
      snake.setVelocity(grid, 0);
    }

    cooldown = true;

    setTimeout(() => {
      cooldown = false;
    }, 1000 / fps);
  }

  function handleTouchStart(e) {
    if (cooldown) {
      return false;
    }

    const x = e.targetTouches[0].screenX;
    const y = e.targetTouches[0].screenY;

    swipe.setRotationCoords(x, y);
  }

  function handleTouch(e) {
    e.preventDefault();

    const lastTouch = e.targetTouches[0];
    const actualX = lastTouch.screenX;
    const actualY = lastTouch.screenY;

    if (
      ((swipe.initX - actualX) > swipe.threshold)
      && (snake.dx === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      snake.setVelocity(-grid, 0);

      return;
    }

    if (
      ((swipe.initX - actualX) < -swipe.threshold)
      && (snake.dx === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      snake.setVelocity(grid, 0);

      return;
    }

    if (
      ((swipe.initY - actualY) > swipe.threshold)
      && (snake.dy === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      snake.setVelocity(0, -grid);

      return;
    }

    if (
      ((swipe.initY - actualY) < -swipe.threshold)
      && (snake.dy === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      snake.setVelocity(0, grid);
    }
  }

  function handleTouchEnd(e) {
    delete swipe.startX;
    delete swipe.startY;
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

  function drawControlPanel() {
    container.insertAdjacentHTML('afterbegin', `
      <section class="game__control control">
        <div class="control__score">
          Score:
          <span class="control__score-value">${user.score}</span>
        </div>
        <div class="control__buttons">
          <button class="control__button control__restart"></button>
          <button class="control__button control__pause"></button>
        </div>
        <div class="control__live">
          ${drawHeart(user.live)}
        </div>
      </section>
    `);
  }

  function updateScore() {
    const value = container.querySelector('.control__score-value');

    user.score++;
    value.innerHTML = user.score;
    updateSpeed();
  }

  function updateLive() {
    const value = container.querySelector('.control__live');

    snake.reset();
    apple.reset();
    updateSpeed(fpsBase);

    user.live--;
    value.innerHTML = drawHeart(user.live);

    if (user.live === 0) {
      endGame();
    }
  }

  function drawHeart(qty) {
    const heartAlive = `
      <div class="control__heart control__heart-alive"></div>
    `;
    const heartBroken = `
      <div class="control__heart control__heart-broken"></div>
    `;
    const lives = heartAlive.repeat(qty);
    const broken = heartBroken.repeat(3 - qty);

    return broken + lives;
  }

  function updateSpeed(rate) {
    if (rate) {
      fps = rate;
    }

    if (user.score % 5 === 0) {
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
    const scorePanel = container.querySelector('.control');

    if (congrat) {
      congrat.remove();
    }

    if (scorePanel) {
      scorePanel.remove();
    }

    fps = fpsBase;

    user.reset();
    apple.reset();
    snake.reset();
  }

  function restartGame(e) {
    if (!e.target.closest('.control__restart')) {
      return;
    }

    confirmRestartGame();
  }

  function confirmRestartGame() {
    popup();

    const popupBlock = document.querySelector('.popup');

    popupBlock.addEventListener('click', (e) => {
      if (e.target.closest('.popup__button--cancel')) {
        popupBlock.remove();
        pause = false;
        loop();

        return;
      }

      if (e.target.closest('.popup__button--apply')) {
        const congrat = container.querySelector('.game__congrat');
        const score = container.querySelector('.control__score-value');
        const live = container.querySelector('.control__live');

        if (congrat) {
          congrat.remove();
        }

        fps = fpsBase;

        user.reset();
        apple.reset();
        snake.reset();

        if (score) {
          score.innerHTML = user.score;
        }

        if (live) {
          live.innerHTML = drawHeart(user.live);
        }

        popupBlock.remove();
        pause = false;
        loop();
      }
    });
  }

  function pauseGame(e) {
    if (!e.target.closest('.control__pause')) {
      return;
    }

    const controlBtn = container.querySelector('.control__pause');

    controlBtn.classList.toggle('control__pause--active');
    pause = !pause;
    loop();
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

  function popup() {
    pause = true;

    container.insertAdjacentHTML('beforebegin', `
      <div class="game__popup popup">
        <div class="popup__container">
          <h2 class="popup__header">Are you sure?</h2>
          <div class="popup__buttons">
            <button class="popup__button popup__button--cancel">No</button>
            <button class="popup__button popup__button--apply">Yes</button>
          </div>
        </div>
      </div>
    `);
  }
}
