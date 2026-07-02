import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Float } from '@react-three/drei';

// ==========================================
// SCROLL-REACTIVE 3D HERO SCENE
// An iridescent glass torus-knot that breathes, follows the cursor and
// rotates/sinks as you scroll, ringed by floating metallic shards.
// Lazy-loaded, desktop-only (mounted from App).
// ==========================================

function GlassKnot() {
  const ref = useRef();

  useFrame((state, dt) => {
    if (!ref.current) return;
    const scroll = window.scrollY / Math.max(1, window.innerHeight);
    const t = state.clock.elapsedTime;
    ref.current.rotation.x += dt * 0.14;
    ref.current.rotation.y = state.pointer.x * 0.5 + scroll * 2.4 + t * 0.07;
    ref.current.rotation.z = state.pointer.y * -0.25;
    // breathe at rest, dive away + swell slightly as the user scrolls out
    ref.current.position.y = 0.55 + Math.sin(t * 0.55) * 0.16 - scroll * 2.4;
    ref.current.position.z = -1.6;
    ref.current.scale.setScalar(0.55 + Math.min(scroll, 1) * 0.2);
  });

  return (
    <mesh ref={ref}>
      <torusKnotGeometry args={[1.35, 0.4, 220, 32]} />
      <meshPhysicalMaterial
        transmission={1}
        thickness={1.5}
        roughness={0.12}
        ior={1.42}
        iridescence={1}
        iridescenceIOR={1.3}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
        color="#bcd9ff"
        attenuationColor="#7EB8F7"
        attenuationDistance={2.2}
      />
    </mesh>
  );
}

const SHARDS = [
  { p: [-4.2, 1.6, -2.0], s: 0.30, speed: 1.4 },
  { p: [4.4, 2.1, -1.6], s: 0.24, speed: 1.1 },
  { p: [-3.4, -1.8, -1.2], s: 0.20, speed: 1.7 },
  { p: [3.8, -1.4, -2.4], s: 0.34, speed: 0.9 },
  { p: [-5.0, -0.2, -3.0], s: 0.26, speed: 1.2 },
  { p: [5.2, 0.4, -3.2], s: 0.22, speed: 1.5 },
  { p: [0.6, 2.8, -3.5], s: 0.18, speed: 1.3 },
  { p: [-1.2, -2.6, -2.8], s: 0.22, speed: 1.0 }
];

function Shards() {
  const group = useRef();
  useFrame((state) => {
    if (!group.current) return;
    const scroll = window.scrollY / Math.max(1, window.innerHeight);
    group.current.rotation.y = scroll * 0.9 + state.pointer.x * 0.12;
    group.current.position.y = -scroll * 1.4;
  });
  return (
    <group ref={group}>
      {SHARDS.map((sh, i) => (
        <Float key={i} speed={sh.speed} rotationIntensity={1.4} floatIntensity={1.6}>
          <mesh position={sh.p} scale={sh.s}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#7EB8F7" metalness={0.92} roughness={0.14} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 7.5], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.4} />
      <GlassKnot />
      <Shards />
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2.5} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color="#7EB8F7" intensity={6} rotation-y={Math.PI / 2} position={[-5, 2, 1]} scale={4} />
        </group>
      </Environment>
    </Canvas>
  );
}
