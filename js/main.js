'use strict';

// ===== 進入點：縮放、主迴圈、背景暫停 =====
(function () {
  const stage = document.getElementById('stage');
  const nameInput = document.getElementById('nameInput');
  const rotate = document.getElementById('rotate');

  function resize() {
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    cv.style.width = Math.floor(W * scale) + 'px';
    cv.style.height = Math.floor(H * scale) + 'px';
    stage.style.width = cv.style.width; stage.style.height = cv.style.height;
    RES = clamp(scale * (window.devicePixelRatio || 1), 0.5, RES_MAX());   // 省電模式最高 1 倍
    cv.width = Math.round(W * RES);
    cv.height = Math.round(H * RES);
    nameInput.style.fontSize = Math.round(34 * scale) + 'px';
  }
  window.applyPowerMode = resize;   // 設定切換省電模式時重新套用解析度
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  resize();

  Online.init();
  Input.init(cv);
  rotate.textContent = tr('請將手機直立握持');
  document.documentElement.lang = { zh: 'zh-Hant', ja: 'ja', en: 'en' }[Save.data.lang] || 'zh-Hant';

  // 瀏覽器在使用者操作後才允許播放聲音：第一次點擊 / 按鍵時解鎖（開場會先無聲播放）
  const unlock = () => Sound.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('touchend', unlock);
  window.addEventListener('keydown', unlock);

  // 切到背景 / 失去焦點 / 手機轉橫：遊戲自動暫停
  const playing = () => App.name === 'game' || (App.name === 'tutorial' && Screens.tutorial.phase === 'play');
  const scheduling = () => App.name === 'game' || (App.name === 'tutorial' && Screens.tutorial.phase !== 'intro');   // 教學完成卡片後面伴奏繼續
  const pauseGame = () => { if (playing() && Game.s && !Game.s.paused && !Game.s.ended) App.cur.pause(); };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { pauseGame(); Sound.suspend(); } else Sound.resume();
  });
  window.addEventListener('blur', pauseGame);
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // 樂曲排程另外用計時器跑，畫面掉幀時音樂也不會斷
  setInterval(() => { if (scheduling()) Game.schedule(); Sound.tick(); }, 25);

  App.start('boot');
  const fonts = Promise.race([document.fonts.load('40px "Mochiy Pop One"'), new Promise(r => setTimeout(r, 2000))]).catch(() => {});
  Promise.all([Assets.load(), fonts]).then(() => App.goto('title'));

  let last = performance.now();
  function loop(now) {
    // 幀率上限：60（120Hz 螢幕不會跑到 120）；省電模式 30。判定用事件時間戳記與音訊時鐘，不受幀率影響
    if (now - last < 1000 / FPS_MAX() - 1.5) { requestAnimationFrame(loop); return; }
    const landscape = !LAND && coarse && window.innerWidth > window.innerHeight * 1.1;   // 直式版面才需要提示轉回直立
    if (landscape) { rotate.style.display = 'flex'; pauseGame(); }
    else if (rotate.style.display !== 'none') rotate.style.display = 'none';
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    Game.time += dt;
    Input.update();
    Fx.update(dt);
    updateChef(dt);
    if (scheduling()) Game.schedule();
    Sound.tick();
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    App.frame(dt);
    Input.endFrame();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.__game = { App, Game, Screens, Input, Save, Sound, Online };
})();
