import * as PIXI from 'pixi.js';
import { SYMBOL_SIZE, VISIBLE_SYMBOLS } from '../utils';

export class Reel {
  constructor(app, x, y, createSumbol, strip, speed = 2, direction = -1) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;
    this.symbols = [];
    this.strip = [...strip];
    this.position = 0;
    this.speed = speed * direction;
    this.baseSpeed = speed;
    this.direction = direction;
    this.spinning = false;
    this.stripSize = strip.length;
    this.onStopped = null;

    // Поля для time-based торможения
    this.brakeStartTime = 0;
    this.brakeDuration = 1000; // длительность торможения (мс)
    this.brakeStartPosition = 0;
    this.targetPosition = null;
    this.isBraking = false;

    // Создаём ленту
    for (let i = 0; i < this.stripSize; i++) {
      const sym = this.strip[i];
      const symbol = createSumbol(sym);
      symbol.display.y = i * SYMBOL_SIZE;
      this.container.addChild(symbol.display);
      this.symbols.push(symbol);
    }

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

  // ---- Остановка по индексу с задержкой и временем торможения ----
 stopAtPosition(idx, delay = 0, duration = 1000) {
  if (!this.spinning) return;
  const maxPos = this.stripSize * SYMBOL_SIZE;
  const pos = this.position; // не нормализуем

  const centerIndex = Math.floor(VISIBLE_SYMBOLS / 2);
  const offset = centerIndex * SYMBOL_SIZE;
  let targetPx = idx * SYMBOL_SIZE - offset;
  targetPx = ((targetPx % maxPos) + maxPos) % maxPos;

  let diff = targetPx - pos;

  // Корректируем diff в зависимости от направления
  if (this.direction === -1) {
    // Движение вниз: цель должна быть позади (diff < 0)
    while (diff >= 0) diff -= maxPos;
  } else {
    // Движение вверх: цель должна быть впереди (diff >= 0)
    while (diff < 0) diff += maxPos;
  }

  this.targetPosition = pos + diff;
  // Не нормализуем! Храним как есть (может быть отрицательным или > maxPos)

  this.brakeStartTime = performance.now() + delay;
  this.brakeDuration = duration;
  this.brakeStartPosition = this.position;
  this.isBraking = true;
}

  // ---- Запуск вращения (в направлении direction) ----
  startSpin() {
    this.spinning = true;
    this.targetPosition = null;
    this.isBraking = false;
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
update(delta) {
  if (!this.spinning) return;

  const maxPos = this.stripSize * SYMBOL_SIZE;

  // ---- Торможение (time-based) ----
  if (this.isBraking && this.targetPosition !== null) {
    const now = performance.now();
    const elapsed = now - this.brakeStartTime;

    if (elapsed < 0) {
      // задержка — крутимся с постоянной скоростью
      this.position += this.speed * delta;
      this._syncPositions();
      return;
    }

    const progress = Math.min(elapsed / this.brakeDuration, 1);
    // easeOutCubic: плавное замедление в конце
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentPos = this.brakeStartPosition + (this.targetPosition - this.brakeStartPosition) * eased;
    this.position = currentPos;

    // Если уже близко к цели — останавливаемся
    if (Math.abs(this.position - this.targetPosition) < 0.5 || progress >= 1) {
      this.position = this.targetPosition;
      this.spinning = false;
      this.isBraking = false;
      this.targetPosition = null;
      // Нормализуем после остановки
      this.position = ((this.position % maxPos) + maxPos) % maxPos;
      this._syncPositions();
      if (this.onStopped) this.onStopped();
      return;
    }

    this._syncPositions();
    return;
  }

  // ---- Свободное вращение (speed-based) ----
  this.position += this.speed * delta;
  if (this.position >= maxPos) this.position -= maxPos;
  if (this.position < 0) this.position += maxPos;
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
