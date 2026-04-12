const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const marioButton = document.getElementById("marioButton");
const snakeButton = document.getElementById("snakeButton");
const restartButton = document.getElementById("restartButton");
const pauseButton = document.getElementById("pauseButton");
const gameTitle = document.getElementById("gameTitle");
const gameHint = document.getElementById("gameHint");

const state = {
  activeGame: null,
  paused: false,
  frameHandle: 0,
  lastTime: 0,
  keys: new Set(),
  mario: null,
  snake: null,
  pointerDirection: null
};

const marioConfig = {
  gravity: 1800,
  moveSpeed: 300,
  jumpVelocity: -650,
  worldWidth: 3000
};

const snakeConfig = {
  gridSize: 24,
  tileSize: 22,
  stepMs: 120
};

const pointerZones = [
  { x: 0, y: 0, w: 0.33, h: 1, action: "left" },
  { x: 0.67, y: 0, w: 0.33, h: 1, action: "right" },
  { x: 0.33, y: 0, w: 0.34, h: 0.5, action: "up" },
  { x: 0.33, y: 0.5, w: 0.34, h: 0.5, action: "down" }
];

function setStatus(title, hint) {
  gameTitle.textContent = title;
  gameHint.textContent = hint;
}

function clearFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function cancelLoop() {
  if (state.frameHandle) {
    cancelAnimationFrame(state.frameHandle);
    state.frameHandle = 0;
  }
}

function enableControls() {
  restartButton.disabled = false;
  pauseButton.disabled = false;
  pauseButton.textContent = state.paused ? "Folytatás" : "Szünet";
}

function resetSharedState() {
  state.paused = false;
  state.lastTime = 0;
  state.keys.clear();
  state.pointerDirection = null;
  enableControls();
}

function startMario() {
  resetSharedState();
  state.activeGame = "mario";
  state.mario = {
    player: { x: 60, y: 370, w: 42, h: 52, vx: 0, vy: 0, onGround: false },
    goalX: 2750,
    cameraX: 0,
    coins: 0,
    won: false,
    gameOver: false,
    platforms: [
      { x: 0, y: 460, w: 540, h: 80 },
      { x: 620, y: 410, w: 180, h: 28 },
      { x: 860, y: 350, w: 190, h: 28 },
      { x: 1120, y: 300, w: 150, h: 28 },
      { x: 1360, y: 460, w: 520, h: 80 },
      { x: 1960, y: 390, w: 180, h: 28 },
      { x: 2200, y: 330, w: 180, h: 28 },
      { x: 2450, y: 270, w: 200, h: 28 },
      { x: 2680, y: 460, w: 320, h: 80 }
    ],
    hazards: [
      { x: 560, y: 500, w: 50, h: 40 },
      { x: 1880, y: 500, w: 50, h: 40 }
    ],
    coinsData: [
      { x: 680, y: 360, r: 10, taken: false },
      { x: 940, y: 300, r: 10, taken: false },
      { x: 1170, y: 250, r: 10, taken: false },
      { x: 2030, y: 340, r: 10, taken: false },
      { x: 2280, y: 280, r: 10, taken: false },
      { x: 2520, y: 220, r: 10, taken: false }
    ]
  };
  setStatus("Mario játék fut", "Irányítás: nyilak vagy A/D, ugrás: W, Fel vagy Space.");
  launchLoop();
}

function startSnake() {
  resetSharedState();
  state.activeGame = "snake";
  const center = Math.floor(snakeConfig.gridSize / 2);
  state.snake = {
    snake: [
      { x: center, y: center },
      { x: center - 1, y: center },
      { x: center - 2, y: center }
    ],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: spawnFood([]),
    score: 0,
    accumulator: 0,
    gameOver: false
  };
  setStatus("Snake játék fut", "Irányítás: nyilak vagy WASD. Érintésnél a vászon szélei vezérelnek.");
  launchLoop();
}

function spawnFood(snakeBody) {
  let food;
  do {
    food = {
      x: Math.floor(Math.random() * snakeConfig.gridSize),
      y: Math.floor(Math.random() * snakeConfig.gridSize)
    };
  } while (snakeBody.some((segment) => segment.x === food.x && segment.y === food.y));
  return food;
}

function launchLoop() {
  cancelLoop();
  clearFrame();
  drawIntroOverlay();
  state.frameHandle = requestAnimationFrame(tick);
}

