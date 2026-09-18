function scrambleText(element, delay = 0) {
  const original = element.innerText;
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
    el.style.cursor = 'grabbing';
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
    el.style.cursor = 'grab';
    el.style.zIndex = 10;
    if (!moved && onSingleClick) onSingleClick();
  });
}

function setupDots() {
  document.querySelectorAll('.card-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.target);
      target.style.transition = 'opacity 0.2s, transform 0.2s';
      target.style.opacity = '0';
      target.style.transform = 'scale(0.95)';
      setTimeout(() => target.style.display = 'none', 200);
    });
  });
}

const card1 = document.getElementById('dragCard1');
const card2 = document.getElementById('dragCard2');
const card3 = document.getElementById('dragCard3');
const card4 = document.getElementById('dragCard4');

if (card1 && card2 && card3 && card4) {
  setRandomPosition(card1);
  setRandomPosition(card2);
  setRandomPosition(card3);
  setRandomPosition(card4);

  makeDraggable(card1);
  makeDraggable(card2, () => {
    window.open('https://maps.google.com/?q=Göteborg', '_blank');
  });
  makeDraggable(card3, () => {
    window.location.href = 'mailto:ossu@studios.com';
  });
  makeDraggable(card4, () => {
    window.location.href = 'tel:0735939560';
  });

  setupDots();
}

window.addEventListener('load', () => {
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

  let pixelSize = 40;
  let frame = 0;

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

  video.play();
  drawPixelated();
}

document.querySelectorAll('.figure').forEach(fig => {
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

  fig.parentNode.insertBefore(canvas, fig);
  fig.style.opacity = '0';

  fig.addEventListener('canplay', () => {
    canvas.width = fig.videoWidth;
    canvas.height = fig.videoHeight;

    function draw() {
      if (!resolved) {
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
            pixelSize = 1;
            resolved = true;
            canvas.style.display = 'none';
            fig.style.opacity = '1';
          }
        }
      }
      requestAnimationFrame(draw);
    }

    draw();
  });
});

/* WORK GRID — pixel reveal on scroll into view, re-pixelates on hover */
function initWorkImageReveal() {
  document.querySelectorAll('.work-image').forEach(wrap => {
    const img = wrap.querySelector('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    wrap.appendChild(canvas);

    let pixelSize = 60;
    let targetPixelSize = 60;
    let initialPixelSize = 22;
    let hoverPixelSize = 9;
    let frame = 0;
    let rafId = null;
    let stepInterval = 3;

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

    function setTarget(px, fast) {
      targetPixelSize = px;
      stepInterval = fast ? 1 : 3;
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    // Exposed so other features (like the lightbox) can pixelate/resolve
    // this card from outside without duplicating the canvas logic.
    wrap._setPixelTarget = setTarget;

    function setup() {
      // Canvas resolution matches the box's displayed size (not the
      // source image's raw resolution), so pixel blocks are sized in
      // real on-screen pixels — consistent whether the card is small or
      // full-width — and the final sharp image is crisp, not blurry
      // from upscaling a shrunk canvas.
      const boxW = wrap.clientWidth;
      const boxH = wrap.clientHeight || boxW;
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

      pixelSize = initialPixelSize;
      targetPixelSize = initialPixelSize;
      drawFrame();
    }

    if (img.complete && img.naturalWidth) {
      setup();
    } else {
      img.addEventListener('load', setup, { once: true });
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTarget(1);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(wrap);

    const item = wrap.closest('.work-item');
    if (item) {
      item.addEventListener('mouseenter', () => setTarget(hoverPixelSize));
      item.addEventListener('mouseleave', () => setTarget(1));
    }
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
    option.addEventListener('click', () => {
      const wasActive = option.classList.contains('active');
      options.forEach(o => o.classList.remove('active'));

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
          if (wrap && wrap._setPixelTarget) wrap._setPixelTarget(18, true);
          requestAnimationFrame(() => {
            if (wrap && wrap._setPixelTarget) wrap._setPixelTarget(1, true);
          });
        } else if (!show && !isHidden) {
          // Disappear in place — pixelate and fade, but stay in the grid
          // (opacity, not display:none) so nothing else snaps to fill it.
          if (wrap && wrap._setPixelTarget) wrap._setPixelTarget(18, true);
          item.classList.add('filtered-out');
        }
        // Already matches the target state — leave it exactly as it is.
      });
    });
  });
}

initFilterCard();

/* NAV — dot follows the cursor on hover, locks to the click position on the active page */
function initNavDot() {
  const links = document.querySelectorAll('.nav-link');
  if (!links.length) return;

  const DOT_KEY_PREFIX = 'ossu-nav-dot:';
  const currentPage = location.pathname.split('/').pop() || 'index.html';

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

  links.forEach(link => {
    const href = link.getAttribute('href');

    if (href === currentPage) {
      link.classList.add('active');
      applyStoredPosition(link);
    }

    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      link.style.setProperty('--dot-x', x + '%');
      link.style.setProperty('--dot-y', y + '%');
    });

    link.addEventListener('mouseleave', () => {
      if (href === currentPage) {
        applyStoredPosition(link);
      }
      // Non-active links: leave --dot-x/--dot-y as-is so the dot fades out
      // right where the cursor left it, instead of jumping back to center.
    });

    link.addEventListener('click', (e) => {
      const rect = link.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
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
  lightbox.innerHTML =
    '<span class="lightbox-close">Close</span>' +
    '<img class="lightbox-image">' +
    '<p class="lightbox-label"></p>';
  document.body.appendChild(lightbox);

  const lbImg = lightbox.querySelector('.lightbox-image');
  const lbLabel = lightbox.querySelector('.lightbox-label');

  // Pixelate the real grid behind the modal — the actual page, dimmed,
  // not a fake copy of the clicked photo — same look as the initial
  // page-load reveal, just held in that state while the modal is open.
  function setGridPixelated(pixelated) {
    document.querySelectorAll('.studio-grid .work-image').forEach(wrap => {
      if (wrap._setPixelTarget) wrap._setPixelTarget(pixelated ? 18 : 1, true);
    });
  }

  function open(item) {
    const img = item.querySelector('img');
    const label = item.querySelector('.work-label');

    lbImg.src = img.src;
    lbLabel.textContent = label ? label.textContent : '';
    lightbox.classList.add('active');
    setGridPixelated(true);
  }

  function close() {
    lightbox.classList.remove('active');
    setGridPixelated(false);
  }

  items.forEach(item => {
    item.addEventListener('click', () => open(item));
  });

  lightbox.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

initLightbox();

