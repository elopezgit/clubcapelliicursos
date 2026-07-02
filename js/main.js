// Club Capelli - Premium Animations

// Client-side SEO routing redirection to clean /admin/ folder
if (window.location.hash.includes('admin') || window.location.search.includes('admin') || window.location.pathname.endsWith('/admin')) {
    window.location.href = window.location.pathname.replace('index.html', '').replace(/\/$/, '') + '/admin/';
}

// GSAP ScrollTrigger Setup
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

    // 0. Splash Particles
    const splashParticles = document.getElementById('splash-particles');
    if (splashParticles) {
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.className = 'splash-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.width = (2 + Math.random() * 6) + 'px';
            p.style.height = p.style.width;
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = (Math.random() * 10) + 's';
            splashParticles.appendChild(p);
        }
    }

    // 0. Splash Screen Animation
    const splash = document.getElementById('splash-screen');
    if (splash) {
        const tl = gsap.timeline({
            onComplete: () => {
                splash.classList.add('hidden');
                setTimeout(() => splash.style.display = 'none', 600);
            }
        });
        tl.from('.splash-logo', { scale: 0.5, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' })
          .from('.splash-title', { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
          .from('.splash-subtitle', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
          .from('.splash-loader', { scaleX: 0, opacity: 0, duration: 0.4, ease: 'power2.out', transformOrigin: 'left center' }, '-=0.2')
          .to({}, { duration: 1.2 }) // hold for loader animation
          .to(splash, { opacity: 0, duration: 0.5, ease: 'power2.in' });
    }

    // 1. Swiper Banner Initialization
    if(document.querySelector('.mySwiperBanner')) {
        const swiper = new Swiper('.mySwiperBanner', {
            effect: 'coverflow',
            grabCursor: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            loop: true,
            autoplay: {
                delay: 2500,
                disableOnInteraction: false,
            },
            coverflowEffect: {
                rotate: 20,
                stretch: 0,
                depth: 200,
                modifier: 1,
                slideShadows: true,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
        });
    }

    // 2. Vanilla Tilt 3D Effects for Cards
    if(typeof VanillaTilt !== 'undefined' && document.querySelectorAll('.card-curso').length > 0) {
        VanillaTilt.init(document.querySelectorAll(".card-curso"), {
            max: 10,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
        });
    }

    // 3. Hero Animations
    const tl = gsap.timeline();
    
    // Check if hero content exists to avoid errors on pages without it
    if(document.querySelector('.hero-content img')) {
        // Logo entrance
        tl.from('.hero-content img', {
            y: -50,
            opacity: 0,
            duration: 1.2,
            ease: 'power3.out'
        })
        // Title entrance
        .from('.hero-content h2', {
            y: 30,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        }, "-=0.8")
        // Subtitle entrance
        .from('.hero-content p', {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out'
        }, "-=0.6");
    }

    // Parallax Effect for Hero Video
    if(document.querySelector('.video-bg')) {
        gsap.to('.video-bg', {
            yPercent: 30,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero-video',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    // 4. Stagger Animations for Cards
    if(document.querySelector('.card-curso')) {
        gsap.fromTo('.card-curso', 
            { y: 100, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.2,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: '#cursos',
                    start: 'top 85%', 
                    toggleActions: 'play none none none' 
                }
            }
        );
    }

    // 5. Payment Card Animation
    if(document.querySelector('#datosdepago .card')) {
        gsap.fromTo('#datosdepago .card', 
            { scale: 0.9, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 1,
                ease: 'elastic.out(1, 0.7)',
                scrollTrigger: {
                    trigger: '#datosdepago',
                    start: 'top 85%',
                }
            }
        );
    }

    // 6. Gallery Stagger Animation (Internal pages)
    if(document.querySelector('.row.g-3 img')) {
        gsap.fromTo('.row.g-3 img', 
            { scale: 0.8, opacity: 0 },
            {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: 'back.out(1.7)',
                scrollTrigger: {
                    trigger: '.row.g-3',
                    start: 'top 85%'
                }
            }
        );
    }

});

// Keep original copy functionality
function copiarTexto(id) {
    var texto = document.getElementById(id).innerText;
    navigator.clipboard.writeText(texto);
    
    // Add visual feedback to button
    let btn = document.querySelector(`button[onclick="copiarTexto('${id}')"]`);
    if(btn) {
        let originalText = btn.innerText;
        btn.style.backgroundColor = '#28a745';
        btn.innerText = '¡Copiado!';
        
        setTimeout(() => {
            btn.style.backgroundColor = '';
            btn.innerText = originalText;
        }, 2000);
    } else {
        alert(id.toUpperCase() + " Dato copiado con exito!");
    }
}
