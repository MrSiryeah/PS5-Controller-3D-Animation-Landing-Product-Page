import * as THREE from 'https://unpkg.com/three@0.162.0/build/three.module.js';
import gsap from 'https://unpkg.com/gsap@3.12.5/index.js';
import { ScrollTrigger } from 'https://unpkg.com/gsap@3.12.5/ScrollTrigger.js';
import Lenis from 'https://unpkg.com/lenis@1.1.20/dist/lenis.mjs';

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

// Three.js setup
const canvas = document.getElementById('video-canvas');
const video = document.getElementById('scroll-video');
const videoSection = document.querySelector('.video-section');

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Create Video Texture
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBAFormat;

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.MeshBasicMaterial({ map: videoTexture });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Maintain aspect ratio cover
    if (video.videoWidth && video.videoHeight) {
        const videoRatio = video.videoWidth / video.videoHeight;
        const canvasRatio = window.innerWidth / window.innerHeight;

        if (canvasRatio > videoRatio) {
            mesh.scale.set(canvasRatio / videoRatio, 1, 1);
        } else {
            mesh.scale.set(1, videoRatio / canvasRatio, 1);
        }
    }
}

window.addEventListener('resize', resize);

function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Video scrubbing logic
video.onloadedmetadata = () => {
    resize();
    initAnimations();
};

if (video.readyState >= 2) {
    resize();
    initAnimations();
}

function initAnimations() {
    // Hero Entrance Animations
    const tlEntrance = gsap.timeline();
    tlEntrance.to('.hero-overlay h1', { opacity: 1, y: 0, duration: 1.5, ease: 'power4.out' })
              .to('.hero-overlay .subtitle', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8');

    // Scroll-synced video rendering & Hero fade
    ScrollTrigger.create({
        trigger: videoSection,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
            if (video.duration) {
                // CORRECTED logic: 0 at top (Deconstructed), duration at bottom (Built)
                // Assuming video goes Deconstructed -> Built
                const targetTime = self.progress * video.duration;
                
                // Direct current time setting for tighter feel
                video.currentTime = targetTime;

                // Hero fade out in first 5% of scroll
                const heroFade = Math.max(0, 1 - self.progress * 20);
                gsap.set('.hero-overlay', { opacity: heroFade, pointerEvents: heroFade < 0.1 ? 'none' : 'auto' });
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
