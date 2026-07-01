/* ================================================================
   PARAM JAIN PORTFOLIO — script.js
   Car scroll animation + all interactions
   ================================================================ */

'use strict';

// ── UTILITIES ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);

// ── STATE ───────────────────────────────────────────────────────
let scrollY = 0;
let scrollPct = 0;
let lastScrollY = 0;
let scrollVelocity = 0;
let raf = null;
let cursorX = -100, cursorY = -100;
let cursorTargetX = -100, cursorTargetY = -100;
let isDriving = false;
let carPos = 8; // left% of car
let currentSection = 0;

// ── ELEMENTS ────────────────────────────────────────────────────
const cursor       = $('cursor');
const scrollFill   = $('scrollFill');
const nav          = $('nav');
const carContainer = $('carContainer');
const carSvg       = $('carSvg');
const exhaust      = $('exhaust');
const speedLines   = $('speedLines');
const signBoard    = $('signBoard');
const signText     = $('signText');
const roadCenterLine = $('roadCenterLine');

// ── SECTION DEFINITIONS ─────────────────────────────────────────
const sections = [
  { id: 'hero',       sign: 'START',     carPct: 8  },
  { id: 'work',       sign: 'MY WORKS',  carPct: 22 },
  { id: 'experience', sign: 'EXP ↓',    carPct: 42 },
  { id: 'certs',      sign: 'CERTS ↓',  carPct: 60 },
  { id: 'about',      sign: 'ABOUT ↓',  carPct: 75 },
  { id: 'contact',    sign: 'FINISH 🏁', carPct: 88 },
];

// ── INIT ────────────────────────────────────────────────────────
function init() {
  initCursor();
  initScroll();
  initReveal();
  initCounters();
  initSkillBars();
  initForm();
  initCarWheel();
  loop();
}

// ── CURSOR ──────────────────────────────────────────────────────
function initCursor() {
  document.addEventListener('mousemove', e => {
    cursorTargetX = e.clientX;
    cursorTargetY = e.clientY;
  });

  document.addEventListener('mouseleave', () => {
    cursor.classList.add('hidden');
  });
  document.addEventListener('mouseenter', () => {
    cursor.classList.remove('hidden');
  });

  // Grow on interactive elements
  const hoverable = $$('a, button, .work-card, input, textarea, .company-pill, .at-list span');
  hoverable.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}

function updateCursor() {
  cursorX = lerp(cursorX, cursorTargetX, 0.18);
  cursorY = lerp(cursorY, cursorTargetY, 0.18);
  cursor.style.left = cursorX + 'px';
  cursor.style.top  = cursorY + 'px';
}

// ── SCROLL HANDLING ─────────────────────────────────────────────
function initScroll() {
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial
}

function onScroll() {
  lastScrollY = scrollY;
  scrollY = window.scrollY;
  scrollVelocity = Math.abs(scrollY - lastScrollY);

  const docH = document.documentElement.scrollHeight - window.innerHeight;
  scrollPct = docH > 0 ? scrollY / docH : 0;

  // Progress bar
  scrollFill.style.width = (scrollPct * 100) + '%';

  // Nav scroll state
  nav.classList.toggle('scrolled', scrollY > 60);

  // Detect current section
  detectSection();

  // Update car position
  updateCar();

  // Road center line speed
  const speed = clamp(scrollVelocity * 2, 0.3, 3);
  roadCenterLine.style.animationDuration = (1 / speed) + 's';
}

// ── SECTION DETECTION ───────────────────────────────────────────
function detectSection() {
  const vh = window.innerHeight;
  let active = 0;

  sections.forEach((sec, i) => {
    const el = document.getElementById(sec.id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top <= vh * 0.5) active = i;
  });

  if (active !== currentSection) {
    currentSection = active;
    updateSign(sections[active]);
  }
}

function updateSign(sec) {
  signBoard.classList.add('active');
  signText.style.opacity = '0';
  signText.style.transform = 'translateY(-6px)';

  setTimeout(() => {
    signText.textContent = sec.sign;
    signText.style.transition = 'opacity 0.3s, transform 0.3s';
    signText.style.opacity = '1';
    signText.style.transform = 'translateY(0)';
  }, 150);

  setTimeout(() => signBoard.classList.remove('active'), 2000);
}

// ── CAR ANIMATION ────────────────────────────────────────────────
function updateCar() {
  // Car target position based on scroll percentage
  const targetCarPos = 8 + scrollPct * 72; // 8% to 80%

  // Smooth approach
  carPos = lerp(carPos, targetCarPos, 0.04);
  carContainer.style.left = carPos + '%';

  // Driving state (is user scrolling?)
  const driving = scrollVelocity > 2;

  if (driving !== isDriving) {
    isDriving = driving;
    setDrivingState(driving);
  }
}

