function scrambleText(element, delay = 0) {
  const original = element.innerText;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let progress = 0;

  setTimeout(() => {
    const interval = setInterval(() => {
      element.innerText = original.split('').map((char) => {
        if (char === ' ') return ' ';
        if (Math.random() < progress) return original[element.innerText.indexOf(char)];
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
  el.style.left = randomBetween(20, window.innerWidth * 0.5) + 'px';
  el.style.top = randomBetween(80, window.innerHeight * 0.5) + 'px';
}

function makeDraggable(el, onSingleClick) {
  let isDragging = false;
  let startX, startY;
  let moved = false;

  el.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('card-dot')) return;
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
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = Math.floor(window.innerWidth * 0.35);

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = Math.floor(window.innerWidth * 0.35);
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
        pixelSize = pixelSize * 0.8;
      } else {
        pixelSize = 1;
      }
    }
  }
  requestAnimationFrame(drawPixelated);
}

video.play();
drawPixelated();

document.querySelectorAll('.figure').forEach(fig => {
  let pixelSize = 40;
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

