(() => {
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.page-progress span');
  const navLinks = [...document.querySelectorAll('.section-nav a')];
  const sections = [...document.querySelectorAll('main section[id], main footer[id]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
  } else {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
  }

  const initMountainParticles = () => {
    const hero = document.querySelector('.hero');
    const mountain = hero?.querySelector('.hero-art');
    const canvas = hero?.querySelector('.mountain-particles');
    const context = canvas?.getContext('2d');
    if (!hero || !mountain || !canvas || !context) return;

    const pointer = { x: -1000, y: -1000, active: false };
    const particles = [];
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let animationId = 0;
    let lastFrame = 0;
    let heroIsVisible = true;

    const resize = () => {
      const bounds = hero.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      const count = Math.min(96, Math.max(32, Math.round((width * height) / 17000)));
      particles.length = 0;
      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: .45 + Math.random() * 1.05,
          alpha: .22 + Math.random() * .42,
          drift: (Math.random() - .5) * .14,
          rise: .08 + Math.random() * .24,
          phase: Math.random() * Math.PI * 2,
        });
      }
      paint(1, false);
    };

    const paint = (step, animate) => {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      const nearby = [];
      for (const particle of particles) {
        if (animate) {
          particle.phase += .012 * step;
          particle.x += (particle.drift + Math.sin(particle.phase) * .025) * step;
          particle.y -= particle.rise * step;
          if (particle.y < -5) { particle.y = height + 5; particle.x = Math.random() * width; }
          if (particle.x < -5) particle.x = width + 5;
          if (particle.x > width + 5) particle.x = -5;
        }
        let x = particle.x;
        let y = particle.y;
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        const influence = pointer.active ? Math.max(0, 1 - distance / 150) : 0;
        if (influence > 0) {
          x += (dx / Math.max(distance, 1)) * influence * 11;
          y += (dy / Math.max(distance, 1)) * influence * 11;
        }
        const shimmer = animate ? .84 + Math.sin(particle.phase) * .16 : 1;
        const alpha = Math.min(.9, (particle.alpha + influence * .38) * shimmer);
        context.beginPath();
        context.fillStyle = `rgba(224, 239, 204, ${alpha})`;
        context.shadowColor = influence ? 'rgba(226, 244, 206, .92)' : 'rgba(212, 232, 193, .5)';
        context.shadowBlur = influence ? 12 : 5;
        context.arc(x, y, particle.radius + influence * .45, 0, Math.PI * 2);
        context.fill();
        nearby.push({ x, y });
      }
      context.shadowBlur = 0;
      for (let first = 0; first < nearby.length; first += 1) {
        for (let second = first + 1; second < nearby.length; second += 1) {
          const dx = nearby[first].x - nearby[second].x;
          const dy = nearby[first].y - nearby[second].y;
          const distance = Math.hypot(dx, dy);
          if (distance < 78) {
            context.beginPath();
            context.strokeStyle = `rgba(207, 227, 187, ${(1 - distance / 78) * .12})`;
            context.lineWidth = .65;
            context.moveTo(nearby[first].x, nearby[first].y);
            context.lineTo(nearby[second].x, nearby[second].y);
            context.stroke();
          }
        }
      }
      if (pointer.active) {
        const glow = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 125);
        glow.addColorStop(0, 'rgba(210, 236, 189, .075)');
        glow.addColorStop(1, 'rgba(210, 236, 189, 0)');
        context.fillStyle = glow;
        context.fillRect(pointer.x - 125, pointer.y - 125, 250, 250);
      }
    };

    const tick = (time) => {
      animationId = 0;
      if (reduceMotion || !heroIsVisible || document.hidden) return;
      const step = lastFrame ? Math.min((time - lastFrame) / 16.67, 2) : 1;
      lastFrame = time;
      paint(step, true);
      animationId = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (!reduceMotion && heroIsVisible && !document.hidden && !animationId) {
        lastFrame = 0;
        animationId = window.requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (animationId) window.cancelAnimationFrame(animationId);
      animationId = 0;
    };

    hero.addEventListener('pointermove', (event) => {
      if (reduceMotion || event.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
      mountain.style.setProperty('--parallax-x', `${((pointer.x / bounds.width) - .5) * -12}px`);
      mountain.style.setProperty('--parallax-y', `${((pointer.y / bounds.height) - .5) * -9}px`);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointer.active = false;
      mountain.style.setProperty('--parallax-x', '0px');
      mountain.style.setProperty('--parallax-y', '0px');
    }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        heroIsVisible = entry.isIntersecting;
        heroIsVisible ? start() : stop();
      }, { threshold: 0.01 }).observe(hero);
    }
    resize();
    if (reduceMotion) paint(1, false);
    else start();
  };
  initMountainParticles();

  const onScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const amount = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
    progress.style.height = `${amount}%`;
    header.classList.toggle('is-scrolled', window.scrollY > 28);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if ('IntersectionObserver' in window) {
    const activeObserver = new IntersectionObserver((entries) => {
      const current = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      const index = sections.findIndex((section) => section.id === current.target.id);
      navLinks.forEach((link, linkIndex) => link.classList.toggle('is-active', linkIndex === Math.min(index, navLinks.length - 1)));
    }, { rootMargin: '-35% 0px -45% 0px', threshold: [0, .2, .5, .8] });
    sections.forEach((section) => activeObserver.observe(section));
  }
})();
