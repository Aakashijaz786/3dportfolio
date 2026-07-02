import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useInView,
  useScroll
} from 'framer-motion';
import { useForm, ValidationError } from '@formspree/react';
import { SmoothScroll, SplitReveal, ScrubText, ScrubIn, VelocityMarquee, ParallaxY, Magnetic, GhostTitle, ScrubZoom, CountUp, ShatterText, SoundLines, usePinProgress, scrollToId, scrollToTop } from './fx';

// Heavy three.js showcase is code-split + mounted only when scrolled near.
const Projects3D = React.lazy(() => import('./Projects3D'));
// Scroll-reactive glass 3D hero object — code-split, desktop-only.
const HeroScene = React.lazy(() => import('./HeroScene'));

// ==========================================
// 1. DYNAMIC GLOBAL STYLES INJECTION
// ==========================================
if (typeof window !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    :root {
      --bg: #060608;
      --surf: #0f0f12;
      --surf2: #161619;
      --txt: #f0f0f4;
      --muted: #888894;
      --stroke: #1a1a1f;
      --a1: #7EB8F7;
      --a2: #4A90D9;
      --a3: #9DC8FF;
      --G: linear-gradient(135deg, #7EB8F7, #4A90D9);
      --G2: linear-gradient(90deg, #7EB8F7, #4A90D9, #7EB8F7);
      --grid-color: rgba(100, 80, 255, 0.04);
      --nav-bg: rgba(6, 6, 8, 0.82);
      --nav-border: rgba(255, 255, 255, 0.06);
      --grain-opacity: 0.03;
      --hero-text: #ffffff;
      --hero-text-sub: rgba(255,255,255,0.55);
    }

    :root[data-theme='light'] {
      --bg: #f0f4f8;
      --surf: #ffffff;
      --surf2: #e8edf5;
      --txt: #0f172a;
      --muted: #475569;
      --stroke: #cbd5e1;
      --a1: #3b82f6;
      --a2: #1d4ed8;
      --a3: #2563eb;
      --G: linear-gradient(135deg, #3b82f6, #1d4ed8);
      --G2: linear-gradient(90deg, #3b82f6, #1d4ed8, #3b82f6);
      --grid-color: rgba(59, 130, 246, 0.07);
      --nav-bg: rgba(255, 255, 255, 0.92);
      --nav-border: rgba(15, 23, 42, 0.12);
      --grain-opacity: 0.01;
      --hero-text: #0f172a;
      --hero-text-sub: #1e293b;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      overflow-x: hidden;
      max-width: 100vw;
    }

    /* ── LENIS SMOOTH SCROLL ── */
    html.lenis, html.lenis body { height: auto; }
    .lenis.lenis-smooth { scroll-behavior: auto !important; }
    .lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
    .lenis.lenis-stopped { overflow: hidden; }

    body, header, nav, div, section, button, a, span, h1, h2, h3, h4, h5, h6, p, ul, li {
      transition: background-color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), 
                  color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), 
                  border-color 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), 
                  box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    body {
      background-color: var(--bg);
      color: var(--txt);
      font-family: 'Inter', sans-serif;
      /* clip (not hidden): hidden creates a scroll container and breaks
         position:sticky pinned sections */
      overflow-x: clip;
      max-width: 100vw;
      -webkit-font-smoothing: antialiased;
    }

    #root {
      overflow-x: clip;
      max-width: 100vw;
    }

    /* Scrollbar Rules */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg);
    }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(var(--a2), var(--a1));
      border-radius: 99px;
      border: 2px solid var(--bg);
    }
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(var(--a1), var(--a3));
    }

    /* Text selection accent */
    ::selection {
      background: rgba(126,184,247,0.28);
      color: var(--txt);
    }

    /* Honor system fonts gracefully + smoother rendering */
    img { max-width: 100%; }
    a, button { -webkit-tap-highlight-color: transparent; }

    /* ── CUSTOM CURSOR (desktop / fine-pointer only, active after load) ── */
    .cursor-dot, .cursor-ring { display: none; }
    @media (hover: hover) and (pointer: fine) {
      body.cc-active { cursor: none; }
      body.cc-active a, body.cc-active button, body.cc-active [role="button"],
      body.cc-active .skill-card, body.cc-active .pcard-inner { cursor: none; }
      body.cc-active input, body.cc-active textarea, body.cc-active select { cursor: text; }
      body.cc-active .cursor-dot, body.cc-active .cursor-ring { display: block; }
    }

    /* ── AURORA GRADIENT MESH (sitewide ambient color) ── */
    .aurora-blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      will-change: transform;
      mix-blend-mode: screen;
    }
    [data-theme='light'] .aurora-blob {
      mix-blend-mode: multiply;
      opacity: 0.5;
    }
    @keyframes aurora-a {
      0%, 100% { transform: translate(-8%, -6%) scale(1); }
      50%      { transform: translate(18%, 12%) scale(1.35); }
    }
    @keyframes aurora-b {
      0%, 100% { transform: translate(10%, 18%) scale(1.1); }
      50%      { transform: translate(-16%, -12%) scale(1.45); }
    }
    @keyframes aurora-c {
      0%, 100% { transform: translate(6%, -14%) scale(1.2); }
      50%      { transform: translate(-12%, 16%) scale(0.9); }
    }
    @keyframes aurora-d {
      0%, 100% { transform: translate(-14%, 12%) scale(0.95); }
      50%      { transform: translate(12%, -16%) scale(1.3); }
    }

    /* Gradient ring border helper for cards */
    @keyframes border-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Typography & Utilities */
    .fd {
      font-family: 'Instrument Serif', serif;
      font-style: italic;
    }

    .sh-text {
      background: var(--G2);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
    }

    .g-text {
      background: var(--G);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* Huge hollow display type for marquee dividers / ghost layers */
    .outline-text {
      color: transparent;
      -webkit-text-stroke: 1.5px var(--muted);
      opacity: 0.45;
      font-weight: 700;
      font-family: 'Familjen Grotesk', 'Inter', sans-serif;
    }

    /* Sitewide animated film-grain overlay (trionn-style). Oversized so the
       stepped translate never exposes edges; compositor-only animation. */
    .noise-overlay {
      position: fixed;
      inset: -10%;
      width: 120%;
      height: 120%;
      z-index: 9990;
      pointer-events: none;
      opacity: var(--grain-opacity);
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E");
      animation: grain 0.7s steps(8) infinite;
    }

    /* Keyframe Animations */
    @keyframes shimmer {
      0% { background-position: 0% center; }
      100% { background-position: 200% center; }
    }

    @keyframes spin-cw {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes spin-ccw {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(-360deg); }
    }

    @keyframes mq {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-50%); }
    }

    @keyframes pulse-dot {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.7); opacity: 0.4; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes float-y {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-18px); }
      100% { transform: translateY(0px); }
    }

    @keyframes grain {
      0%, 100% { transform: translate(0, 0); }
      10% { transform: translate(-1%, -1%); }
      30% { transform: translate(-2%, -2%); }
      50% { transform: translate(-1%, 2%); }
      70% { transform: translate(1%, -2%); }
      90% { transform: translate(2%, 1%); }
    }

    /* Google Fonts Dynamic Injection */
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@300;400;500;600;700&family=Familjen+Grotesk:wght@400;500;600;700&display=swap');

    /* ── NAV LINK HOVER EFFECT ── */
    .portfolio-nav-link {
      background: transparent;
      border: none;
      color: var(--muted);
      padding: 0.4rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.82rem;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      position: relative;
      text-decoration: none;
      transition: color 0.25s ease;
      letter-spacing: 0.02em;
    }
    .portfolio-nav-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 2px;
      background: linear-gradient(to right, #7EB8F7, #4A90D9);
      border-radius: 2px;
      transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: 0 0 8px rgba(126,184,247,0.6);
    }
    .portfolio-nav-link:hover {
      color: var(--txt);
      background: var(--nav-hover, rgba(126,184,247,0.07));
    }
    .portfolio-nav-link:hover::after {
      width: 60%;
    }
    [data-theme='light'] .portfolio-nav-link::after {
      background: linear-gradient(to right, #3b82f6, #1d4ed8);
      box-shadow: 0 0 8px rgba(59,130,246,0.5);
    }

    /* ── RESUME BUTTON ── */
    .portfolio-resume-btn {
      background: transparent;
      border: 1px solid var(--stroke);
      color: var(--txt);
      padding: 0.38rem 0.95rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.3s ease;
    }
    .portfolio-resume-btn:hover {
      border-color: var(--a1);
      color: var(--a1);
      background: rgba(126,184,247,0.08);
      box-shadow: 0 0 18px rgba(126,184,247,0.2);
      transform: translateY(-1px);
    }
    [data-theme='light'] .portfolio-resume-btn:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: rgba(59,130,246,0.08);
      box-shadow: 0 0 14px rgba(59,130,246,0.2);
    }

    /* ── HAMBURGER MENU ── */
    .hamburger-btn {
      display: none;
      background: transparent;
      border: 1px solid var(--stroke);
      color: var(--txt);
      width: 38px;
      height: 38px;
      border-radius: 10px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
      transition: border-color 0.2s, background 0.2s;
    }
    .hamburger-btn:hover {
      border-color: var(--a1);
      background: rgba(126,184,247,0.08);
    }

    /* Mobile drawer */
    .mobile-drawer {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0;
      background: var(--bg);            /* opaque so menu is always readable */
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
      border-bottom: 1px solid var(--nav-border);
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      z-index: 201;
      padding: 4.75rem 1.5rem 2rem;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 100dvh;
      overflow-y: auto;
    }
    .mobile-drawer.open {
      display: flex;
    }
    .mobile-drawer-link {
      background: transparent;
      border: none;
      color: var(--txt);
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
      font-size: 1rem;
      cursor: pointer;
      font-family: 'Inter', sans-serif;
      text-align: left;
      transition: background 0.2s, color 0.2s;
    }
    .mobile-drawer-link:hover {
      background: rgba(126,184,247,0.08);
      color: var(--a1);
    }
    .mobile-drawer-divider {
      height: 1px;
      background: var(--stroke);
      margin: 0.5rem 0;
    }

    /* ── RESPONSIVE BREAKPOINTS ── */

    /* Collapse nav into a hamburger early enough for tablets + small laptops */
    @media (max-width: 900px) {
      .hamburger-btn { display: flex !important; }
      .desktop-nav { display: none !important; }
      .desktop-resume-btn { display: none !important; }
      .desktop-divider { display: none !important; }
      .desktop-hire-btn { display: none !important; }
    }

    /* Laptops & small desktops */
    @media (max-width: 1024px) {
      #projects, #skills { padding: 5rem 0 !important; }
      #contact { padding: 6rem 0 3rem !important; }
      .about-grid { gap: 3rem !important; }
    }

    /* Tablets / large phones */
    @media (max-width: 768px) {
      /* Section rhythm */
      #projects, #skills { padding: 4rem 0 !important; }
      #contact { padding: 5rem 0 2.5rem !important; }

      /* Projects grid: override span columns */
      .projects-grid { gap: 1.1rem !important; }
      .projects-grid > div { grid-column: span 12 !important; }

      /* PCard: always column layout on mobile + tighter padding */
      .pcard-inner {
        flex-direction: column !important;
        padding: 1.85rem !important;
        gap: 1.5rem !important;
        border-radius: 1.25rem !important;
      }
      .pcard-title { font-size: 2.1rem !important; }
      .pcard-id { top: 1.4rem !important; right: 1.4rem !important; }

      /* About: tighten the two-column gap + card padding */
      .about-grid { gap: 2.25rem !important; }
      .about-card { padding: 1.85rem !important; border-radius: 1.25rem !important; }

      /* Skills card padding */
      .skill-card { padding: 1.5rem !important; }

      /* Hero role line: let it wrap instead of clipping */
      .hero-role { height: auto !important; min-height: 2.6rem; }
      .hero-stats { gap: 1.25rem !important; }
    }

    /* Phones */
    @media (max-width: 480px) {
      .hero-btns {
        flex-direction: column !important;
        width: 100%;
      }
      .hero-btns > * {
        width: 100%;
        justify-content: center;
      }

      #projects, #skills { padding: 3.25rem 0 !important; }

      .pcard-inner { padding: 1.4rem !important; }
      .pcard-title { font-size: 1.85rem !important; }
      .about-card { padding: 1.5rem !important; }
      .skill-card { padding: 1.3rem !important; }
      .contact-cards { gap: 0.75rem !important; }

      /* Tame the marquee text on tiny screens */
      .contact-marquee span { font-size: 1rem !important; }

      /* Hero stats -> clean 2 columns instead of a cramped row */
      .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
    }

    /* Very small phones */
    @media (max-width: 360px) {
      .hero-stats { gap: 0.85rem !important; }
    }

    /* Short viewports (landscape phones / small laptops): trim hero so it
       never overflows under the navbar */
    @media (max-height: 760px) {
      .hero-scroll { display: none !important; }
      .hero-stats { padding-top: 1.25rem !important; }
    }
    @media (max-height: 640px) {
      .hero-stats { display: none !important; }
    }

    /* Touch / coarse pointers: kill hover-tilt jitter, ease motion */
    @media (hover: none) {
      .pcard-inner { transform: none !important; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    }

    /* ── SCROLL TO TOP FAB ── */
    .scroll-top-fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 300;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      border: 1px solid var(--stroke);
      background: var(--surf);
      color: var(--a1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.35);
      transition: all 0.3s ease;
      backdrop-filter: blur(12px);
    }
    .scroll-top-fab:hover {
      background: var(--a1);
      color: #060608;
      border-color: var(--a1);
      box-shadow: 0 6px 32px rgba(126,184,247,0.4);
      transform: translateY(-3px);
    }
    [data-theme='light'] .scroll-top-fab:hover {
      background: #3b82f6;
      color: #fff;
      border-color: #3b82f6;
      box-shadow: 0 6px 28px rgba(59,130,246,0.35);
    }
  `;
  document.head.appendChild(styleTag);
}

// ==========================================
// 2. CUSTOM HOOKS
// ==========================================
function useScrolled(threshold = 70) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);
  return scrolled;
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  // useLayoutEffect runs synchronously before paint — avoids flash
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check(); // run immediately on mount
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

// ==========================================
// 3. REUSABLE INFRASTRUCTURE COMPONENTS
// ==========================================

/**
 * Enhanced Space Constellation Background with 3D Particles, 
 * Quadratic Mouse Repulsion, Elastic Return, and Linear Gradient Connectors.
 */
function SpaceCanvasBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, inside: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const colors = [
      'rgb(124,58,237)', // violet
      'rgb(6,182,212)',  // cyan
      'rgb(168,85,247)', // purple
      'rgb(59,130,246)'  // blue
    ];

    let particles = [];
    // Adaptive density: fewer particles on small screens keeps phones at 60fps
    // (the connector loop is O(n²), so this matters a lot on mobile).
    let numParticles = 140;
    const maxDistance = 140;
    const repulsionRadius = 140;
    const repulsionStrength = 4.5;
    const springStrength = 0.018;
    const damping = 0.88;
    const edgeMargin = 40;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const w = window.innerWidth;
      numParticles = w < 480 ? 38 : w < 768 ? 60 : w < 1100 ? 100 : 140;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push({
          x: x,
          y: y,
          homeX: x,
          homeY: y,
          vx: 0,
          vy: 0,
          ambientVx: (Math.random() - 0.5) * 0.28,
          ambientVy: (Math.random() - 0.5) * 0.28,
          color: colors[Math.floor(Math.random() * colors.length)],
          coreSize: Math.random() * (2.4 - 0.6) + 0.6,
          baseAlpha: Math.random() * (0.75 - 0.25) + 0.25,
          pulseSpeed: Math.random() * 0.02 + 0.005,
          pulsePhase: Math.random() * Math.PI * 2
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track Global Mouse Elements
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y, inside: true };
      } else {
        mouseRef.current.inside = false;
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.inside = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation Loop
    const render = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw subtle Grid Overlay (every 60px)
      const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || 'rgba(100,80,255,0.04)';
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 60) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 60) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // 2. Update and Draw Particles
      particles.forEach((p, idx) => {
        // Update ambient drift
        p.homeX += p.ambientVx;
        p.homeY += p.ambientVy;

        // Soft boundary checking for home positions
        if (p.homeX < edgeMargin) { p.homeX = edgeMargin; p.ambientVx *= -1; }
        if (p.homeX > canvas.width - edgeMargin) { p.homeX = canvas.width - edgeMargin; p.ambientVx *= -1; }
        if (p.homeY < edgeMargin) { p.homeY = edgeMargin; p.ambientVy *= -1; }
        if (p.homeY > canvas.height - edgeMargin) { p.homeY = canvas.height - edgeMargin; p.ambientVy *= -1; }

        // Spring Force returning to home
        const fxHome = (p.homeX - p.x) * springStrength;
        const fyHome = (p.homeY - p.y) * springStrength;
        p.vx += fxHome;
        p.vy += fyHome;

        // Mouse Repulsion Force with Quadratic Falloff
        if (mouseRef.current.inside) {
          const dx = p.x - mouseRef.current.x;
          const dy = p.y - mouseRef.current.y;
          const dist = Math.hypot(dx, dy);

          if (dist < repulsionRadius && dist > 0) {
            // Quadratic falloff normalization
            const normDist = dist / repulsionRadius;
            const force = (1 - normDist * normDist) * repulsionStrength;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // Apply velocities and dampening
        p.vx *= damping;
        p.vy *= damping;
        p.x += p.vx;
        p.y += p.vy;

        // Twinkle / Breathe calculations via Sine Wave
        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.15;
        const clampedAlpha = Math.max(0.1, Math.min(1, currentAlpha));

        // Draw Glow Halo (5x Core Size)
        const haloRadius = p.coreSize * 5;
        const radialGlow = ctx.createRadialGradient(p.x, p.y, p.coreSize, p.x, p.y, haloRadius);
        radialGlow.addColorStop(0, p.color.replace('rgb', 'rgba').replace(')', `, ${clampedAlpha})`));
        radialGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radialGlow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Core
        ctx.fillStyle = p.color.replace('rgb', 'rgba').replace(')', `, ${clampedAlpha})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.coreSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Connecting Linear Gradient Lines
      ctx.lineWidth = 0.7;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pA = particles[i];
          const pB = particles[j];
          const dx = pA.x - pB.x;
          const dy = pA.y - pB.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.22;
            const gradient = ctx.createLinearGradient(pA.x, pA.y, pB.x, pB.y);
            gradient.addColorStop(0, pA.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`));
            gradient.addColorStop(1, pB.color.replace('rgb', 'rgba').replace(')', `, ${alpha})`));

            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
}

/**
 * Standard Micro Constellation Particles for isolated Section Layers
 */
function SectionParticles({ n = 65 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;

    let pts = [];
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resize();

    for (let i = 0; i < n; i++) {
      pts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.56,
        vy: (Math.random() - 0.5) * 0.56,
        r: Math.random() * (1.4 - 0.3) + 0.3,
        a: Math.random() * 0.5 + 0.2
      });
    }

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update & Draw nodes
      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.fillStyle = `rgba(126, 184, 247, ${p.a * 0.45})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Spatial Connectors
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 100) {
            const op = (1 - d / 100) * 0.1;
            ctx.strokeStyle = `rgba(126, 184, 247, ${op})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      frameId = requestAnimationFrame(loop);
    };
    loop();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [n]);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }} />;
}

/**
 * Pure Mouse-tracking 3D Interactive Tilt Wrapper
 */
function Tilt({ children, deg = 14, width = '100%' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { stiffness: 160, damping: 22 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [deg, -deg]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-deg, deg]), springConfig);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const box = ref.current.getBoundingClientRect();
    const xc = (e.clientX - box.left) / box.width - 0.5;
    const yc = (e.clientY - box.top) / box.height - 0.5;
    x.set(xc);
    y.set(yc);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '900px', width }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>
        {children}
      </motion.div>
    </div>
  );
}

/**
 * High-End Scroll Triggered 3D Perspective Reveal Wrapper
 */
function Reveal3D({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 70, rotateX: 25, scale: 0.92, filter: 'blur(8px)' }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.95, delay: delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ width: '100%', originY: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Polymorphic Button / Anchor Hybrid Component
 */
function Btn({ children, primary = false, onClick, href }) {
  const ref = useRef(null);
  const mvx = useMotionValue(0);
  const mvy = useMotionValue(0);
  const x = useSpring(mvx, { stiffness: 300, damping: 18, mass: 0.4 });
  const y = useSpring(mvy, { stiffness: 300, damping: 18, mass: 0.4 });

  const handleMove = (e) => {
    if (!ref.current) return;
    const b = ref.current.getBoundingClientRect();
    mvx.set((e.clientX - (b.left + b.width / 2)) * 0.35);
    mvy.set((e.clientY - (b.top + b.height / 2)) * 0.35);
  };
  const handleLeave = () => { mvx.set(0); mvy.set(0); };

  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.85rem 1.75rem',
    borderRadius: '9999px',
    fontSize: '0.88rem',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    textDecoration: 'none',
    border: primary ? 'none' : '1px solid var(--stroke)',
    background: primary ? 'var(--G)' : 'rgba(255,255,255,0.02)',
    backdropFilter: primary ? 'none' : 'blur(6px)',
    color: primary ? '#060608' : 'var(--txt)',
    boxShadow: primary ? '0 4px 20px rgba(126,184,247,0.25)' : 'none',
    x, y
  };

  const elementProps = {
    ref,
    style: styles,
    onClick,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    whileHover: { scale: 1.05, boxShadow: primary ? '0 8px 30px rgba(126,184,247,0.5)' : '0 4px 18px rgba(126,184,247,0.18)' },
    whileTap: { scale: 0.96 }
  };

  if (href) {
    return <motion.a href={href} {...elementProps}>{children}</motion.a>;
  }
  return <motion.button {...elementProps}>{children}</motion.button>;
}

/**
 * Universal Unified Section Heading Component
 */
function SHead({ eyebrow, heading, italic, sub }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} style={{ marginBottom: '3.5rem', width: '100%' }}>
      <ParallaxY from={26} to={-26}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--a1)', marginBottom: '0.5rem' }}
        >
          <span style={{ width: '24px', height: '1px', background: 'var(--a1)' }}></span>
          {eyebrow}
        </motion.div>
        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '400', lineHeight: '1.1' }}>
          <SplitReveal text={heading} per="word" delay={0.05} />{' '}
          <span className="fd g-text">
            <SplitReveal text={italic} per="word" delay={0.25} />
          </span>
        </h2>
        {sub && (
          <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '500px' }}>{sub}</p>
        )}
      </ParallaxY>
    </div>
  );
}

/**
 * Custom Interactive Cursor — a precise dot + lagging glow ring that
 * expands when hovering interactive elements. Desktop / fine-pointer only.
 */
function CustomCursor() {
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 380, damping: 30, mass: 0.4 });
  const ringY = useSpring(dotY, { stiffness: 380, damping: 30, mass: 0.4 });
  const [hovering, setHovering] = useState(false);
  const [down, setDown] = useState(false);

  useEffect(() => {
    const targets = 'a, button, [role="button"], .skill-card, .pcard-inner, input, textarea';
    const move = (e) => { dotX.set(e.clientX); dotY.set(e.clientY); };
    const over = (e) => { if (e.target.closest && e.target.closest(targets)) setHovering(true); };
    const out = (e) => { if (e.target.closest && e.target.closest(targets)) setHovering(false); };
    const dn = () => setDown(true);
    const up = () => setDown(false);

    document.body.classList.add('cc-active');
    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseover', over, { passive: true });
    document.addEventListener('mouseout', out, { passive: true });
    window.addEventListener('mousedown', dn);
    window.addEventListener('mouseup', up);
    return () => {
      document.body.classList.remove('cc-active');
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mouseout', out);
      window.removeEventListener('mousedown', dn);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  return (
    <>
      {/* Precise core dot */}
      <motion.div
        className="cursor-dot"
        style={{
          position: 'fixed', top: 0, left: 0, x: dotX, y: dotY,
          width: '7px', height: '7px', marginLeft: '-3.5px', marginTop: '-3.5px',
          borderRadius: '50%', background: 'var(--a1)',
          boxShadow: '0 0 10px rgba(126,184,247,0.9)',
          zIndex: 10000, pointerEvents: 'none', mixBlendMode: 'difference'
        }}
        animate={{ scale: hovering ? 0 : down ? 0.6 : 1 }}
        transition={{ duration: 0.18 }}
      />
      {/* Lagging glow ring */}
      <motion.div
        className="cursor-ring"
        style={{
          position: 'fixed', top: 0, left: 0, x: ringX, y: ringY,
          width: '34px', height: '34px', marginLeft: '-17px', marginTop: '-17px',
          borderRadius: '50%', border: '1.5px solid var(--a1)',
          zIndex: 9999, pointerEvents: 'none'
        }}
        animate={{
          scale: hovering ? 1.9 : down ? 0.85 : 1,
          backgroundColor: hovering ? 'rgba(126,184,247,0.12)' : 'rgba(126,184,247,0)',
          borderColor: hovering ? 'var(--a3)' : 'var(--a1)'
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      />
    </>
  );
}

/**
 * Top scroll-progress bar driven by page scroll.
 */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 130, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'var(--G2)', backgroundSize: '200% auto',
        transformOrigin: '0%', scaleX, zIndex: 250,
        animation: 'shimmer 4s linear infinite',
        boxShadow: '0 0 12px rgba(126,184,247,0.6)'
      }}
    />
  );
}

/**
 * Sitewide animated Aurora gradient mesh — rich, attractive ambient color
 * that drifts slowly behind all content.
 */
function AuroraBackground() {
  const blobs = [
    { c: 'rgba(126,184,247,0.30)', size: '46vw', top: '-8%', left: '-6%', anim: 'aurora-a 22s ease-in-out infinite' },
    { c: 'rgba(124,58,237,0.26)', size: '42vw', top: '20%', left: '58%', anim: 'aurora-b 26s ease-in-out infinite' },
    { c: 'rgba(6,182,212,0.22)', size: '40vw', top: '55%', left: '4%', anim: 'aurora-c 30s ease-in-out infinite' },
    { c: 'rgba(244,114,182,0.18)', size: '34vw', top: '68%', left: '62%', anim: 'aurora-d 24s ease-in-out infinite' }
  ];
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          className="aurora-blob"
          style={{ width: b.size, height: b.size, top: b.top, left: b.left, background: `radial-gradient(circle, ${b.c} 0%, rgba(0,0,0,0) 70%)`, animation: b.anim }}
        />
      ))}
    </div>
  );
}

// ==========================================
// 4. MAIN PAGE SECTIONS
// ==========================================

function LoadingScreen({ onDone }) {
  const [count, setCount] = useState(0);
  const words = ["Build", "Create", "Engineer", "Design"];
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setWordIdx(p => (p + 1) % words.length);
    }, 880);

    const countInterval = setInterval(() => {
      setCount(p => {
        if (p >= 100) {
          clearInterval(countInterval);
          setTimeout(() => onDone(), 280);
          return 100;
        }
        return p + 1;
      });
    }, 24);

    return () => {
      clearInterval(wordInterval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.45, ease: 'easeInOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(1.5rem, 5vw, 3rem)',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background Rings */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: 0.03 }}>
        <div style={{ width: '350px', height: '350px', borderRadius: '50%', border: '1px solid var(--txt)', animation: 'spin-cw 20s linear infinite', position: 'absolute', top: '-175px', left: '-175px' }} />
        <div style={{ width: '520px', height: '520px', borderRadius: '50%', border: '1px dashed var(--txt)', animation: 'spin-ccw 25s linear infinite', position: 'absolute', top: '-260px', left: '-260px' }} />
        <div style={{ width: '700px', height: '700px', borderRadius: '50%', border: '1px solid var(--txt)', animation: 'spin-cw 35s linear infinite', position: 'absolute', top: '-350px', left: '-350px' }} />
      </div>

      <div style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        aakash ijaz · portfolio
      </div>

      <div style={{ alignSelf: 'center', textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={wordIdx}
            initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -25, filter: 'blur(6px)' }}
            transition={{ duration: 0.4 }}
            className="fd sh-text"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)', fontWeight: '400' }}
          >
            {words[wordIdx]}
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ alignSelf: 'flex-end', fontSize: 'clamp(4rem, 8vw, 6rem)', lineHeight: '0.8' }} className="fd">
          {String(count).padStart(3, '0')}
        </div>
        <div style={{ width: '100%', height: '2px', background: 'var(--indicator-track)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div
            style={{
              width: `${count}%`,
              height: '100%',
              background: 'var(--G)',
              boxShadow: '0 0 14px rgba(126,184,247,0.55)'
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Navbar({ theme, toggleTheme }) {
  const isScrolled = useScrolled(70);
  const isMobile = useIsMobile(900);

  const scrollNav = (id) => scrollToId(id);

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',   // CSS-only centering — NOT managed by framer
      zIndex: 200,
      width: 'min(94%, 820px)',
      maxWidth: 'calc(100vw - 2rem)',
    }}>
      <motion.div
        initial={{ y: -44, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.85rem 0.5rem 1.2rem',
          borderRadius: '9999px',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          background: 'var(--nav-bg)',
          border: '1px solid var(--nav-border)',
          boxShadow: isScrolled ? '0 8px 44px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
          transition: 'box-shadow 0.3s ease',
          gap: '0.5rem'
        }}>
        {/* LEFT: Logo + Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, overflow: 'hidden' }}>
          <Tilt deg={22} width="fit-content">
            <div
              onClick={() => scrollNav('hero')}
              style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--a2), var(--a1))', padding: '2px', cursor: 'pointer', boxShadow: '0 0 14px rgba(126,184,247,0.35)', flexShrink: 0 }}
            >
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/images/vecteezy_software-engineer-png-graphic-clipart-design_23485893.png" alt="Aakash Ijaz" style={{ width: '130%', height: '130%', objectFit: 'contain', objectPosition: 'center 10%', marginTop: '8px' }} />
              </div>
            </div>
          </Tilt>

          {/* Desktop nav links — hidden on mobile */}
          <nav className="desktop-nav" style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '0.1rem' }}>
            {['Home', 'About', 'Projects', 'Skills', 'Contact'].map((item) => (
              <button key={item} onClick={() => scrollNav(item.toLowerCase())} className="portfolio-nav-link">
                {item}
              </button>
            ))}
          </nav>
        </div>

        {/* RIGHT: Always rendered controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          {/* Resume — desktop only */}
          <a
            href="/AakashIjaz_resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="AakashIjaz_resume.pdf"
            className="portfolio-resume-btn desktop-resume-btn"
            title="View & Download Resume"
            style={{ display: isMobile ? 'none' : 'inline-flex' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Resume
          </a>
          <div className="desktop-divider" style={{ width: '1px', height: '18px', background: 'var(--stroke)', display: isMobile ? 'none' : 'block' }} />

          {/* Theme toggle — always shown */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 18 }}
            whileTap={{ scale: 0.9 }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt)', padding: '0.4rem', borderRadius: '50%' }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </motion.button>

          {/* Hire me — desktop only */}
          <div className="desktop-divider" style={{ width: '1px', height: '18px', background: 'var(--stroke)', display: isMobile ? 'none' : 'block' }} />
          <span className="desktop-hire-btn" style={{ display: isMobile ? 'none' : 'inline-flex' }}>
            <Magnetic strength={0.3}>
              <Btn primary onClick={() => scrollNav('contact')}>Hire me</Btn>
            </Magnetic>
          </span>

          {/* Hamburger — mobile only, always in DOM */}
          <NavbarMobile theme={theme} toggleTheme={toggleTheme} scrollNav={scrollNav} isMobile={isMobile} />
        </div>
      </motion.div>
    </div>
  );
}


function NavbarMobile({ theme, toggleTheme, scrollNav, isMobile }) {
  const [open, setOpen] = useState(false);
  const handleNav = (id) => { setOpen(false); scrollNav(id); };

  return (
    <>
      <button
        className="hamburger-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
        style={{
          background: 'transparent',
          border: '1px solid var(--stroke)',
          color: 'var(--txt)',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          cursor: 'pointer',
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.05rem',
          flexShrink: 0,
          fontFamily: 'sans-serif',
          transition: 'border-color 0.2s'
        }}
      >
        {open ? '✕' : '☰'}
      </button>
      <div
        className={`mobile-drawer ${open ? 'open' : ''}`}
        style={{ display: (isMobile && open) ? 'flex' : 'none' }}
      >
        {/* Drawer header with an explicit, always-visible close button */}
        <div style={{ position: 'absolute', top: '1.1rem', left: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--muted)' }}>Menu</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              width: '42px', height: '42px', borderRadius: '12px',
              border: '1px solid var(--stroke)', background: 'var(--surf)',
              color: 'var(--txt)', fontSize: '1.25rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {['Home', 'About', 'Projects', 'Skills', 'Contact'].map((item) => (
          <button key={item} className="mobile-drawer-link" onClick={() => handleNav(item.toLowerCase())}>
            {item}
          </button>
        ))}
        <div className="mobile-drawer-divider" />
        <a
          href="/AakashIjaz_resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          download="AakashIjaz_resume.pdf"
          className="portfolio-resume-btn"
          style={{ borderRadius: '0.75rem', justifyContent: 'center' }}
          onClick={() => setOpen(false)}
        >
          📄 View Resume
        </a>
        <button onClick={() => { toggleTheme(); setOpen(false); }} className="mobile-drawer-link">
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
        <Btn primary onClick={() => handleNav('contact')}>Hire me</Btn>
      </div>
    </>
  );
}

/**
 * Floating Scroll-To-Top Button
 */
function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          className="scroll-top-fab"
          onClick={() => scrollToTop()}
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          title="Back to top"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Hero() {
  const containerRef = useRef(null);
  const roles = ["Software Engineer", "Full-Stack Developer", "ML Engineer", "AI Builder"];
  const [roleIdx, setRoleIdx] = useState(0);
  const isMobile = useIsMobile(900);

  // Parallax Mechanics
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-25, 25]), { stiffness: 40, damping: 15 });
  const py = useSpring(useTransform(my, [-0.5, 0.5], [-25, 25]), { stiffness: 40, damping: 15 });

  // Scroll-exit scrub: hero content drifts up, shrinks and fades as you leave
  const { scrollYProgress: exitProg } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const exitY = useTransform(exitProg, [0, 1], [0, -150]);
  const exitScale = useTransform(exitProg, [0, 1], [1, 0.93]);
  const exitOpacity = useTransform(exitProg, [0, 0.75], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIdx(prev => (prev + 1) % roles.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    mx.set(e.clientX / innerWidth - 0.5);
    my.set(e.clientY / innerHeight - 0.5);
  };

  return (
    <section
      id="hero"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-start',      // top-align so tall content scrolls down, never under the navbar
        justifyContent: 'center',
        background: 'var(--bg)'
      }}
    >
      {/* Layer 1: Trionn-style interactive line field — touch & hold to blast */}
      <InteractiveLines />

      {/* Layer 1.5: Scroll-reactive iridescent glass 3D object (desktop only) */}
      {!isMobile && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', opacity: 0.55 }}>
          <React.Suspense fallback={null}>
            <HeroScene />
          </React.Suspense>
        </div>
      )}

      {/* Layer 2: Mouse Parallax Elements */}
      <motion.div style={{ position: 'absolute', inset: 0, x: px, y: py, pointerEvents: 'none', zIndex: 2 }}>
        <div style={{ position: 'absolute', top: '32%', left: '50%', transform: 'translate(-50%, -50%)', width: '70vw', height: '40vw', background: 'radial-gradient(circle, rgba(126,184,247,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)' }} />
        <div className="float-y" style={{ position: 'absolute', top: '15%', left: '15%', width: 'min(550px, 60vw)', height: 'min(550px, 60vw)', background: 'radial-gradient(circle, rgba(124,58,237,0.03) 0%, rgba(0,0,0,0) 60%)', animation: 'float-y 8s ease-in-out infinite' }} />
        <div className="float-y" style={{ position: 'absolute', bottom: '10%', right: '10%', width: 'min(380px, 40vw)', height: 'min(380px, 40vw)', background: 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, rgba(0,0,0,0) 60%)', animation: 'float-y 6s ease-in-out infinite 1s' }} />
      </motion.div>

      {/* Layer 3: Blueprint grid is rendered by SpaceCanvasBackground canvas itself — no duplicate needed */}

      {/* Layer 4: Organic Texture Film Grain — contained within section */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`, pointerEvents: 'none', zIndex: 3, opacity: 'var(--grain-opacity)' }} />

      {/* Layer 5: Visual Content Gradient Falloff Base */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '260px', background: 'linear-gradient(transparent, var(--bg))', zIndex: 4, pointerEvents: 'none' }} />

      {/* Main Container Content — pointer-transparent so the line field stays touchable.
          Scrubbed by scroll for a cinematic exit as the user leaves the hero. */}
      <motion.div style={{ position: 'relative', zIndex: 10, maxWidth: '920px', width: '100%', padding: 'clamp(7rem, 13vh, 10rem) 1.25rem 3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', y: exitY, scale: exitScale, opacity: exitOpacity, willChange: 'transform, opacity' }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(126,184,247,0.09)', border: '1px solid rgba(126,184,247,0.2)', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--a3)', marginBottom: '2rem', pointerEvents: 'auto' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-dot 2s infinite' }}></span>
          ✦ Available for opportunities
        </motion.div>

        <Tilt deg={5}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 7.5vw, 6.5rem)',
              fontWeight: '800',
              letterSpacing: '-0.04em',
              lineHeight: '0.98',
              /* solid color — background-clip:text breaks on transformed split chars */
              color: 'var(--hero-text)',
              textShadow: '0 8px 40px rgba(0,0,0,0.35)',
              marginBottom: '1.5rem'
            }}
          >
            <SplitReveal text="Aakash" per="char" delay={0.15} duration={1} />{' '}
            <span className="fd" style={{ fontWeight: '400' }}>
              <SplitReveal text="Ijaz" per="char" delay={0.42} duration={1} />
            </span>
          </h1>
        </Tilt>

        <div className="hero-role" style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)', fontWeight: '300', height: '3.5rem', marginBottom: '1.5rem', color: 'var(--txt)' }}>
          A <AnimatePresence mode="wait">
            <motion.span key={roleIdx} className="fd sh-text" style={{ fontWeight: '400', display: 'inline-block' }}>
              {/* Trionn-style word morph: chars fly out up / in from below */}
              {roles[roleIdx].split('').map((c, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 16, rotate: 8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0, transition: { delay: i * 0.028, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
                  exit={{ opacity: 0, y: -14, rotate: -6, transition: { delay: i * 0.014, duration: 0.25 } }}
                  style={{ display: 'inline-block', whiteSpace: 'pre' }}
                >
                  {c}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence> based in Islamabad, PK.
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '460px', marginBottom: '2.25rem' }}
        >
          Engineering comprehensive architectural ecosystems using modern tech stacks, incorporating real-time AI capabilities, machine learning pipelines, and high-fidelity user experiences.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="hero-btns"
          style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', pointerEvents: 'auto' }}
        >
          <Btn primary onClick={() => scrollToId('projects')}>View Projects ↓</Btn>
          <Btn onClick={() => scrollToId('contact')}>Get in Touch</Btn>
        </motion.div>

        {/* Trionn-style interaction hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '2.5rem' }}
        >
          ✦ Touch the lines · click &amp; hold to blast
        </motion.div>

        {/* Metrics/Stats Cluster */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="hero-stats"
          style={{
            width: '100%',
            borderTop: '1px solid var(--stroke)',
            paddingTop: '2rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '2rem'
          }}
        >
          {[
            { num: "3+", lbl: "Years Coding" },
            { num: "5+", lbl: "Projects Built" },
            { num: "2", lbl: "Research Labs" },
            { num: "AI", lbl: "MERN+AI Stack" }
          ].map((stat, i) => (
            <div key={i}>
              <div><CountUp value={stat.num} className="fd sh-text" style={{ fontSize: '2rem' }} /></div>
              <div style={{ fontSize: '0.68rem', uppercase: true, letterSpacing: '0.15em', color: 'var(--muted)', marginTop: '0.25rem', textTransform: 'uppercase' }}>{stat.lbl}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll Indicator Metric Line */}
        <div className="hero-scroll" style={{ marginTop: '2.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--muted)' }}>SCROLL</span>
          <div style={{ width: '1px', height: '44px', background: 'var(--stroke)', position: 'relative', overflow: 'hidden' }}>
            <motion.div
              animate={{ y: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '50%', background: 'var(--G)' }}
            />
          </div>
        </div>

      </motion.div>
    </section >
  );
}

/** One credential of the pinned trust wall — steps in inside its scrub window. */
function TrustItem({ progress, range, k, v }) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [46, 0]);
  const scale = useTransform(progress, range, [0.82, 1]);
  const blurPx = useTransform(progress, range, [7, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  return (
    <motion.div style={{ opacity, y, scale, filter, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', willChange: 'transform, opacity' }}>
      <span style={{ fontSize: '0.62rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--a1)', fontWeight: 600 }}>{k}</span>
      <span className="fd" style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.6rem)', color: 'var(--txt)', whiteSpace: 'nowrap' }}>{v}</span>
    </motion.div>
  );
}

/**
 * Pinned credibility wall: the big bold statement fills the screen first,
 * then shrinks into a label while each credential steps in one by one,
 * scrubbed to scroll (scrolling back reverses the sequence).
 */
function TrustStrip() {
  const items = [
    { k: 'Education', v: 'FAST-NUCES' },
    { k: 'AI Research', v: 'AIMS Lab' },
    { k: 'Industry', v: 'Codroon' },
    { k: 'Leadership', v: 'NASCON' },
    { k: 'Stack', v: 'MERN · AI' },
  ];
  const ref = useRef(null);
  const scrollYProgress = usePinProgress(ref);

  // Phase 1: huge statement → shrinks into a small eyebrow label
  const titleScale = useTransform(scrollYProgress, [0.04, 0.26], [1, 0.3]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  // Progress line fills as the credentials arrive
  const lineScaleX = useTransform(scrollYProgress, [0.3, 0.88], [0, 1]);

  return (
    <section ref={ref} style={{ position: 'relative', height: '280vh', zIndex: 5 }}>
      <div style={{ position: 'sticky', top: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'clip', padding: '0 1.5rem', gap: 'clamp(2rem, 5vh, 3.5rem)' }}>

        {/* Phase 1: big bold statement, morphs down into the section label */}
        <motion.h2
          style={{
            scale: titleScale,
            opacity: titleOpacity,
            textAlign: 'center',
            fontFamily: "'Familjen Grotesk', 'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(2rem, 5.6vw, 4.4rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            willChange: 'transform',
            maxWidth: '1000px'
          }}
        >
          Trusted across <span className="fd g-text" style={{ fontWeight: 400 }}>study, research</span>
          {' '}&amp; <span className="fd g-text" style={{ fontWeight: 400 }}>industry.</span>
        </motion.h2>

        {/* Phase 2: credentials step in one by one on each scroll increment */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: 'clamp(1.75rem, 5.5vw, 4.5rem)', maxWidth: '1100px' }}>
          {items.map((it, i) => {
            const start = 0.3 + i * 0.115;
            return (
              <TrustItem key={i} progress={scrollYProgress} range={[start, start + 0.105]} k={it.k} v={it.v} />
            );
          })}
        </div>

        {/* Progress line fills left→right as the wall assembles */}
        <motion.div style={{ scaleX: lineScaleX, transformOrigin: '0% 50%', width: 'min(560px, 78vw)', height: '1px', background: 'var(--G)', boxShadow: '0 0 12px rgba(126,184,247,0.45)' }} />
      </div>
    </section>
  );
}

/**
 * Trionn-signature pinned manifesto — the statement stays pinned while
 * scroll scrubs each word into focus, word by word. Scroll back up and
 * the reveal rewinds.
 */
function Manifesto() {
  const outerRef = useRef(null);
  const pinProgress = usePinProgress(outerRef);
  return (
    <section ref={outerRef} style={{ position: 'relative', height: '190vh' }}>
      <div style={{ position: 'sticky', top: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* ambient glow drifting against scroll for depth */}
        <ParallaxY from={80} to={-80} style={{ position: 'absolute', top: '20%', right: '-10%', pointerEvents: 'none' }}>
          <div style={{ width: 'min(560px, 70vw)', height: 'min(560px, 70vw)', background: 'radial-gradient(circle, rgba(126,184,247,0.07) 0%, rgba(0,0,0,0) 70%)' }} />
        </ParallaxY>

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--a1)', marginBottom: '2rem' }}>
            <span style={{ width: '24px', height: '1px', background: 'var(--a1)' }} />
            Manifesto
          </div>
          <ScrubText
            progress={pinProgress}
            text="I engineer *immersive* digital experiences — blending AI, full-stack systems and 3D interfaces into products that feel *alive,* not just functional."
            style={{ fontSize: 'clamp(1.8rem, 4.6vw, 3.6rem)', lineHeight: 1.28, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--txt)' }}
          />
        </div>
      </div>
    </section>
  );
}

function TimeCard({ icon, title, sub, period, type, accent }) {
  return (
    <div
      style={{
        background: 'var(--surf)',
        border: '1px solid var(--stroke)',
        borderLeft: accent ? '2px solid var(--a1)' : '1px solid var(--stroke)',
        padding: '1.5rem',
        borderRadius: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        cursor: 'default'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(6px)';
        e.currentTarget.style.borderColor = 'var(--a2)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0px)';
        e.currentTarget.style.borderColor = accent ? 'var(--a1)' : 'var(--stroke)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--a1)' }}>{type}</span>
          <h4 style={{ fontSize: '1.1rem', fontWeight: '500', marginTop: '0.15rem' }}>{title}</h4>
        </div>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--muted)' }}>
        <span>{sub}</span>
        <span>{period}</span>
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" style={{ padding: 'clamp(4rem, 10vw, 7rem) 0 clamp(3rem, 8vw, 5rem)', position: 'relative', overflow: 'hidden' }}>
      {/* Ghost display type drifting with scroll behind the content */}
      <GhostTitle text="ABOUT" top="1.5rem" dir={1} />
      {/* Decorative blob — clipped by overflow:hidden */}
      <div style={{ position: 'absolute', top: 0, left: '-10%', width: 'min(500px, 80vw)', height: 'min(500px, 80vw)', background: 'radial-gradient(circle, rgba(126,184,247,0.04) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        <SHead eyebrow="Introduction" heading="Behind the" italic="System" />

        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '4rem', alignItems: 'flex-start' }}>

          {/* Left Summary Identity Block — slow parallax lane, scrubs in on scroll */}
          <ParallaxY from={18} to={-18}>
          <ScrubIn>
            <Tilt deg={8}>
              <div className="about-card" style={{ background: 'var(--surf)', border: '1px solid var(--stroke)', padding: '2.5rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(126,184,247,0.05) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1.75rem' }}>
                  {/* Outer animated ring */}
                  <div style={{
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, var(--a1), var(--a2), var(--a3), var(--a1))',
                    animation: 'spin-cw 6s linear infinite',
                    zIndex: 0
                  }} />
                  {/* Inner gap ring */}
                  <div style={{
                    position: 'absolute',
                    inset: '-1px',
                    borderRadius: '50%',
                    background: 'var(--surf)',
                    zIndex: 1
                  }} />
                  {/* Image container */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    zIndex: 2,
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(126,184,247,0.25)'
                  }}>
                    <img
                      src="/images/vecteezy_software-engineer-png-graphic-clipart-design_23485893.png"
                      alt="Aakash Ijaz"
                      style={{
                        width: '115%',
                        height: '115%',
                        objectFit: 'contain',
                        objectPosition: 'center bottom',
                        marginBottom: '-4px'
                      }}
                    />
                  </div>
                  {/* Online status dot */}
                  <div style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#10B981',
                    border: '2px solid var(--surf)',
                    zIndex: 3,
                    animation: 'pulse-dot 2s infinite'
                  }} />
                </div>

                <h3 style={{ fontSize: '1.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>Aakash Ijaz</h3>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--a1)', marginBottom: '1.5rem' }}>Software Engineering Student</p>

                <ScrubText
                  text="Currently completing a Bachelor of Science in Software Engineering at FAST-NUCES Islamabad (Graduating June 2026). Deeply focused on system engineering strategies, interactive frameworks, and computational modeling."
                  style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}
                />
                <ScrubText
                  text="Experienced as a Full-Stack Web Developer and API systems engineer, combining structural clean architecture with state-driven algorithmic engines."
                  style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem' }}
                />

                <div style={{ borderTop: '1px solid var(--stroke)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--txt)' }}>
                  <span>📍 Islamabad, PK</span>
                  <span style={{ color: 'var(--stroke)' }}>·</span>
                  <span>🎓 BSE '26</span>
                  <span style={{ color: 'var(--stroke)' }}>·</span>
                  <span>💼 Open to Work</span>
                </div>
              </div>
            </Tilt>
          </ScrubIn>
          </ParallaxY>

          {/* Right Chronology Timeline Stack — faster parallax lane, cards scrub in one by one */}
          <ParallaxY from={70} to={-70}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {[
              { type: "Education", title: "FAST-NUCES Islamabad", sub: "BSE Bachelor of Software Engineering", period: "2022 — 2026", icon: "⚡", accent: false },
              { type: "Research & AI", title: "AIMS Lab / AI Research Node", sub: "Deep Learning & Forecasting Engineer", period: "2025 — Present", icon: "✦", accent: true },
              { type: "Professional Experience", title: "Codroon", sub: "Full Stack Developer & API Architect", period: "2025", icon: "⚙️", accent: false },
              { type: "Leadership", title: "NASCON Marathon Node", sub: "Lead Organizer — Web Development Engineering", period: "2025", icon: "◈", accent: false }
            ].map((card, i) => (
              <ScrubIn key={i} from={70}>
                <TimeCard {...card} />
              </ScrubIn>
            ))}
          </div>
          </ParallaxY>

        </div>
      </div>
    </section>
  );
}

