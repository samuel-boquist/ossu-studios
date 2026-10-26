// People who've asked their system for less motion get the calm version:
// no scramble, no pixel reveals or hover pixelation, videos paused.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lets keyboard users reach and trigger things that are only clickable
// <div>/<span>s: focusable, announced as a button, Enter/Space = click.
function makeKeyboardClickable(el, label, onActivate) {
  el.setAttribute('role', el.getAttribute('role') || 'button');
  el.tabIndex = 0;
  if (label) el.setAttribute('aria-label', label);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onActivate) onActivate(); else el.click();
    }
  });
}

function scrambleText(element, delay = 0) {
  if (reduceMotion) return;
  const original = element.innerText;
  // Screen readers keep reading the real text, not the random letters.
  if (element.tagName === 'A') element.setAttribute('aria-label', original);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let progress = 0;

  setTimeout(() => {
    const interval = setInterval(() => {
      element.innerText = original.split('').map((char) => {
        if (char === ' ') return ' ';
        if (Math.random() < progress) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');

      progress += 0.005;
      if (progress >= 1) {
        element.innerText = original;
        clearInterval(interval);
      }
    }, 5);
  }, delay);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setRandomPosition(el) {
  el.style.position = 'fixed';
  el.style.left = randomBetween(window.innerWidth * 0.1, window.innerWidth * 0.7) + 'px';
  el.style.top = randomBetween(window.innerHeight * 0.2, window.innerHeight * 0.7) + 'px';
}

function makeDraggable(el, onSingleClick) {
  let isDragging = false;
  let startX, startY;
  let moved = false;

  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('card-dot') || e.target.classList.contains('filter-option')) return;
    isDragging = true;
    moved = false;
    const rect = el.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    el.style.zIndex = 1000;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = Math.abs(e.clientX - (parseFloat(el.style.left) + startX));
    const dy = Math.abs(e.clientY - (parseFloat(el.style.top) + startY));
    if (dx > 5 || dy > 5) moved = true;
    el.style.left = (e.clientX - startX) + 'px';
    el.style.top = (e.clientY - startY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    el.style.zIndex = 10;
    if (!moved && onSingleClick) onSingleClick();
  });
}

function setupDots() {
  document.querySelectorAll('.card-dot').forEach(dot => {
    makeKeyboardClickable(dot, 'Hide card');
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.target);
      target.style.transition = 'opacity 0.2s, transform 0.2s';
      target.style.opacity = '0';
      target.style.transform = 'scale(0.95)';
      setTimeout(() => target.style.display = 'none', 200);
    });
  });
}

// Each card is set up on its own, so removing one from the page
// doesn't stop the others from being placed and draggable.
const homeCards = [
  ['dragCard1', null],
  ['dragCard2', () => window.open('https://maps.google.com/?q=Göteborg', '_blank')],
  ['dragCard3', () => { window.location.href = 'mailto:ossu@studios.com'; }],
  ['dragCard4', () => { window.location.href = 'tel:0735939560'; }],
];

// Still random every load, but each card tries random spots until it
// finds one that doesn't overlap a card already placed — so they spread
// out instead of landing on top of each other. Bigger cards go first,
// since they're the hardest to fit. If a screen is too cramped to find a
// clear spot, the spot with the least overlap wins.
function placeCardsApart(cards) {
  const GAP = 24;
  const placed = [];
  // Same area setRandomPosition() uses, so they land where they always have.
  const minX = Math.round(window.innerWidth * 0.1);
  const minY = Math.round(window.innerHeight * 0.2);

  const overlap = (a, b) =>
    Math.max(0, Math.min(a.x + a.w + GAP, b.x + b.w) - Math.max(a.x, b.x - GAP)) *
    Math.max(0, Math.min(a.y + a.h + GAP, b.y + b.h) - Math.max(a.y, b.y - GAP));

  cards
    .map(el => ({ el, w: el.offsetWidth, h: el.offsetHeight }))
    .filter(c => c.w > 0) // hidden on this screen size
    .sort((a, b) => b.w * b.h - a.w * a.h)
    .forEach(c => {
      const maxX = Math.max(minX, Math.min(window.innerWidth * 0.7, window.innerWidth - c.w - 16));
      const maxY = Math.max(minY, Math.min(window.innerHeight * 0.7, window.innerHeight - c.h - 16));
      let best = null;

      for (let i = 0; i < 200; i++) {
        const spot = { x: randomBetween(minX, maxX), y: randomBetween(minY, maxY), w: c.w, h: c.h };
        const hit = placed.reduce((sum, p) => sum + overlap(spot, p), 0);
        if (!best || hit < best.hit) best = { ...spot, hit };
        if (hit === 0) break;
      }

      placed.push(best);
      c.el.style.position = 'fixed';
      c.el.style.left = best.x + 'px';
      c.el.style.top = best.y + 'px';
    });
}

