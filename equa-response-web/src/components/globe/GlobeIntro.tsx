"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, AlertTriangle } from 'lucide-react';

interface GlobeIntroProps {
  targetLat: number;
  targetLon: number;
  onComplete: () => void;
  scenarioName: string;
}

export default function GlobeIntro({ targetLat, targetLon, onComplete, scenarioName }: GlobeIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [skipped, setSkipped] = useState(false);
  const [fallback, setFallback] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    globe: THREE.Mesh;
  } | undefined>(undefined);

  useEffect(() => {
    if (!containerRef.current || skipped || fallback) return;

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.warn('WebGL not supported, using fallback');
        // Client-only capability check; setting fallback here is intentional.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFallback(true);
        setTimeout(onComplete, 100);
        return;
      }
    } catch (e) {
      console.error('WebGL detection failed:', e);
      setFallback(true);
      setTimeout(onComplete, 100);
      return;
    }

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x020617); // slate-950

      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 6.5; // Start position

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // Earth sphere
      const geometry = new THREE.SphereGeometry(2, 64, 64);
      
      // Earth texture (procedural)
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = 2048;
      textureCanvas.height = 1024;
      const ctx = textureCanvas.getContext('2d');
      if (!ctx) {
        setFallback(true);
        setTimeout(onComplete, 100);
        return;
      }
    
    // Ocean blue gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, '#1e3a8a'); // blue-900
    gradient.addColorStop(0.5, '#1e40af'); // blue-800
    gradient.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 1024);
    
    // Land masses (simplified - just Sri Lanka highlighted)
    ctx.fillStyle = '#065f46'; // emerald-900
    // Sri Lanka approximate shape (simplified)
    const sriLankaX = (80 + 180) / 360 * 2048; // lon 80°E
    const sriLankaY = (90 - 7) / 180 * 1024; // lat 7°N
    ctx.fillRect(sriLankaX - 10, sriLankaY - 15, 8, 25);
    
    // Target marker (bright spot)
    ctx.fillStyle = '#06b6d4'; // cyan-500
    ctx.beginPath();
    ctx.arc(sriLankaX, sriLankaY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    const material = new THREE.MeshPhongMaterial({ 
      map: texture,
      emissive: new THREE.Color(0x0a4a5a),
      emissiveIntensity: 0.2
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(5.2, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    sceneRef.current = { scene, camera, renderer, globe };

      // Animation
      const startTime = Date.now();
      const duration = 2600; // 2.6 seconds
      
      // Convert target lat/lon to rotation
      const targetRotationY = -(targetLon * Math.PI) / 180;
      const targetRotationX = (targetLat * Math.PI) / 180;

      function animate() {
        if (skipped || fallback) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic easing function (ease-in-out-cubic)
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Camera zoom in: 6.5 → 2.4
        camera.position.z = 6.5 - (eased * 4.1);
        
        // Rotate globe to target
        globe.rotation.y = eased * targetRotationY;
        globe.rotation.x = eased * targetRotationX * 0.3; // Smaller X rotation
        atmosphere.rotation.y = globe.rotation.y;
        atmosphere.rotation.x = globe.rotation.x;
        
        // Slow auto-spin
        globe.rotation.y += 0.001;

        renderer.render(scene, camera);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete
          setTimeout(() => {
            if (!skipped && !fallback) onComplete();
          }, 300);
        }
      }

      animate();

      // Cleanup
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
        atmosphereGeometry.dispose();
        atmosphereMaterial.dispose();
      };
    } catch (error) {
      console.error('Globe initialization failed:', error);
      setFallback(true);
      setTimeout(onComplete, 100);
    }
  }, [targetLat, targetLon, onComplete, skipped, fallback]);

  const handleSkip = () => {
    setSkipped(true);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    onComplete();
  };

  if (skipped || fallback) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      {/* 3D Globe Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Fallback Message */}
      {fallback && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-yellow-500" />
            <p className="text-slate-400">Initializing map view...</p>
          </div>
        </div>
      )}

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top: Skip button */}
        <div className="absolute top-8 right-8 pointer-events-auto">
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900/80 backdrop-blur-sm border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            <X size={16} />
            <span className="text-sm font-medium">Skip Intro</span>
          </button>
        </div>

        {/* Bottom: Scenario info */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <div className="inline-block px-8 py-4 rounded-lg bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30">
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">
              INITIALIZING OPERATIONAL VIEW
            </div>
            <div className="text-lg text-white font-bold">
              {scenarioName}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div className="text-xs text-slate-400 font-mono">
                Acquiring satellite lock...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