function PCard({ p }) {
  const cardRef = useRef(null);
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const springConfig = { stiffness: 140, damping: 20 };
  const rX = useSpring(useMotionValue(0), springConfig);
  const rY = useSpring(useMotionValue(0), springConfig);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const box = cardRef.current.getBoundingClientRect();

    // Spotlight motion calculations
    const gx = ((e.clientX - box.left) / box.width) * 100;
    const gy = ((e.clientY - box.top) / box.height) * 100;
    glowX.set(gx);
    glowY.set(gy);

    // 3D Tilt orientation calculations
    const rxVal = -((e.clientY - box.top) / box.height - 0.5) * 12;
    const ryVal = ((e.clientX - box.left) / box.width - 0.5) * 12;
    rX.set(rxVal);
    rY.set(ryVal);
  };

  const handleMouseLeave = () => {
    rX.set(0);
    rY.set(0);
    glowX.set(-1000);
    glowY.set(-1000);
  };

  const isWide = p.col >= 10;
  const isMobile = useIsMobile(768);
  const spotlightBg = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(126,184,247,0.13) 0%, rgba(0,0,0,0) 65%)`);

  return (
    <div style={{ gridColumn: isMobile ? 'span 12' : `span ${p.col}`, width: '100%', perspective: '1000px' }}>
      <Reveal3D>
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="pcard-inner"
          style={{
            rotateX: rX,
            rotateY: rY,
            transformStyle: 'preserve-3d',
            background: 'var(--surf)',
            border: '1px solid var(--stroke)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: (isWide && !isMobile) ? 'row' : 'column',
            justifyContent: 'space-between',
            gap: '2.5rem'
          }}
        >
          {/* Layer A: Tracking Cursor Spotlight Shadow */}
          <motion.div style={{ position: 'absolute', inset: 0, background: spotlightBg, pointerEvents: 'none' }} />

          {/* Layer B: Geometrical Graphic Schematics */}
          <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '220px', height: '220px', opacity: 0.15, pointerEvents: 'none' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `1px solid ${p.accent || 'var(--a1)'}`, position: 'absolute' }} />
            <div style={{ width: '70%', height: '70%', top: '15%', left: '15%', borderRadius: '50%', border: `1px dashed ${p.accent || 'var(--a1)'}`, position: 'absolute' }} />
            <div style={{ width: '140%', height: '1px', background: `linear-gradient(90deg, transparent, ${p.accent || 'var(--a1)'}, transparent)`, position: 'absolute', top: '50%', left: '-20%', transform: 'rotate(-45deg)' }} />
          </div>

          {/* Layer C: Vintage Halftone Dot Matrix Texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '5px 5px', opacity: 0.14, mixBlendMode: 'multiply', pointerEvents: 'none' }} />

          {/* Layer D: Static Pure Ambient Gloss Shimmer */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)', pointerEvents: 'none' }} />

          <div className="pcard-id" style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
            {p.id}
          </div>

          {/* Core Descriptive Text Context */}
          <div style={{ flex: isWide ? '0 0 55%' : '1 1 auto', zIndex: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--stroke)' }}>{p.type}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.year}</span>
            </div>

            <h3 className="fd pcard-title" style={{ fontSize: '2.5rem', fontWeight: '400', marginBottom: '0.25rem', lineHeight: '1.1' }}>{p.title}</h3>
            <h4 style={{ fontSize: '0.88rem', color: 'var(--a1)', marginBottom: '1.2rem', fontWeight: '500' }}>{p.sub}</h4>
            <ScrubText text={p.desc} style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }} />

            <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {p.bullets.map((b, i) => (
                <li key={i} style={{ fontSize: '0.82rem', color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--a1)' }}>➔</span> {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Modular Technology Cluster */}
          <div style={{ flex: isWide ? '0 0 40%' : '1 1 auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: isWide ? 'flex-end' : 'flex-start', zIndex: 5 }}>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.15em', marginBottom: '0.75rem', textAlign: isWide ? 'right' : 'left' }}>Tech Stack</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: isWide ? 'flex-end' : 'flex-start' }}>
                {p.tags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '99px',
                      background: 'var(--surf2)',
                      border: '1px solid var(--stroke)',
                      fontSize: '0.75rem',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = 'var(--a1)';
                      e.target.style.boxShadow = '0 0 10px rgba(126,184,247,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = 'var(--stroke)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </motion.div>
      </Reveal3D>
    </div>
  );
}

/**
 * Trionn "services" moment: pinned section where the discipline names
 * shatter — every character flies outward in 3D as scroll scrubs through,
 * revealing the statement underneath. Reassembles on scroll-up.
 */
function Disciplines() {
  const ref = useRef(null);
  const scrollYProgress = usePinProgress(ref);
  const stmtOpacity = useTransform(scrollYProgress, [0.55, 0.85], [0, 1]);
  const stmtY = useTransform(scrollYProgress, [0.55, 0.85], [36, 0]);
  const glowScale = useTransform(scrollYProgress, [0.2, 0.9], [0.7, 1.5]);
  const glowOpacity = useTransform(scrollYProgress, [0.1, 0.5, 0.95], [0.15, 0.55, 0.85]);

  return (
    <section ref={ref} style={{ position: 'relative', height: '230vh' }}>
      <div style={{ position: 'sticky', top: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 1.5rem' }}>

        {/* ── Aesthetic background layers ── */}
        {/* Drifting constellation particles */}
        <SectionParticles n={48} />
        {/* Center glow that swells as the letters shatter */}
        <motion.div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', x: '-50%', y: '-50%', width: 'min(760px, 85vw)', height: 'min(760px, 85vw)', scale: glowScale, opacity: glowOpacity, background: 'radial-gradient(circle, rgba(126,184,247,0.14) 0%, rgba(124,58,237,0.08) 45%, rgba(0,0,0,0) 70%)', pointerEvents: 'none', filter: 'blur(10px)' }} />
        {/* Slow-spinning orbital rings */}
        <div aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(640px, 80vw)', height: 'min(640px, 80vw)', pointerEvents: 'none', opacity: 0.16 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid var(--a1)', animation: 'spin-cw 42s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '12%', borderRadius: '50%', border: '1px dashed var(--a2)', animation: 'spin-ccw 30s linear infinite' }} />
          <div style={{ position: 'absolute', inset: '26%', borderRadius: '50%', border: '1px solid rgba(167,139,250,0.6)', animation: 'spin-cw 22s linear infinite' }} />
        </div>
        {/* Corner auras drifting against scroll */}
        <ParallaxY from={90} to={-90} style={{ position: 'absolute', top: '6%', left: '-8%', pointerEvents: 'none' }}>
          <div style={{ width: 'min(420px, 55vw)', height: 'min(420px, 55vw)', background: 'radial-gradient(circle, rgba(6,182,212,0.09) 0%, rgba(0,0,0,0) 70%)' }} />
        </ParallaxY>
        <ParallaxY from={-90} to={90} style={{ position: 'absolute', bottom: '4%', right: '-8%', pointerEvents: 'none' }}>
          <div style={{ width: 'min(460px, 60vw)', height: 'min(460px, 60vw)', background: 'radial-gradient(circle, rgba(244,114,182,0.08) 0%, rgba(0,0,0,0) 70%)' }} />
        </ParallaxY>

        <div style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--a1)', marginBottom: '2.5rem', position: 'relative', zIndex: 2 }}>
          ✦ Different disciplines · One standard of craft
        </div>
        <ShatterText
          progress={scrollYProgress}
          lines={['A.I.', 'FULL-STACK', '3D · DESIGN']}
          style={{ fontFamily: "'Familjen Grotesk', 'Inter', sans-serif", fontWeight: 700, fontSize: 'clamp(3rem, 10vw, 8rem)', letterSpacing: '-0.03em', color: 'var(--txt)', position: 'relative', zIndex: 2 }}
        />
        {/* Statement revealed inside the debris field */}
        <motion.p
          className="fd g-text"
          style={{ opacity: stmtOpacity, y: stmtY, position: 'absolute', zIndex: 2, fontSize: 'clamp(1.6rem, 4vw, 3rem)', textAlign: 'center', maxWidth: '760px', padding: '0 1.5rem' }}
        >
          One engineer. Every layer.
        </motion.p>
      </div>
    </section>
  );
}

/**
 * Puzzle-assemble moment (inverse of Disciplines): characters of a tech
 * word fly IN from scattered 3D positions and lock together as you scroll.
 */
function TechAssemble() {
  const ref = useRef(null);
  const progress = usePinProgress(ref);
  const subOpacity = useTransform(progress, [0.68, 0.88], [0, 1]);
  const subY = useTransform(progress, [0.68, 0.88], [24, 0]);

  return (
    <section ref={ref} style={{ position: 'relative', height: '200vh' }}>
      <div style={{ position: 'sticky', top: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0 1.5rem', gap: '2.25rem' }}>
        <div style={{ fontSize: '0.68rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--a1)', position: 'relative', zIndex: 2 }}>
          ⌘ Scroll · watch the pieces lock in
        </div>
        <ShatterText
          mode="assemble"
          progress={progress}
          lines={['< ENGINEERED />']}
          style={{ fontFamily: "'Familjen Grotesk', 'Inter', sans-serif", fontWeight: 700, fontSize: 'clamp(2.4rem, 8.5vw, 7rem)', letterSpacing: '-0.02em', color: 'var(--txt)', position: 'relative', zIndex: 2 }}
        />
        <motion.p style={{ opacity: subOpacity, y: subY, color: 'var(--muted)', fontSize: '0.95rem', letterSpacing: '0.04em', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          Precision, assembled from chaos — <span className="fd g-text" style={{ fontSize: '1.1rem' }}>that's how I build.</span>
        </motion.p>
      </div>
    </section>
  );
}

/**
 * Friendly AI greeter — pops up after the visitor has scrolled deep,
 * types a rotating set of messages, and offers a shortcut to Contact.
 */
function AiGreeter() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const messages = [
    "Hi! I'm ARIA — Aakash's AI assistant 🤖",
    'Enjoying the 3D? He built every bit of it.',
    'Got a project or a role in mind?',
    'Any questions? Feel free to reach out — Aakash replies fast!'
  ];

  useEffect(() => {
    const onScroll = () => {
      const p = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (p > 0.45) setVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Typewriter loop
  useEffect(() => {
    if (!visible || dismissed) return;
    const msg = messages[msgIdx];
    let i = 0;
    setTyped('');
    const typeId = setInterval(() => {
      i += 1;
      setTyped(msg.slice(0, i));
      if (i >= msg.length) {
        clearInterval(typeId);
        setTimeout(() => setMsgIdx((m) => (m + 1) % messages.length), 3000);
      }
    }, 30);
    return () => clearInterval(typeId);
  }, [msgIdx, visible, dismissed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          style={{
            position: 'fixed', bottom: '1.5rem', left: '1.25rem', zIndex: 290,
            display: 'flex', alignItems: 'flex-end', gap: '0.7rem', maxWidth: 'min(320px, calc(100vw - 6rem))'
          }}
        >
          {/* Avatar orb */}
          <div style={{ position: 'relative', width: '46px', height: '46px', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: '-3px', borderRadius: '50%', background: 'conic-gradient(from 0deg, var(--a1), var(--a2), #a78bfa, var(--a1))', animation: 'spin-cw 5s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--surf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              🤖
            </div>
            <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '11px', height: '11px', borderRadius: '50%', background: '#10B981', border: '2px solid var(--bg)', animation: 'pulse-dot 2s infinite' }} />
          </div>

          {/* Speech bubble */}
          <div style={{
            background: 'var(--nav-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
            border: '1px solid var(--nav-border)', borderRadius: '1.1rem 1.1rem 1.1rem 0.25rem',
            padding: '0.85rem 1rem', boxShadow: '0 12px 40px rgba(0,0,0,0.45)', position: 'relative', flex: 1
          }}>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss assistant"
              style={{ position: 'absolute', top: '0.4rem', right: '0.5rem', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}
            >
              ✕
            </button>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--a1)', marginBottom: '0.35rem', fontWeight: 700 }}>
              ARIA · AI Assistant
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--txt)', lineHeight: 1.5, minHeight: '2.5em' }}>
              {typed}<span style={{ opacity: 0.7 }}>▌</span>
            </div>
            <button
              onClick={() => scrollToId('contact')}
              style={{
                marginTop: '0.6rem', padding: '0.45rem 0.9rem', borderRadius: '99px', border: 'none',
                background: 'var(--G)', color: '#060608', fontSize: '0.72rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Inter', sans-serif", letterSpacing: '0.04em'
              }}
            >
              Ask Aakash →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Pinned horizontal-scroll gallery (desktop): vertical scroll drives the
 * project cards sideways, trionn-style. Falls back to the original
 * vertical grid under 1024px.
 */
function HorizontalProjects({ children }) {
  const isNarrow = useIsMobile(1024);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [range, setRange] = useState(0);

  useEffect(() => {
    if (isNarrow) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track || !track.parentElement) return;
      setRange(Math.max(0, track.scrollWidth - track.parentElement.clientWidth));
    };
    measure();
    // re-measure after fonts/images settle
    const t = setTimeout(measure, 900);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [isNarrow]);

  const scrollYProgress = usePinProgress(sectionRef);
  const x = useTransform(scrollYProgress, [0, 1], [0, -range]);

  if (isNarrow) {
    return (
      <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', width: '100%' }}>
        {children}
      </div>
    );
  }

  return (
    <div ref={sectionRef} style={{ height: `calc(100vh + ${range}px)`, position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ fontSize: '0.66rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 max(calc((100vw - 1100px) / 2), 1.5rem)', marginBottom: '1.25rem' }}>
          Scroll to explore ⟶
        </div>
        <motion.div ref={trackRef} style={{ x, display: 'flex', alignItems: 'stretch', gap: '2rem', padding: '0 max(calc((100vw - 1100px) / 2), 1.5rem)', willChange: 'transform' }}>
          {React.Children.map(children, (child) => (
            <div style={{ width: 'min(720px, 74vw)', flexShrink: 0, display: 'flex' }}>
              <div style={{ width: '100%' }}>{child}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/** Live local clock for the footer ledger (updates every second). */
function LiveClock() {
  const [now, setNow] = useState('');
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Karachi' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}>PKT → {now}</span>;
}

/**
 * Huge hollow-type marquee divider — reacts to scroll velocity like the
 * contact band, but rendered as outlined display type.
 */
function WorksMarquee() {
  return (
    <div aria-hidden="true" style={{ padding: 'clamp(1.5rem, 4vw, 3rem) 0 0', position: 'relative', zIndex: 1 }}>
      <VelocityMarquee
        items={['SELECTED WORKS', '✦', 'ARCHITECTED SYSTEMS', '✦', 'AI · FULL-STACK · 3D', '✦']}
        itemClassName="outline-text"
        itemStyle={{ fontSize: 'clamp(3rem, 9vw, 7.5rem)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
        speed={7}
      />
    </div>
  );
}

/**
 * Defers loading/mounting the heavy three.js carousel until the user
 * scrolls near it — keeps first paint fast, especially on mobile.
 */
function Lazy3DProjects({ items }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '400px 0px' });

  const placeholder = (
    <div style={{
      height: 'clamp(360px, 56vh, 620px)', marginBottom: '3rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.6rem', color: 'var(--muted)', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase'
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--a1)', animation: 'pulse-dot 1.4s infinite' }} />
      Rendering 3D showcase
    </div>
  );

  return (
    <div ref={ref}>
      {inView ? (
        <React.Suspense fallback={placeholder}>
          <Projects3D items={items} />
        </React.Suspense>
      ) : placeholder}
    </div>
  );
}

function Projects() {
  const dataset = [
    { id: "01", title: "Tahqiiq", sub: "AI Legal Document Analyzer", type: "Final Year Project", year: "2026", col: 7, desc: "Architected a distributed intelligent validation layer dedicated to corporate legal analysis, parsing structural vulnerabilities, and cross-checking ambiguity vectors.", bullets: ["Built custom risk extraction engines", "Integrated contextual embedding pipelines", "Optimized zero-latency client data parsing"], tags: ["React", "FastAPI", "NLP", "LangChain", "MERN"], accent: "#8b5cf6" },
    { id: "02", title: "CRM Platform", sub: "Enterprise Relationship Node", type: "Professional Work", year: "2025", col: 5, desc: "Constructed an automated high-throughput commercial architecture handling large data objects seamlessly, designed with secure API routes.", bullets: ["Managed complex relational structures", "Configured state-driven telemetry hooks", "Implemented multi-tier data security models"], tags: ["Next.js", "Express", "MongoDB", "Node"], accent: "#22d3ee" },
    { id: "03", title: "Forecasting Engine", sub: "Deep Learning Predictive Analytics", type: "Research Lab", year: "2025", col: 5, desc: "Engineered sequential machine learning modules structured to output temporal tracking projections using LSTM networks.", bullets: ["Formulated multivariate pipeline models", "Evaluated structural time-series arrays", "Optimized gradient processing functions"], tags: ["Python", "PyTorch", "LSTM", "ARIMA", "FAISS"], accent: "#f472b6" },
    { id: "04", title: "Hospital ERP", sub: "Full-Stack Medical Operations Platform", type: "Full-Stack Project", year: "2025", col: 7, desc: "Formulated complete administrative infrastructure tracking internal processes, patient workflows, and specialized access nodes.", bullets: ["Optimized data object relationships", "Designed granular session layers", "Rendered instantaneous updates via socket streams"], tags: ["React", "Node.js", "Express", "MongoDB"], accent: "#34d399" },
    { id: "05", title: "NASCON Node", sub: "High-Traffic Registration Platform", type: "Leadership Event", year: "2025", col: 12, desc: "Engineered a rapid transactional orchestration system supporting extensive user registration processes for a major technical event without operational downtime.", bullets: ["Scaled runtime server handling architecture", "Managed complex real-time checkouts", "Deployed dynamic analytical reporting grids"], tags: ["React", "Vite", "Node.js", "Tailwind Engine", "Railway"], accent: "#7EB8F7" }
  ];

  return (
    // overflow clip (not hidden) — hidden would break the sticky horizontal gallery
    <section id="projects" style={{ padding: '6rem 0', overflow: 'clip', position: 'relative' }}>
      <GhostTitle text="WORKS" top="1rem" dir={-1} />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        <SHead eyebrow="Selected Works" heading="Architected" italic="Systems" />

        {/* Cinematic interactive 3D glass carousel (lazy-loaded), zooming in on scroll */}
        <ScrubZoom from={0.9}>
          <Lazy3DProjects items={dataset} />
        </ScrubZoom>

      </div>

      {/* Pinned horizontal work gallery — vertical scroll drives cards sideways */}
      <HorizontalProjects>
        {dataset.map((p) => <PCard key={p.id} p={p} />)}
      </HorizontalProjects>
    </section>
  );
}

function SkillBar({ name, level, accent }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <span style={{ fontSize: '0.83rem', color: 'var(--txt)', fontWeight: '500' }}>{name}</span>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: '700',
          color: accent,
          background: `${accent}18`,
          border: `1px solid ${accent}40`,
          padding: '0.1rem 0.5rem',
          borderRadius: '99px',
          fontFamily: 'monospace',
          letterSpacing: '0.05em'
        }}>{level}%</span>
      </div>
      <div style={{ width: '100%', height: '4px', background: 'var(--surf2)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${accent}99, ${accent})`,
            borderRadius: '99px',
            boxShadow: `0 0 10px ${accent}60`,
            position: 'relative'
          }}
        >
          {/* Shimmer sweep */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 0.8 }}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '40%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              borderRadius: '99px'
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

