import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  useScroll
} from 'framer-motion';

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
    }

    :root[data-theme='light'] {
      --bg: #f8fafc;
      --surf: #ffffff;
      --surf2: #f1f5f9;
      --txt: #0f172a;
      --muted: #64748b;
      --stroke: #e2e8f0;
      --a1: #3b82f6;
      --a2: #1d4ed8;
      --a3: #60a5fa;
      --G: linear-gradient(135deg, #3b82f6, #1d4ed8);
      --G2: linear-gradient(90deg, #3b82f6, #1d4ed8, #3b82f6);
      --grid-color: rgba(59, 130, 246, 0.08);
      --nav-bg: rgba(255, 255, 255, 0.85);
      --nav-border: rgba(0, 0, 0, 0.08);
      --grain-opacity: 0.015;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

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
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Scrollbar Rules */
    ::-webkit-scrollbar {
      width: 3px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg);
    }
    ::-webkit-scrollbar-thumb {
      background: #1e1e24;
      border-radius: 99px;
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
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@300;400;500;600;700&display=swap');
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
    const numParticles = 140;
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
function Tilt({ children, deg = 14 }) {
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
      style={{ perspective: '900px', width: '100%' }}
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
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: primary ? 'none' : '1px solid var(--stroke)',
    background: primary ? 'var(--G)' : 'transparent',
      color: primary ? '#060608' : 'var(--txt)',
        boxShadow: primary ? '0 4px 20px rgba(126,184,247,0.25)' : 'none',
  };

const elementProps = {
  style: styles,
  onClick: onClick,
  whileHover: { y: -2, boxShadow: primary ? '0 6px 26px rgba(126,184,247,0.45)' : '0 4px 14px rgba(255,255,255,0.05)' },
  whileTap: { scale: 0.97 }
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
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--a1)', marginBottom: '0.5rem' }}
      >
        <span style={{ width: '24px', height: '1px', background: 'var(--a1)' }}></span>
        {eyebrow}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
        animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.8, delay: 0.1 }}
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '400', lineHeight: '1.1' }}
      >
        {heading} <span className="fd g-text">{italic}</span>
      </motion.h2>
      {sub && (
        <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.95rem', maxWidth: '500px' }}>{sub}</p>
      )}
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
        padding: '3rem',
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

  const scrollNav = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ y: -44, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      style={{
        position: 'fixed',
        top: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        width: '90%',
        maxWidth: '720px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.75rem 0.5rem 1.2rem',
          borderRadius: '9999px',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          background: 'var(--nav-bg)',
          border: '1px solid var(--nav-border)',
          boxShadow: isScrolled ? '0 8px 44px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
          transition: 'box-shadow 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Tilt deg={22}>
            <div
              onClick={() => scrollNav('hero')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--bg)',
                border: '1px solid var(--a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 'bold'
              }}
              className="fd g-text"
            >
              AI
            </div>
          </Tilt>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {['Home', 'About', 'Projects', 'Skills', 'Contact'].map((item) => (
              <button
                key={item}
                onClick={() => scrollNav(item.toLowerCase())}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--txt)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--nav-hover)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 18 }}
            whileTap={{ scale: 0.9 }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--txt)',
              padding: '0.4rem',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </motion.button>
          <div style={{ width: '1px', height: '18px', background: 'var(--stroke)' }}></div>
          <Btn primary onClick={() => scrollNav('contact')}>Hire me</Btn>
        </div>
      </div>
    </motion.div>
  );
}

