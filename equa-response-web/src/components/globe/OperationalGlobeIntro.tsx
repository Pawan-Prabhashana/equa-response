"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OperationalGlobeIntroProps {
  targetLat: number;
  targetLon: number;
  onComplete: () => void;
  scenarioName: string;
}

export default function OperationalGlobeIntro({ 
  targetLat, 
  targetLon, 
  onComplete, 
  scenarioName 
}: OperationalGlobeIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [skipped, setSkipped] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const animationRef = useRef<number | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    globe: THREE.Mesh;
    atmosphere: THREE.Mesh;
    stars: THREE.Points;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || skipped) return;

    try {
      // ========== SCENE SETUP ==========
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000510); // Deep space blue-black

      // Camera
      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 8);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // ========== STARFIELD ==========
      const starsGeometry = new THREE.BufferGeometry();
      const starCount = 5000;
      const positions = new Float32Array(starCount * 3);
      
      for (let i = 0; i < starCount; i++) {
        const radius = 50 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      }
      
      starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        transparent: true,
        opacity: 0.8
      });
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);

      // ========== EARTH SPHERE (PROCEDURAL TEXTURE) ==========
      const earthRadius = 2;
      const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

      // Create procedural Earth texture
      const canvas = document.createElement('canvas');
      canvas.width = 2048;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Failed to get canvas context');
        setTimeout(onComplete, 100);
        return;
      }

      // Base ocean color (deep blue)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a2f4a'); // Dark blue at poles
      gradient.addColorStop(0.5, '#0f4c81'); // Ocean blue at equator
      gradient.addColorStop(1, '#1a2f4a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add noise/texture for water
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = `rgba(15, 76, 129, ${Math.random() * 0.3})`;
        ctx.fillRect(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 5,
          Math.random() * 5
        );
      }

      // Add simplified land masses (mock continents)
      ctx.fillStyle = '#2d5a3f'; // Forest green for land
      
      // Asia (simplified blob)
      ctx.beginPath();
      ctx.ellipse(1400, 400, 300, 200, 0, 0, Math.PI * 2);
      ctx.fill();

      // Africa (simplified)
      ctx.beginPath();
      ctx.ellipse(1100, 500, 150, 250, 0, 0, Math.PI * 2);
      ctx.fill();

      // Americas (simplified)
      ctx.beginPath();
      ctx.ellipse(400, 400, 120, 300, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Europe (small)
      ctx.beginPath();
      ctx.ellipse(1050, 350, 80, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Australia (small)
      ctx.beginPath();
      ctx.ellipse(1650, 650, 80, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight Sri Lanka region (target location)
      const sriLankaX = ((targetLon + 180) / 360) * canvas.width;
      const sriLankaY = ((90 - targetLat) / 180) * canvas.height;
      
      ctx.fillStyle = '#ff6b35'; // Orange highlight
      ctx.beginPath();
      ctx.arc(sriLankaX, sriLankaY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Add glow around target
      const targetGlow = ctx.createRadialGradient(sriLankaX, sriLankaY, 0, sriLankaX, sriLankaY, 30);
      targetGlow.addColorStop(0, 'rgba(255, 107, 53, 0.6)');
      targetGlow.addColorStop(1, 'rgba(255, 107, 53, 0)');
      ctx.fillStyle = targetGlow;
      ctx.fillRect(sriLankaX - 30, sriLankaY - 30, 60, 60);

      // Add polar ice caps
      ctx.fillStyle = '#e8f4f8';
      ctx.fillRect(0, 0, canvas.width, 80);
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;

      const earthMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.1,
        emissive: new THREE.Color(0x0a1a2f),
        emissiveIntensity: 0.15
      });

      const globe = new THREE.Mesh(earthGeometry, earthMaterial);
      scene.add(globe);

      // ========== ATMOSPHERE GLOW ==========
      const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.08, 64, 64);
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

      // ========== LIGHTING ==========
      const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
      sunLight.position.set(5, 3, 5);
      scene.add(sunLight);

      const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
      scene.add(ambientLight);

      // Store scene reference
      sceneRef.current = { scene, camera, renderer, globe, atmosphere, stars };

      // ========== ANIMATION ==========
      const startTime = Date.now();
      const duration = 3800; // 3.8 seconds
      
      // Convert target lat/lon to rotation
      const targetRotationY = -(targetLon * Math.PI) / 180;
      const targetRotationX = (targetLat * Math.PI) / 180 * 0.3;

      function animate() {
        if (skipped) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic ease-in-out
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Phase 1 (0-0.8s): Establish - slow rotation
        // Phase 2 (0.8s-3.8s): Fly to target
        const establishPhase = Math.min(elapsed / 800, 1);

        // Camera zoom: 8 → 2.7
        camera.position.z = 8 - (eased * 5.3);
        
        // Globe rotation to target
        globe.rotation.y = targetRotationY * eased + establishPhase * 0.2;
        globe.rotation.x = targetRotationX * eased;
        atmosphere.rotation.y = globe.rotation.y;
        atmosphere.rotation.x = globe.rotation.x;

        // Slow star rotation for depth
        stars.rotation.y += 0.0002;

        renderer.render(scene, camera);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete - start fade transition
          setTimeout(() => {
            setShowMap(true);
            setTimeout(() => {
              if (!skipped) onComplete();
            }, 600); // Wait for crossfade
          }, 200);
        }
      }

      animate();

      // Handle window resize
      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        earthGeometry.dispose();
        earthMaterial.dispose();
        atmosphereGeometry.dispose();
        atmosphereMaterial.dispose();
        starsGeometry.dispose();
        starsMaterial.dispose();
      };

    } catch (error) {
      console.error('Globe initialization failed:', error);
      setTimeout(onComplete, 100);
    }
  }, [targetLat, targetLon, onComplete, skipped]);

  const handleSkip = () => {
    setSkipped(true);
    onComplete();
  };

  if (skipped && !showMap) return null;

  return (
    <AnimatePresence>
      {!showMap && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 bg-slate-950"
        >
          {/* 3D Globe Container */}
          <div ref={containerRef} className="absolute inset-0" />

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-slate-900/80 transition-all text-slate-300 hover:text-white z-10"
          >
            <X size={16} />
            <span className="text-sm font-bold">SKIP</span>
          </button>

          {/* Bottom Info */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-10">
            <div className="px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 rounded-lg">
              <div className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-1">
                {scenarioName}
              </div>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2 justify-center">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Acquiring satellite lock...
              </div>
            </div>
          </div>

          {/* Scanning lines effect */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent animate-scan" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