function Skills() {
  const schema = [
    {
      cat: 'Languages', icon: '{ }',
      accent: '#7EB8F7',
      label: 'Core',
      items: [{ n: 'JavaScript', l: 88 }, { n: 'Python', l: 85 }, { n: 'C++', l: 75 }, { n: 'SQL', l: 78 }]
    },
    {
      cat: 'Frontend', icon: '◻',
      accent: '#a78bfa',
      label: 'UI Layer',
      items: [{ n: 'React', l: 90 }, { n: 'HTML/CSS', l: 92 }, { n: 'Tailwind', l: 85 }, { n: 'Framer Motion', l: 78 }]
    },
    {
      cat: 'Backend & DB', icon: '⚙',
      accent: '#34d399',
      label: 'Server',
      items: [{ n: 'Node/Express', l: 86 }, { n: 'REST APIs', l: 90 }, { n: 'FastAPI', l: 82 }, { n: 'MongoDB', l: 84 }]
    },
    {
      cat: 'AI / ML', icon: '✦',
      accent: '#f472b6',
      label: 'Intelligence',
      items: [{ n: 'NLP/LLMs', l: 80 }, { n: 'LSTM/GRU', l: 78 }, { n: 'RAG', l: 75 }, { n: 'ARIMA', l: 72 }]
    },
    {
      cat: 'DevOps & Tools', icon: '⬡',
      accent: '#fb923c',
      label: 'Ops',
      items: [{ n: 'Git', l: 90 }, { n: 'Docker', l: 72 }, { n: 'FAISS', l: 70 }, { n: 'LegalBERT', l: 68 }]
    },
    {
      cat: 'Design & UX', icon: '◈',
      accent: '#38bdf8',
      label: 'Design',
      items: [{ n: 'UI/UX', l: 76 }, { n: 'Figma', l: 72 }, { n: 'Nielsen', l: 74 }, { n: 'Prototyping', l: 70 }]
    }
  ];

  return (
    <section id="skills" style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>
      <GhostTitle text="ARSENAL" top="1rem" dir={1} />
      {/* Ambient background glows — clipped by overflow:hidden */}
      <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 'min(500px, 70vw)', height: 'min(500px, 70vw)', background: 'radial-gradient(circle, rgba(126,184,247,0.04) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: 'min(400px, 60vw)', height: 'min(400px, 60vw)', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
        <SHead eyebrow="Capabilities" heading="Technical" italic="Index" />

        <ScrubZoom from={0.94}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          {schema.map((block, i) => (
            <Reveal3D key={i} delay={i * 0.07}>
              <Tilt deg={8}>
                <div
                  className="skill-card"
                  style={{
                    background: 'var(--surf)',
                    border: `1px solid ${block.accent}30`,
                    padding: '1.75rem',
                    borderRadius: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = `0 12px 40px ${block.accent}20, 0 0 0 1px ${block.accent}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top-right ambient glow blob */}
                  <div style={{
                    position: 'absolute', top: '-20px', right: '-20px',
                    width: '100px', height: '100px',
                    background: `radial-gradient(circle, ${block.accent}22 0%, transparent 70%)`,
                    pointerEvents: 'none', borderRadius: '50%'
                  }} />

                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Icon badge */}
                      <div style={{
                        width: '38px', height: '38px',
                        borderRadius: '10px',
                        background: `${block.accent}18`,
                        border: `1px solid ${block.accent}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', color: block.accent, fontFamily: 'monospace',
                        boxShadow: `0 0 12px ${block.accent}30`
                      }}>
                        {block.icon}
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--txt)', lineHeight: '1.2' }}>{block.cat}</h3>
                        <span style={{ fontSize: '0.62rem', color: block.accent, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '600' }}>{block.label}</span>
                      </div>
                    </div>
                    {/* Average level indicator */}
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      color: block.accent,
                      opacity: 0.7,
                      lineHeight: 1
                    }}>
                      {Math.round(block.items.reduce((a, b) => a + b.l, 0) / block.items.length)}
                      <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>%</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: `linear-gradient(to right, ${block.accent}50, transparent)`, marginBottom: '1.25rem' }} />

                  {/* Skill Bars */}
                  <div>
                    {block.items.map((sk, idx) => (
                      <SkillBar key={idx} name={sk.n} level={sk.l} accent={block.accent} />
                    ))}
                  </div>

                </div>
              </Tilt>
            </Reveal3D>
          ))}
        </div>
        </ScrubZoom>
      </div>
    </section>
  );
}

