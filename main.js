import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// ─── Lenis smooth scroll, wired into GSAP ticker ─────────────────────────────
const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
});

// This is the CORRECT integration: pipe Lenis into GSAP's ticker
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Keep ScrollTrigger updated from Lenis scroll events
lenis.on('scroll', ScrollTrigger.update);

// ─── Canvas & Video setup ─────────────────────────────────────────────────────
const canvas = document.getElementById('video-canvas');
const ctx = canvas.getContext('2d');
const video = document.getElementById('scroll-video');
const videoSection = document.querySelector('.video-section');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw one frame of the video to the canvas, cover-fit
function drawFrame() {
    if (video.readyState < 2) return;

    const vr = video.videoWidth / video.videoHeight;
    const cr = canvas.width / canvas.height;
    let w, h, x, y;

    if (cr > vr) {
        w = canvas.width;
        h = canvas.width / vr;
        x = 0;
        y = (canvas.height - h) / 2;
    } else {
        h = canvas.height;
        w = canvas.height * vr;
        x = (canvas.width - w) / 2;
        y = 0;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, x, y, w, h);
}

// Render loop – runs every GSAP tick so the canvas always stays live
gsap.ticker.add(drawFrame);

// ─── Init once video metadata is available ────────────────────────────────────
function init() {
    // Jump to the last frame so the controller starts DECONSTRUCTED
    video.currentTime = video.duration;

    ScrollTrigger.create({
        trigger: videoSection,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,               // small scrub number = tighter, more responsive
        onUpdate: (self) => {
            // REVERSED: progress 0 (top) = end of video (deconstructed)
            //           progress 1 (bottom) = start of video (built)
            const t = (1 - self.progress) * video.duration;
            video.currentTime = t;
        }
    });

    // ── Info banners ─────────────────────────────────────────────────────────
    const banners = [
        { id: '#banner-1', start: '15%', end: '35%' },
        { id: '#banner-2', start: '45%', end: '65%' },
        { id: '#banner-3', start: '75%', end: '92%' },
    ];

    banners.forEach(({ id, start, end }) => {
        const el = document.querySelector(id);
        ScrollTrigger.create({
            trigger: videoSection,
            start: `${start} top`,
            end: `${end} top`,
            onEnter:      () => el.classList.add('active'),
            onLeave:      () => el.classList.remove('active'),
            onEnterBack:  () => el.classList.add('active'),
            onLeaveBack:  () => el.classList.remove('active'),
        });
    });

    // ── Spec cards ────────────────────────────────────────────────────────────
    gsap.from('.spec-card', {
        y: 80, opacity: 0, stagger: 0.15, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: '.specs', start: 'top 82%' }
    });

    // ── Hero text ─────────────────────────────────────────────────────────────
    gsap.to('.hero h1',      { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out', delay: 0.2 });
    gsap.to('.hero .subtitle', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.7 });
}

// Fire init as soon as metadata is ready (or immediately if already loaded)
if (video.readyState >= 1) {
    init();
} else {
    video.addEventListener('loadedmetadata', init, { once: true });
}
