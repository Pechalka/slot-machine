import * as PIXI from 'pixi.js';
import { SYMBOL_SIZE, VISIBLE_SYMBOLS } from '../../utils';

export class Reel {
  constructor(app, x, y, createSumbol, strip, speed = 2) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.symbols = [];
    this.strip = [...strip];
    this.position = 0;
    this.speed = speed;
    this.baseSpeed = speed;
    this.spinning = false;
    this.stripSize = strip.length;
    this.onStopped = null;

    this.direction = -1; // up / down

    // Создаём ленту
    for (let i = 0; i < this.stripSize; i++) {
      const sym = this.strip[i];
      const symbol = createSumbol(sym);
      symbol.display.y = i * SYMBOL_SIZE;
      this.container.addChild(symbol.display);
      this.symbols.push(symbol);
    }

    this.targetPosition = null;

    // Маска
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE * VISIBLE_SYMBOLS);
    mask.endFill();
    this.container.mask = mask;
    this.container.addChild(mask);

    app.stage.addChild(this.container);
    this._syncPositions();
  }

  stopAtPosition(idx) {
    if (!this.spinning) return;
    const maxPos = this.stripSize * SYMBOL_SIZE;
    const pos = ((this.position % maxPos) + maxPos) % maxPos;
    const centerIndex = Math.floor(VISIBLE_SYMBOLS / 2);
    const offset = centerIndex * SYMBOL_SIZE;
    let targetPx = idx * SYMBOL_SIZE - offset;
    targetPx = ((targetPx % maxPos) + maxPos) % maxPos;

    // Вычисляем дельту с учётом направления
    let delta = (pos - targetPx) * this.direction;
    delta = ((delta % maxPos) + maxPos) % maxPos;
    this.targetPosition = pos - delta * this.direction;
    // Нормализуем
    this.targetPosition = ((this.targetPosition % maxPos) + maxPos) % maxPos;
  }
  // ---- Запуск вращения (вниз) ----
  startSpin() {
    this.spinning = true;
    this.targetPosition = null;
    this.speed = this.direction * this.baseSpeed;
  }

  stopSpin() {
    this.spinning = false;
  }

  // ---- Анимация выигрыша на строке ----
  playWinOnRow(row) {
    const totalHeight = this.stripSize * SYMBOL_SIZE;
    const targetY = row * SYMBOL_SIZE;
    for (let i = 0; i < this.symbols.length; i++) {
      const symbol = this.symbols[i];
      let y = ((symbol.display.y % totalHeight) + totalHeight) % totalHeight;
      if (Math.abs(y - targetY) < 0.5) {
        if (symbol.playWin) {
          return symbol.playWin();
        }
      }
    }
    return Promise.resolve();
  }

  // ---- Обновление каждый кадр ----
  update(t) {
    const delta = t.deltaTime;

    if (!this.spinning) return;

    const maxPos = this.stripSize * SYMBOL_SIZE;
    // Нормализуем позицию в начале каждого кадра
    this.position = ((this.position % maxPos) + maxPos) % maxPos;

    if (this.targetPosition !== null) {
      let diff = this.targetPosition - this.position;
      // Если почти достигли → остановка
      if (Math.abs(diff) < 0.5) {
        this.position = this.targetPosition;
        this.spinning = false;
        this.targetPosition = null;
        this._syncPositions();
        if (this.onStopped) this.onStopped();
        return;
      }

      // Замедление (движение вниз, speed отрицательная)
      let minSpeed = 0.5;
      let targetSpeed = Math.min(Math.abs(this.baseSpeed), Math.abs(diff) / SYMBOL_SIZE + 0.5);
      this.speed = Math.max(minSpeed, targetSpeed, Math.abs(this.speed) * 0.98);
      let step = this.speed * delta * this.direction;
      if (Math.abs(step) > Math.abs(diff)) step = diff;
      this.position += step;
    } else {
      // Свободное вращение (вниз)
      this.position += this.speed * delta;
      if (this.position >= maxPos) this.position -= maxPos;
      if (this.position < 0) this.position += maxPos;
    }

    this._syncPositions();
  }

  // ---- Синхронизация позиций ----
  _syncPositions() {
    const maxY = this.stripSize * SYMBOL_SIZE;
    const pos = ((this.position % maxY) + maxY) % maxY;
    for (let i = 0; i < this.symbols.length; i++) {
      let y = (i * SYMBOL_SIZE - pos) % maxY;
      if (y < -SYMBOL_SIZE) y += maxY;
      this.symbols[i].display.y = y;
    }
  }
}