function drawIntroOverlay() {
  if (state.activeGame === "mario") {
    renderMario(0);
  } else if (state.activeGame === "snake") {
    renderSnake();
  } else {
    renderIdle();
  }
}

function tick(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }
  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.032);
  state.lastTime = timestamp;

  if (!state.paused) {
    if (state.activeGame === "mario") {
      updateMario(delta);
      renderMario(delta);
    } else if (state.activeGame === "snake") {
      updateSnake(delta);
      renderSnake();
    } else {
      renderIdle();
    }
  } else if (state.activeGame === "mario") {
    renderMario(delta);
    drawPaused();
  } else if (state.activeGame === "snake") {
    renderSnake();
    drawPaused();
  } else {
    renderIdle();
  }

  state.frameHandle = requestAnimationFrame(tick);
}

function renderIdle() {
  clearFrame();
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#112742");
  gradient.addColorStop(1, "#07111c");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#eff8ff";
  ctx.font = "700 42px Trebuchet MS";
  ctx.fillText("Mario vagy Snake?", 50, 100);
  ctx.font = "24px Trebuchet MS";
  ctx.fillStyle = "#bfd3e3";
  ctx.fillText("Kattints egy gombra fent, és indul a játék.", 50, 150);

  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(70, 250, 180, 30);
  ctx.fillStyle = "#49b26b";
  ctx.fillRect(70, 310, 240, 30);
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(420, 290, 22, 0, Math.PI * 2);
  ctx.fill();
}

function updateMario(delta) {
  const mario = state.mario;
  const player = mario.player;
  if (mario.won || mario.gameOver) {
    return;
  }

  const left = state.keys.has("ArrowLeft") || state.keys.has("a") || state.pointerDirection === "left";
  const right = state.keys.has("ArrowRight") || state.keys.has("d") || state.pointerDirection === "right";
  const jump = state.keys.has("ArrowUp") || state.keys.has("w") || state.keys.has(" ") || state.pointerDirection === "up";

  player.vx = 0;
  if (left) {
    player.vx = -marioConfig.moveSpeed;
  }
  if (right) {
    player.vx = marioConfig.moveSpeed;
  }
  if (jump && player.onGround) {
    player.vy = marioConfig.jumpVelocity;
    player.onGround = false;
  }

  player.vy += marioConfig.gravity * delta;
  player.x += player.vx * delta;
  player.y += player.vy * delta;
  player.onGround = false;

  for (const platform of mario.platforms) {
    const intersects =
      player.x < platform.x + platform.w &&
      player.x + player.w > platform.x &&
      player.y < platform.y + platform.h &&
      player.y + player.h > platform.y;
    if (!intersects) {
      continue;
    }

    const prevBottom = player.y + player.h - player.vy * delta;
    if (prevBottom <= platform.y + 12 && player.vy >= 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.x + player.w / 2 < platform.x + platform.w / 2) {
      player.x = platform.x - player.w;
    } else {
      player.x = platform.x + platform.w;
    }
  }

  for (const hazard of mario.hazards) {
    if (
      player.x < hazard.x + hazard.w &&
      player.x + player.w > hazard.x &&
      player.y < hazard.y + hazard.h &&
      player.y + player.h > hazard.y
    ) {
      mario.gameOver = true;
      setStatus("Mario vesztett", "Nyomd meg az Újraindítás gombot, és próbáld újra.");
    }
  }

  for (const coin of mario.coinsData) {
    if (coin.taken) {
      continue;
    }
    const centerX = player.x + player.w / 2;
    const centerY = player.y + player.h / 2;
    const dx = centerX - coin.x;
    const dy = centerY - coin.y;
    if (Math.hypot(dx, dy) < coin.r + 16) {
      coin.taken = true;
      mario.coins += 1;
    }
  }

  if (player.y > canvas.height + 120) {
    mario.gameOver = true;
    setStatus("Mario leesett", "Nyomd meg az Újraindítás gombot, és indulhat újra.");
  }

  player.x = Math.max(0, Math.min(player.x, marioConfig.worldWidth - player.w));
  mario.cameraX = Math.max(0, Math.min(player.x - canvas.width * 0.35, marioConfig.worldWidth - canvas.width));

  if (player.x >= mario.goalX) {
    mario.won = true;
    setStatus("Mario célba ért", `Összegyűjtött érmék: ${mario.coins}.`);
  }
}

