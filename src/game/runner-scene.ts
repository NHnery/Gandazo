import Phaser from 'phaser';
import { GROUND, WORLD_HEIGHT, RunnerModel, type RunState } from './runner-model';

export type Snapshot = { state: RunState; score: number; coins: number; level: number; seconds: number };
export type RunnerControls = { start: () => void; jump: () => void; duck: (active: boolean) => void; pause: () => void; resume: () => void; destroy: () => void };

/** Phaser owns the renderer, resizing and one animation loop; the simulation owns game rules. */
export function createRunner(host: HTMLElement, onChange: (state: Snapshot) => void): Promise<RunnerControls> {
  return new Promise((resolve, reject) => {
    let game: Phaser.Game;
    let observer: ResizeObserver | undefined;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    class RunnerScene extends Phaser.Scene {
      model = new RunnerModel();
      pen!: Phaser.GameObjects.Graphics;
      factor = 1;
      lastEmit = '';
      constructor() { super('GanadazoRunner'); }
      create() {
        try {
          this.pen = this.add.graphics();
          this.fit();
          this.scale.on('resize', () => this.fit());
          this.emit();
          resolve({
            start: () => { this.model.start(); this.emit(); },
            jump: () => this.model.jump(),
            duck: active => this.model.duck(active),
            pause: () => { this.model.pause(); this.emit(); },
            resume: () => { this.model.resume(); this.emit(); },
            destroy: () => { observer?.disconnect(); game.destroy(true); },
          });
        } catch (error) { reject(error); }
      }
      fit() {
        this.factor = this.scale.height / WORLD_HEIGHT;
        this.model.resize(this.scale.width / this.factor);
        this.pen?.setScale(this.factor);
        this.emit();
      }
      emit() {
        const { state, score, coins, level, elapsed } = this.model;
        const key = `${state}:${score}:${coins}:${level}:${Math.floor(elapsed)}`;
        if (key === this.lastEmit) return;
        this.lastEmit = key;
        onChange({ state, score, coins, level, seconds: Math.floor(elapsed) });
      }
      update(_time: number, delta: number) {
        const previous = this.model.state;
        this.model.update(delta / 1000);
        if (!reducedMotion && previous === 'running' && this.model.state === 'over') this.cameras.main.shake(130, .003);
        this.draw();
        this.emit();
      }
      rect(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
        this.pen.fillStyle(color, alpha).fillRect(Math.round(x), Math.round(y), w, h);
      }
      draw() {
        const g = this.pen;
        const m = this.model;
        const w = m.width;
        const t = m.elapsed;
        const scroll = m.distance;
        g.clear();
        // Twilight over the Andes: a restrained pixel world with layered movement.
        this.rect(0, 0, w, WORLD_HEIGHT, 0x19132e);
        this.rect(0, 80, w, 95, 0x25193f);
        this.rect(0, 175, w, 130, 0x39234f);
        this.rect(0, 265, w, 96, 0x553459);
        for (let i = 0; i < 35; i++) {
          const x = (i * 137 + 28) % w;
          const y = (i * 47 + 20) % 195;
          this.rect(x, y, i % 4 ? 2 : 3, 2, 0xd0b7ef, i % 3 ? .35 : .75);
        }
        g.fillStyle(0xffb800, .045).fillCircle(w * .75, 126, 81);
        g.fillStyle(0xffb800, .08).fillCircle(w * .75, 126, 64);
        g.fillStyle(0xffca67, .85).fillCircle(w * .75, 126, 43);
        for (let i = 0; i < 4; i++) this.rect(w * .75 - 44, 134 + i * 8, 88, 3, 0x39234f, .45);
        for (let layer = 0; layer < 3; layer++) {
          const size = 240 + layer * 40;
          const shift = (scroll * (.035 + layer * .035)) % size;
          const colors = [0x473059, 0x342b4f, 0x29233f];
          for (let i = -1; i < w / size + 1; i++) {
            const x = i * size - shift;
            const peak = 188 + layer * 38 + ((i + 8) % 3) * 21;
            g.fillStyle(colors[layer]).fillTriangle(x, GROUND, x + size * .52, peak, x + size * 1.2, GROUND);
            if (layer === 0) { g.fillStyle(0xd9bad5, .38).fillTriangle(x + size * .4, peak + 24, x + size * .52, peak, x + size * .65, peak + 25); }
          }
        }
        // Small local rooftops and warmly lit windows in the distance.
        for (let i = -1; i < w / 105 + 1; i++) {
          const x = i * 105 - (scroll * .19) % 105;
          const roof = i % 2 ? 294 : 309;
          this.rect(x, roof, 77, GROUND - roof, 0x46334b);
          this.rect(x - 5, roof - 5, 87, 7, 0x916252);
          this.rect(x + 10, roof - 10, 68, 6, 0x916252);
          for (let j = 0; j < 3; j++) this.rect(x + 10 + j * 22, roof + 13, 8, 12, 0xd5a069, .65);
          this.rect(x + 33, roof + 34, 12, 27, 0x271e35);
        }
        // Inca stone walkway, animated independently of the distant scenery.
        this.rect(0, GROUND, w, 90, 0x211b2e);
        this.rect(0, GROUND, w, 5, 0xb89365);
        this.rect(0, GROUND + 5, w, 6, 0x715343);
        this.rect(0, GROUND + 18, w, 1, 0x514052);
        this.rect(0, GROUND + 52, w, 2, 0x342b40);
        for (let i = -1; i < w / 55 + 1; i++) {
          const x = i * 55 - scroll % 55;
          this.rect(x, GROUND + 18, 2, 34, 0x342b40);
          this.rect(x + 26, GROUND + 54, 2, 36, 0x342b40);
          this.rect(x + 9, GROUND + 26, 15, 2, 0x725a66, .35);
        }
        for (const coin of m.pickups) {
          const pulse = Math.sin(t * 6 + coin.phase) * 2;
          g.fillStyle(0xffb800, .08).fillCircle(coin.x, coin.y, 16);
          this.rect(coin.x - 7, coin.y - 10 + pulse, 14, 20, 0xffb800);
          this.rect(coin.x - 10, coin.y - 6 + pulse, 20, 12, 0xffb800);
          this.rect(coin.x - 4, coin.y - 6 + pulse, 4, 12, 0xffe6a0);
          this.rect(coin.x + 4, coin.y - 5 + pulse, 3, 10, 0xcd840e);
        }
        for (const obstacle of m.obstacles) {
          const { x, y, width, height, kind } = obstacle;
          if (kind === 'cactus') {
            this.rect(x + 8, y, 13, height, 0x48ba85); this.rect(x + 15, y + 3, 6, height - 3, 0x2a825e);
            this.rect(x, y + 16, 9, 6, 0x48ba85); this.rect(x, y + 6, 5, 16, 0x48ba85);
            this.rect(x + 20, y + 28, 11, 6, 0x48ba85); this.rect(x + 27, y + 18, 5, 16, 0x48ba85);
            this.rect(x + 10, y - 5, 8, 5, 0xe797ae);
          } else if (kind === 'fence') {
            this.rect(x, y, 8, height, 0xd19c61); this.rect(x + width - 8, y, 8, height, 0xd19c61);
            this.rect(x, y + 7, width, 7, 0x9f6b4a); this.rect(x, y + 25, width, 7, 0x9f6b4a);
            this.rect(x + 3, y + 8, 3, 3, 0xffdf86); this.rect(x + width - 6, y + 8, 3, 3, 0xffdf86);
          } else if (kind === 'rock') {
            this.rect(x + 5, y, width - 10, height, 0x8c7d9d); this.rect(x, y + 7, width, height - 7, 0x746680);
            this.rect(x + 6, y + 2, 9, 4, 0xb2a2bd);
          } else {
            const wing = Math.sin(t * 20) > 0;
            this.rect(x + 7, y + 7, 22, 12, 0xdf8caa); this.rect(x, y + 9, 9, 5, 0xffd071);
            this.rect(x + 7, y + 8, 3, 3, 0x17131f); this.rect(x + 18, y + (wing ? 0 : 17), 14, 7, 0xa65f89);
          }
        }
        // Original brown bull, gold horns and four-frame run cycle, with a purple scarf.
        const x = m.playerX;
        const y = m.y - 48;
        const frame = m.state === 'running' ? Math.floor(t * 12) % 4 : 0;
        g.fillStyle(0x0c0a14, .3).fillEllipse(x + 25, GROUND + 2, 59, 8);
        if (m.ducking) {
          this.rect(x + 3, y + 27, 40, 15, 0xa65e3e); this.rect(x + 34, y + 23, 20, 18, 0xbf7a4e);
          this.rect(x + 40, y + 17, 4, 8, 0xffc95c); this.rect(x + 49, y + 18, 4, 7, 0xffc95c);
          this.rect(x + 43, y + 28, 5, 5, 0xfff7e1); this.rect(x + 46, y + 29, 2, 3, 0x211726);
          this.rect(x + 10, y + 42, 9, 6, 0x59354a); this.rect(x + 34, y + 42, 9, 6, 0x59354a);
        } else {
          const legs = m.grounded ? Math.sin(frame * Math.PI / 2) * 5 : -3;
          this.rect(x + 9, y + 9, 32, 23, 0xa65e3e); this.rect(x + 14, y + 5, 25, 6, 0xc78752);
          this.rect(x + 13, y + 28, 25, 7, 0xba784c); this.rect(x + 33, y + 1, 20, 22, 0xba784c);
          this.rect(x + 39, y + 5, 13, 14, 0xcf955c); this.rect(x + 45, y + 8, 5, 5, 0xfff7e1);
          this.rect(x + 48, y + 9, 2, 3, 0x211726); this.rect(x + 49, y + 18, 7, 6, 0xe3ac85);
          this.rect(x + 36, y - 5, 5, 10, 0xffcb60); this.rect(x + 47, y - 5, 5, 10, 0xffcb60);
          this.rect(x + 33, y - 8, 7, 4, 0xffdf97); this.rect(x + 49, y - 8, 6, 4, 0xffdf97);
          this.rect(x + 31, y + 22, 14, 6, 0x9756ec); this.rect(x + 20, y + 22, 15, 4, 0x7833d1);
          for (const [lx, offset] of [[12, legs], [20, -legs], [30, -legs], [38, legs]]) {
            this.rect(x + lx, y + 33, 5, 12 + offset, 0x724139); this.rect(x + lx, y + 43 + offset, 7, 4, 0x302336);
          }
          this.rect(x + 1, y + 13, 9, 4, 0x724139); this.rect(x - 3, y + 7 + Math.sin(t * 8) * 2, 5, 10, 0x724139);
        }
        for (const spark of m.sparks) this.rect(spark.x, spark.y, 4, 4, spark.gold ? 0xffc14b : 0xc18bff, Math.max(0, spark.life / .6));
        if (m.state === 'running' && m.grounded && !reducedMotion) {
          for (let i = 0; i < 4; i++) this.rect(x - ((t * 90 + i * 12) % 43), GROUND - 3 - i * 2, 3, 3, 0xc3a789, .25);
        }
      }
    }
    try {
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host,
        width: host.clientWidth,
        height: host.clientHeight,
        backgroundColor: '#19132e',
        pixelArt: true,
        roundPixels: true,
        banner: false,
        audio: { noAudio: true },
        input: { keyboard: false, mouse: false, touch: false },
        scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: RunnerScene,
      });
      observer = new ResizeObserver(() => {
        const { clientWidth: width, clientHeight: height } = host;
        if (width > 0 && height > 0 && (game.scale.width !== width || game.scale.height !== height)) game.scale.resize(width, height);
      });
      observer.observe(host);
    } catch (error) { reject(error); }
  });
}
