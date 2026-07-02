import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';

// ============================================================
// Interactive 3D Glass Carousel
// ------------------------------------------------------------
//  • MeshPhysicalMaterial glass with real transmission + iridescence
//  • Custom vertex WARP shader injected via onBeforeCompile, driven
//    by drag velocity (flex on fast movement, inertial snap-back)
//  • Infinite kinetic coverflow: click-drag to throw, damped easing
//  • Hover -> iridescent sheen rises + project title is revealed
//  Adapted to this repo's stack: Vite + React 19 (JSX, not Next/TS).
// ============================================================

const SPACING = 2.45;
const lerp = THREE.MathUtils.lerp;

/** "#rrggbb" + alpha → rgba() string for the label canvas. */
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Rounded-rect path helper (canvas roundRect isn't everywhere). */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Word-wrap helper for the 2D label canvas. */
function wrapText(ctx, text, x, y, maxW, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let yy = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxW && n > 0) {
      ctx.fillText(line.trim(), x, yy);
      line = words[n] + ' ';
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, yy);
  return yy;
}

/** Builds a crisp, offline (system-font) CanvasTexture for a card face. */
function makeLabelTexture({ number, title, sub, type, accent }) {
  const W = 560;
  const H = 760;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Deep panel wash so text always reads against the glass
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, 'rgba(6,8,16,0.88)');
  wash.addColorStop(0.55, 'rgba(10,12,24,0.72)');
  wash.addColorStop(1, 'rgba(6,8,16,0.9)');
  ctx.fillStyle = wash;
  roundRect(ctx, 14, 14, W - 28, H - 28, 26);
  ctx.fill();

  // Accent aura in the top corner
  const aura = ctx.createRadialGradient(W - 80, 90, 10, W - 80, 90, 320);
  aura.addColorStop(0, hexA(accent, 0.4));
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(0, 0, W, H);

  // Card frame stroke
  ctx.strokeStyle = hexA(accent, 0.55);
  ctx.lineWidth = 2.5;
  roundRect(ctx, 14, 14, W - 28, H - 28, 26);
  ctx.stroke();

  // Index number (top)
  ctx.fillStyle = accent;
  ctx.font = '700 44px Inter, system-ui, sans-serif';
  ctx.fillText(number, 48, 96);
  ctx.fillRect(48, 114, 66, 4);

  // Type tag pill (top-right)
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  const typeTxt = type.toUpperCase();
  const tw = ctx.measureText(typeTxt).width;
  ctx.fillStyle = hexA(accent, 0.16);
  roundRect(ctx, W - 66 - tw, 58, tw + 36, 42, 21);
  ctx.fill();
  ctx.strokeStyle = hexA(accent, 0.5);
  ctx.lineWidth = 1.5;
  roundRect(ctx, W - 66 - tw, 58, tw + 36, 42, 21);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(typeTxt, W - 48 - tw, 87);

  // Title (serif italic, wrapped)
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18;
  ctx.font = 'italic 600 68px Georgia, "Times New Roman", serif';
  const endY = wrapText(ctx, title, 48, 520, W - 96, 72);
  ctx.shadowBlur = 0;

  // Divider
  const div = ctx.createLinearGradient(48, 0, W - 48, 0);
  div.addColorStop(0, hexA(accent, 0.8));
  div.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = div;
  ctx.fillRect(48, endY + 26, W - 160, 2);

  // Subtitle
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '400 27px Inter, system-ui, sans-serif';
  wrapText(ctx, sub, 48, endY + 68, W - 96, 36);

  // CTA
  ctx.fillStyle = accent;
  ctx.font = '700 24px Inter, system-ui, sans-serif';
  ctx.fillText('VIEW CASE  →', 48, H - 58);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function GlassCard({ index, count, data, drag }) {
  const group = useRef();
  const glassRef = useRef();
  const labelRef = useRef();
  const hoverVal = useRef(0);

  // Per-card shader uniforms (mutated every frame).
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uVelocity: { value: 0 }, uHover: { value: 0 } }),
    []
  );

  const label = useMemo(
    () =>
      makeLabelTexture({
        number: `0${index + 1}`.slice(-2),
        title: data.title,
        sub: data.sub,
        type: data.type,
        accent: data.accent,
      }),
    [data, index]
  );

  // Inject the velocity-driven Z-warp into whatever material we attach this to.
  const onBeforeCompile = useMemo(
    () => (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uVelocity = uniforms.uVelocity;
      shader.uniforms.uHover = uniforms.uHover;
      shader.vertexShader =
        'uniform float uTime;\nuniform float uVelocity;\nuniform float uHover;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           // Drag-velocity flex: the faster you throw, the more the card bends.
           float wave = sin(position.x * 2.1 + uTime * 2.0) * cos(position.y * 1.7 + uTime * 1.3);
           transformed.z += wave * uVelocity * 0.75;
           // Subtle hover ripple.
           transformed.z += sin(position.y * 4.0 - uTime * 2.4) * uHover * 0.05;`
        );
    },
    [uniforms]
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;

    // Infinite wrap around the ring.
    const total = count * SPACING;
    let x = index * SPACING + drag.current.offset;
    x = ((x % total) + total) % total;
    if (x > total / 2) x -= total;

    // Coverflow placement.
    g.position.x = x;
    g.position.y = Math.sin(t * 0.6 + index) * 0.06; // gentle float
    g.position.z = lerp(g.position.z, -Math.abs(x) * 0.5, 0.12);
    g.rotation.y = lerp(g.rotation.y, -x * 0.14, 0.12);

    // Hover easing.
    const hovered = drag.current.hovered === index ? 1 : 0;
    hoverVal.current = lerp(hoverVal.current, hovered, 0.12);
    uniforms.uHover.value = hoverVal.current;

    // Scale: shrink toward edges, bump on hover.
    const baseScale = 1 - Math.min(Math.abs(x) * 0.05, 0.34);
    const target = baseScale + hoverVal.current * 0.07;
    const s = lerp(g.scale.x, target, 0.15);
    g.scale.setScalar(s);

    // Velocity -> warp amount (inertial snap-back as velocity decays).
    const vTarget = Math.min(Math.abs(drag.current.velocity) * 7, 1.4);
    uniforms.uVelocity.value = lerp(uniforms.uVelocity.value, vTarget, 0.25);

    // Iridescent sheen + clearcoat rise on hover.
    if (glassRef.current) {
      glassRef.current.iridescence = lerp(glassRef.current.iridescence, 0.18 + hoverVal.current * 0.82, 0.1);
      glassRef.current.clearcoat = lerp(glassRef.current.clearcoat, 0.35 + hoverVal.current * 0.65, 0.1);
    }
    // Labels always readable; hover pushes them to full strength.
    if (labelRef.current) {
      labelRef.current.opacity = lerp(labelRef.current.opacity, 0.62 + hoverVal.current * 0.38, 0.12);
    }
  });

  return (
    <group
      ref={group}
      onPointerOver={() => (drag.current.hovered = index)}
      onPointerOut={() => {
        if (drag.current.hovered === index) drag.current.hovered = -1;
      }}
    >
      {/* Refractive glass body */}
      <mesh>
        <planeGeometry args={[2.0, 2.7, 48, 48]} />
        <meshPhysicalMaterial
          ref={glassRef}
          transmission={1}
          thickness={1.3}
          roughness={0.16}
          ior={1.45}
          metalness={0}
          clearcoat={0.4}
          clearcoatRoughness={0.25}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[120, 540]}
          color={data.accent}
          attenuationColor={data.accent}
          attenuationDistance={2.4}
          envMapIntensity={1.5}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>

      {/* Project label that bends with the glass and fades in on hover */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[2.0, 2.7, 48, 48]} />
        <meshBasicMaterial
          ref={labelRef}
          map={label}
          transparent
          opacity={0.1}
          depthWrite={false}
          toneMapped={false}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>
    </group>
  );
}

function Carousel({ items, onGrab }) {
  // Shared kinetic state (mutated imperatively for 60fps).
  const drag = useRef({ offset: 0, velocity: 0, dragging: false, lastX: 0, hovered: -1 });

  useEffect(() => {
    const end = () => {
      drag.current.dragging = false;
      onGrab && onGrab(false);
    };
    window.addEventListener('pointerup', end);

    // Page scroll spins the ring — new cards rotate in as you scroll past.
    let lastY = window.scrollY;
    const onScroll = () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (!drag.current.dragging) {
        const v = drag.current.velocity + dy * 0.00006;
        drag.current.velocity = Math.max(-0.09, Math.min(0.09, v));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('pointerup', end);
      window.removeEventListener('scroll', onScroll);
    };
  }, [onGrab]);

  useFrame(() => {
    const d = drag.current;
    if (!d.dragging) {
      d.offset += d.velocity;
      d.velocity *= 0.93; // inertial damping
      if (Math.abs(d.velocity) < 0.00025) {
        d.velocity = 0;
        d.offset += 0.0011; // slow cinematic idle drift
      }
    }
  });

  const onDown = (e) => {
    drag.current.dragging = true;
    drag.current.lastX = e.clientX;
    drag.current.velocity = 0;
    onGrab && onGrab(true);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d.dragging) return;
    const k = 0.0055;
    const delta = (e.clientX - d.lastX) * k;
    d.offset += delta;
    d.velocity = delta;
    d.lastX = e.clientX;
  };

  return (
    <>
      {/* Invisible full-view catcher so you can drag from anywhere */}
      <mesh position={[0, 0, -3]} onPointerDown={onDown} onPointerMove={onMove}>
        <planeGeometry args={[80, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {items.map((it, i) => (
        <GlassCard key={i} index={i} count={items.length} data={it} drag={drag} />
      ))}
    </>
  );
}

function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 6]} intensity={0.7} />
      {/* Procedural env (no external HDRI -> works offline) for refraction */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 2.5, 4]} scale={[8, 3, 1]} color="#cfe2ff" />
        <Lightformer form="rect" intensity={2} position={[-4, -1, 3]} scale={[4, 5, 1]} color="#7EB8F7" />
        <Lightformer form="circle" intensity={2.6} position={[4, 1.5, 2]} scale={[3, 3, 1]} color="#c084fc" />
        <Lightformer form="circle" intensity={1.8} position={[0, -3, 2]} scale={[5, 2, 1]} color="#22d3ee" />
      </Environment>
    </>
  );
}

export default function Projects3D({ items }) {
  const [grabbing, setGrabbing] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(360px, 56vh, 620px)',
        marginBottom: '3rem',
        cursor: grabbing ? 'grabbing' : 'grab',
        touchAction: 'pan-y',
      }}
    >
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 7.6], fov: 38 }}
        style={{ touchAction: 'pan-y' }}
      >
        <Suspense fallback={null}>
          <StudioLighting />
          <Carousel items={items} onGrab={setGrabbing} />
        </Suspense>
      </Canvas>

      {/* Drag hint */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.68rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          pointerEvents: 'none',
          opacity: 0.8,
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>⟵</span> Drag · Scroll to spin · Hover to focus <span style={{ fontSize: '0.9rem' }}>⟶</span>
      </div>
    </div>
  );
}