function renderMario() {
  const mario = state.mario;
  const player = mario.player;
  clearFrame();

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#76c7ff");
  sky.addColorStop(1, "#dff7ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cam = mario.cameraX;
  drawCloud(130 - cam * 0.15, 90, 1.1);
  drawCloud(450 - cam * 0.18, 140, 0.8);
  drawCloud(760 - cam * 0.12, 110, 1.3);

  ctx.fillStyle = "#69b34c";
  ctx.fillRect(0, 460, canvas.width, 80);

  for (const platform of mario.platforms) {
    drawPlatform(platform.x - cam, platform.y, platform.w, platform.h);
  }
  for (const hazard of mario.hazards) {
    drawHazard(hazard.x - cam, hazard.y, hazard.w, hazard.h);
  }
  for (const coin of mario.coinsData) {
    if (!coin.taken) {
      drawCoin(coin.x - cam, coin.y, coin.r);
    }
  }

  drawGoal(mario.goalX - cam, 360);
  drawPlayer(player.x - cam, player.y, player.w, player.h);

  ctx.fillStyle = "rgba(6, 21, 33, 0.58)";
  ctx.fillRect(16, 16, 250, 80);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px Trebuchet MS";
  ctx.fillText(`Ermék: ${mario.coins}`, 28, 48);
  ctx.fillText(`Pozíció: ${Math.floor(player.x)}m`, 28, 80);

  if (mario.won) {
    drawBanner("Nyertél!");
  } else if (mario.gameOver) {
    drawBanner("Vége a játéknak");
  }
}

function updateSnake(delta) {
  const snake = state.snake;
  if (snake.gameOver) {
    return;
  }

  const requestedDirection = getSnakeDirectionFromInput();
  if (requestedDirection) {
    const opposite =
      requestedDirection.x === -snake.direction.x &&
      requestedDirection.y === -snake.direction.y;
    if (!opposite) {
      snake.nextDirection = requestedDirection;
    }
  }

  snake.accumulator += delta * 1000;
  while (snake.accumulator >= snakeConfig.stepMs) {
    snake.accumulator -= snakeConfig.stepMs;
    snake.direction = snake.nextDirection;

    const head = snake.snake[0];
    const nextHead = {
      x: head.x + snake.direction.x,
      y: head.y + snake.direction.y
    };

    const hitWall =
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x >= snakeConfig.gridSize ||
      nextHead.y >= snakeConfig.gridSize;
    const hitSelf = snake.snake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

    if (hitWall || hitSelf) {
      snake.gameOver = true;
      setStatus("Snake vesztett", `Végső pontszám: ${snake.score}. Nyomd meg az Újraindítás gombot.`);
      return;
    }

    snake.snake.unshift(nextHead);
    if (nextHead.x === snake.food.x && nextHead.y === snake.food.y) {
      snake.score += 1;
      snake.food = spawnFood(snake.snake);
    } else {
      snake.snake.pop();
    }
  }
}

function renderSnake() {
  clearFrame();
  const size = snakeConfig.gridSize;
  const tile = snakeConfig.tileSize;
  const boardSize = size * tile;
  const offsetX = (canvas.width - boardSize) / 2;
  const offsetY = (canvas.height - boardSize) / 2;

  ctx.fillStyle = "#07111c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#15334a" : "#10283b";
      ctx.fillRect(offsetX + x * tile, offsetY + y * tile, tile - 1, tile - 1);
    }
  }

  const snake = state.snake;
  ctx.fillStyle = "#f44d5e";
  ctx.fillRect(offsetX + snake.food.x * tile + 2, offsetY + snake.food.y * tile + 2, tile - 5, tile - 5);

  snake.snake.forEach((segment, index) => {
    ctx.fillStyle = index === 0 ? "#7fe59d" : "#49b26b";
    ctx.fillRect(offsetX + segment.x * tile + 2, offsetY + segment.y * tile + 2, tile - 5, tile - 5);
  });

  ctx.fillStyle = "rgba(6, 21, 33, 0.62)";
  ctx.fillRect(16, 16, 250, 72);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 22px Trebuchet MS";
  ctx.fillText(`Pont: ${snake.score}`, 28, 48);
  ctx.fillText(`Hossz: ${snake.snake.length}`, 28, 78);

  if (snake.gameOver) {
    drawBanner("Vége a játéknak");
  }
}

