"use client";

import React, { useEffect, useRef } from "react";

export default function DeepSpaceStars3D() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dynamic Three.js CDN Loader
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    document.head.appendChild(script);

    let animationFrameId: number;

    script.onload = () => {
      const THREE = (window as any).THREE;
      if (!THREE) return;

      // 1. SAHNE VE KAMERA SETUP
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x020208, 0.0003);

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        5000
      );
      camera.position.z = 1000;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const starGroup = new THREE.Group();
      scene.add(starGroup);

      // ------------------------------------------------------------------------
      // 3D KATMANLI YILDIZ ALANI (SADECE YILDIZLAR)
      // ------------------------------------------------------------------------

      // KATMAN 1: Arka Plan Derin Yıldızları (Küçük, Yoğun)
      const bgStarCount = 4500;
      const bgGeo = new THREE.BufferGeometry();
      const bgPositions = new Float32Array(bgStarCount * 3);
      const bgColors = new Float32Array(bgStarCount * 3);

      for (let i = 0; i < bgStarCount * 3; i += 3) {
        bgPositions[i] = (Math.random() - 0.5) * 5000;
        bgPositions[i + 1] = (Math.random() - 0.5) * 5000;
        bgPositions[i + 2] = -Math.random() * 3500;

        bgColors[i] = 0.7 + Math.random() * 0.3;
        bgColors[i + 1] = 0.8 + Math.random() * 0.2;
        bgColors[i + 2] = 1.0;
      }

      bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
      bgGeo.setAttribute("color", new THREE.BufferAttribute(bgColors, 3));

      const bgMat = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
      });

      const bgStars = new THREE.Points(bgGeo, bgMat);
      starGroup.add(bgStars);

      // KATMAN 2: Ön / Orta Plan Parlak Yıldızlar (Özel Renkli)
      const midStarCount = 1200;
      const midGeo = new THREE.BufferGeometry();
      const midPositions = new Float32Array(midStarCount * 3);
      const midColors = new Float32Array(midStarCount * 3);

      const colorPalette = [
        [0.6, 0.7, 1.0], // Mavi
        [0.8, 0.6, 1.0], // Mor
        [1.0, 0.9, 0.7], // Altın / Sıcak
        [0.4, 0.8, 1.0], // Turkuaz
      ];

      for (let i = 0; i < midStarCount * 3; i += 3) {
        midPositions[i] = (Math.random() - 0.5) * 3500;
        midPositions[i + 1] = (Math.random() - 0.5) * 3500;
        midPositions[i + 2] = (Math.random() - 0.5) * 2000;

        const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        midColors[i] = col[0];
        midColors[i + 1] = col[1];
        midColors[i + 2] = col[2];
      }

      midGeo.setAttribute("position", new THREE.BufferAttribute(midPositions, 3));
      midGeo.setAttribute("color", new THREE.BufferAttribute(midColors, 3));

      const midMat = new THREE.PointsMaterial({
        size: 3.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
      });

      const midStars = new THREE.Points(midGeo, midMat);
      starGroup.add(midStars);

      // ------------------------------------------------------------------------
      // FARE PARALAKSI VE ANİMASYON DÖNGÜSÜ
      // ------------------------------------------------------------------------
      let mouseX = 0;
      let mouseY = 0;

      const handleMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.00015;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.00015;
      };

      window.addEventListener("mousemove", handleMouseMove);

      const animate = () => {
        // Sonsuz Yavaş Uzay Dönüşü
        starGroup.rotation.y += 0.0002;
        starGroup.rotation.x += 0.0001;

        // Yumuşak Fare Paralaks Hareketi
        starGroup.rotation.y += (mouseX - starGroup.rotation.y) * 0.04;
        starGroup.rotation.x += (-mouseY - starGroup.rotation.x) * 0.04;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(animate);
      };

      animate();

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationFrameId);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    };

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#020208] overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* Giriş Kartının Arkasındaki Derinlik ve Işık Katmanları */}
      <div className="absolute right-12 top-1/2 -translate-y-1/2 w-[550px] h-[650px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(2,2,8,0.95)_100%)] pointer-events-none" />
    </div>
  );
}