// core/input.js — keyboard state and mobile-device detection. Nothing here
// knows about the game itself; game.js reads `keys`/`justPressed` each frame.

function createInputState() {
  const keys = {};
  const justPressed = {};

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!keys[k]) justPressed[k] = true;
    keys[k] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  return {
    keys,
    justPressed,
    clearJustPressed() {
      for (const k in justPressed) delete justPressed[k];
    },
  };
}

// This game needs a keyboard, so phones/tablets get a "desktop only" screen
// instead of an unplayable control scheme.
function isMobileDevice() {
  const uaMobile = /Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const touchOnly = ('maxTouchPoints' in navigator) && navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
  const narrowViewport = Math.min(window.innerWidth, window.innerHeight) < 700;
  return uaMobile || (touchOnly && narrowViewport);
}
