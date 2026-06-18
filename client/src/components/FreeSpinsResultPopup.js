import { Graphics, Text, Container } from 'pixi.js';

export function createFreeSpinsResultPopup(actor, app) {
  const container = new Container();
  container.visible = false;
  container.zIndex = 1000;

  // Фон
  const bg = new Graphics();
  bg.beginFill(0x000000, 0.9);
  bg.drawRoundedRect(-210, -110, 420, 220, 20);
  bg.endFill();
  bg.lineStyle(3, 0xFFD700, 1);
  bg.drawRoundedRect(-210, -110, 420, 220, 20);
  container.addChild(bg);

  // Заголовок
  const title = new Text('🎰 Free Spins Complete!', {
    fontSize: 24,
    fill: 0xFFD700,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    align: 'center',
    wordWrap: true,
    wordWrapWidth: 360,
  });
  title.anchor.set(0.5);
  title.position.set(0, -45);
  container.addChild(title);

  // Сумма выигрыша
  const winText = new Text('', {
    fontSize: 32,
    fill: 0xFFFFFF,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    align: 'center',
  });
  winText.anchor.set(0.5);
  winText.position.set(0, 10);
  container.addChild(winText);

  // Кнопка OK
  const btnBg = new Graphics();
  btnBg.beginFill(0xFFD700);
  btnBg.drawRoundedRect(-55, 50, 110, 45, 10);
  btnBg.endFill();
  btnBg.eventMode = 'static';
  btnBg.cursor = 'pointer';
  container.addChild(btnBg);

  const btnText = new Text('OK', {
    fontSize: 22,
    fill: 0x000000,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  });
  btnText.anchor.set(0.5);
  btnText.position.set(0, 72);
  container.addChild(btnText);

  btnBg.on('pointertap', () => {
    container.visible = false;
    actor.send({ type: 'CLOSE_RESULT' });
  });

  // Центрирование
  const position = () => {
    container.x = app.screen.width / 2;
    container.y = app.screen.height / 2;
  };
  app.renderer.on('resize', position);
  position();

  // Добавляем на сцену (app.stage уже имеет sortableChildren: true)
  app.stage.addChild(container);

  return {
    show: (totalWin) => {
      winText.text = totalWin > 0 ? `+${totalWin} coins` : 'No win 😅';
      container.visible = true;
    },
    hide: () => {
      container.visible = false;
    },
  };
}
