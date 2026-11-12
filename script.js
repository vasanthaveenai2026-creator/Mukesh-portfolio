document.addEventListener("DOMContentLoaded", () => {
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = hasGSAP && !prefersReduced;
  // "Lite" mode for phones / touch devices: lighter animations, native scrolling
  const lite = window.matchMedia("(max-width: 920px), (pointer: coarse)").matches;

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  // 1. Procedurally Generate Intricate Mandala Petals
  const outerPetals = document.getElementById("petals-outer");
  const innerPetals = document.getElementById("petals-inner");

  if (outerPetals) {
    for (let i = 0; i < 24; i++) {
      const angle = i * 15;
      const petal = document.createElementNS("http://www.w3.org/2000/svg", "path");
      petal.setAttribute("d", "M200 35 C215 70, 215 105, 200 130 C185 105, 185 70, 200 35 Z");
      petal.setAttribute("transform", `rotate(${angle} 200 200)`);
      outerPetals.appendChild(petal);
    }
  }

  if (innerPetals) {
    for (let i = 0; i < 16; i++) {
      const angle = i * 22.5;
      const petal = document.createElementNS("http://www.w3.org/2000/svg", "path");
      petal.setAttribute("d", "M200 105 C210 130, 210 155, 200 175 C190 155, 190 130, 200 105 Z");
      petal.setAttribute("transform", `rotate(${angle} 200 200)`);
      innerPetals.appendChild(petal);
    }
  }

  // 2. Smooth Scrolling (Lenis) synced with GSAP ScrollTrigger
  let lenis = null;
  // Native scrolling is smoother than JS smooth-scroll on phones, so Lenis is desktop only
  if (animate && !lite && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // 3. Theme switch for the light-contrast zone (kept from original, now via ScrollTrigger)
  const lightZone = document.querySelector(".light-contrast-wrapper");
  if (lightZone && hasGSAP) {
    ScrollTrigger.create({
      trigger: lightZone,
      start: "top 80%",
      end: "bottom 20%",
      onToggle: (self) => document.body.classList.toggle("light-theme", self.isActive),
    });
  }

  // 4. Split-Screen Sticky Spotlight for Lineage & Qualifications
  const milestoneCards = document.querySelectorAll(".milestone-card");
  const spotIndex = document.getElementById("spotIndex");
  const spotBadge = document.getElementById("spotBadge");
  const spotTitle = document.getElementById("spotTitle");
  const spotDesc = document.getElementById("spotDesc");
  const spotProgress = document.getElementById("spotProgress");
  let currentLang = "en";
  let activeCardEl = null;

  function getMilestoneText(card, field) {
    if (currentLang === "ta") {
      if (field === "badge") return card.dataset.badgeTa || card.dataset.badge;
      if (field === "title") return card.dataset.titleTa || card.dataset.title;
      if (field === "desc") return card.dataset.descTa || card.dataset.desc;
    }
    return card.dataset[field];
  }

  function activateMilestone(card, index) {
    const changed = activeCardEl !== card;
    activeCardEl = card;

    milestoneCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");

    if (spotIndex) spotIndex.textContent = card.dataset.num;
    if (spotBadge) spotBadge.textContent = getMilestoneText(card, "badge");
    if (spotTitle) spotTitle.textContent = getMilestoneText(card, "title");
    if (spotDesc) spotDesc.innerHTML = getMilestoneText(card, "desc");

    const pct = ((index + 1) / milestoneCards.length) * 100;
    if (spotProgress) {
      if (animate) gsap.to(spotProgress, { width: `${pct}%`, duration: 0.8, ease: "power3.out", overwrite: true });
      else spotProgress.style.width = `${pct}%`;
    }

    // Smooth text swap in the spotlight panel
    if (animate && changed) {
      gsap.fromTo(
        [spotIndex, spotBadge, spotTitle, spotDesc].filter(Boolean),
        { y: 18, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: 0.07, overwrite: true }
      );
    }
  }

  milestoneCards.forEach((card, index) => {
    card.addEventListener("click", () => activateMilestone(card, index));
  });

  const milestoneObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(milestoneCards).indexOf(entry.target);
          if (idx !== -1) activateMilestone(entry.target, idx);
        }
      });
    },
    { root: null, rootMargin: "-35% 0px -45% 0px", threshold: 0.1 }
  );

  milestoneCards.forEach((card) => milestoneObserver.observe(card));

  // 5. Language Toggle Engine (EN <-> Tamil)
  const langToggleBtn = document.getElementById("langToggleBtn");
  const langTextSpan = langToggleBtn ? langToggleBtn.querySelector(".lang-text") : null;

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "ta" : "en";

      if (langTextSpan) {
        langTextSpan.textContent = langTextSpan.getAttribute(`data-${currentLang}`);
      }

      document.querySelectorAll("[data-en][data-ta]").forEach((el) => {
        el.innerHTML = el.getAttribute(`data-${currentLang}`);
      });

      const activeCard = document.querySelector(".milestone-card.active");
      if (activeCard) {
        const activeIdx = Array.from(milestoneCards).indexOf(activeCard);
        activateMilestone(activeCard, activeIdx !== -1 ? activeIdx : 0);
      }
    });
  }

  if (!animate) return; // reduced motion or GSAP failed to load: page stays fully visible

  // =========================================================
  // GSAP ANIMATIONS
  // =========================================================

  // 6. Language button: disappears after scrolling down, returns at the top
  const langWrap = document.querySelector(".lang-toggle-wrap");
  if (langWrap) {
    gsap.from(langWrap, { y: -30, autoAlpha: 0, duration: 0.9, delay: 0.9, ease: "power3.out" });

    ScrollTrigger.create({
      start: 80,
      end: "max",
      onEnter: () => {
        langWrap.classList.add("is-hidden");
        gsap.to(langWrap, { y: -30, autoAlpha: 0, duration: 0.45, ease: "power2.in", overwrite: true });
      },
      onLeaveBack: () => {
        langWrap.classList.remove("is-hidden");
        gsap.to(langWrap, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out", overwrite: true });
      },
    });
  }

  // 7. Hero intro timeline
  const heroName = document.getElementById("monumentalName");
  const heroSub = document.querySelector(".hero-sub-bar");
  const threadPath = document.getElementById("heroThreadPath");

  const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  if (heroName) {
    intro.from(heroName, { yPercent: 28, scale: 1.1, autoAlpha: 0, duration: 1.6 }, 0.1);
  }
  if (heroSub) {
    intro.from(heroSub, { y: 30, autoAlpha: 0, duration: 1.1 }, 0.9);
  }
  if (threadPath) {
    const length = threadPath.getTotalLength();
    gsap.set(threadPath, { strokeDasharray: length, strokeDashoffset: length });
    intro.to(threadPath, { strokeDashoffset: 0, duration: 2, ease: "expo.out" }, 0.3);
  }
  gsap.from(".whatsapp-float", {
    scale: 0, autoAlpha: 0, duration: 0.8, delay: 1.8, ease: "back.out(2)", clearProps: "transform,opacity,visibility",
  });

  // 8. Hero scroll: title drifts, shrinks and fades as you leave
  const heroSection = document.querySelector(".monumental-hero");
  if (heroSection) {
    gsap.to(".hero-title-wrap", {
      y: lite ? 70 : 150, scale: lite ? 1 : 0.94, autoAlpha: 0.15, ease: "none",
      scrollTrigger: { trigger: heroSection, start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero-thread-svg", {
      autoAlpha: 0, ease: "none",
      scrollTrigger: { trigger: heroSection, start: "top top", end: "70% top", scrub: true },
    });
  }

  // 9. Ambient background parallax (orbs + mandala drift at different speeds)
  if (!lite) {
    const docScroll = { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 1.2 };
    gsap.to(".orb-1", { "--py": "260px", ease: "none", scrollTrigger: docScroll });
    gsap.to(".orb-2", { "--py": "-320px", ease: "none", scrollTrigger: docScroll });
    gsap.to(".orb-3", { "--py": "180px", ease: "none", scrollTrigger: docScroll });
    gsap.to(".mandala-bg", { "--py": "320px", ease: "none", scrollTrigger: docScroll });
  }

  // 10. Section headers: pill, title, text rise one after another
  gsap.utils.toArray(".gallery-intro, .section-header").forEach((header) => {
    gsap.from(header.children, {
      y: 45, autoAlpha: 0, duration: 1.1, ease: "power3.out", stagger: 0.14,
      scrollTrigger: { trigger: header, start: "top 85%", toggleActions: "play none none reverse" },
    });
  });

  // 11. Gallery cards: rise in, image reveals with a clip-path + settling zoom
  gsap.utils.toArray(".gallery-card-item").forEach((card) => {
    gsap.from(card, {
      y: lite ? 40 : 70, autoAlpha: 0, duration: lite ? 0.8 : 1.2, ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 90%", toggleActions: lite ? "play none none none" : "play none none reverse" },
    });

    const img = card.querySelector("img");
    if (img && lite) {
      // Phones: one cheap fade/zoom instead of a scroll-scrubbed clip-path
      gsap.from(img, {
        scale: 1.08, autoAlpha: 0, duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 90%", toggleActions: "play none none none" },
      });
    } else if (img) {
      gsap.fromTo(
        img,
        { scale: 1.25, clipPath: "inset(14% 14% 14% 14% round 16px)" },
        {
          scale: 1, clipPath: "inset(0% 0% 0% 0% round 16px)", ease: "none",
          scrollTrigger: { trigger: card, start: "top 92%", end: "top 40%", scrub: 0.8 },
        }
      );
    }

    const caption = card.querySelector(".story-caption-box, figcaption");
    if (caption) {
      gsap.from(caption.children.length ? caption.children : caption, {
        y: 28, autoAlpha: 0, duration: 0.9, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: card, start: "top 70%", toggleActions: "play none none reverse" },
      });
    }
  });

  // 12. Resume cards: staggered batch reveal
  gsap.set(".resume-card", { y: 60, autoAlpha: 0 });
  ScrollTrigger.batch(".resume-card", {
    start: "top 88%",
    onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.16, overwrite: true }),
    onLeaveBack: (batch) => gsap.to(batch, { y: 60, autoAlpha: 0, duration: 0.5, ease: "power2.in", overwrite: true }),
  });

  // 13. Credentials spotlight panel + footer
  const spotlight = document.querySelector(".lineage-sticky-pane");
  if (spotlight) {
    gsap.from(spotlight, {
      x: -50, autoAlpha: 0, duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: ".lineage-split-layout", start: "top 80%", toggleActions: "play none none reverse" },
    });
  }
  // Footer name only; the Instagram icon stays always visible
  gsap.from(".footer-name", {
    y: 30, autoAlpha: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".glass-footer", start: "top 100%", toggleActions: "play none none none" },
  });

  // 14. Recalculate trigger positions once fonts / images have settled
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
});