const homeCardEls = [];
homeCards.forEach(([id, onClick]) => {
  const card = document.getElementById(id);
  if (!card) return;
  homeCardEls.push(card);
  makeDraggable(card, onClick);
  if (onClick) {
    makeKeyboardClickable(card, null, onClick);
    card.setAttribute('role', 'link');
  }
});
placeCardsApart(homeCardEls);

// Generic — closes any .card-dot's parent .drag-card, on any page.
setupDots();

// Only play the scramble-in effect when it'll actually be noticed: a
// fresh arrival from outside the site, or an explicit reload — not on
// every internal link click between pages, where it'd just replay on
// loop as you browse around.
function shouldPlayIntroScramble() {
  const navEntry = performance.getEntriesByType('navigation')[0];
  const isReload = navEntry && navEntry.type === 'reload';
  const cameFromExternal = !document.referrer || !document.referrer.startsWith(location.origin);
  return isReload || cameFromExternal;
}

window.addEventListener('load', () => {
  if (!shouldPlayIntroScramble()) return;

  document.querySelectorAll('.drag-card p').forEach((p) => {
    scrambleText(p, 0);
  });
  document.querySelectorAll('.nav-logo, .nav-link').forEach((el, i) => {
    scrambleText(el, i * 15);
  });
});

const video = document.getElementById('mainVideo');
const canvas = document.getElementById('pixelCanvas');

if (video && canvas) {
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerWidth * 0.5625);

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = Math.floor(window.innerWidth * 0.5625);
  });

  let pixelSize = reduceMotion ? 1 : 40;
  let frame = 0;
  canvas.setAttribute('aria-hidden', 'true');

  function drawPixelated() {
    if (video.readyState >= 2) {
      const w = Math.max(1, Math.floor(canvas.width / pixelSize));
      const h = Math.max(1, Math.floor(canvas.height / pixelSize));

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(video, 0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      frame++;
      if (frame % 3 === 0) {
        if (pixelSize > 1) {
          pixelSize = pixelSize * 0.90;
        } else {
          pixelSize = 1;
        }
      }
    }
    requestAnimationFrame(drawPixelated);
  }

  // Reduced motion: hold still on the first frame instead of looping.
  if (reduceMotion) video.pause(); else video.play();
  drawPixelated();
}

document.querySelectorAll('.figure').forEach(fig => {
  fig.setAttribute('aria-hidden', 'true');
  if (reduceMotion) {
    fig.pause();
    return;
  }
  let pixelSize = 80;
  let frame = 0;
  let resolved = false;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.style.cssText = fig.style.cssText;
  canvas.style.position = 'absolute';
  canvas.style.imageRendering = 'pixelated';
  canvas.style.zIndex = '5';
  canvas.className = fig.className;
  canvas.setAttribute('aria-hidden', 'true');

  fig.parentNode.insertBefore(canvas, fig);
  fig.style.opacity = '0';

  function start() {
    canvas.width = fig.videoWidth;
    canvas.height = fig.videoHeight;

    function draw() {
      const w = Math.max(1, Math.floor(canvas.width / pixelSize));
      const h = Math.max(1, Math.floor(canvas.height / pixelSize));

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fig, 0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      frame++;
      if (frame % 3 === 0) {
        if (pixelSize > 1) {
          pixelSize = pixelSize * 0.8;
        } else {
          resolved = true;
          canvas.style.display = 'none';
          fig.style.opacity = '1';
        }
      }
      if (!resolved) requestAnimationFrame(draw);
    }

    draw();
  }

  // A cached video can already be playable before this deferred script
  // runs, so its 'canplay' has fired and gone — start right away then.
  // { once: true } because a looping video fires 'canplay' again on every
  // loop, which used to stack up another draw loop each time.
  if (fig.readyState >= 3) {
    start();
  } else {
    fig.addEventListener('canplay', start, { once: true });
  }
});

