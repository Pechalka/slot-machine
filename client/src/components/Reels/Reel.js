import * as PIXI from 'pixi.js';
import { SYMBOL_SIZE, VISIBLE_SYMBOLS } from '../../utils';

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
    this.brakeDuration = 1500;
    this.brakeStartPosition = 0;
    this.targetPosition = null;
    this.isBraking = false;
    this._brakeStarted = false;

    this._stopIdx = 0;
    // Поля для time-based запуска (каскад)
    this.startDelay = 0;
    this.spinStartTime = 0;
    this.isWaiting = false;

    // Создаём ленту
    for (let i = 0; i < this.stripSize; i++) {
      const sym = this.strip[i];
      const symbol = createSumbol(sym);
      symbol.display.y = i * SYMBOL_SIZE;
      this.container.addChild(symbol.display);
      this.symbols.push(symbol);
    }

    // const mask = new PIXI.Graphics();
    // mask.beginFill(0xffffff);
    // mask.drawRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE * VISIBLE_SYMBOLS);
    // mask.endFill();
    // this.container.mask = mask;
    // this.container.addChild(mask);
    const mask = new PIXI.Graphics();
mask.beginFill(0xffffff);
mask.drawRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE * VISIBLE_SYMBOLS);
mask.endFill();
this.container.mask = mask;
this.container.addChild(mask);

    app.stage.addChild(this.container);
    this._syncPositions();
  }

  // ---- Запуск вращения с каскадной задержкой (time-based) ----
  startSpin(delay = 0) {
    this.spinning = true;
    this.targetPosition = null;
    this.isBraking = false;
    this._brakeStarted = false;
    this.speed = this.direction * this.baseSpeed;
    if (delay > 0) {
      this.isWaiting = true;
      this.spinStartTime = performance.now() + delay;
    } else {
      this.isWaiting = false;
    }
     this._syncPositions();
  }

  // ---- Остановка с каскадной задержкой (time-based) ----
  stopAtPosition(idx, delay = 0, duration = 1500) {
    if (!this.spinning) return;
    this._stopIdx = idx;
    const maxPos = this.stripSize * SYMBOL_SIZE;
    const pos = this.position;

    const centerIndex = Math.floor(VISIBLE_SYMBOLS / 2);
    const offset = centerIndex * SYMBOL_SIZE;
    let targetPx = idx * SYMBOL_SIZE - offset;
    targetPx = ((targetPx % maxPos) + maxPos) % maxPos;

    let diff = targetPx - pos;

    if (this.direction === -1) {
      while (diff >= 0) diff -= maxPos;
    } else {
      while (diff < 0) diff += maxPos;
    }

    this.targetPosition = pos + diff;
    this.brakeStartTime = performance.now() + delay;
    this.brakeDuration = duration;
    this.brakeStartPosition = this.position;
    this.isBraking = true;
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

    // ---- Фаза 1: Ожидание старта (time-based) ----
    if (this.isWaiting) {
      const now = performance.now();
      if (now < this.spinStartTime) {
        // Ждём — стоим на месте
        this._syncPositions();
        return;
      } else {
        this.isWaiting = false;
        // Задержка прошла, начинаем вращение (переходим к свободному вращению)
      }
    }

    // ---- Фаза 2: Торможение (time-based) ----
    if (this.isBraking && this.targetPosition !== null) {
      const now = performance.now();
      const elapsed = now - this.brakeStartTime;

      if (elapsed < 0) {
        // задержка — крутимся с постоянной скоростью
        this.position += this.speed * delta;
        this._syncPositions();
        return;
      }

      if (!this._brakeStarted) {
        this._brakeStarted = true;
        this.brakeStartPosition = this.position;

        // Пересчитываем targetPosition с учётом текущей позиции
        const maxPos = this.stripSize * SYMBOL_SIZE;
        const pos = this.position;
        const centerIndex = Math.floor(VISIBLE_SYMBOLS / 2);
        const offset = centerIndex * SYMBOL_SIZE;
        let targetPx = this._stopIdx * SYMBOL_SIZE - offset;
        targetPx = ((targetPx % maxPos) + maxPos) % maxPos;
        let diff = targetPx - pos;
        if (this.direction === -1) {
          while (diff >= 0) diff -= maxPos;
        } else {
          while (diff < 0) diff += maxPos;
        }
        this.targetPosition = pos + diff;
      }

      const progress = Math.min((now - this.brakeStartTime) / this.brakeDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentPos =
        this.brakeStartPosition + (this.targetPosition - this.brakeStartPosition) * eased;
      this.position = currentPos;

      if (Math.abs(this.position - this.targetPosition) < 0.5 || progress >= 1) {
        this.position = this.targetPosition;
        this.spinning = false;
        this.isBraking = false;
        this.targetPosition = null;
        this._brakeStarted = false;
        const maxPos = this.stripSize * SYMBOL_SIZE;
        this.position = ((this.position % maxPos) + maxPos) % maxPos;
        this._syncPositions();
        if (this.onStopped) this.onStopped();
        return;
      }

      this._syncPositions();
      return;
    }

    // console.log('speed:', this.speed, 'delta:', delta);

    // ---- Фаза 3: Свободное вращение (speed-based) ----
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
        //  console.log(`symbol ${i}: y=${y}, pos=${pos}`);
      this.symbols[i].display.y = y;
    }
  }
}
