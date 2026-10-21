'use strict';
(() => {
const header = document.querySelector('#header');
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const form = document.querySelector('#request-form');
const result = document.querySelector('#form-result');
const selection = document.querySelector('#selected-property');
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
if (header) {
  const update_header = () => header.classList.toggle('scrolled', window.scrollY > 30);
  update_header();
  window.addEventListener('scroll', update_header, { passive: true });
}
if (menu && navigation) {
  const close_menu = () => {
    navigation.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
  };
  menu.addEventListener('click', () => {
    const opened = navigation.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(opened));
    menu.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', close_menu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('open')) {
      close_menu();
      menu.focus();
    }
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', close_menu);
}
if (form) {
  const contact = form.elements.namedItem('contact');
  const name = form.elements.namedItem('name');
  const validate = () => {
    name.setCustomValidity(name.value.trim().length >= 2 ? '' : 'Введите имя: не менее двух символов.');
    const value = contact.value.trim();
    const phone = /^\+?[\d\s()\-]{7,25}$/.test(value) && value.replace(/\D/g, '').length >= 7;
    const username = /^@[a-z\d_]{4,32}$/i.test(value);
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    contact.setCustomValidity(phone || username || email ? '' : 'Введите телефон с кодом страны, @username или email.');
  };
  form.addEventListener('input', () => {
    validate();
    result.hidden = true;
    result.replaceChildren();
  });
  document.querySelectorAll('[data-property]').forEach(link => {
    link.addEventListener('click', () => {
      form.elements.namedItem('property').value = link.dataset.property;
      selection.textContent = 'Выбранный объект: ' + link.dataset.property;
      selection.hidden = false;
      result.hidden = true;
      result.replaceChildren();
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    validate();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const message = [
      'Здравствуйте! Хочу получить подборку недвижимости от SeaNest.',
      'Имя: ' + String(data.get('name')).trim(),
      'Контакт: ' + String(data.get('contact')).trim(),
      'Бюджет: ' + (String(data.get('budget')).trim() || 'пока не определён'),
      'Цель: ' + data.get('purpose'),
      'Объект: ' + (data.get('property') || 'персональная подборка')
    ].join('\n');
    // Здесь можно подключить API обработки заявки вместо подготовки ссылки WhatsApp.
    // Запрос к API выполняйте только после проверки данных и явного действия пользователя.
    const link = document.createElement('a');
    link.href = 'https://wa.me/995591098301?text=' + encodeURIComponent(message);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Перейти в WhatsApp и отправить сообщение ↗';
    result.replaceChildren(document.createTextNode('Сообщение подготовлено. Заявка ещё не отправлена.'), link);
    result.hidden = false;
  });
}

// Единый ритм появления: элементы одной группы выходят последовательно.
// Контент остаётся доступным без JavaScript и при отключённых анимациях.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
// Слои первого экрана догоняют прокрутку и мягко затухают после остановки колеса.
const wave = document.querySelector('.hero .waves');
const scene = document.querySelector('.hero-scroll-scene');
const waveViewport = window.matchMedia('(min-width: 1000px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)');
if (wave && scene && 'animate' in Element.prototype && CSS.supports('animation-timeline', 'view()')) {
  let waveMotion = null;
  const layerMotions = [];
  const heroLayers = [
    { element: scene.querySelector('.hero-content'), frames: [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-40px)', opacity: 0.85 }
    ] },
    { element: scene.querySelector('.hero-image'), frames: [
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(30px) scale(0.97)' }
    ] }
  ];
  let waveFrame = 0;
  let waveTime = 0;
  let waveProgress = 0;
  let waveTarget = 0;
  const renderWave = time => {
    const elapsed = waveTime ? Math.min(time - waveTime, 50) : 16;
    waveTime = time;
    waveProgress += (waveTarget - waveProgress) * (1 - Math.exp(-elapsed / 190));
    const settled = Math.abs(waveTarget - waveProgress) < 0.00003;
    if (settled) waveProgress = waveTarget;
    waveMotion.currentTime = waveProgress * 1000;
    layerMotions.forEach(animation => { animation.currentTime = waveProgress * 1000; });
    waveFrame = settled ? 0 : requestAnimationFrame(renderWave);
    if (settled) waveTime = 0;
  };
  const updateWave = (snap = false) => {
    if (!waveViewport.matches || document.hidden) {
      cancelAnimationFrame(waveFrame);
      waveFrame = 0;
      waveTime = 0;
      if (waveMotion) waveMotion.cancel();
      layerMotions.forEach(animation => animation.cancel());
      layerMotions.length = 0;
      waveMotion = null;
      return;
    }
    const bounds = scene.getBoundingClientRect();
    const distance = Math.max(1, bounds.height - document.documentElement.clientHeight);
    waveTarget = Math.max(0, Math.min(1, -bounds.top / distance));
    if (!waveMotion) {
      waveMotion = wave.animate([
        { transform: 'translate(0,0)', opacity: 0.85 },
        { transform: 'translate(-50%,-20px)', opacity: 1 }
      ], { duration: 1000, fill: 'both', easing: 'linear' });
      waveMotion.pause();
      heroLayers.forEach(layer => {
        if (!layer.element) return;
        const animation = layer.element.animate(layer.frames, { duration: 1000, fill: 'both', easing: 'linear' });
        animation.pause();
        layerMotions.push(animation);
      });
      snap = true;
    }
    if (snap) {
      cancelAnimationFrame(waveFrame);
      waveFrame = 0;
      waveTime = 0;
      waveProgress = waveTarget;
      waveMotion.currentTime = waveProgress * 1000;
      layerMotions.forEach(animation => { animation.currentTime = waveProgress * 1000; });
    } else if (!waveFrame) {
      waveFrame = requestAnimationFrame(renderWave);
    }
  };
  window.addEventListener('scroll', () => updateWave(), { passive: true });
  window.addEventListener('resize', () => updateWave(true), { passive: true });
  waveViewport.addEventListener('change', () => updateWave(true));
  document.addEventListener('visibilitychange', () => updateWave(true));
  updateWave(true);
}
// Ореол плавно догоняет мышь; цикл останавливается, когда движение закончено.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
if ('animate' in Element.prototype) {
  const halo = document.createElement('div');
  halo.className = 'cursor-halo';
  halo.setAttribute('aria-hidden', 'true');
  const haloLayer = document.createElement('div');
  haloLayer.className = 'cursor-halo-layer';
  haloLayer.setAttribute('aria-hidden', 'true');
  haloLayer.append(halo);
  document.body.append(haloLayer);
  const haloMotion = halo.animate([
    { transform: 'translate3d(0,0,0)' },
    { transform: 'translate3d(0,0,0)' }
  ], { duration: 1, fill: 'both' });
  haloMotion.pause();
  haloMotion.currentTime = 1;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let frame = 0;
  let previousTime = 0;
  let positioned = false;
  const renderHalo = time => {
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 16;
    previousTime = time;
    const smoothing = 1 - Math.exp(-elapsed / 145);
    currentX += (targetX - currentX) * smoothing;
    currentY += (targetY - currentY) * smoothing;
    const settled = Math.hypot(targetX - currentX, targetY - currentY) < 0.15;
    if (settled) {
      currentX = targetX;
      currentY = targetY;
    }
    const transform = `translate3d(${currentX}px,${currentY}px,0)`;
    haloMotion.effect.setKeyframes([{ transform }, { transform }]);
    frame = settled ? 0 : requestAnimationFrame(renderHalo);
    if (settled) previousTime = 0;
  };
  const hideHalo = () => {
    halo.classList.remove('is-visible');
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
    positioned = false;
  };
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || motionPreference.matches) return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!positioned) {
      currentX = targetX;
      currentY = targetY;
      positioned = true;
      renderHalo(performance.now());
    }
    halo.classList.add('is-visible');
    if (!frame) frame = requestAnimationFrame(renderHalo);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', hideHalo);
  window.addEventListener('blur', hideHalo);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hideHalo();
  });
  finePointer.addEventListener('change', hideHalo);
  motionPreference.addEventListener('change', hideHalo);
}
if ('IntersectionObserver' in window && 'animate' in Element.prototype) {
  const animations = new Set();
  const animateEntry = (element, delay = 0) => {
    if (motionPreference.matches) {
      element.classList.remove('motion-pending');
      return;
    }
    const animation = element.animate([
      { opacity: 0, translate: '0 18px' },
      { opacity: 1, translate: '0 0' }
    ], { duration: 1250, delay, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'both' });
    animations.add(animation);
    const finishEntry = () => {
      element.classList.remove('motion-pending');
      animations.delete(animation);
      animation.cancel();
    };
    animation.finished.then(finishEntry, finishEntry);
  };
  document.querySelectorAll('.hero-content > *, .hero-image, .hero-caption').forEach((element, index) => {
    animateEntry(element, Math.min(index * 85, 510));
  });
  const observer = new IntersectionObserver(entries => {
    let sequence = 0;
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animateEntry(entry.target, Math.min(sequence++ * 85, 255));
    });
  }, { threshold: 0.05, rootMargin: '0px 0px 20px 0px' });
  document.querySelectorAll('.section > .container > .eyebrow, .section-heading, .benefit, .property, .steps li, .about-grid > div, .request-grid > div, #request-form, .footer-top, .footer-bottom').forEach(element => {
    // Начальное состояние задаётся до попадания блока в экран, а не после.
    if (!motionPreference.matches) element.classList.add('motion-pending');
    observer.observe(element);
  });
  // Переход с клавиатуры сразу открывает блок с получившим фокус элементом.
  document.addEventListener('focusin', event => {
    document.querySelectorAll('.motion-pending').forEach(element => {
      if (!element.contains(event.target)) return;
      observer.unobserve(element);
      element.classList.remove('motion-pending');
      animations.forEach(animation => {
        if (animation.effect.target === element) animation.cancel();
      });
    });
  });
  motionPreference.addEventListener('change', () => {
    if (!motionPreference.matches) return;
    document.querySelectorAll('.motion-pending').forEach(element => element.classList.remove('motion-pending'));
    animations.forEach(animation => animation.cancel());
  });
}
})();