function Hero() {
  const containerRef = useRef(null);
  const roles = ["Software Engineer", "Full-Stack Developer", "ML Engineer", "AI Builder"];
  const [roleIdx, setRoleIdx] = useState(0);

  // Parallax Mechanics
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, [-0.5, 0.5], [-25, 25]), { stiffness: 40, damping: 15 });
  const py = useSpring(useTransform(my, [-0.5, 0.5], [-25, 25]), { stiffness: 40, damping: 15 });

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
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)'
      }}
    >
      {/* Layer 1: Enhanced 3D Particles Constellation Background */}
      <SpaceCanvasBackground />

      {/* Layer 2: Mouse Parallax Elements */}
      <motion.div style={{ position: 'absolute', inset: 0, x: px, y: py, pointerEvents: 'none', zIndex: 2 }}>
        <div style={{ position: 'absolute', top: '32%', left: '50%', transform: 'translate(-50%, -50%)', width: '70vw', height: '40vw', background: 'radial-gradient(circle, rgba(126,184,247,0.1) 0%, rgba(0,0,0,0) 70%)', filter: 'blur(40px)' }} />
        <div className="float-y" style={{ position: 'absolute', top: '15%', left: '15%', width: '550px', height: '550px', background: 'radial-gradient(circle, rgba(124,58,237,0.03) 0%, rgba(0,0,0,0) 60%)', animation: 'float-y 8s ease-in-out infinite' }} />
        <div className="float-y" style={{ position: 'absolute', bottom: '10%', right: '10%', width: '380px', height: '380px', background: 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, rgba(0,0,0,0) 60%)', animation: 'float-y 6s ease-in-out infinite 1s' }} />
      </motion.div>

      {/* Layer 3: Blueprint grid is rendered by SpaceCanvasBackground canvas itself — no duplicate needed */}

      {/* Layer 4: Organic Texture Film Grain */}
      <div style={{ position: 'absolute', inset: '-200%', width: '400%', height: '400%', backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3联%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`, animation: 'grain 6s steps(10) infinite', pointerEvents: 'none', zIndex: 3, opacity: 'var(--grain-opacity)' }} />

      {/* Layer 5: Visual Content Gradient Falloff Base */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '260px', background: 'linear-gradient(transparent, var(--bg))', zIndex: 4, pointerEvents: 'none' }} />

      {/* Main Container Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '820px', width: '100%', padding: '7rem 1.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(126,184,247,0.09)', border: '1px solid rgba(126,184,247,0.2)', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.72rem', letterSpacing: '0.05em', color: 'var(--a3)', marginBottom: '2rem' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse-dot 2s infinite' }}></span>
          ✦ Available for opportunities
        </motion.div>

        <Tilt deg={6}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="fd"
            style={{
              fontSize: 'clamp(4rem, 9vw, 9rem)',
              fontWeight: '400',
              lineHeight: '0.95',
              background: 'linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.55) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1.5rem'
            }}
          >
          Aakash Ijaz
        </motion.h1>
      </Tilt>

      <div style={{ fontSize: 'clamp(1.2rem, 3.5vw, 2.2rem)', fontWeight: '300', height: '3.5rem', marginBottom: '1.5rem', color: 'var(--txt)' }}>
        A <AnimatePresence mode="wait">
          <motion.span
            key={roleIdx}
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            transition={{ duration: 0.4 }}
            className="fd sh-text"
            style={{ fontWeight: '400' }}
          >
            {roles[roleIdx]}
          </motion.span>
        </AnimatePresence> based in Islamabad, PK.
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '460px', marginBottom: '3rem' }}
      >
        Engineering comprehensive architectural ecosystems using modern tech stacks, incorporating real-time AI capabilities, machine learning pipelines, and high-fidelity user experiences.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ display: 'flex', gap: '1rem', marginBottom: '5rem' }}
      >
        <Btn primary onClick={() => document.getElementById('projects').scrollIntoView({ behavior: 'smooth' })}>View Projects ↓</Btn>
        <Btn onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>Get in Touch</Btn>
      </motion.div>

      {/* Metrics/Stats Cluster */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
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
            <div className="fd sh-text" style={{ fontSize: '2rem' }}>{stat.num}</div>
            <div style={{ fontSize: '0.68rem', uppercase: true, letterSpacing: '0.15em', color: 'var(--muted)', marginTop: '0.25rem', textTransform: 'uppercase' }}>{stat.lbl}</div>
          </div>
        ))}
      </motion.div>

      {/* Scroll Indicator Metric Line */}
      <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--muted)' }}>SCROLL</span>
        <div style={{ width: '1px', height: '44px', background: 'var(--stroke)', position: 'relative', overflow: 'hidden' }}>
          <motion.div
            animate={{ y: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '50%', background: 'var(--G)' }}
          />
        </div>
      </div>

    </div>
    </section >
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
    <section id="about" style={{ padding: '7rem 0 5rem', position: 'relative' }}>
      <div style={{ position: 'absolute', topLeft: 0, width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(126,184,247,0.04) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        <SHead eyebrow="Introduction" heading="Behind the" italic="System" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'flex-start' }}>

          {/* Left Summary Identity Block */}
          <Reveal3D>
            <Tilt deg={8}>
              <div style={{ background: 'var(--surf)', border: '1px solid var(--stroke)', padding: '2.5rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(126,184,247,0.05) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

                <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--G)', padding: '1px', marginBottom: '1.5rem' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifycontent: 'center' }}>
                    <span className="fd g-text" style={{ fontSize: '2.2rem', fontWeight: 'bold' }}>AI</span>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.75rem', fontWeight: '500', marginBottom: '0.25rem' }}>Aakash Ijaz</h3>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--a1)', marginBottom: '1.5rem' }}>Software Engineering Student</p>

                <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1rem' }}>
                  Currently completing a Bachelor of Science in Software Engineering at FAST-NUCES Islamabad (Graduating June 2026). Deeply focused on system engineering strategies, interactive frameworks, and computational modeling.
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  Experienced as a Full-Stack Web Developer and API systems engineer, combining structural clean architecture with state-driven algorithmic engines.
                </p>

                <div style={{ borderTop: '1px solid var(--stroke)', paddingTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--txt)' }}>
                  <span>📍 Islamabad, PK</span>
                  <span style={{ color: 'var(--stroke)' }}>·</span>
                  <span>🎓 BSE '26</span>
                  <span style={{ color: 'var(--stroke)' }}>·</span>
                  <span>💼 Open to Work</span>
                </div>
              </div>
            </Tilt>
          </Reveal3D>

          {/* Right Chronology Timeline Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {[
              { type: "Education", title: "FAST-NUCES Islamabad", sub: "BSE Bachelor of Software Engineering", period: "2022 — 2026", icon: "⚡", accent: false },
              { type: "Research & AI", title: "AIMS Lab / AI Research Node", sub: "Deep Learning & Forecasting Engineer", period: "2025 — Present", icon: "✦", accent: true },
              { type: "Professional Experience", title: "Codroon", sub: "Full Stack Developer & API Architect", period: "2025", icon: "⚙️", accent: false },
              { type: "Leadership", title: "NASCON Marathon Node", sub: "Lead Organizer — Web Development Engineering", period: "2025", icon: "◈", accent: false }
            ].map((card, i) => (
              <Reveal3D key={i} delay={i * 0.1}>
                <TimeCard {...card} />
              </Reveal3D>
            ))}
          </div>

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
  const spotlightBg = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(126,184,247,0.13) 0%, rgba(0,0,0,0) 65%)`);

  return (
    <div style={{ gridColumn: `span ${p.col}`, width: '100%', perspective: '1000px' }}>
      <Reveal3D>
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
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
            flexDirection: isWide ? 'row' : 'column',
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

          <div style={{ position: 'absolute', top: '2rem', right: '2rem', fontSize: '0.85rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
            {p.id}
          </div>

          {/* Core Descriptive Text Context */}
          <div style={{ flex: isWide ? '0 0 55%' : '1 1 auto', zIndex: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.04)', padding: '0.25rem 0.6rem', borderRadius: '4px', border: '1px solid var(--stroke)' }}>{p.type}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.year}</span>
            </div>

            <h3 className="fd" style={{ fontSize: '2.5rem', fontWeight: '400', marginBottom: '0.25rem', lineHeight: '1.1' }}>{p.title}</h3>
            <h4 style={{ fontSize: '0.88rem', color: 'var(--a1)', marginBottom: '1.2rem', fontWeight: '500' }}>{p.sub}</h4>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{p.desc}</p>

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

function Projects() {
  const dataset = [
    { id: "01", title: "Tahqiiq", sub: "AI Legal Document Analyzer", type: "Final Year Project", year: "2026", col: 7, desc: "Architected a distributed intelligent validation layer dedicated to corporate legal analysis, parsing structural vulnerabilities, and cross-checking ambiguity vectors.", bullets: ["Built custom risk extraction engines", "Integrated contextual embedding pipelines", "Optimized zero-latency client data parsing"], tags: ["React", "FastAPI", "NLP", "LangChain", "MERN"], accent: "#7EB8F7" },
    { id: "02", title: "CRM Platform", sub: "Enterprise Relationship Node", type: "Professional Work", year: "2025", col: 5, desc: "Constructed an automated high-throughput commercial architecture handling large data objects seamlessly, designed with secure API routes.", bullets: ["Managed complex relational structures", "Configured state-driven telemetry hooks", "Implemented multi-tier data security models"], tags: ["Next.js", "Express", "MongoDB", "Node"], accent: "#4A90D9" },
    { id: "03", title: "Forecasting Engine", sub: "Deep Learning Predictive Analytics", type: "Research Lab", year: "2025", col: 5, desc: "Engineered sequential machine learning modules structured to output temporal tracking projections using LSTM networks.", bullets: ["Formulated multivariate pipeline models", "Evaluated structural time-series arrays", "Optimized gradient processing functions"], tags: ["Python", "PyTorch", "LSTM", "ARIMA", "FAISS"], accent: "#9DC8FF" },
    { id: "04", title: "Hospital ERP", sub: "Full-Stack Medical Operations Platform", type: "Full-Stack Project", year: "2025", col: 7, desc: "Formulated complete administrative infrastructure tracking internal processes, patient workflows, and specialized access nodes.", bullets: ["Optimized data object relationships", "Designed granular session layers", "Rendered instantaneous updates via socket streams"], tags: ["React", "Node.js", "Express", "MongoDB"], accent: "#7EB8F7" },
    { id: "05", title: "NASCON Node", sub: "High-Traffic Registration Platform", type: "Leadership Event", year: "2025", col: 12, desc: "Engineered a rapid transactional orchestration system supporting extensive user registration processes for a major technical event without operational downtime.", bullets: ["Scaled runtime server handling architecture", "Managed complex real-time checkouts", "Deployed dynamic analytical reporting grids"], tags: ["React", "Vite", "Node.js", "Tailwind Engine", "Railway"], accent: "#4A90D9" }
  ];

  return (
    <section id="projects" style={{ padding: '6rem 0' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        <SHead eyebrow="Selected Works" heading="Architected" italic="Systems" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', width: '100%' }}>
          {dataset.map((p) => <PCard key={p.id} p={p} />)}
        </div>
      </div>
    </section>
  );
}

function Skills() {
  const schema = [
    { cat: "Languages", icon: "{ }", items: [{ n: "JavaScript", l: 88 }, { n: "Python", l: 85 }, { n: "C++", l: 75 }, { n: "SQL", l: 78 }] },
    { cat: "Frontend", icon: "◻", items: [{ n: "React", l: 90 }, { n: "Tailwind", l: 85 }, { n: "HTML/CSS", l: 92 }, { n: "Framer Motion", l: 78 }] },
    { cat: "Backend & DB", icon: "⚙", items: [{ n: "Node/Express", l: 86 }, { n: "FastAPI", l: 82 }, { n: "MongoDB", l: 84 }, { n: "REST APIs", l: 90 }] },
    { cat: "AI / ML", icon: "✦", items: [{ n: "LSTM/GRU", l: 78 }, { n: "NLP/LLMs", l: 80 }, { n: "RAG", l: 75 }, { n: "ARIMA", l: 72 }] },
    { cat: "DevOps & Tools", icon: "⬡", items: [{ n: "Docker", l: 72 }, { n: "Git", l: 90 }, { n: "FAISS", l: 70 }, { n: "LegalBERT", l: 68 }] },
    { cat: "Design & UX", icon: "◈", items: [{ n: "Figma", l: 72 }, { n: "UI/UX", l: 76 }, { n: "Nielsen", l: 74 }, { n: "Prototyping", l: 70 }] }
  ];

  return (
    <section id="skills" style={{ padding: '6rem 0', position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(126,184,247,0.03) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>
        <SHead eyebrow="Capabilities" heading="Technical" italic="Index" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {schema.map((block, i) => (
            <Reveal3D key={i} delay={i * 0.05}>
              <Tilt deg={10}>
                <div
                  style={{
                    background: 'var(--surf)',
                    border: '1px solid var(--stroke)',
                    padding: '2rem',
                    borderRadius: '1.25rem',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--stroke)', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--a1)', fontFamily: 'monospace', fontSize: '1.1rem' }}>{block.icon}</span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '500' }}>{block.cat}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {block.items.map((sk, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                          <span style={{ color: 'var(--txt)' }}>{sk.n}</span>
                          <span style={{ color: 'var(--muted)' }}>{sk.l}%</span>
                        </div>
                        {/* Interactive Viewport Skill Bar Progress Loop */}
                        <div style={{ width: '100%', height: '3px', background: 'var(--surf2)', borderRadius: '99px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${sk.l}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                            style={{ height: '100%', background: 'var(--G)', borderRadius: '99px', boxShadow: '0 0 8px rgba(126,184,247,0.4)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </Tilt>
            </Reveal3D>
          ))}
        </div>
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

      {/* Infinite Seamless Typography Marquee Loop */}
      <div style={{ borderTop: '1px solid var(--stroke)', borderBottom: '1px solid var(--stroke)', padding: '1.2rem 0', background: 'rgba(15,15,18,0.3)', width: '100%', overflow: 'hidden', position: 'relative', marginBottom: '5rem' }}>
        <div style={{ display: 'flex', width: '200%', animation: 'mq 40s linear infinite' }}>
          {[1, 2].map((loopIdx) => (
            <div key={loopIdx} style={{ display: 'flex', justifyContent: 'space-around', width: '100%', whiteSpace: 'nowrap', gap: '2rem' }}>
              {Array(6).fill("LET'S BUILD SOMETHING GREAT •").map((txt, i) => (
                <span key={i} className="fd sh-text" style={{ fontSize: 'clamp(1.2rem, 2.8vw, 1.9rem)', fontWeight: '400', letterSpacing: '0.05em' }}>{txt}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        <Tilt deg={4}>
          <h2 className="fd" style={{ fontSize: 'clamp(2.4rem, 7vw, 5.5rem)', fontWeight: '400', lineHeight: '1.1', marginBottom: '3.5rem' }}>
            Let's build something <span className="g-text">great.</span>
          </h2>
        </Tilt>

        {/* Contact Links Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem', width: '100%', maxWidth: '960px', marginBottom: '4rem' }}>
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

        <Btn primary href="mailto:aakashijaz2002@gmail.com">Send me a message ↗</Btn>

        {/* Footer Real-Time Ledger Base Bar */}
        <div style={{ width: '100%', borderTop: '1px solid var(--stroke)', marginTop: '6rem', paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
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
            © 2026 Aakash Ijaz · Built with React & Framer Motion
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
          <Navbar theme={theme} toggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />
          <Hero />
          <About />
          <Projects />
          <Skills />
          <Contact />
        </motion.div>
      )}
    </>
  );
}