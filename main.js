import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Initialize Lenis for smooth scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync Lenis with ScrollTrigger
lenis.on('scroll', ScrollTrigger.update);

const video = document.getElementById('scroll-video');
const videoSection = document.querySelector('.video-section');

// Wait for video metadata to be loaded
video.onloadedmetadata = () => {
    initAnimations();
};

// Fallback if metadata is already loaded
if (video.readyState >= 2) {
    initAnimations();
}

function initAnimations() {
    // Hero Animations
    const tlHero = gsap.timeline();
    tlHero.to('.hero h1', { opacity: 1, y: 0, duration: 1.5, ease: 'power4.out' })
          .to('.hero .subtitle', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.8');

    // Video Scroll Sync (Reversed)
    ScrollTrigger.create({
        trigger: videoSection,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.5, // Increased scrub for even smoother movement
        onUpdate: (self) => {
            if (video.duration) {
                // Reverse mapping: 1 (start) to 0 (end)
                // If progress is 0 (top), targetTime is duration (full video)
                // If progress is 1 (bottom), targetTime is 0
                // User wants: "starts deconstructed and at the bottom is the full built controller"
                // Assuming the video goes from Built -> Deconstructed:
                // progress 0 (top) -> targetTime 0 (Built)
                // progress 1 (bottom) -> targetTime duration (Deconstructed)
                // Wait, the user said: "starts deconstructed and at the bottom is the full built controller"
                // This means:
                // Scroll Top -> Video End (Deconstructed)
                // Scroll Bottom -> Video Start (Built)
                
                const targetTime = (1 - self.progress) * video.duration;
                
                // Using a direct update with a small lerp-like behavior via GSAP
                gsap.to(video, {
                    currentTime: targetTime,
                    duration: 0.5, // Buffer for smoothness
                    ease: 'power1.out',
                    overwrite: true
                });
            }
        }
    });

    // Text Overlay Animations
    const textOverlays = document.querySelectorAll('.text-overlay');
    textOverlays.forEach((overlay) => {
        gsap.to(overlay, {
            opacity: 1,
            pointerEvents: 'auto',
            scrollTrigger: {
                trigger: overlay,
                // Adjust start/end to span the longer section
                start: 'top 70%',
                end: 'top 30%',
                scrub: 1,
                toggleActions: 'play reverse play reverse'
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
