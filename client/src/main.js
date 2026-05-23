import * as PIXI from 'pixi.js';
import { Reel } from './Reel.js';
import { generateVisualStripFromWeights, REEL_WIDTH, SYMBOL_SIZE, VISIBLE_SYMBOLS, createEmojiTexture } from './utils.js';

const REEL_COUNT = 3;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const app = new PIXI.Application({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x0a0a2a,
});
document.getElementById('pixi-canvas-wrapper').appendChild(app.view);

let reels = [];
let isSpinning = false;     // крутится или останавливается?
let stoppedCount = 0;
const spinBtn = document.getElementById('spin-btn');
const winDiv = document.getElementById('win-message');

const symbols = ['cherry', 'lemon', 'orange', 'bell', 'seven'];

function hideSpinButton() {
    spinBtn.style.display = 'none';
}
function showSpinButton() {
    spinBtn.style.display = 'block';
}

async function init() {
    const textures = {};
    for (const sym of symbols) {
        textures[sym] = createEmojiTexture(app, sym);
    }

    const configRes = await fetch('/api/config');
    const config = await configRes.json();
    const { symbolWeights } = config;

    function onReelStopped() {
        stoppedCount++;
        if (stoppedCount === REEL_COUNT) {
            // Все барабаны остановились
            isSpinning = false;
            showSpinButton();
            winDiv.innerText = 'Нажмите SPIN';
            console.log('Готово к новому спину');
        }
    }

    function repositionReels() {
        const startX = (app.screen.width - REEL_COUNT * REEL_WIDTH) / 2;
        const startY = (app.screen.height - VISIBLE_SYMBOLS * SYMBOL_SIZE) / 2;
        reels.forEach((r, i) => {
            r.container.x = startX + i * REEL_WIDTH;
            r.container.y = startY;
        });
    }

    for (let i = 0; i < REEL_COUNT; i++) {
        const visualStrip = generateVisualStripFromWeights(symbolWeights);
        const reel = new Reel(app, 0, 0, textures, visualStrip, 4);
        reel.onStopped = onReelStopped;
        reels.push(reel);
    }
    repositionReels();

    // Обработчик кнопки – только запуск
    spinBtn.onclick = () => {
        if (isSpinning) return;

        // Запускаем вращение
        stoppedCount = 0;
        isSpinning = true;
        hideSpinButton();
        winDiv.innerText = 'Вращение... 🎲';

        for (let r of reels) r.startSpin();

        // Запрос к серверу
        fetch('/api/spin')
            .then(response => response.json())
            .then(data => {
                // data.reels – массив символов, например ['cherry', 'lemon', 'seven']
                console.log('data.reels', data.reels);
                winDiv.innerText = 'Останавливается...';
                for (let i = 0; i < reels.length; i++) {
                    reels[i].stopAtSymbol(data.reels[i]);
                }
            })
            .catch(error => {
                console.error('Ошибка сервера:', error);
                winDiv.innerText = 'Ошибка сервера';
                // Принудительная остановка
                for (let r of reels) r.stopSpin();
                isSpinning = false;
                showSpinButton();
            });
    };

    app.ticker.add((delta) => {
        for (let r of reels) r.update(delta);
    });
}

app.ticker.addOnce(() => init());