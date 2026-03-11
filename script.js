document.addEventListener("DOMContentLoaded", () => {
  console.log("Portfolio loaded.");

  // -- 1. Load Supabase Clients FIRST to avoid UI script crashes --
  async function loadClients() {
    console.log("Tentative de chargement des clients Supabase...");
    const clientsGrid = document.getElementById("clients-grid");

    if (!clientsGrid) {
      console.warn("La div #clients-grid est introuvable sur cette page.");
      return;
    }

    if (typeof window.supabaseClient === "undefined") {
      console.warn(
        "window.supabaseClient est indéfini. Configuration Supabase manquante.",
      );
      clientsGrid.innerHTML =
        "<p style='color: red;'>Erreur : Supabase CDN non chargé.</p>";
      return;
    }

    try {
      const { data: clients, error } = await window.supabaseClient
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      clientsGrid.innerHTML = ""; // Clear existing fallback

      if (clients && clients.length > 0) {
        console.log("Clients trouvés :", clients.length);
        clients.forEach((client) => {
          const card = document.createElement("div");
          card.classList.add("client-card", "fade-in-element", "visible"); // Forcer visible au cas où le scroll bug

          // Badge Partenaire Minecraft si applicable
          const partnerBadgeHtml = client.is_partner 
            ? `<img src="images/UI/Minecraft_Partner_Badge.webp" alt="Minecraft Partner" class="partner-badge" title="Minecraft Partner" />` 
            : "";

          card.innerHTML = `
            ${partnerBadgeHtml}
            <div class="client-logo-wrapper">
              <img src="${client.image_url}" alt="${client.name} Logo" class="client-logo" />
            </div>
            <div class="client-name">${client.name}</div>
            ${client.description ? `<div class="client-description">${client.description}</div>` : ""}
          `;

          clientsGrid.appendChild(card);
        });
      } else {
        console.log("Aucun client dans la BDD Supabase.");
        clientsGrid.innerHTML =
          "<p style='color: #888; text-align: center; width: 100%; grid-column: 1/-1;'>Aucun client ajouté pour le moment. (Créez-en un sur /admin)</p>";
      }
    } catch (err) {
      console.error("Erreur critique loadClients:", err);
      clientsGrid.innerHTML = `<p style='color: red; text-align: center; width: 100%; grid-column: 1/-1;'>Erreur de chargement: ${err.message}</p>`;
    }
  }

  // Lancement garanti sans délai
  loadClients();

  // -- Mobile Menu Toggle --
  const mobileBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      navLinks.classList.toggle("active");
    });

    // Close menu on link click
    const links = navLinks.querySelectorAll("a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
      });
    });
  }

  // -- Pixel Glow Effect generator --
  function createParticles(containerElement, numParticles, isCircle = true) {
    if (!containerElement) return;

    const blueColors = ["#00FFFF", "#007FFF", "#1F51FF", "#0AFFFF", "#00BFFF"];
    const orangeColors = [
      "#FF9B36",
      "#FFA449",
      "#FF8B1C",
      "#FFAF59",
      "#FFa022",
    ];
    const sizes = [3, 4, 5];
    const xpImages = ["images/xp1.png", "images/xp2.png"];

    for (let i = 0; i < numParticles; i++) {
      let particle;

      if (isCircle) {
        particle = document.createElement("div");
        particle.classList.add("pixel-particle");
      } else {
        particle = document.createElement("img");
        particle.classList.add("pixel-particle", "xp-particle");
        particle.src = xpImages[Math.floor(Math.random() * xpImages.length)];
      }

      let px, py;

      if (isCircle) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 35 + Math.random() * 25;
        px = 50 + radius * Math.cos(angle);
        py = 50 + radius * Math.sin(angle);

        let color;
        if (py < 45 || (py >= 45 && py < 55 && Math.random() < 0.5)) {
          color = orangeColors[Math.floor(Math.random() * orangeColors.length)];
        } else {
          color = blueColors[Math.floor(Math.random() * blueColors.length)];
        }

        const size = sizes[Math.floor(Math.random() * sizes.length)];
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}`;
      } else {
        // Spread across the entire fullscreen section
        // The section covers 100vw, so px ranges 0 to 100
        // We just keep away from the direct center block (say 35% to 65% in px and py)
        let isMobile = window.innerWidth <= 768;
        do {
          px = Math.random() * 100;
          if (isMobile) {
            // Sur mobile: uniquement en haut (0-20%) ou en bas (80-100%)
            py =
              Math.random() < 0.5
                ? Math.random() * 20
                : 80 + Math.random() * 20;
          } else {
            py = 10 + Math.random() * 80; // Keep slightly away from top/bottom direct edges
          }
        } while (!isMobile && px > 15 && px < 85 && py > 20 && py < 80); // Zone d'exclusion beaucoup plus large au centre (texte + image)

        // Petites tailles pour les XP (encore plus petites)
        let imgSize = 8 + Math.random() * 8; // entre 8px et 16px
        if (isMobile) {
          imgSize = 4 + Math.random() * 6; // entre 4px et 10px sur mobile
        }
        particle.style.width = `${imgSize}px`;
        particle.style.height = `${imgSize}px`;
        particle.style.objectFit = "contain";
        particle.style.imageRendering = "pixelated";
      }

      particle.style.left = `${px}%`;
      particle.style.top = `${py}%`;

      const floatDuration = 2 + Math.random() * 3;
      // Delay d'apparition aléatoire
      const delay = Math.random() * 2;

      particle.style.animation = `
                particleFloat ${floatDuration}s infinite ease-in-out alternate ${delay}s, 
                fadeInParticle 1s forwards ${delay}s
            `;

      containerElement.appendChild(particle);
    }
  }

  // Generate particles for Logo (dense circle, orange top, blue bot)
  const logoWrapper = document.querySelector(".logo-wrapper");
  createParticles(logoWrapper, 80, true);

  // NOTE: L'ancienne génération éparse d'XP autour de "about" a été retirée.

  // -- New specific generation of XP around the ABOUT ME text only --
  function createTextParticles(containerElement, numParticles) {
    if (!containerElement) return;
    const xpImages = ["images/xp1.png", "images/xp2.png"];
    for (let i = 0; i < numParticles; i++) {
      let particle = document.createElement("img");
      particle.classList.add("pixel-particle", "xp-particle");
      particle.src = xpImages[Math.floor(Math.random() * xpImages.length)];

      // Pick random positions around the edges of the container box
      // We'll put them slightly outside the text boundaries
      // using negative margins up to e.g. -10% or +110%
      let px, py;
      if (Math.random() > 0.5) {
        // Top or bottom edge
        px = -10 + Math.random() * 120; // x: -10 to 110
        py =
          Math.random() > 0.5
            ? -10 + Math.random() * 10
            : 100 + Math.random() * 10;
      } else {
        // Left or right edge
        px =
          Math.random() > 0.5
            ? -10 + Math.random() * 10
            : 100 + Math.random() * 10;
        py = -10 + Math.random() * 120; // y: -10 to 110
      }

      const imgSize = 4 + Math.random() * 8; // Petit: 4px à 12px
      particle.style.width = `${imgSize}px`;
      particle.style.height = `${imgSize}px`;
      particle.style.objectFit = "contain";
      particle.style.imageRendering = "pixelated";
      particle.style.left = `${px}%`;
      particle.style.top = `${py}%`;

      const floatDuration = 2 + Math.random() * 3;
      const delay = Math.random() * 2;
      particle.style.animation = `
            particleFloat ${floatDuration}s infinite ease-in-out alternate ${delay}s, 
            fadeInParticle 1s forwards ${delay}s
        `;
      containerElement.appendChild(particle);
    }
  }

  const aboutTextContainer = document.getElementById("about-text-container");
  createTextParticles(aboutTextContainer, 15);

  // -- Dynamic Sticky Scroll Progress Bar --
  const navbar = document.querySelector(".navbar");
  const scrollContainer = document.querySelector(".scroll-progress-container");
  if (navbar && scrollContainer) {
    const updateStickyTop = () => {
      scrollContainer.style.top = `${navbar.offsetHeight}px`;
    };
    updateStickyTop(); // Calcul initial
    window.addEventListener("resize", updateStickyTop); // Update on resize
  }

  // -- Lenis Smooth Scroll Setup --
  if (typeof Lenis !== "undefined") {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // get scroll value
    lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
      if (typeof updateOpacityOnScroll === "function") {
        updateOpacityOnScroll();
      }
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }

  // -- Contact Modal Toggle --
  const contactBtns = document.querySelectorAll('a[href="#contact"]');
  const contactModal = document.getElementById("contact-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const contactForm = document.getElementById("contact-form");

  if (contactModal) {
    contactBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        contactModal.classList.add("active");
      });
    });

    closeModalBtn.addEventListener("click", () => {
      contactModal.classList.remove("active");
    });

    contactModal.addEventListener("click", (e) => {
      if (e.target === contactModal) {
        contactModal.classList.remove("active");
      }
    });

    if (contactForm) {
      contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("contact-email").value;
        const subject = document.getElementById("contact-subject").value;
        const message = document.getElementById("contact-message").value;

        const finalMessage = `${message}\n\n---\nEmail de contact: ${email}`;

        // Build mailto link
        const mailtoLink = `mailto:froxal.pro@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalMessage)}`;
        window.location.href = mailtoLink;

        // Close modal after sending
        contactModal.classList.remove("active");
        contactForm.reset();
      });
    }
  }

  // -- Manual Video Loop Fix --
  const profileVideo = document.getElementById("profile-video");
  if (profileVideo) {
    profileVideo.addEventListener("ended", function () {
      this.currentTime = 0;
      this.play();
    });
  }

  // -- Scroll-linked Fade In, Fade Out bg & Progress bar --
  const dynamicBg = document.getElementById("dynamic-bg");
  const dynamicBg2 = document.getElementById("dynamic-bg2");
  const progressBar = document.getElementById("scroll-progress-bar");
  const clientsSection = document.getElementById("clients");

  window.updateOpacityOnScroll = function () {
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY; // Current scroll height
    
    // Refresh the list of elements to animate (so dynamic ones are caught)
    const fadeElements = document.querySelectorAll(".fade-in-element:not(.visible)");

    // 0. Loading Bar logic
    if (progressBar) {
      // How much we've scrolled vs how much until we reach the "center" of the About section roughly
      // Let's say it fills completely when we have scrolled 1 windowHeight
      const maxScrollForBar = windowHeight * 0.8;
      let progressRatio = scrollY / maxScrollForBar;
      progressRatio = Math.max(0, Math.min(1, progressRatio)); // Clamp 0 to 1

      progressBar.style.width = `${progressRatio * 100}%`;
    }

    // 1. Apparition des éléments About et Animations
    fadeElements.forEach((element) => {
      const rect = element.getBoundingClientRect();

      // Commence à apparaître quand l'élément est à 90% du bas de l'écran
      // Est totalement visible quand il arrive à 40% (milieu-haut)
      const startFade = windowHeight * 0.9;
      const endFade = windowHeight * 0.4;

      let ratio = (startFade - rect.top) / (startFade - endFade);
      ratio = Math.max(0, Math.min(1, ratio)); // Clamp entre 0 et 1

      element.style.opacity = ratio;
      element.style.transform = `translateY(${(1 - ratio) * 50}px)`;
    });

    // 2. Disparition graduelle du fond bg.png
    if (dynamicBg) {
      // Le fond s'efface totalement quand on arrive sur la section ABOUT
      // disons sur les 500 premiers pixels de scroll.
      const maxFadeScroll = windowHeight * 0.6;

      let bgRatio = 1 - scrollY / maxFadeScroll;
      bgRatio = Math.max(0, Math.min(1, bgRatio)); // entre 0 et 1

      dynamicBg.style.opacity = bgRatio * 0.1; // * 0.1 car c'est l'opacité max initiale
    }

    // 3. Apparition graduelle du fond bg2.png pour la section Animations
    if (dynamicBg2 && clientsSection) {
      const rect = clientsSection.getBoundingClientRect();
      // Start fading in bg2 when the animations section is at the bottom of the screen
      const startFadeIn = windowHeight;
      // Completely visible when it reaches the top/middle
      const endFadeIn = windowHeight * 0.2;

      let bg2Ratio = (startFadeIn - rect.top) / (startFadeIn - endFadeIn);
      bg2Ratio = Math.max(0, Math.min(1, bg2Ratio));

      dynamicBg2.style.opacity = bg2Ratio * 0.1; // * 0.1 pour garder le même niveau d'opacité max que bg1
    }
  };

  // Fallback normal scroll event and initial check
  window.addEventListener("scroll", window.updateOpacityOnScroll);
  window.updateOpacityOnScroll();

  // (L'ancienne fonction loadClients a été déplacée au début de ce fichier pour éviter les interférences JS)
});
