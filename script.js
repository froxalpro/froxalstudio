document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio loaded.");

    // -- Mobile Menu Toggle --
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.classList.toggle('active');
        });

        // Close menu on link click
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // -- Pixel Glow Effect generator --
    function createParticles(containerElement, numParticles, isCircle = true) {
        if (!containerElement) return;

        const blueColors = ['#00FFFF', '#007FFF', '#1F51FF', '#0AFFFF', '#00BFFF'];
        const orangeColors = ['#FF9B36', '#FFA449', '#FF8B1C', '#FFAF59', '#FFa022'];
        const sizes = [3, 4, 5];
        const xpImages = ['images/xp1.png', 'images/xp2.png'];

        for (let i = 0; i < numParticles; i++) {
            let particle;

            if (isCircle) {
                particle = document.createElement('div');
                particle.classList.add('pixel-particle');
            } else {
                particle = document.createElement('img');
                particle.classList.add('pixel-particle', 'xp-particle');
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
                do {
                    px = Math.random() * 100;
                    py = 10 + Math.random() * 80; // Keep slightly away from top/bottom direct edges
                } while (px > 25 && px < 75 && py > 30 && py < 70); // Retry if it lands in the middle zone

                // Petites tailles pour les XP (encore plus petites)
                const imgSize = 8 + Math.random() * 8; // entre 8px et 16px
                particle.style.width = `${imgSize}px`;
                particle.style.height = `${imgSize}px`;
                particle.style.objectFit = 'contain';
                particle.style.imageRendering = 'pixelated';
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
    const logoWrapper = document.querySelector('.logo-wrapper');
    createParticles(logoWrapper, 80, true);

    // Generate max 15 small XP images around About section (spread wide on the screen)
    const xpContainer = document.getElementById('about'); // The whole section
    createParticles(xpContainer, 15, false);

    // -- Dynamic Sticky Scroll Progress Bar --
    const navbar = document.querySelector('.navbar');
    const scrollContainer = document.querySelector('.scroll-progress-container');
    if (navbar && scrollContainer) {
        const updateStickyTop = () => {
            scrollContainer.style.top = `${navbar.offsetHeight}px`;
        };
        updateStickyTop(); // Calcul initial
        window.addEventListener('resize', updateStickyTop); // Update on resize
    }

    // -- Lenis Smooth Scroll Setup --
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        })

        // get scroll value
        lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
            if (typeof updateOpacityOnScroll === 'function') {
                updateOpacityOnScroll();
            }
        })

        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)
    }

    // -- Scroll-linked Fade In, Fade Out bg & Progress bar --
    const fadeElements = document.querySelectorAll('.fade-in-element');
    const dynamicBg = document.getElementById('dynamic-bg');
    const progressBar = document.getElementById('scroll-progress-bar');

    window.updateOpacityOnScroll = function () {
        const windowHeight = window.innerHeight;
        const scrollY = window.scrollY; // Hauteur du défilement actuel

        // 0. Loading Bar logic
        if (progressBar) {
            // How much we've scrolled vs how much until we reach the "center" of the About section roughly
            // Let's say it fills completely when we have scrolled 1 windowHeight
            const maxScrollForBar = windowHeight * 0.8;
            let progressRatio = scrollY / maxScrollForBar;
            progressRatio = Math.max(0, Math.min(1, progressRatio)); // Clamp 0 to 1

            progressBar.style.width = `${progressRatio * 100}%`;
        }

        // 1. Apparition des éléments About
        fadeElements.forEach(element => {
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

            let bgRatio = 1 - (scrollY / maxFadeScroll);
            bgRatio = Math.max(0, Math.min(1, bgRatio)); // entre 0 et 1

            dynamicBg.style.opacity = bgRatio * 0.1; // * 0.1 car c'est l'opacité max initiale
        }
    };

    // Fallback normal scroll event and initial check
    window.addEventListener('scroll', window.updateOpacityOnScroll);
    window.updateOpacityOnScroll();
});
