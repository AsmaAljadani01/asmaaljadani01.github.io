/* Two features: the "Spot the bug" game and copying the email */
(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  /* ---------- 1) Spot the bug ---------- */

  // Each mistake: its name, why it matters, and where to look
  const bugs = {
    spelling: { name: 'Spelling', why: '"Creat" is now "Create". A typo in a title is noticed first.', hint: 'Read the title slowly.' },
    align: { name: 'Alignment', why: 'The email field was pushed out of line. All fields now share one edge.', hint: 'Compare the edges of the fields.' },
    password: { name: 'Exposed password', why: 'The password was readable on screen. It is now hidden.', hint: 'What could someone next to you read?' },
    contrast: { name: 'Faint text', why: 'The helper text was too pale to read. The contrast went from 2.0 to 9.7.', hint: 'Is every line easy to read?' },
    buttons: { name: 'Wrong main button', why: '"Cancel" stood out more than "Sign up". The main action now leads.', hint: 'Which button catches your eye first?' },
  };

  const spots = $$('.spot');
  const total = Object.keys(bugs).length;
  const found = new Set();
  const say = (text) => { $('#feedback').textContent = text; };

  const fix = (id) => {
    if (found.has(id)) return;
    found.add(id);
    const spot = $(`[data-bug="${id}"]`);
    spot.classList.add('fixed');
    spot.dataset.number = found.size;
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = bugs[id].name;
    item.append(title, bugs[id].why);
    $('#found').append(item);
    $('#score').textContent = `${found.size} of ${total} found`;
  };

  spots.forEach((spot) =>
    spot.addEventListener('click', () => {
      const id = spot.dataset.bug;
      if (!id) { say('That part is fine. Keep looking.'); return; }
      fix(id);
      say(found.size === total ? 'All 5 found. You have a sharp eye.' : `${bugs[id].name}: ${bugs[id].why}`);
      if (found.size === total) confetti();
    })
  );

  $('#hint').addEventListener('click', () => {
    const next = Object.keys(bugs).find((id) => !found.has(id));
    say(next ? bugs[next].hint : 'Nothing left to find.');
  });

  $('#reveal').addEventListener('click', () => {
    Object.keys(bugs).forEach(fix);
    say('All answers are shown below.');
  });

  $('#restart').addEventListener('click', () => {
    found.clear();
    spots.forEach((spot) => { spot.classList.remove('fixed'); delete spot.dataset.number; });
    $('#found').replaceChildren();
    $('#score').textContent = `0 of ${total} found`;
    say('Start anywhere on the card.');
  });

  /* ---------- 2) Copy email ---------- */

  $('#copy-email').addEventListener('click', async () => {
    const status = $('#copy-status');
    try {
      await navigator.clipboard.writeText($('.email').textContent.trim());
      status.textContent = 'Email copied';
    } catch (e) {
      status.textContent = 'Could not copy. Tap the email and copy it manually.';
    }
  });

  /* ---------- 3) Creative touches ---------- */

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Typed line above the name
  const typed = $('#typed');
  if (typed && !reduce) {
    const phrases = ['Computer science student', 'I build interfaces', 'I test with an eye for detail', 'From the UI to the database'];
    let p = 0, i = 0, deleting = false;
    typed.textContent = '';
    const tick = () => {
      const word = phrases[p];
      typed.textContent = word.slice(0, i);
      if (!deleting && i === word.length) { deleting = true; return setTimeout(tick, 1700); }
      if (deleting && i === 0) { deleting = false; p = (p + 1) % phrases.length; return setTimeout(tick, 350); }
      i += deleting ? -1 : 1;
      setTimeout(tick, deleting ? 28 : 65);
    };
    setTimeout(tick, 500);
  }

  // Soft light that follows the pointer (mouse only)
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    document.documentElement.classList.add('has-glow');
    addEventListener('pointermove', (e) => {
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
    }, { passive: true });
  }

  // Scroll progress bar
  const bar = $('.progress');
  const paint = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
  };
  addEventListener('scroll', paint, { passive: true });
  addEventListener('resize', paint);
  paint();

  // Sections fade in as you reach them
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }), { threshold: 0.12 });
    $$('.project, .about-grid > div, .split > div, .contact .wrap > *').forEach((el) => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // QA mode: outlines every element and shows a small report
  const qaBtn = $('#qa-toggle');
  const hud = $('#qa-hud');
  const updateHud = () => {
    const missingAlt = $$('img').filter((img) => !img.hasAttribute('alt')).length;
    const interactive = $$('a[href]:not([href=""]), button').length;
    hud.textContent = `QA mode: ${innerWidth}×${innerHeight} viewport, ${$$('h1,h2,h3,h4').length} headings, ${interactive} interactive elements, ${missingAlt} images missing alt text`;
  };
  const toggleQA = () => {
    const on = document.body.classList.toggle('qa');
    qaBtn.setAttribute('aria-pressed', String(on));
    hud.hidden = !on;
    if (on) updateHud();
  };
  qaBtn.addEventListener('click', toggleQA);
  addEventListener('resize', () => { if (!hud.hidden) updateHud(); });

  // Quick menu (Ctrl+K or Cmd+K)
  const palette = $('#palette');
  const openBtn = $('#open-palette');
  if (palette && typeof palette.showModal === 'function') {
    const scrollTo = (id) => () => document.getElementById(id).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    const cmds = [
      { label: 'Go to Projects', run: scrollTo('projects') },
      { label: 'Play Spot the bug', run: scrollTo('bugs') },
      { label: 'Go to About me', run: scrollTo('about') },
      { label: 'Go to Contact', run: scrollTo('contact') },
      { label: 'Copy email', run: () => { scrollTo('contact')(); $('#copy-email').click(); } },
      { label: 'Download CV', run: () => $('a[download]').click() },
      { label: 'Open GitHub', run: () => $('a[href*="github.com"]').click() },
      { label: 'Open LinkedIn', run: () => $('a[href*="linkedin.com"]').click() },
      { label: 'Toggle QA mode', run: toggleQA },
      { label: 'Show all bug answers', run: () => { scrollTo('bugs')(); $('#reveal').click(); } },
    ];
    const input = $('#pal-q');
    const list = $('#pal-list');
    let shown = [];
    let active = 0;

    const run = (cmd) => { palette.close(); setTimeout(cmd.run, 50); };
    const render = () => {
      const q = input.value.trim().toLowerCase();
      shown = cmds.filter((c) => c.label.toLowerCase().includes(q));
      active = Math.min(active, Math.max(shown.length - 1, 0));
      const items = shown.map((cmd, n) => {
        const li = document.createElement('li');
        li.id = `pal-${n}`;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', String(n === active));
        li.textContent = cmd.label;
        li.addEventListener('click', () => run(cmd));
        return li;
      });
      if (!items.length) {
        const none = document.createElement('li');
        none.className = 'none';
        none.textContent = 'No match. Try “cv” or “email”.';
        items.push(none);
      }
      list.replaceChildren(...items);
      input.setAttribute('aria-activedescendant', shown.length ? `pal-${active}` : '');
    };

    const open = () => { input.value = ''; active = 0; render(); palette.showModal(); input.focus(); };
    openBtn.addEventListener('click', open);
    input.addEventListener('input', () => { active = 0; render(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(shown.length, 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(shown.length, 1); render(); }
      else if (e.key === 'Enter' && shown[active]) { e.preventDefault(); run(shown[active]); }
    });
    palette.addEventListener('click', (e) => { if (e.target === palette) palette.close(); });
    addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        palette.open ? palette.close() : open();
      }
    });
  } else if (openBtn) {
    openBtn.hidden = true;
  }

  // Confetti when all five bugs are found
  function confetti() {
    if (reduce) return;
    const c = document.createElement('canvas');
    c.className = 'confetti';
    c.setAttribute('aria-hidden', 'true');
    c.width = innerWidth;
    c.height = innerHeight;
    document.body.append(c);
    const ctx = c.getContext('2d');
    const colors = ['#cdacff', '#ff9dcb', '#8cf0c4', '#fbf8ff', '#7a52c4'];
    const bits = Array.from({ length: 150 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 240, y: innerHeight * 0.62,
      vx: (Math.random() - 0.5) * 15, vy: -Math.random() * 17 - 4,
      s: 7 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    let frame = 0;
    const step = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach((b) => {
        b.vy += 0.35; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r);
        ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        ctx.restore();
      });
      if (++frame < 160) requestAnimationFrame(step); else c.remove();
    };
    step();
  }
})();
