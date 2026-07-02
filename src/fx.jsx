import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useVelocity,
  useAnimationFrame,
  useInView
} from 'framer-motion';
import Lenis from 'lenis';

// ==========================================
// AWARD-SITE MOTION LAYER (trionn-style)
// Lenis inertia scroll + kinetic typography +
// scroll-scrub reveals + velocity marquee.
// ==========================================

/**
 * Lenis smooth (inertia) scrolling — the single biggest "award site" feel
 * upgrade. Native scroll position still updates, so framer-motion's
 * useScroll/useInView keep working untouched.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });
    window.__lenis = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
  return null;
}

/** Smooth-scroll to a section id, Lenis-aware (falls back to native). */
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -80, duration: 1.4 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

export function scrollToTop() {
  if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.2 });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Kinetic split-text reveal — words/chars rise out of an overflow mask with a
 * stagger, the signature big-type entrance of award sites.
 */
export function SplitReveal({
  text,
  per = 'word',            // 'word' | 'char'
  delay = 0,
  stagger,
  duration = 0.9,
  className = '',
  style = {},
  once = true
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '0px 0px -12% 0px' });
  const words = String(text).split(' ');
  const step = stagger ?? (per === 'char' ? 0.032 : 0.07);
  let i = 0;

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', ...style }} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {(per === 'char' ? w.split('') : [w]).map((unit, ui) => {
            const idx = i++;
            return (
              <span
                key={ui}
                style={{
                  display: 'inline-block',
                  overflow: 'hidden',
                  verticalAlign: 'bottom',
                  // keep descenders (g, j, y) from clipping at rest
                  paddingBottom: '0.12em',
                  marginBottom: '-0.12em'
                }}
              >
                <motion.span
                  style={{ display: 'inline-block', willChange: 'transform' }}
                  initial={{ y: '115%', rotate: per === 'char' ? 9 : 4, opacity: 0 }}
                  animate={inView ? { y: '0%', rotate: 0, opacity: 1 } : {}}
                  transition={{ duration, delay: delay + idx * step, ease: [0.22, 1, 0.36, 1] }}
                >
                  {unit}
                </motion.span>
              </span>
            );
          })}
          {wi < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

/** One word of a scroll-scrubbed paragraph. */
function ScrubWord({ children, progress, range, accent }) {
  const opacity = useTransform(progress, range, [0.1, 1]);
  const y = useTransform(progress, range, [16, 0]);
  const blurPx = useTransform(progress, range, [5, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  return (
    <motion.span
      className={accent ? 'fd g-text' : undefined}
      style={{ opacity, y, filter, display: 'inline-block', whiteSpace: 'pre', willChange: 'opacity, transform' }}
    >
      {children}{' '}
    </motion.span>
  );
}

/**
 * Trionn-signature manifesto text: each word fades/lifts in, scrubbed
 * directly by scroll position (scroll back up and it reverses).
 * Wrap accent words in *asterisks* to render them serif-italic gradient.
 * Pass `targetRef` (e.g. a tall pinned outer section) to drive the scrub
 * from that element instead of the paragraph itself.
 */
export function ScrubText({ text, targetRef, progress, style, className }) {
  const ownRef = useRef(null);
  const { scrollYProgress: ownProgress } = useScroll({
    target: targetRef ?? ownRef,
    offset: targetRef ? ['start start', 'end end'] : ['start 0.85', 'end 0.4']
  });
  const drive = progress ?? ownProgress;
  const pinned = Boolean(progress || targetRef);
  const words = String(text).split(' ');
  const span = pinned ? [0.06, 0.82] : [0, 1];
  const scale = (span[1] - span[0]) / words.length;

  return (
    <p ref={ownRef} className={className} style={style}>
      {words.map((w, i) => {
        const accent = w.startsWith('*') && w.replace(/[*.,—;:!?]/g, '').length > 0 && w.includes('*', 1);
        const clean = accent ? w.replace(/\*/g, '') : w;
        const start = span[0] + i * scale;
        return (
          <ScrubWord key={i} progress={drive} range={[start, start + scale * 2.2]} accent={accent}>
            {clean}
          </ScrubWord>
        );
      })}
    </p>
  );
}

/**
 * Robust pin progress for tall sticky sections: 0 when the section top hits
 * the viewport top, 1 when its bottom meets the viewport bottom. Measured
 * straight from getBoundingClientRect each scroll frame — immune to the
 * layout-caching quirks useScroll can hit around sticky content.
 */
export function usePinProgress(ref) {
  const progress = useMotionValue(0);
  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      progress.set(Math.min(1, Math.max(0, -rect.top / total)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps
  return progress;
}

const wrapNum = (min, max, v) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/**
 * Marquee whose speed and direction react to scroll velocity — scroll fast
 * and the band whips along with you, scroll up and it reverses.
 */
export function VelocityMarquee({ items, speed = 5.5, itemClassName = 'fd sh-text', itemStyle, style }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(smoothVelocity, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const dir = useRef(-1);

  useAnimationFrame((t, delta) => {
    const vf = velocityFactor.get();
    if (vf < 0) dir.current = 1;
    else if (vf > 0) dir.current = -1;
    let moveBy = dir.current * speed * (delta / 1000);
    moveBy += moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  const x = useTransform(baseX, (v) => `${wrapNum(-25, 0, v)}%`);

  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}>
      <motion.div style={{ display: 'flex', width: 'max-content', x }}>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{ display: 'flex', gap: '3rem', alignItems: 'center', paddingRight: '3rem' }}>
            {items.map((it, i) => (
              <span key={i} className={itemClassName} style={{ flexShrink: 0, ...itemStyle }}>{it}</span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Subtle scroll parallax — child drifts from `from`px to `to`px as it
 * crosses the viewport.
 */
export function ParallaxY({ children, from = 50, to = -50, style }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);
  return (
    <motion.div ref={ref} style={{ y, willChange: 'transform', ...style }}>
      {children}
    </motion.div>
  );
}

/**
 * Huge outlined "ghost" title drifting horizontally behind a section as you
 * scroll — classic award-site depth layer. Parent section must be
 * position:relative (+ overflow:hidden to clip the edges).
 */
export function GhostTitle({ text, top = '2.5rem', dir = 1, opacity = 0.5 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], [`${dir * 10}%`, `${dir * -10}%`]);
  return (
    <div ref={ref} aria-hidden="true" style={{ position: 'absolute', top, left: 0, right: 0, pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        style={{
          x,
          whiteSpace: 'nowrap',
          textAlign: 'center',
          fontWeight: 800,
          fontSize: 'clamp(5rem, 16vw, 14rem)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          color: 'transparent',
          WebkitTextStroke: '1px var(--stroke)',
          opacity,
          willChange: 'transform',
          userSelect: 'none'
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

/**
 * Scroll-scrub zoom-in: block scales/fades up as it enters the viewport
 * (and reverses when scrolling back). For carousels, grids, forms.
 */
export function ScrubZoom({ children, from = 0.92, style }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.98', 'start 0.45'] });
  const scale = useTransform(scrollYProgress, [0, 1], [from, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);
  return (
    <motion.div ref={ref} style={{ scale, opacity, willChange: 'transform', ...style }}>
      {children}
    </motion.div>
  );
}

/** Springy count-up for stat numbers ("3+", "120", "AI" passes through). */
export function CountUp({ value, className, style }) {
  const m = String(value).match(/^(\d+)(.*)$/);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 55, damping: 16 });
  const [disp, setDisp] = useState(0);

  useEffect(() => spring.on('change', (v) => setDisp(Math.round(v))), [spring]);
  useEffect(() => {
    if (inView && m) mv.set(parseInt(m[1], 10));
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!m) return <span ref={ref} className={className} style={style}>{value}</span>;
  return <span ref={ref} className={className} style={style}>{disp}{m[2]}</span>;
}

/** One character of a shatter/assemble block — flies to/from its seeded 3D offset on scrub. */
function ShatterChar({ children, progress, seed, mode }) {
  const assemble = mode === 'assemble';
  const x = useTransform(progress, assemble ? [0.08, 0.7] : [0.3, 0.95], assemble ? [seed[0], 0] : [0, seed[0]]);
  const y = useTransform(progress, assemble ? [0.08, 0.7] : [0.3, 0.95], assemble ? [seed[1], 0] : [0, seed[1]]);
  const rotate = useTransform(progress, assemble ? [0.08, 0.7] : [0.3, 0.95], assemble ? [seed[2], 0] : [0, seed[2]]);
  const opacity = useTransform(progress, assemble ? [0.08, 0.58] : [0.3, 0.85], assemble ? [0.08, 1] : [1, 0.08]);
  const blurPx = useTransform(progress, assemble ? [0.08, 0.62] : [0.3, 0.9], assemble ? [7, 0] : [0, 6]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  return (
    <motion.span style={{ x, y, rotate, opacity, filter, display: 'inline-block', whiteSpace: 'pre', willChange: 'transform' }}>
      {children}
    </motion.span>
  );
}

/**
 * Trionn "services dispersal" and its inverse:
 * mode="shatter"  — characters explode outward as scroll scrubs through.
 * mode="assemble" — puzzle effect: characters fly IN from scattered 3D
 * positions and lock into the word. Both reverse on scroll-up.
 */
export function ShatterText({ lines, progress, style, className, mode = 'shatter' }) {
  return (
    <div className={className} style={{ textAlign: 'center', ...style }}>
      {lines.map((line, li) => (
        <div key={li} style={{ lineHeight: 1.04 }}>
          {line.split('').map((c, ci) => {
            const i = li * 31 + ci * 7;
            const seed = [Math.sin(i) * 380, Math.cos(i * 1.7) * 290, Math.sin(i * 2.3) * 75];
            return (
              <ShatterChar key={ci} progress={progress} seed={seed} mode={mode}>{c}</ShatterChar>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * Scrub-in reveal for cards/blocks: fades, lifts and sharpens tied directly
 * to scroll position (reverses on scroll-up) — the manifesto feel for
 * layout elements instead of words.
 */
export function ScrubIn({ children, from = 56, style }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.98', 'start 0.55'] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [from, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const blurPx = useTransform(scrollYProgress, [0, 1], [8, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;
  return (
    <motion.div ref={ref} style={{ opacity, y, scale, filter, willChange: 'transform, opacity', ...style }}>
      {children}
    </motion.div>
  );
}

/**
 * Interactive sound lines (Web Audio): hovering a line plays a pentatonic
 * tone and the line swells. Context is created lazily; browsers unlock
 * audio after the user's first click anywhere.
 */
export function SoundLines({ style }) {
  const ctxRef = useRef(null);
  const freqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

  const play = (f) => {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch { /* audio unavailable — lines stay visual-only */ }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', ...style }}>
      {freqs.map((f, i) => (
        <motion.div
          key={i}
          onMouseEnter={() => play(f)}
          whileHover={{ scaleY: 3, backgroundColor: 'var(--a1)', boxShadow: '0 0 14px rgba(126,184,247,0.55)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          style={{ height: '2px', borderRadius: '2px', background: 'var(--stroke)', cursor: 'pointer' }}
        />
      ))}
    </div>
  );
}

/** Magnetic hover wrapper — the element leans toward the cursor. */
export function Magnetic({ children, strength = 0.35, style }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 16, mass: 0.5 });
  const y = useSpring(my, { stiffness: 260, damping: 16, mass: 0.5 });

  const onMove = (e) => {
    if (!ref.current) return;
    const b = ref.current.getBoundingClientRect();
    mx.set((e.clientX - (b.left + b.width / 2)) * strength);
    my.set((e.clientY - (b.top + b.height / 2)) * strength);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y, display: 'inline-block', ...style }}
    >
      {children}
    </motion.div>
  );
}
