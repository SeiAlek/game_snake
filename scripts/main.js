'use strict';

initGame();

function initGame() {
  const container = document.querySelector('.game');

  container.insertAdjacentHTML('afterbegin', `
    <div class="game__container">
      <img src="./images/snake.svg" class="game__image" alt="Snake Game" />
      <input
        id="user-nick-name"
        type="text"
        class="game__input"
        pattern="[A-Za-z]{0,8}"
        placeholder="Input Your Name"
      />
      <button id="start-snake" class="game__start-btn">Start</button>
    </div>
  `);

  const btnStartSnake = document.querySelector('#start-snake');
  const gameImage = document.querySelector('.game__image');
  const userNickName = document.querySelector('#user-nick-name');

  btnStartSnake.addEventListener('click', (e) => {
    btnStartSnake.classList.add('hide');
    gameImage.classList.add('hide');
    userNickName.classList.add('hide');

    game(container, userNickName.value);
  });
}

function game(container, userNickName) {
  const clientHeight = document.documentElement.clientHeight;
  const clientWidth = document.documentElement.clientWidth;

  const grid = 16;
  let width = grid * 30;
  let height = grid * 40;
  const colorSnake = '#204051';
  const colorFood = '#ff0000';
  const fpsBase = 3;

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
  let pause = false;

  const user = {
    nickName: userNickName || 'NoName',
    score: 0,
    roundScore: 0,
    distance: 0,
    live: 3,

    reset() {
      this.score = 0;
      this.roundScore = 0;
      this.distance = 0;
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
      user.distance += 1;

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
      this.length = 14;
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

  const setNewVelocity = trottle(setVelocity, 1000 / fps);

  startGame();
  drawControlPanel();
  loop();

  document.addEventListener('keydown', handleKeyDown);
  container.addEventListener('touchstart', handleTouchStart);
  container.addEventListener('touchmove', handleTouch);
  container.addEventListener('touchend', handleTouchEnd);

  document.addEventListener('click', pauseButton);
  document.addEventListener('keydown', pauseKeys);
  document.addEventListener('click', initRestartGame);

  function trottle(f, delay) {
    let isBussy = false;
    let savedCoords = null;

    return function wrapper(...args) {
      if (isBussy) {
        savedCoords = args;

        return;
      }

      isBussy = true;
      savedCoords = null;
      f(...args);

      setTimeout(() => {
        isBussy = false;

        if (savedCoords) {
          wrapper(...savedCoords);
        }
      }, delay);
    };
  }

  function setVelocity(x, y) {
    snake.dx = x;
    snake.dy = y;
  }

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

  function handleKeyDown(e) {
    if ((e.key === 'ArrowUp' || e.keyCode === 87) && (snake.dy === 0)) {
      setNewVelocity(0, -grid);
    }

    if ((e.key === 'ArrowDown' || e.keyCode === 83) && (snake.dy === 0)) {
      setNewVelocity(0, grid);
    }

    if ((e.key === 'ArrowLeft' || e.keyCode === 65) && (snake.dx === 0)) {
      setNewVelocity(-grid, 0);
    }

    if ((e.key === 'ArrowRight' || e.keyCode === 68) && (snake.dx === 0)) {
      setNewVelocity(grid, 0);
    }
  }

  function handleTouchStart(e) {
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
      setNewVelocity(-grid, 0);

      return;
    }

    if (
      ((swipe.initX - actualX) < -swipe.threshold)
      && (snake.dx === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(grid, 0);

      return;
    }

    if (
      ((swipe.initY - actualY) > swipe.threshold)
      && (snake.dy === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(0, -grid);

      return;
    }

    if (
      ((swipe.initY - actualY) < -swipe.threshold)
      && (snake.dy === 0)
    ) {
      swipe.setRotationCoords(actualX, actualY);
      setNewVelocity(0, grid);
    }
  }

  function handleTouchEnd() {
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
    const printedName = (user.nickName.length > 8)
      ? user.nickName.slice(0, 5) + '...'
      : user.nickName;

    container.insertAdjacentHTML('afterbegin', `
      <section class="game__control control">
        <div class="control__score">
          ${printedName}:&nbsp;
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
    user.roundScore++;
    value.innerHTML = user.score;
    updateSpeed();
  }

  function updateLive() {
    const value = container.querySelector('.control__live');

    resetRound();

    user.live--;
    user.roundScore = 0;
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

  function updateSpeed() {
    if (user.roundScore % 5 === 0) {
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

  function resetRound() {
    fps = fpsBase;

    apple.reset();
    snake.reset();
  }

  function startGame() {
    const popupBlock = document.querySelector('.popup');
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

    if (popupBlock) {
      popupBlock.remove();
    }

    pause = false;
    loop();
  }

  function initRestartGame(e) {
    if (!e.target.closest('.control__restart')) {
      return;
    }
    popup();
    confirmRestartGame();
  }

  function confirmRestartGame() {
    const popupBlock = document.querySelector('.popup');

    popupBlock.addEventListener('click', (e) => {
      if (e.target.closest('.popup__button--cancel')) {
        popupBlock.remove();
        pause = false;
        loop();

        return;
      }

      if (e.target.closest('.popup__button--apply')) {
        startGame();
      }
    });
  }

  function pauseButton(e) {
    if (e.target.closest('.control__pause')) {
      pauseGame();
    }
  }

  function pauseKeys(e) {
    if (e.keyCode === 80) {
      pauseGame();
    }
  }

  function pauseGame(e) {
    const controlBtn = container.querySelector('.control__pause');

    controlBtn.classList.toggle('control__pause--active');
    pause = !pause;
    loop();
  }

  function endGame() {
    const controlPanel = container.querySelector('.control');
    const btnStartSnake = document.querySelector('#start-snake');

    saveScores();
    canvas.remove();
    controlPanel.remove();
    btnStartSnake.classList.remove('hide');

    container.insertAdjacentHTML('afterbegin', `
      <div class="game__congrat">
        <img src="./images/snake.svg" class="game__image">
        <h2>Congratulation!</h2>
        You result: ${user.score}!
      </div>
    `);

    printHighScoresTable();
  }

  function saveScores() {
    const highScores = JSON.parse(localStorage.getItem('snake')) || {};

    const userResult = {
      nickName: user.nickName,
      score: user.score,
      distance: user.distance,
      date: Date.now(),
    };

    highScores[userResult.date] = userResult;

    const highScoresArray = Object.entries(highScores)
      .sort((a, b) => sortHighScores(a[1], b[1]));

    const newHighScores = {};

    for (let i = 0; i < highScoresArray.length; i++) {
      if (i > 4) {
        break;
      }

      const scoreName = highScoresArray[i][0];
      const scoreValue = highScoresArray[i][1];

      newHighScores[scoreName] = scoreValue;
    }

    localStorage.setItem('snake', JSON.stringify(newHighScores));
  }

  function printHighScoresTable() {
    let highScores = Object.entries(
      JSON.parse(localStorage.getItem('snake')
      ));

    highScores = highScores.sort((a, b) => sortHighScores(a[1], b[1]));

    container.insertAdjacentHTML('beforeend', `
      <div class="game__container">
        <table class="game__high-score">
          <tr>
            <th>Date</th>
            <th>Nick</th>
            <th>Score</th>
          </tr>
          ${highScores.map(item => {
            const row = `
              <tr>
                <td>
                  ${new Date(item[1].date).getDate()}.

                  ${new Date(item[1].date).getMonth() + 1}.
                  ${new Date(item[1].date).getFullYear()}
                </td>
                <td>
                  ${item[1].nickName}
                </td>
                <td>
                  ${item[1].score}
                </td>
              </tr>
            `;

            return row;
          })}
        </table>
      </div>
    `);
  }

  function sortHighScores(a, b) {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    return b.date - a.date;
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
