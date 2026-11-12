document.addEventListener("DOMContentLoaded", () => {
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

  // 2. Hero Sweeping SVG Thread Draw-In on Load
  const threadPath = document.getElementById("heroThreadPath");
  if (threadPath) {
    const length = threadPath.getTotalLength();
    threadPath.style.strokeDasharray = length;
    threadPath.style.strokeDashoffset = length;
    threadPath.getBoundingClientRect();
    threadPath.style.transition = "stroke-dashoffset 1.8s cubic-bezier(0.22, 1, 0.36, 1)";
    threadPath.style.strokeDashoffset = "0";
  }

  // 3. Gradual Scroll-Progress Reveal & Gentle Theme Transition
  const scrollItems = document.querySelectorAll(".scroll-fade-item");
  const monumentalName = document.getElementById("monumentalName");
  const lightZone = document.querySelector(".light-contrast-wrapper");

  function updateScrollAnimations() {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY;

    if (monumentalName) {
      const heroProgress = Math.min(scrollY / (windowHeight * 0.85), 1);
      monumentalName.style.transform = `translateY(${scrollY * 0.18}px) scale(${1 - heroProgress * 0.06})`;
      monumentalName.style.opacity = `${1 - heroProgress * 0.75}`;
    }

    if (lightZone) {
      const zoneRect = lightZone.getBoundingClientRect();
      const triggerTop = windowHeight * 0.8;
      const triggerBottom = windowHeight * 0.2;
      if (zoneRect.top <= triggerTop && zoneRect.bottom >= triggerBottom) {
        document.body.classList.add("light-theme");
      } else {
        document.body.classList.remove("light-theme");
      }
    }

    scrollItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const startTrigger = windowHeight * 0.96;
      const endTrigger = windowHeight * 0.48;
      const rawProgress = (startTrigger - rect.top) / (startTrigger - endTrigger);
      const progress = Math.max(0, Math.min(1, rawProgress));
      const eased = 1 - Math.pow(1 - progress, 3);

      item.style.setProperty("--item-opacity", eased.toFixed(3));
      item.style.setProperty("--item-y", `${((1 - eased) * 55).toFixed(1)}px`);

      const img = item.querySelector("img");
      if (img) {
        img.style.setProperty("--img-opacity", (0.05 + eased * 0.95).toFixed(3));
        img.style.setProperty("--img-scale", (1.09 - eased * 0.09).toFixed(4));
        img.style.setProperty("--img-blur", `${((1 - eased) * 7).toFixed(2)}px`);
      }
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateScrollAnimations();
        ticking = false;
      });
      ticking = true;
    }
  });
  window.addEventListener("resize", updateScrollAnimations);
  updateScrollAnimations();

  // 4. Split-Screen Sticky Spotlight for Lineage & Qualifications
  const milestoneCards = document.querySelectorAll(".milestone-card");
  const spotIndex = document.getElementById("spotIndex");
  const spotBadge = document.getElementById("spotBadge");
  const spotTitle = document.getElementById("spotTitle");
  const spotDesc = document.getElementById("spotDesc");
  const spotProgress = document.getElementById("spotProgress");
  let currentLang = "en";

  function getMilestoneText(card, field) {
    if (currentLang === "ta") {
      if (field === "badge") return card.dataset.badgeTa || card.dataset.badge;
      if (field === "title") return card.dataset.titleTa || card.dataset.title;
      if (field === "desc") return card.dataset.descTa || card.dataset.desc;
    }
    return card.dataset[field];
  }

  function activateMilestone(card, index) {
    milestoneCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");

    if (spotIndex) spotIndex.textContent = card.dataset.num;
    if (spotBadge) spotBadge.textContent = getMilestoneText(card, "badge");
    if (spotTitle) spotTitle.textContent = getMilestoneText(card, "title");
    if (spotDesc) spotDesc.innerHTML = getMilestoneText(card, "desc");
    if (spotProgress) {
      const pct = ((index + 1) / milestoneCards.length) * 100;
      spotProgress.style.width = `${pct}%`;
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
    {
      root: null,
      rootMargin: "-35% 0px -45% 0px",
      threshold: 0.1,
    }
  );

  milestoneCards.forEach((card) => milestoneObserver.observe(card));

  // 5. Language Toggle Engine (EN <-> Tamil)
  const langToggleBtn = document.getElementById("langToggleBtn");
  const langTextSpan = langToggleBtn ? langToggleBtn.querySelector(".lang-text") : null;

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "ta" : "en";
      
      // Update toggle button text
      if (langTextSpan) {
        langTextSpan.textContent = langTextSpan.getAttribute(`data-${currentLang}`);
      }

      // Translate all elements with data-en and data-ta attributes
      document.querySelectorAll("[data-en][data-ta]").forEach((el) => {
        el.innerHTML = el.getAttribute(`data-${currentLang}`);
      });

      // Refresh active milestone spotlight details in current language
      const activeCard = document.querySelector(".milestone-card.active");
      if (activeCard) {
        const activeIdx = Array.from(milestoneCards).indexOf(activeCard);
        activateMilestone(activeCard, activeIdx !== -1 ? activeIdx : 0);
      }
    });
  }
});