/* WORK GRID — pixel reveal on scroll into view */
function initWorkImageReveal() {
  const resizeHandlers = [];

  document.querySelectorAll('.work-image').forEach(wrap => {
    const img = wrap.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.setAttribute('aria-hidden', 'true'); // the <img> alt text speaks for it
    wrap.appendChild(canvas);

    let pixelSize = 60;
    let targetPixelSize = 60;
    let initialPixelSize = reduceMotion ? 1 : 22;
    let frame = 0;
    let rafId = null;
    let stepInterval = 3;
    let pendingTarget = null;
    let ready = false;

    // Source crop rect, computed in setup() to replicate object-fit: cover
    // (canvas bitmaps stretch to fill their box, ignoring aspect ratio —
    // <img> doesn't have this problem, but canvas needs it done manually).
    let sx = 0, sy = 0, sw = 0, sh = 0;

    function drawFrame() {
      const w = Math.max(1, Math.floor(canvas.width / pixelSize));
      const h = Math.max(1, Math.floor(canvas.height / pixelSize));

      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
      ctx.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    function tick() {
      frame++;

      if (frame % stepInterval === 0) {
        if (pixelSize > targetPixelSize) {
          pixelSize = Math.max(targetPixelSize, pixelSize * 0.8);
        } else if (pixelSize < targetPixelSize) {
          pixelSize = Math.min(targetPixelSize, pixelSize / 0.8);
        }
      }

      drawFrame();

      if (pixelSize !== targetPixelSize) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function setTarget(px, speed) {
      if (!ready) {
        // Not set up yet — the image is still loading, so there's nothing
        // to draw. Remember this and let setup() apply it once it can
        // actually size the canvas. (Checking canvas.width === 0 here
        // never worked: a new canvas is 300x150 by default, so a reveal
        // triggered before load "finished" on a blank canvas, then setup()
        // reset it to pixelated with nothing left to resolve it but hover.)
        pendingTarget = { px, speed };
        return;
      }
      targetPixelSize = px;
      stepInterval = speed || 3;
      if (reduceMotion) {
        // Jump straight to the end state instead of animating there.
        pixelSize = px;
        drawFrame();
        return;
      }
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    // Exposed so other features (like the lightbox) can pixelate/resolve
    // this card from outside without duplicating the canvas logic.
    wrap._setPixelTarget = setTarget;

    // Canvas resolution matches the box's displayed size (not the
    // source image's raw resolution), so pixel blocks are sized in
    // real on-screen pixels — consistent whether the card is small or
    // full-width — and the final sharp image is crisp, not blurry
    // from upscaling a shrunk canvas. Split out from setup() so a
    // window resize (device rotation, or crossing a breakpoint that
    // changes the box's aspect ratio) can resize the buffer and
    // recompute the cover-crop without re-running the reveal
    // animation — otherwise the old buffer just gets stretched by the
    // canvas's CSS width/height to fit the new box, distorting it.
    function resizeCanvas() {
      const boxW = wrap.clientWidth;
      const boxH = wrap.clientHeight || boxW;
      // Hidden (display: none while filtered out on mobile) — keep the old
      // buffer; a 0x0 canvas makes drawFrame() throw and kills the loop.
      if (boxW === 0) return;
      canvas.width = boxW;
      canvas.height = boxH;

      const boxRatio = boxW / boxH;
      const imgRatio = img.naturalWidth / img.naturalHeight;

      if (imgRatio > boxRatio) {
        sh = img.naturalHeight;
        sw = sh * boxRatio;
        sx = (img.naturalWidth - sw) / 2;
        sy = 0;
      } else {
        sw = img.naturalWidth;
        sh = sw / boxRatio;
        sx = 0;
        sy = (img.naturalHeight - sh) / 2;
      }

      drawFrame();
    }

    function setup() {
      pixelSize = initialPixelSize;
      targetPixelSize = initialPixelSize;
      resizeCanvas();
      ready = true;

      if (pendingTarget) {
        const { px, speed } = pendingTarget;
        pendingTarget = null;
        setTarget(px, speed);
      }
    }

    if (img.complete && img.naturalWidth) {
      setup();
    } else {
      img.addEventListener('load', setup, { once: true });
    }

    resizeHandlers.push(() => {
      if (ready) resizeCanvas();
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTarget(1);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(wrap);
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => resizeHandlers.forEach(fn => fn()), 150);
  });
}

initWorkImageReveal();

/* Floating filter tags — draggable and randomly placed, like the homepage
   cards; a plain click (no drag) filters the grid below */
function initFilterCard() {
  const card = document.querySelector('.filter-card');
  const options = document.querySelectorAll('.filter-option');
  const items = document.querySelectorAll('.work-item[data-category]');
  if (!card || !options.length || !items.length) return;

  // Keep the card within the empty strip above the grid on first load —
  // the homepage's full-viewport bounds could drop it on top of a busy
  // photo, where the difference blend is hard to read.
  card.style.position = 'fixed';
  card.style.left = randomBetween(16, Math.max(16, window.innerWidth - 216)) + 'px';
  card.style.top = randomBetween(70, 150) + 'px';
  makeDraggable(card);

  options.forEach(option => {
    makeKeyboardClickable(option);
    option.setAttribute('aria-pressed', option.classList.contains('active'));
    option.addEventListener('click', () => {
      const wasActive = option.classList.contains('active');
      options.forEach(o => {
        o.classList.remove('active');
        o.setAttribute('aria-pressed', 'false');
      });
      if (!wasActive) option.setAttribute('aria-pressed', 'true');

      // Clicking the already-active option turns it off again — back to
      // showing everything — instead of always forcing a filter to be on.
      const category = wasActive ? 'all' : option.dataset.filter;
      if (!wasActive) option.classList.add('active');

      items.forEach(item => {
        const show = category === 'all' || item.dataset.category === category;
        const isHidden = item.classList.contains('filtered-out');
        const wrap = item.querySelector('.work-image');

        if (show && isHidden) {
          // Appear in place — the item never left the grid, so nothing
          // reflows; it just pixel-reveals back in where it already sits.
          item.classList.remove('filtered-out');
          if (wrap && wrap._setPixelTarget) wrap._setPixelTarget(18, 2);
          requestAnimationFrame(() => {
            if (wrap && wrap._setPixelTarget) wrap._setPixelTarget(1, 2);
          });
        } else if (!show && !isHidden) {
          // Disappear in place — pixelate and fade, but stay in the grid
          // (opacity, not display:none) so nothing else snaps to fill it.
          if (wrap && wrap._setPixelTarget) wrap._setPixelTarget(18, 2);
          item.classList.add('filtered-out');
        }
        // Already matches the target state — leave it exactly as it is.
      });
    });
  });
}

initFilterCard();

/* CONTACT — floating, draggable, like the homepage cards */
function initContactCard() {
  const card = document.getElementById('contactCard');
  if (!card) return;
  setRandomPosition(card);
  makeDraggable(card);
}

initContactCard();

/* NAV — dot follows the cursor on hover, locks to the click position on the active page */
function initNavDot() {
  const links = document.querySelectorAll('.nav-link');
  if (!links.length) return;

  const DOT_KEY_PREFIX = 'ossu-nav-dot:';
  const currentPage = location.pathname.split('/').pop() || 'index.html';

  // Cloudflare's static hosting serves (and the address bar shows) clean
  // URLs like /about instead of /about.html, so currentPage often has no
  // extension while every nav link's href is still the literal filename —
  // "about" !== "about.html" meant .active never got applied at all once
  // this went live, even though it worked fine against a local file
  // server serving exact filenames. Compare both with .html stripped.
  const stripHtml = (p) => p.replace(/\.html$/, '');

  function applyStoredPosition(link) {
    const href = link.getAttribute('href');
    const stored = localStorage.getItem(DOT_KEY_PREFIX + href);
    if (stored) {
      const [x, y] = stored.split(',');
      link.style.setProperty('--dot-x', x + '%');
      link.style.setProperty('--dot-y', y + '%');
    } else {
      link.style.removeProperty('--dot-x');
      link.style.removeProperty('--dot-y');
    }
  }

  function setDotPosition(link, clientX, clientY) {
    const rect = link.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    link.style.setProperty('--dot-x', x + '%');
    link.style.setProperty('--dot-y', y + '%');
    return { x, y };
  }

  links.forEach(link => {
    const href = link.getAttribute('href');
    const isCurrentPage = stripHtml(href) === stripHtml(currentPage);

    if (isCurrentPage) {
      link.classList.add('active');
      applyStoredPosition(link);
    }

    link.addEventListener('mousemove', (e) => {
      setDotPosition(link, e.clientX, e.clientY);
    });

    link.addEventListener('mouseleave', () => {
      if (isCurrentPage) {
        applyStoredPosition(link);
      }
      // Non-active links: leave --dot-x/--dot-y as-is so the dot fades out
      // right where the cursor left it, instead of jumping back to center.
    });

    // Touch has no hover to drift the dot into place before a tap, so
    // position (and reveal, via the .active/CSS below) it right on
    // touchdown instead of waiting for the click that follows — same
    // effect as mousemove, just for a finger instead of a cursor.
    link.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      if (touch) setDotPosition(link, touch.clientX, touch.clientY);
    }, { passive: true });

    link.addEventListener('click', (e) => {
      const { x, y } = setDotPosition(link, e.clientX, e.clientY);
      localStorage.setItem(DOT_KEY_PREFIX + href, x + ',' + y);
    });
  });
}

initNavDot();

/* STUDIO — click a card to see it enlarged */
function initLightbox() {
  const items = document.querySelectorAll('.studio-grid .work-item');
  if (!items.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML =
    '<button type="button" class="lightbox-close">Close</button>' +
    '<img class="lightbox-image" alt="">' +
    '<p class="lightbox-label"></p>';
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.lightbox-image');
  const lbLabel = lightbox.querySelector('.lightbox-label');
  const lbClose = lightbox.querySelector('.lightbox-close');
  let openedFrom = null;

  // Pixelate the real grid behind the modal — the actual page, dimmed,
  // not a fake copy of the clicked photo — same look as the initial
  // page-load reveal, just held in that state while the modal is open.
  function setGridPixelated(pixelated) {
    document.querySelectorAll('.studio-grid .work-image').forEach(wrap => {
      if (wrap._setPixelTarget) wrap._setPixelTarget(pixelated ? 18 : 1, 1);
    });
  }

  function open(item) {
    const img = item.querySelector('img');
    const label = item.querySelector('.work-label');

    // Grid shows small thumbnails; the enlarged view loads the original.
    lbImg.src = img.dataset.full || img.src;
    lbLabel.textContent = label ? label.textContent : '';
    lbImg.alt = img.alt;
    lightbox.setAttribute('aria-label', img.alt);
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('active');
    setGridPixelated(true);
    openedFrom = item;
    lbClose.focus();
  }

  function close() {
    if (!lightbox.classList.contains('active')) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    setGridPixelated(false);
    // Back to the photo you opened, so keyboard users don't lose their place.
    if (openedFrom) openedFrom.focus();
  }

  items.forEach(item => {
    const img = item.querySelector('img');
    makeKeyboardClickable(item, img ? 'Enlarge ' + img.alt : null);
    item.addEventListener('click', () => open(item));
  });

  lightbox.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    // The only control inside is Close — keep Tab from leaving the dialog.
    if (e.key === 'Tab') {
      e.preventDefault();
      lbClose.focus();
    }
  });
}

initLightbox();

