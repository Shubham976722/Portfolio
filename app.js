(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  const navLinks = nav ? Array.from(nav.querySelectorAll("a[href^='#']")) : [];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  const year = document.getElementById("year");
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const sheetURL = "https://script.google.com/macros/s/AKfycbxw52r2xvGBFCSa1aN1LYoVppk2udZFtOrlSW3Ow4qAGpwLEJyMthmE2t0ZmQEicLWm/exec";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  function setMenu(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.querySelector(".sr-only").textContent = open ? "Close menu" : "Open menu";
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      setMenu(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
  }

  function onScroll() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }

    const marker = window.scrollY + 140;
    let current = "";
    sections.forEach((section) => {
      if (section.offsetTop <= marker) current = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Progressive scroll reveal */
  document.querySelectorAll(".metrics-grid, .skill-groups").forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty("--stagger", String(index));
    });
  });

  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (!reducedMotion && "IntersectionObserver" in window && revealEls.length) {
    document.documentElement.classList.add("reveal-ready");

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Subtle one-time counter animation for metrics */
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  if (!reducedMotion && "IntersectionObserver" in window && counters.length) {
    const animateCount = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || "0", 10);
      const suffix = el.dataset.suffix || "";
      const duration = 850;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = `${value.toFixed(decimals)}${suffix}`;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = `${target.toFixed(decimals)}${suffix}`;
        }
      };

      requestAnimationFrame(tick);
    };

    const countObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => countObserver.observe(el));
  }

  /* Gentle interactive tilt & glare for visual cards on pointer devices */
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reducedMotion && canHover) {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * 5;
        const ry = (x - 0.5) * 6;

        card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        card.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* Quick copy for contact email */
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy");
      if (!value) return;
      const original = button.textContent;
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = "Copied";
        button.classList.add("is-copied");
        window.setTimeout(() => {
          button.textContent = original;
          button.classList.remove("is-copied");
        }, 1800);
      } catch (err) {
        button.textContent = value;
      }
    });
  });

  if (form && status) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      status.className = "form-status";

      if (!form.checkValidity()) {
        status.textContent = "Please add your name, a valid email, and a message.";
        status.classList.add("is-error");
        form.reportValidity();
        return;
      }

      const button = form.querySelector("button[type='submit']");
      const original = button.textContent;
      button.disabled = true;
      button.textContent = "Sending...";
      status.textContent = "";

      try {
        await fetch(sheetURL, {
          method: "POST",
          body: new FormData(form)
        });
        form.reset();
        status.textContent = "Message sent. Shubham will get back to you.";
        status.classList.add("is-success");
      } catch (error) {
        status.textContent = "The form could not be sent. Email shubhammhaske19@gmail.com instead.";
        status.classList.add("is-error");
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    });
  }
})();