/**
 * Formspree-powered Contact Form with premium glassmorphic styling
 */
function ContactForm() {
  const [state, handleSubmit, reset] = useForm("xeojwkoy");

  if (state.succeeded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          background: 'var(--surf)',
          border: '1px solid rgba(126,184,247,0.3)',
          borderRadius: '1.5rem',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(126,184,247,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>✦</div>
        <h4 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--txt)' }}>
          Message Received!
        </h4>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6', maxWidth: '300px' }}>
          Thanks for reaching out, Aakash will get back to you soon.
        </p>
        <motion.button
          onClick={reset}
          whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(126,184,247,0.2)' }}
          whileTap={{ scale: 0.97 }}
          style={{
            marginTop: '1rem',
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: '1px solid var(--stroke)',
            borderRadius: '999px',
            color: 'var(--txt)',
            fontSize: '0.8rem',
            fontWeight: '500',
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s'
          }}
        >
          Send Another Message
        </motion.button>
      </motion.div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'var(--surf2)',
    border: '1px solid var(--stroke)',
    borderRadius: '0.75rem',
    color: 'var(--txt)',
    fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'var(--surf)',
        border: '1px solid var(--stroke)',
        borderRadius: '1.5rem',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Name field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="name" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: '600' }}>
          Your Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          placeholder="Aakash Ijaz"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--a1)'; e.target.style.boxShadow = '0 0 0 3px rgba(126,184,247,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--stroke)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Email field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="email" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: '600' }}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          required
          placeholder="you@example.com"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = 'var(--a1)'; e.target.style.boxShadow = '0 0 0 3px rgba(126,184,247,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--stroke)'; e.target.style.boxShadow = 'none'; }}
        />
        <ValidationError prefix="Email" field="email" errors={state.errors} style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }} />
      </div>

      {/* Message field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="message" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', fontWeight: '600' }}>
          Your Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder="Let's build something great together..."
          style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
          onFocus={e => { e.target.style.borderColor = 'var(--a1)'; e.target.style.boxShadow = '0 0 0 3px rgba(126,184,247,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--stroke)'; e.target.style.boxShadow = 'none'; }}
        />
        <ValidationError prefix="Message" field="message" errors={state.errors} style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.25rem' }} />
      </div>

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={state.submitting}
        whileHover={!state.submitting ? { y: -2, boxShadow: '0 8px 32px rgba(126,184,247,0.4)' } : {}}
        whileTap={{ scale: 0.97 }}
        style={{
          padding: '0.9rem 1.5rem',
          background: state.submitting ? 'var(--surf2)' : 'var(--G)',
          border: 'none',
          borderRadius: '0.75rem',
          color: state.submitting ? 'var(--muted)' : '#060608',
          fontSize: '0.85rem',
          fontWeight: '600',
          fontFamily: "'Inter', sans-serif",
          cursor: state.submitting ? 'not-allowed' : 'pointer',
          letterSpacing: '0.04em',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {state.submitting ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: '0.9rem' }}
            >⟳</motion.span>
            Sending...
          </>
        ) : (
          <>Send Message ➔</>
        )}
      </motion.button>
    </form>
  );
}

/**
 * Trionn-style interactive line field. A grid of short line segments that
 * gently flow at rest and radiate away from the cursor on contact. Click &
 * hold sends an expanding "blast" ripple through the grid. Pure canvas, no n².
 */
function InteractiveLines() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const blast = useRef({ active: false, r: 0, x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, w, h, spacing, points = [];

    const readAccent = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--a1').trim();
      return v || '#7EB8F7';
    };
    let accent = readAccent();

    const build = () => {
      const parent = canvas.parentElement;
      w = canvas.width = parent.clientWidth;
      h = canvas.height = parent.clientHeight;
      spacing = w < 600 ? 32 : 46;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;
      points = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          points.push({ x: x * spacing, y: y * spacing, angle: 0, len: spacing * 0.3, cur: 0 });
        }
      }
      accent = readAccent();
    };
    build();

    // Convert "#rrggbb" -> "r,g,b"
    const rgb = (() => {
      const hex = accent.replace('#', '');
      const n = parseInt(hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex, 16);
      return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    })();

    const radius = 175;
    const render = (t) => {
      ctx.clearRect(0, 0, w, h);
      if (blast.current.active) {
        blast.current.r += 16;
        if (blast.current.r > Math.hypot(w, h)) blast.current.active = false;
      }
      const mx = mouse.current.x, my = mouse.current.y;

      for (const p of points) {
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.hypot(dx, dy);

        // Resting state: a slow flowing wave.
        let tAngle = Math.sin((p.x + p.y) * 0.004 + t * 0.0004) * 0.6;
        let tLen = spacing * 0.3;
        let tCur = 0;

        // Cursor repulsion -> radiate away.
        if (dist < radius) {
          const f = 1 - dist / radius;
          tAngle = Math.atan2(dy, dx);
          tLen = spacing * (0.3 + f * 0.55);
          tCur = f;
        }

        // Blast ripple ring.
        if (blast.current.active) {
          const bd = Math.abs(Math.hypot(p.x - blast.current.x, p.y - blast.current.y) - blast.current.r);
          if (bd < 64) {
            const bf = 1 - bd / 64;
            tAngle = Math.atan2(p.y - blast.current.y, p.x - blast.current.x);
            tLen = spacing * (0.3 + bf * 0.8);
            tCur = Math.max(tCur, bf);
          }
        }

        p.angle += (tAngle - p.angle) * 0.18;
        p.len += (tLen - p.len) * 0.12;
        p.cur += (tCur - p.cur) * 0.12;

        const hl = p.len / 2;
        const ca = Math.cos(p.angle) * hl, sa = Math.sin(p.angle) * hl;
        ctx.strokeStyle = `rgba(${rgb}, ${0.1 + p.cur * 0.7})`;
        ctx.lineWidth = 0.8 + p.cur * 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x - ca, p.y - sa);
        ctx.lineTo(p.x + ca, p.y + sa);
        ctx.stroke();

        if (p.cur > 0.4) {
          ctx.fillStyle = `rgba(${rgb}, ${(p.cur - 0.4) * 0.95})`;
          ctx.beginPath();
          ctx.arc(p.x + ca, p.y + sa, 1.1 + p.cur * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.current.x = e.clientX - r.left;
      mouse.current.y = e.clientY - r.top;
    };
    const onLeave = () => { mouse.current.x = -9999; mouse.current.y = -9999; };
    const onDown = (e) => {
      const r = canvas.getBoundingClientRect();
      blast.current = { active: true, r: 0, x: e.clientX - r.left, y: e.clientY - r.top };
    };

    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', build);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', build);
    };
  }, []);

  // touchAction 'pan-y' keeps vertical page-scroll working on mobile while
  // still letting taps/horizontal moves drive the line interaction & blast.
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'pan-y' }} />;
}