function getSnakeDirectionFromInput() {
  if (state.pointerDirection === "left") {
    return { x: -1, y: 0 };
  }
  if (state.pointerDirection === "right") {
    return { x: 1, y: 0 };
  }
  if (state.pointerDirection === "up") {
    return { x: 0, y: -1 };
  }
  if (state.pointerDirection === "down") {
    return { x: 0, y: 1 };
  }
  if (state.keys.has("ArrowLeft") || state.keys.has("a")) {
    return { x: -1, y: 0 };
  }
  if (state.keys.has("ArrowRight") || state.keys.has("d")) {
    return { x: 1, y: 0 };
  }
  if (state.keys.has("ArrowUp") || state.keys.has("w")) {
    return { x: 0, y: -1 };
  }
  if (state.keys.has("ArrowDown") || state.keys.has("s")) {
    return { x: 0, y: 1 };
  }
  return null;
}

function drawPlatform(x, y, w, h) {
  ctx.fillStyle = "#8b5a2b";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#59a14f";
  ctx.fillRect(x, y, w, 10);
}

function drawHazard(x, y, w, h) {
  ctx.fillStyle = "#c62f2f";
  for (let i = 0; i < w; i += 10) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + 5, y);
    ctx.lineTo(x + i + 10, y + h);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCoin(x, y, r) {
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f4a300";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawGoal(x, y) {
  ctx.fillStyle = "#5b3a29";
  ctx.fillRect(x, y, 10, 100);
  ctx.fillStyle = "#ff4d6d";
  ctx.beginPath();
  ctx.moveTo(x + 10, y);
  ctx.lineTo(x + 70, y + 18);
  ctx.lineTo(x + 10, y + 36);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer(x, y, w, h) {
  ctx.fillStyle = "#ff6b35";
  ctx.fillRect(x + 8, y + 8, w - 16, h - 8);
  ctx.fillStyle = "#b22222";
  ctx.fillRect(x + 4, y, w - 8, 14);
  ctx.fillStyle = "#25364f";
  ctx.fillRect(x + 10, y + 28, w - 20, h - 28);
  ctx.fillStyle = "#f6d3b5";
  ctx.fillRect(x + 12, y + 14, w - 24, 14);
}

function drawCloud(x, y, scale) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.beginPath();
  ctx.arc(x, y, 24 * scale, 0, Math.PI * 2);
  ctx.arc(x + 26 * scale, y - 10 * scale, 20 * scale, 0, Math.PI * 2);
  ctx.arc(x + 54 * scale, y, 24 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawBanner(text) {
  ctx.fillStyle = "rgba(6, 21, 33, 0.8)";
  ctx.fillRect(canvas.width / 2 - 210, canvas.height / 2 - 55, 420, 110);
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 3;
  ctx.strokeRect(canvas.width / 2 - 210, canvas.height / 2 - 55, 420, 110);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 38px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 12);
  ctx.textAlign = "start";
}

function drawPaused() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("Szünet", canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "start";
}

function togglePause() {
  if (!state.activeGame) {
    return;
  }
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? "Folytatás" : "Szünet";
}

function restartGame() {
  if (state.activeGame === "mario") {
    startMario();
  } else if (state.activeGame === "snake") {
    startSnake();
  }
}

function handlePointer(event) {
  const rect = canvas.getBoundingClientRect();
  const nx = (event.clientX - rect.left) / rect.width;
  const ny = (event.clientY - rect.top) / rect.height;
  const zone = pointerZones.find(
    (item) => nx >= item.x && nx <= item.x + item.w && ny >= item.y && ny <= item.y + item.h
  );
  state.pointerDirection = zone ? zone.action : null;
}

function clearPointer() {
  state.pointerDirection = null;
}

window.addEventListener("keydown", (event) => {
  const safeKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "d", "w", "s"]);
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (safeKeys.has(key)) {
    event.preventDefault();
    state.keys.add(key);
  }
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  state.keys.delete(key);
});

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  handlePointer(event);
});
canvas.addEventListener("pointermove", (event) => {
  if (event.buttons > 0) {
    handlePointer(event);
  }
});
canvas.addEventListener("pointerup", clearPointer);
canvas.addEventListener("pointercancel", clearPointer);
canvas.addEventListener("pointerleave", clearPointer);

marioButton.addEventListener("click", startMario);
snakeButton.addEventListener("click", startSnake);
restartButton.addEventListener("click", restartGame);
pauseButton.addEventListener("click", togglePause);

renderIdle();
