import { describe, it, expect } from 'vitest';
import {
  createShip,
  createAsteroid,
  getLevelConfig,
  dtToMilliseconds,
  checkCollision,
  wrapPosition,
  clampSpeed,
  createProgress,
  unlockNextLevel,
  saveBestTime,
  isBossLevel,
  getBossNumber,
  getBossHp,
  LEVELS
} from './game-logic.js';

describe('createShip', () => {
  it('creates ship at center of screen', () => {
    const ship = createShip(800, 600);
    expect(ship.x).toBe(400);
    expect(ship.y).toBe(300);
  });

  it('ship starts alive and invincible', () => {
    const ship = createShip(800, 600);
    expect(ship.alive).toBe(true);
    expect(ship.invincible).toBe(90);
    expect(ship.radius).toBe(15);
  });
});

describe('createAsteroid', () => {
  it('creates asteroid with correct radius by size', () => {
    const big = createAsteroid(100, 100, 3);
    expect(big.radius).toBe(32);
    expect(big.size).toBe(3);

    const med = createAsteroid(100, 100, 2);
    expect(med.radius).toBe(16);
    expect(med.size).toBe(2);

    const small = createAsteroid(100, 100, 1);
    expect(small.radius).toBe(8);
    expect(small.size).toBe(1);
  });

  it('creates asteroid at given position', () => {
    const a = createAsteroid(250, 350, 2);
    expect(a.x).toBe(250);
    expect(a.y).toBe(350);
  });

  it('has vertices for rendering', () => {
    const a = createAsteroid(100, 100, 3);
    expect(a.vertices.length).toBeGreaterThanOrEqual(8);
    expect(a.vertices.length).toBeLessThanOrEqual(12);
  });
});

describe('getLevelConfig', () => {
  it('level 1 has 4 rocks, 2 big', () => {
    const cfg = getLevelConfig(1);
    expect(cfg.rockCount).toBe(4);
    expect(cfg.bigRocks).toBe(2);
  });

  it('difficulty increases with level', () => {
    const cfg1 = getLevelConfig(1);
    const cfg10 = getLevelConfig(10);
    expect(cfg10.rockCount).toBeGreaterThan(cfg1.rockCount);
    expect(cfg10.speedMult).toBeGreaterThan(cfg1.speedMult);
    expect(cfg10.rockSpeed).toBeGreaterThan(cfg1.rockSpeed);
  });

  it('big rocks cap at rockCount', () => {
    const cfg = getLevelConfig(100);
    expect(cfg.bigRocks).toBeLessThanOrEqual(cfg.rockCount);
  });

  it('no enemies before level 5', () => {
    for (let i = 1; i <= 4; i++) {
      expect(getLevelConfig(i).enemyCount).toBe(0);
    }
  });

  it('enemies start at level 5', () => {
    expect(getLevelConfig(5).enemyCount).toBeGreaterThanOrEqual(1);
  });

  it('enemy count increases with level', () => {
    const cfg5 = getLevelConfig(5);
    const cfg20 = getLevelConfig(20);
    expect(cfg20.enemyCount).toBeGreaterThan(cfg5.enemyCount);
  });
});

describe('dtToMilliseconds', () => {
  it('converts frame-normalized dt to real milliseconds', () => {
    expect(dtToMilliseconds(1)).toBeCloseTo(16.667);
    expect(dtToMilliseconds(60)).toBeCloseTo(1000.02);
  });

  it('60 frames equals approximately 1 second', () => {
    const oneSecond = dtToMilliseconds(60);
    expect(oneSecond).toBeGreaterThan(999);
    expect(oneSecond).toBeLessThan(1001);
  });
});

describe('checkCollision', () => {
  it('detects collision when overlapping', () => {
    expect(checkCollision(100, 100, 20, 110, 100, 20)).toBe(true);
  });

  it('no collision when far apart', () => {
    expect(checkCollision(100, 100, 20, 300, 300, 20)).toBe(false);
  });

  it('collision at exact touch', () => {
    expect(checkCollision(100, 100, 10, 119, 100, 10)).toBe(true);
    expect(checkCollision(100, 100, 10, 121, 100, 10)).toBe(false);
  });
});