/**
 * Bold, trionn-inspired interactive typographic band.
 */
function InteractiveBand() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section style={{ position: 'relative', padding: 'clamp(5rem, 13vw, 9rem) 0', overflow: 'hidden' }}>
      <InteractiveLines />

      {/* edge fades for depth */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 35%, var(--bg) 92%)', pointerEvents: 'none', zIndex: 1 }} />

      <div ref={ref} style={{ position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', pointerEvents: 'none' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--a1)', marginBottom: '1.5rem' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--a1)', animation: 'pulse-dot 2s infinite' }} />
          Interactive · Dare to touch
        </motion.div>

        {/* Scroll-scrubbed statement — each word sharpens as you scroll through */}
        <ScrubText
          text="Designed to *mean* *something.*"
          style={{ fontSize: 'clamp(2.4rem, 8vw, 6rem)', fontWeight: '700', lineHeight: '1.06', letterSpacing: '-0.02em' }}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ marginTop: '1.5rem', color: 'var(--muted)', fontSize: '0.95rem', letterSpacing: '0.02em' }}
        >
          Move across the field — <span style={{ color: 'var(--txt)' }}>click &amp; hold to blast the grid.</span>
        </motion.p>
      </div>
    </section>
  );
}

function Contact() {
  const containerRef = useRef(null);

  return (
    <section id="contact" ref={containerRef} style={{ padding: '8rem 0 4rem', position: 'relative', overflow: 'hidden' }}>

      {/* Structural Interactive Abstract Rings */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', pointerEvents: 'none', opacity: 0.15 }}>
        <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '1px solid var(--a1)', animation: 'spin-cw 8s linear infinite', position: 'absolute', top: '35px', left: '35px' }} />
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '1px dashed var(--a2)', animation: 'spin-ccw 6s linear infinite', position: 'absolute', top: '55px', left: '55px' }} />
        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--G)', filter: 'blur(8px)', position: 'absolute', top: '85px', left: '85px' }} />
      </div>

      {/* Scroll-velocity marquee — whips faster with your scroll, reverses when you scroll up */}
      <div className="contact-marquee" style={{ width: '100%', position: 'relative', marginBottom: '5rem' }}>
        <div style={{ borderTop: '1px solid var(--stroke)', borderBottom: '1px solid var(--stroke)', padding: '1.1rem 0', background: 'rgba(6,6,8,0.5)' }}>
          <VelocityMarquee
            items={["LET'S BUILD SOMETHING GREAT ✦", 'FULL·STACK · AI · ENGINEER ✦', 'OPEN TO WORK · ISLAMABAD · PK ✦', 'REACT · NODE · PYTHON · PYTORCH ✦', 'MERN STACK · FAST API · ML ✦']}
            itemStyle={{ fontSize: 'clamp(1rem, 2.2vw, 1.6rem)', fontWeight: '400', letterSpacing: '0.08em' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <Tilt deg={4}>
          <h2 className="fd" style={{ fontSize: 'clamp(2.4rem, 7vw, 5.5rem)', fontWeight: '400', lineHeight: '1.1', marginBottom: '3.5rem' }}>
            <SplitReveal text="Let's build something" per="word" duration={1.1} />{' '}
            <span className="g-text">
              <SplitReveal text="great." per="char" delay={0.4} duration={1.1} />
            </span>
          </h2>
        </Tilt>

        {/* Contact Links Grid Layout */}
        <ScrubZoom from={0.93} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="contact-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.2rem', width: '100%', maxWidth: '960px', marginBottom: '4rem' }}>
          {[
            { tag: "EMAIL", val: "aakashijaz2002@gmail.com", url: "mailto:aakashijaz2002@gmail.com", emo: "✉️" },
            { tag: "PHONE", val: "+92 300 5413866", url: "tel:+923005413866", emo: "📞" },
            { tag: "LINKEDIN", val: "linkedin.com/in/aakashijaz", url: "https://linkedin.com", emo: "🔗" },
            { tag: "GITHUB", val: "github.com/aakashijaz", url: "https://github.com", emo: "⬡" }
          ].map((c, idx) => (
            <motion.a
              href={c.url}
              key={idx}
              initial={{ opacity: 0, y: 30, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.08 }}
              style={{
                background: 'var(--surf)',
                border: '1px solid var(--stroke)',
                padding: '1.5rem',
                borderRadius: '1rem',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                alignItems: 'center',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--a1)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(126,184,247,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.borderColor = 'var(--stroke)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{c.emo}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--a1)', letterSpacing: '0.15em', fontWeight: '600' }}>{c.tag}</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--muted)', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.val}</span>
            </motion.a>
          ))}
        </div>
        </ScrubZoom>

        {/* Stay in Touch — Contact Form */}
        <ScrubZoom from={0.94} style={{ width: '100%', maxWidth: '620px', marginTop: '1rem', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--a1)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ width: '24px', height: '1px', background: 'var(--a1)' }}></span>
            Stay In Touch
          </p>
          <ContactForm />
        </ScrubZoom>

        {/* Interactive sound lines — hover plays a pentatonic scale */}
        <div style={{ width: '100%', maxWidth: '720px', marginTop: '5rem' }}>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.25rem' }}>
            ✦ Play the lines
          </div>
          <SoundLines />
        </div>

        {/* Footer Real-Time Ledger Base Bar */}
        <div style={{ width: '100%', borderTop: '1px solid var(--stroke)', marginTop: '4rem', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center' }}>
          <LiveClock />
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="https://linkedin.com" style={{ color: 'inherit', textDecoration: 'none' }}>LinkedIn</a>
            <a href="https://github.com" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub</a>
            <a href="mailto:aakashijaz2002@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>Email</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-dot 2s infinite' }}></span>
            <span>Open to opportunities · Islamabad, PK</span>
          </div>

          <div>
            © 2026 Aakash Ijaz · Built with React · Three.js · Lenis
          </div>
        </div>

      </div>
    </section>
  );
}

// ==========================================
// 5. MASTER INTEGRATION NODE
// ==========================================
export default function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen onDone={() => setLoading(false)} />}
      </AnimatePresence>

      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <SmoothScroll />
          <AuroraBackground />
          <div className="noise-overlay" aria-hidden="true" />
          <ScrollProgress />
          <CustomCursor />
          <Navbar theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
          <Hero />
          <TrustStrip />
          <Manifesto />
          <About />
          <WorksMarquee />
          <Projects />
          <Skills />
          <Disciplines />
          <TechAssemble />
          <InteractiveBand />
          <Contact />
          <AiGreeter />
          <ScrollToTop />
        </motion.div>
      )}
    </>
  );
}