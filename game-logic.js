export const LEVELS = 100;

export function createShip(W, H) {
  return {
    x: W / 2, y: H / 2, angle: -Math.PI / 2,
    vx: 0, vy: 0, radius: 15, alive: true,
    thrusting: false, invincible: 90, fireCooldown: 0
  };
}

export function createAsteroid(x, y, size) {
  const speeds = { 3: [0.6, 1.4], 2: [1.0, 2.2], 1: [1.6, 3.0] };
  const sp = speeds[size];
  const angle = Math.random() * Math.PI * 2;
  const speed = sp[0] + Math.random() * (sp[1] - sp[0]);
  const vertices = [];
  const numVerts = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numVerts; i++) {
    const a = (i / numVerts) * Math.PI * 2;
    const r = (size === 3 ? 30 : size === 2 ? 16 : 8) * (0.7 + Math.random() * 0.6);
    vertices.push({ a, r });
  }
  return {
    x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    size, vertices, radius: size === 3 ? 32 : size === 2 ? 16 : 8,
    rotAngle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02
  };
}

export function getLevelConfig(level) {
  const rockCount = 3 + Math.floor(level * 1.2);
  const bigRocks = Math.min(rockCount, 2 + Math.floor(level / 5));
  const speedMult = 1 + (level - 1) * 0.04;
  const rockSpeed = 1 + (level - 1) * 0.06;
  const enemyCount = level >= 5 ? Math.floor((level - 4) * 0.8) + 1 : 0;
  return { rockCount, bigRocks, speedMult, rockSpeed, enemyCount };
}

export function dtToMilliseconds(dt) {
  return dt * 16.667;
}

export function checkCollision(x1, y1, r1, x2, y2, r2) {
  return Math.hypot(x1 - x2, y1 - y2) < r1 + r2;
}

export function wrapPosition(x, y, W, H, margin) {
  let nx = x, ny = y;
  if (nx < -margin) nx = W + margin;
  if (nx > W + margin) nx = -margin;
  if (ny < -margin) ny = H + margin;
  if (ny > H + margin) ny = -margin;
  return { x: nx, y: ny };
}

export function clampSpeed(vx, vy, maxSpeed) {
  const spd = Math.hypot(vx, vy);
  if (spd > maxSpeed) {
    return { vx: (vx / spd) * maxSpeed, vy: (vy / spd) * maxSpeed };
  }
  return { vx, vy };
}

export function createProgress() {
  return { unlocked: { 1: true }, times: {}, completed: {} };
}

export function unlockNextLevel(progress, level) {
  const next = level + 1;
  if (next <= LEVELS) {
    progress.unlocked[next] = true;
  }
  progress.completed[level] = true;
  return progress;
}

export function saveBestTime(progress, level, time) {
  const prev = progress.times[level];
  let isNewBest = false;
  if (!prev || time < prev) {
    progress.times[level] = time;
    isNewBest = true;
  }
  return { progress, isNewBest };
}

export function isBossLevel(level) {
  return level % 10 === 0 && level > 0;
}

export function getBossNumber(level) {
  return level / 10;
}

export function getBossHp(level) {
  const num = getBossNumber(level);
  return 15 + num * 10;
}