function setDrivingState(on) {
  if (on) {
    carSvg.classList.add('rev');
    exhaust.classList.add('on');
    speedLines.classList.add('on');
  } else {
    carSvg.classList.remove('rev');
    exhaust.classList.remove('on');
    speedLines.classList.remove('on');
  }
}

// Spin wheels based on scroll velocity
function initCarWheel() {
  // The wheel circles rotate via the animation already;
  // We add data-driven rotation to the spoke groups
}

// ── RAF LOOP ─────────────────────────────────────────────────────
function loop() {
  updateCursor();
  raf = requestAnimationFrame(loop);
}

// ── REVEAL ON SCROLL ────────────────────────────────────────────
function initReveal() {
  const revealEls = $$('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        // Animate skill bars when about section is visible
        if (entry.target.classList.contains('about-skills')) {
          animateSkillBars();
        }
        // Animate stats
        if (entry.target.id && entry.target.id.startsWith('astat-')) {
          animateCounter(entry.target.querySelector('.astat-num'));
        }
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  revealEls.forEach(el => observer.observe(el));

  // Also observe stat containers
  $$('.about-stats').forEach(el => {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        el.querySelectorAll('.astat-num').forEach(n => animateCounter(n));
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
  });
}

// ── SKILL BARS ──────────────────────────────────────────────────
function initSkillBars() {
  const bars = $$('.sb-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => observer.observe(b));
}

function animateSkillBars() {
  $$('.sb-fill').forEach(bar => bar.classList.add('animated'));
}

// ── COUNTER ANIMATION ────────────────────────────────────────────
function initCounters() {
  // Handled via IntersectionObserver in initReveal
}

function animateCounter(el) {
  if (!el) return;
  const target  = parseInt(el.dataset.target, 10);
  const decimal = el.dataset.decimal || '';
  if (isNaN(target)) return;
  const duration = 1600;
  const start = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = clamp(elapsed / duration, 0, 1);
    const eased    = 1 - Math.pow(2, -10 * progress);
    el.textContent = Math.round(eased * target);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target + decimal;
    }
  }

  requestAnimationFrame(step);
}

// ── FORM ─────────────────────────────────────────────────────────
function initForm() {
  const form    = $('contactForm');
  const success = $('cfSuccess');
  const btn     = $('cf-submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name  = $('cfName').value.trim();
    const email = $('cfEmail').value.trim();
    const msg   = $('cfMsg').value.trim();

    if (!name || !email || !msg) {
      shake(form);
      return;
    }

    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "be1376ca-1348-4074-8487-255320c99021", 
          name: name,
          email: email,
          message: msg,
        }),
      });

      const result = await response.json();

      if (response.status === 200) {
        btn.textContent = 'Sent!';
        success.classList.add('show');
        form.reset();
      } else {
        console.error("Web3Forms error:", result);
        btn.textContent = 'Error sending';
      }
    } catch (error) {
      console.error("Network error:", error);
      btn.textContent = 'Error sending';
    } finally {
      setTimeout(() => {
        btn.innerHTML = 'Send Message <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        btn.disabled = false;
        success.classList.remove('show');
      }, 4000);
    }
  });
}

function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight; // reflow
  el.style.animation = 'shake 0.4s ease';
  setTimeout(() => el.style.animation = '', 400);
}

// Inject shake keyframes
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    40%      { transform: translateX(6px); }
    60%      { transform: translateX(-4px); }
    80%      { transform: translateX(4px); }
  }
