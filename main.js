import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', ScrollTrigger.update);

// Canvas setup
const canvas = document.getElementById('video-canvas');
const context = canvas.getContext('2d');
const video = document.getElementById('scroll-video');
const videoSection = document.querySelector('.video-section');

// Set canvas dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function render() {
    if (video.readyState >= 2) {
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, xOffset, yOffset;

        if (canvasRatio > videoRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / videoRatio;
            xOffset = 0;
            yOffset = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * videoRatio;
            yOffset = 0;
            xOffset = (canvas.width - drawWidth) / 2;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, xOffset, yOffset, drawWidth, drawHeight);
    }
}

// Video scrubbing logic
video.onloadedmetadata = () => {
    initAnimations();
    resizeCanvas();
};

if (video.readyState >= 2) {
    initAnimations();
    resizeCanvas();
}

function initAnimations() {
    // Hero Animations
    const tlHero = gsap.timeline();
    tlHero.to('.hero h1', { opacity: 1, y: 0, duration: 1.5, ease: 'power4.out' })
          .to('.hero .subtitle', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8');

    // Scroll-synced video rendering
    const scrollProp = { progress: 0 };

    ScrollTrigger.create({
        trigger: videoSection,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
            if (video.duration) {
                // Reversed logic: 1 at top, 0 at bottom
                // Scroll Top (progress 0) -> targetTime is duration (Deconstructed)
                // Scroll Bottom (progress 1) -> targetTime is 0 (Built)
                const targetTime = (1 - self.progress) * video.duration;
                
                // Using gsap.to to smoothly interpolate the currentTime
                gsap.to(video, {
                    currentTime: targetTime,
                    duration: 0.1,
                    onUpdate: render,
                    overwrite: true
                });
            }
        }
    });

    // Info Banners
    const banners = [
        { id: '#banner-1', start: 0.15, end: 0.35 },
        { id: '#banner-2', start: 0.45, end: 0.65 },
        { id: '#banner-3', start: 0.75, end: 0.95 }
    ];

    banners.forEach((banner) => {
        ScrollTrigger.create({
            trigger: videoSection,
            start: `${banner.start * 100}% top`,
            end: `${banner.end * 100}% top`,
            onToggle: (self) => {
                const el = document.querySelector(banner.id);
                if (self.isActive) {
                    el.classList.add('active');
                } else {
                    el.classList.remove('active');
                }
            }
        });
    });

    // Spec Card Animations
    gsap.from('.spec-card', {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.specs',
            start: 'top 80%'
        }
    });
}

// Initial render loop to keep canvas alive if video is playing/buffering
gsap.ticker.add(render);