describe('wrapPosition', () => {
  it('wraps x when going off left edge', () => {
    const pos = wrapPosition(-30, 300, 800, 600, 20);
    expect(pos.x).toBe(820);
  });

  it('wraps x when going off right edge', () => {
    const pos = wrapPosition(830, 300, 800, 600, 20);
    expect(pos.x).toBe(-20);
  });

  it('wraps y when going off top edge', () => {
    const pos = wrapPosition(400, -30, 800, 600, 20);
    expect(pos.y).toBe(620);
  });

  it('does not wrap when within bounds', () => {
    const pos = wrapPosition(400, 300, 800, 600, 20);
    expect(pos.x).toBe(400);
    expect(pos.y).toBe(300);
  });
});

describe('clampSpeed', () => {
  it('does not change speed under max', () => {
    const result = clampSpeed(3, 4, 10);
    expect(result.vx).toBe(3);
    expect(result.vy).toBe(4);
  });

  it('clamps speed over max', () => {
    const result = clampSpeed(6, 8, 5);
    const spd = Math.hypot(result.vx, result.vy);
    expect(spd).toBeCloseTo(5);
  });

  it('preserves direction when clamping', () => {
    const result = clampSpeed(6, 8, 5);
    const angle = Math.atan2(result.vy, result.vx);
    const origAngle = Math.atan2(8, 6);
    expect(angle).toBeCloseTo(origAngle);
  });
});

describe('createProgress', () => {
  it('starts with level 1 unlocked', () => {
    const p = createProgress();
    expect(p.unlocked[1]).toBe(true);
    expect(Object.keys(p.times)).toHaveLength(0);
    expect(Object.keys(p.completed)).toHaveLength(0);
  });
});

describe('unlockNextLevel', () => {
  it('unlocks level 2 after completing level 1', () => {
    const p = createProgress();
    unlockNextLevel(p, 1);
    expect(p.unlocked[2]).toBe(true);
    expect(p.completed[1]).toBe(true);
  });

  it('does not unlock beyond LEVELS', () => {
    const p = createProgress();
    unlockNextLevel(p, LEVELS);
    expect(p.unlocked[LEVELS + 1]).toBeUndefined();
    expect(p.completed[LEVELS]).toBe(true);
  });
});

describe('saveBestTime', () => {
  it('saves first time as best', () => {
    const p = createProgress();
    const { isNewBest } = saveBestTime(p, 1, 5.5);
    expect(isNewBest).toBe(true);
    expect(p.times[1]).toBe(5.5);
  });

  it('saves faster time as new best', () => {
    const p = createProgress();
    saveBestTime(p, 1, 10.0);
    const { isNewBest } = saveBestTime(p, 1, 8.0);
    expect(isNewBest).toBe(true);
    expect(p.times[1]).toBe(8.0);
  });

  it('does not save slower time', () => {
    const p = createProgress();
    saveBestTime(p, 1, 5.0);
    const { isNewBest } = saveBestTime(p, 1, 7.0);
    expect(isNewBest).toBe(false);
    expect(p.times[1]).toBe(5.0);
  });
});

describe('isBossLevel', () => {
  it('level 10 is a boss level', () => {
    expect(isBossLevel(10)).toBe(true);
  });

  it('level 20 is a boss level', () => {
    expect(isBossLevel(20)).toBe(true);
  });

  it('level 1 is not a boss level', () => {
    expect(isBossLevel(1)).toBe(false);
  });

  it('level 5 is not a boss level', () => {
    expect(isBossLevel(5)).toBe(false);
  });

  it('level 99 is not a boss level', () => {
    expect(isBossLevel(99)).toBe(false);
  });

  it('level 100 is a boss level', () => {
    expect(isBossLevel(100)).toBe(true);
  });
});

describe('getBossNumber', () => {
  it('returns correct boss number', () => {
    expect(getBossNumber(10)).toBe(1);
    expect(getBossNumber(20)).toBe(2);
    expect(getBossNumber(100)).toBe(10);
  });
});

describe('getBossHp', () => {
  it('boss 1 has 25 HP', () => {
    expect(getBossHp(10)).toBe(25);
  });

  it('boss HP increases with boss number', () => {
    expect(getBossHp(20)).toBeGreaterThan(getBossHp(10));
    expect(getBossHp(30)).toBeGreaterThan(getBossHp(20));
  });

  it('boss 10 has 115 HP', () => {
    expect(getBossHp(100)).toBe(115);
  });
});