`;
document.head.appendChild(shakeStyle);

// ── TICKER PAUSE ON HOVER ────────────────────────────────────────
const tickerInner = $('tickerInner');
if (tickerInner) {
  const track = tickerInner.querySelector('.ticker-track');
  if (track) {
    tickerInner.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    tickerInner.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
  }
}

// ── SMOOTH ANCHOR SCROLLING ──────────────────────────────────────
$$('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── TILT EFFECT ON WORK CARDS ─────────────────────────────────────
$$('.work-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.01)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
  });
});

// ── HERO NAME LETTER HOVER ───────────────────────────────────────
function wrapLetters(el) {
  if (!el) return;
  const text = el.textContent;
  el.innerHTML = [...text].map(ch =>
    ch === ' ' ? ' ' : `<span class="letter">${ch}</span>`
  ).join('');
}

$$('.hn-first, .hn-last').forEach(el => {
  wrapLetters(el);
  el.querySelectorAll('.letter').forEach((letter, i) => {
    letter.style.display = 'inline-block';
    letter.style.transition = `transform 0.3s ${i * 0.03}s, color 0.3s`;
    letter.addEventListener('mouseenter', () => {
      letter.style.transform = 'translateY(-4px)';
      letter.style.color = 'var(--accent)';
    });
    letter.addEventListener('mouseleave', () => {
      letter.style.transform = 'translateY(0)';
      letter.style.color = '';
    });
  });
});

// ── SCROLL VELOCITY DECAY ────────────────────────────────────────
// Auto-decay velocity after scroll stops
let decayTimer = null;
window.addEventListener('scroll', () => {
  clearTimeout(decayTimer);
  decayTimer = setTimeout(() => {
    scrollVelocity = 0;
    setDrivingState(false);
  }, 150);
}, { passive: true });

// ── PARALLAX ON HERO ─────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const heroEl = document.querySelector('.s-hero');
  if (!heroEl) return;
  const rect = heroEl.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) return;

  const progress = -rect.top / window.innerHeight;
  const heroLeft = heroEl.querySelector('.hero-left');
  if (heroLeft) {
    heroLeft.style.transform = `translateY(${progress * 40}px)`;
    heroLeft.style.opacity   = 1 - progress * 1.5;
  }
}, { passive: true });

// ── CAR HONK ON CLICK ────────────────────────────────────────────
carContainer && carContainer.addEventListener('click', () => {
  // Visual honk effect
  carSvg.style.filter = 'drop-shadow(0 0 20px rgba(137,207,240,0.9)) drop-shadow(0 2px 16px rgba(0,0,0,0.6))';
  carContainer.style.transform = 'scale(1.05)';

  // Ripple on road
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position:absolute; bottom:30px; left:${carPos}%;
    width:40px; height:20px;
    border:1px solid var(--accent);
    border-radius:50%;
    pointer-events:none;
    animation: rippleOut 0.6s ease-out forwards;
    z-index:1;
  `;
  const roadStrip = document.getElementById('roadStrip');
  roadStrip && roadStrip.appendChild(ripple);

  setTimeout(() => {
    carSvg.style.filter = '';
    carContainer.style.transform = '';
    ripple.remove();
  }, 600);
});

// Inject ripple animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleOut {
    from { transform: scale(1); opacity: 1; }
    to   { transform: scale(3); opacity: 0; }
  }
`;
document.head.appendChild(rippleStyle);

// ── ABOUT SCROLL TEXT ────────────────────────────────────────────
// Already animated via CSS, but pause when out of view
const astTrack = document.querySelector('.ast-track');
if (astTrack) {
  const observer = new IntersectionObserver(entries => {
    astTrack.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
  });
  observer.observe(astTrack);
}

// ── SCENERY SPEED LINKED TO SCROLL ──────────────────────────────
window.addEventListener('scroll', () => {
  const spd = clamp(Math.abs(scrollVelocity) * 0.5 + 14, 14, 5);
  document.querySelectorAll('.scene-item').forEach(item => {
    item.style.animationDuration = spd + 's';
  });
}, { passive: true });

// ── KEYBOARD NAVIGATION ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    const next = currentSection + 1 < sections.length ? sections[currentSection + 1] : null;
    if (next) {
      const el = document.getElementById(next.id);
      el && el.scrollIntoView({ behavior: 'smooth' });
    }
  }
  if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    const prev = currentSection - 1 >= 0 ? sections[currentSection - 1] : null;
    if (prev) {
      const el = document.getElementById(prev.id);
      el && el.scrollIntoView({ behavior: 'smooth' });
    }
  }
});

// ── ABOUT SECTION — stats trigger on view ───────────────────────
const aboutStats = document.querySelector('.about-stats');
if (aboutStats) {
  const io = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      aboutStats.querySelectorAll('.astat-num').forEach(el => animateCounter(el));
      io.disconnect();
    }
  }, { threshold: 0.5 });
  io.observe(aboutStats);
}

// ── CAR TRACK — pointer events for honk ──────────────────────────
const roadStrip = document.getElementById('roadStrip');
if (roadStrip) roadStrip.style.pointerEvents = 'none';
if (carContainer) carContainer.style.pointerEvents = 'auto';

// ── ACTIVE NAV LINK ──────────────────────────────────────────────
function updateActiveNav() {
  const links = { work: $('nav-work'), about: $('nav-about'), contact: $('nav-contact') };
  const secId = sections[currentSection]?.id;
  Object.keys(links).forEach(key => {
    if (links[key]) {
      links[key].style.color = key === secId ? 'var(--text-white)' : '';
    }
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });

// ── START ───────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

