export const GROUND = 360;
export const WORLD_HEIGHT = 450;
export const STEP = 1 / 120;
export type RunState = 'ready' | 'running' | 'paused' | 'over';
export type ObstacleKind = 'cactus' | 'fence' | 'rock' | 'bird';
export type Box = { x: number; y: number; width: number; height: number };
export type Obstacle = Box & { kind: ObstacleKind };
export type Coin = { x: number; y: number; phase: number };
export type Spark = { x: number; y: number; vx: number; vy: number; life: number; gold: boolean };

export const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** A fixed-step simulation: movement, difficulty and scoring do not depend on screen refresh rate. */
export class RunnerModel {
  state: RunState = 'ready';
  width: number;
  elapsed = 0;
  distance = 0;
  coins = 0;
  score = 0;
  y = GROUND;
  velocityY = 0;
  duckHeld = false;
  duckUntil = 0;
  obstacles: Obstacle[] = [];
  pickups: Coin[] = [];
  sparks: Spark[] = [];
  accumulator = 0;
  nextObstacle = 1.4;
  nextCoin = .6;
  private random: () => number;

  constructor(width = 800, random = Math.random) {
    this.width = Math.max(400, width);
    this.random = random;
  }

  get playerX() { return 64; }
  get level() { return 1 + Math.min(5, Math.floor(this.elapsed / 18)); }
  get speed() { return Math.min(300, (this.width - this.playerX) / 2.6) * (1 + Math.min(.7, this.elapsed / 150)); }
  get grounded() { return this.y >= GROUND - .01; }
  get ducking() { return this.grounded && (this.duckHeld || this.elapsed < this.duckUntil); }
  get hitbox(): Box {
    return { x: this.playerX + 10, y: this.y - (this.ducking ? 22 : 44), width: 35, height: this.ducking ? 19 : 40 };
  }

  start() {
    this.state = 'running';
    this.elapsed = this.distance = this.coins = this.score = this.accumulator = 0;
    this.y = GROUND;
    this.velocityY = 0;
    this.duckHeld = false;
    this.duckUntil = 0;
    this.obstacles = [];
    this.pickups = [];
    this.sparks = [];
    this.nextObstacle = 1.4;
    this.nextCoin = .6;
  }

  jump() {
    if (this.state !== 'running' || !this.grounded) return;
    this.duckHeld = false;
    this.duckUntil = 0;
    this.velocityY = -660;
  }

  duck(active: boolean) {
    this.duckHeld = this.state === 'running' && active;
    if (this.duckHeld) this.duckUntil = this.elapsed + .6;
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.duckHeld = false;
    this.accumulator = 0;
  }

  resume() {
    if (this.state === 'paused') this.state = 'running';
  }

  resize(width: number) {
    const next = Math.max(400, width);
    if (Math.abs(next - this.width) < .5) return;
    const ratio = (next - this.playerX) / (this.width - this.playerX);
    for (const item of [...this.obstacles, ...this.pickups]) item.x = this.playerX + (item.x - this.playerX) * ratio;
    this.width = next;
    this.pause();
  }

  update(seconds: number) {
    if (this.state !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
    this.accumulator += Math.min(seconds, .1);
    while (this.accumulator + 1e-9 >= STEP && this.state === 'running') {
      this.accumulator -= STEP;
      this.tick(STEP);
    }
  }

  private tick(dt: number) {
    this.elapsed += dt;
    const movement = this.speed * dt;
    this.distance += movement;
    this.velocityY += 1900 * dt;
    this.y = Math.min(GROUND, this.y + this.velocityY * dt);
    if (this.grounded) this.velocityY = 0;

    if (this.elapsed >= this.nextObstacle) {
      const options: ObstacleKind[] = this.elapsed > 18 ? ['cactus', 'fence', 'rock', 'bird'] : ['cactus', 'fence', 'rock'];
      const kind = options[Math.floor(this.random() * options.length)] ?? 'cactus';
      const width = kind === 'fence' ? 46 : kind === 'bird' ? 38 : 28;
      const height = kind === 'cactus' ? 54 : kind === 'fence' ? 43 : kind === 'bird' ? 25 : 24;
      this.obstacles.push({ kind, x: this.width + 30, y: GROUND - (kind === 'bird' ? 55 : height), width, height });
      this.nextObstacle = this.elapsed + 1.35 + this.random() * .55;
    }
    if (this.elapsed >= this.nextCoin) {
      const high = this.random() > .5;
      for (let i = 0; i < 3; i++) this.pickups.push({ x: this.width + 30 + i * 35, y: GROUND - (high ? 78 + (i === 1 ? 24 : 0) : 30), phase: i });
      this.nextCoin = this.elapsed + 2.4 + this.random() * .6;
    }

    for (const obstacle of this.obstacles) obstacle.x -= movement;
    for (const coin of this.pickups) coin.x -= movement;
    this.obstacles = this.obstacles.filter(item => item.x + item.width > -30);
    this.pickups = this.pickups.filter(item => item.x > -30);
    const player = this.hitbox;
    for (const obstacle of this.obstacles) {
      const box = { ...obstacle, x: obstacle.x + 4, y: obstacle.y + 3, width: obstacle.width - 8, height: obstacle.height - 3 };
      if (overlaps(player, box)) {
        this.state = 'over';
        this.duckHeld = false;
        this.burst(this.playerX + 24, this.y - 25, false);
        break;
      }
    }
    if (this.state !== 'running') return;
    this.pickups = this.pickups.filter(coin => {
      if (!overlaps(player, { x: coin.x - 9, y: coin.y - 9, width: 18, height: 18 })) return true;
      this.coins++;
      this.burst(coin.x, coin.y, true);
      return false;
    });
    this.score = Math.floor(this.distance / 18) + this.coins * 25;
    for (const spark of this.sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.vy += 350 * dt; spark.life -= dt; }
    this.sparks = this.sparks.filter(spark => spark.life > 0);
  }

  private burst(x: number, y: number, gold: boolean) {
    for (let i = 0; i < 9; i++) this.sparks.push({ x, y, gold, vx: (this.random() - .5) * 180, vy: -60 - this.random() * 160, life: .6 });
  }
}
