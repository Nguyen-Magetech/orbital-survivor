/** Renderer- and input-agnostic logic for a compact survival arena. */
import type { SoundId } from '@/audio/soundIds';
import { ARENA, PLAYER, PROGRESSION } from '@/config/gameplayConstants';
import type { AudioPlayer } from '@/framework/audio/AudioPlayer';
import type { DpadDirection, InputManager } from '@/framework/input/InputManager';
import { Vector3, clamp } from '@/framework/math/Vector3';
import type { Renderer, RenderHandle } from '@/framework/render/Renderer';
import type { ModelId } from '@/models';

const DIRECTIONS: Readonly<Record<DpadDirection, { x: number; y: number }>> = {
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const SPAWN_POINTS = [
  { x: -ARENA.spawnEdge, y: 0 },
  { x: 0, y: ARENA.spawnEdge },
  { x: ARENA.spawnEdge, y: 0 },
  { x: 0, y: -ARENA.spawnEdge },
] as const;

interface MovingThing {
  handle: RenderHandle;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  health?: number;
}

type GameStatus = 'ready' | 'playing' | 'lost';

export class Game {
  private readonly arenaHandle: RenderHandle;
  private readonly playerHandle: RenderHandle;
  private readonly player = { x: 0, y: 0 };
  private readonly facing = { x: 0, y: 1 };
  private readonly enemies: MovingThing[] = [];
  private readonly bolts: MovingThing[] = [];
  private status: GameStatus = 'ready';
  private score = 0;
  private spawnElapsed = 0;
  private spawnIndex = 0;
  private wave = 0;
  private remainingToSpawn = 0;
  private lastSwipe: DpadDirection | null = null;
  private swipeWindowLeft = 0;

  public constructor(
    private readonly renderer: Renderer<ModelId>,
    private readonly input: InputManager,
    private readonly audio: AudioPlayer<SoundId>,
  ) {
    this.arenaHandle = renderer.addModel('arena');
    renderer.setTransform(this.arenaHandle, new Vector3(0, 0, -0.1));
    this.playerHandle = renderer.addModel('player');
    this.syncPlayer();
    this.input.on('dpadSwipe', (direction) => this.onSwipe(direction));
    this.input.on('pinchTap', () => this.onTap());
  }

  public getScore(): number { return this.score; }
  public getStatus(): GameStatus { return this.status; }
  public getWave(): number { return this.wave; }

  public update(dt: number): void {
    if (this.status !== 'playing') return;
    const step = Math.max(0, dt);
    this.spawnElapsed += step;
    if (this.lastSwipe && this.swipeWindowLeft > 0) {
      this.swipeWindowLeft = Math.max(0, this.swipeWindowLeft - step);
      if (this.swipeWindowLeft === 0) this.lastSwipe = null;
    }

    if (this.remainingToSpawn > 0 && this.spawnElapsed >= this.spawnInterval()) {
      this.spawnElapsed = 0;
      this.spawnEnemy();
      this.remainingToSpawn--;
    }

    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const bolt = this.bolts[i];
      bolt.x += bolt.vx * step;
      bolt.y += bolt.vy * step;
      bolt.age += step;
      this.renderer.setTransform(bolt.handle, new Vector3(bolt.x, bolt.y, 0.35));
      let hit = -1;
      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        if (distanceSquared(bolt.x, bolt.y, enemy.x, enemy.y) <= ARENA.hitRadius ** 2) {
          hit = j;
          break;
        }
      }
      if (hit >= 0) {
        this.bolts.splice(i, 1);
        this.renderer.remove(bolt.handle);
        const enemy = this.enemies[hit];
        enemy.health = (enemy.health ?? 1) - 1;
        if (enemy.health <= 0) {
          this.removeEnemy(hit);
          this.score += 1;
        }
        this.audio.play('hit');
      } else if (bolt.age >= ARENA.boltLifetime) {
        this.renderer.remove(bolt.handle);
        this.bolts.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      enemy.x += (dx / distance) * ARENA.enemySpeed * step;
      enemy.y += (dy / distance) * ARENA.enemySpeed * step;
      this.renderer.setTransform(enemy.handle, new Vector3(enemy.x, enemy.y, 0.15));
      if (distanceSquared(enemy.x, enemy.y, this.player.x, this.player.y) <= ARENA.playerHitRadius ** 2) {
        this.status = 'lost';
        this.audio.play('explosion');
        break;
      }
    }

    if (this.status === 'playing' && this.remainingToSpawn === 0 && this.enemies.length === 0) {
      this.startWave(this.wave + 1);
    }
  }

  public render(): void { this.renderer.render(); }

  private onSwipe(direction: DpadDirection): void {
    if (this.status !== 'playing') return;
    const vector = DIRECTIONS[direction];
    const isDoubleSwipe = this.lastSwipe === direction && this.swipeWindowLeft > 0;
    if (isDoubleSwipe) {
      this.player.x = vector.x * ARENA.playerBound;
      this.player.y = vector.y * ARENA.playerBound;
      this.lastSwipe = null;
      this.swipeWindowLeft = 0;
    } else {
      this.player.x = clamp(this.player.x + vector.x * PLAYER.stepSize, -ARENA.playerBound, ARENA.playerBound);
      this.player.y = clamp(this.player.y + vector.y * PLAYER.stepSize, -ARENA.playerBound, ARENA.playerBound);
      this.lastSwipe = direction;
      this.swipeWindowLeft = PROGRESSION.doubleSwipeWindow;
    }
    this.facing.x = vector.x;
    this.facing.y = vector.y;
    this.syncPlayer();
  }

  private onTap(): void {
    if (this.status === 'ready' || this.status === 'lost') {
      this.reset();
      this.status = 'playing';
      this.startWave(1);
      this.audio.play('select');
      return;
    }
    this.bolts.push({
      handle: this.renderer.addModel('bolt'),
      x: this.player.x,
      y: this.player.y,
      vx: this.facing.x * ARENA.boltSpeed,
      vy: this.facing.y * ARENA.boltSpeed,
      age: 0,
    });
    this.audio.play('laser');
  }

  private spawnEnemy(): void {
    const isBossWave = this.wave % PROGRESSION.bossEveryWaves === 0;
    const point = SPAWN_POINTS[this.spawnIndex % SPAWN_POINTS.length];
    this.spawnIndex++;
    const handle = this.renderer.addModel(isBossWave ? 'boss' : 'enemy');
    const bossTier = this.wave / PROGRESSION.bossEveryWaves - 1;
    const health = isBossWave
      ? PROGRESSION.bossHealth + bossTier * PROGRESSION.bossHealthPerTier
      : 1;
    if (isBossWave) this.renderer.setScale?.(handle, PROGRESSION.bossScale);
    this.enemies.push({ handle, x: point.x, y: point.y, vx: 0, vy: 0, age: 0, health });
  }

  private startWave(wave: number): void {
    this.wave = wave;
    const isBossWave = wave % PROGRESSION.bossEveryWaves === 0;
    this.remainingToSpawn = isBossWave
      ? 1
      : PROGRESSION.firstWaveEnemies + (wave - 1) * PROGRESSION.enemiesAddedPerWave;
    this.spawnElapsed = 0;
  }

  private spawnInterval(): number {
    return Math.max(
      PROGRESSION.fastestSpawnInterval,
      ARENA.spawnInterval / (1 + (this.wave - 1) * PROGRESSION.spawnAccelerationPerWave),
    );
  }

  private removeEnemy(index: number): void {
    this.renderer.remove(this.enemies[index].handle);
    this.enemies.splice(index, 1);
  }

  private reset(): void {
    for (const enemy of this.enemies) this.renderer.remove(enemy.handle);
    for (const bolt of this.bolts) this.renderer.remove(bolt.handle);
    this.enemies.length = 0;
    this.bolts.length = 0;
    this.player.x = 0;
    this.player.y = 0;
    this.facing.x = 0;
    this.facing.y = 1;
    this.score = 0;
    this.spawnElapsed = 0;
    this.spawnIndex = 0;
    this.wave = 0;
    this.remainingToSpawn = 0;
    this.lastSwipe = null;
    this.swipeWindowLeft = 0;
    this.syncPlayer();
  }

  private syncPlayer(): void {
    this.renderer.setTransform(this.playerHandle, new Vector3(this.player.x, this.player.y, 0.25));
    this.renderer.setRotation(this.playerHandle, Math.atan2(this.facing.y, this.facing.x) - Math.PI / 2);
  }
}

function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
