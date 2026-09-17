"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";
import StarBackground from "@/components/StarBackground";

interface TimelineStep {
  id: string;
  tag: string;
  title: string;
  description: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: "step-1",
    tag: "01 / INTERSTELLAR",
    title: "GAS + DUST",
    description: "Matter gathers across enormous regions of space, vast reserves of hydrogen and helium floating in silence.",
  },
  {
    id: "step-2",
    tag: "02 / ATTRACTION",
    title: "GRAVITY",
    description: "Gravity quietly begins bringing matter together over millions of light-years, pulling order from chaos.",
  },
  {
    id: "step-3",
    tag: "03 / COMPRESSION",
    title: "COLLAPSE",
    description: "As the cloud contracts under its own mass, core density surges and internal temperatures soar.",
  },
  {
    id: "step-4",
    tag: "04 / BIRTH",
    title: "PROTOSTAR",
    description: "A dense, glowing core takes shape within the cosmic dust, on the precipice of sustained fusion.",
  },
  {
    id: "step-5",
    tag: "05 / IGNITION",
    title: "STAR",
    description: "Under immense heat and pressure, nuclear fusion ignites. A new star casts light into the deep cosmos.",
  },
];

interface ProductHierarchy {
  level: string;
  title: string;
  desc: string;
}

const PRODUCT_HIERARCHY: ProductHierarchy[] = [
  { level: "01", title: "Organization", desc: "The cosmic container for all vision and teams." },
  { level: "02", title: "Projects", desc: "Vast clouds of potential awaiting structure." },
  { level: "03", title: "Tasks", desc: "Dense particles of actionable execution." },
  { level: "04", title: "People", desc: "Gravitational forces that propel ideas forward." },
  { level: "05", title: "Progress", desc: "Radiant momentum that transforms energy into light." },
];

function NebulaModel({ stage = 0 }: { stage?: number }) {
  const modelRef = useRef<HTMLDivElement>(null);
  const targetStageRef = useRef(stage);

  useEffect(() => {
    targetStageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (!modelRef.current) return;

    const container = modelRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const particleCount = 1800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const palette = [
      new THREE.Color("#e8b4a0"),
      new THREE.Color("#c9a7c9"),
      new THREE.Color("#f2dfb3"),
      new THREE.Color("#9e8fa8"),
    ];

    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.55) * 2.7;
      const turbulence = (Math.random() - 0.5) * 0.8;
      const x = Math.cos(angle) * radius + turbulence;
      const y = (Math.random() - 0.5) * 1.2 + Math.sin(angle * 2) * 0.45;
      const z = Math.sin(angle) * radius * 0.46 + turbulence;

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const cloud = new THREE.Points(geometry, material);
    scene.add(cloud);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.46, 24, 24),
      new THREE.MeshBasicMaterial({
        color: "#f2d6b0",
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(core);

    const clock = new THREE.Clock();
    let frameId = 0;
    let currentStage = stage;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      currentStage += (targetStageRef.current - currentStage) * 0.06;
      const progress = currentStage / 4;
      cloud.scale.setScalar(1 - progress * 0.42);
      cloud.rotation.y = elapsed * (0.08 + progress * 0.1);
      cloud.rotation.z = Math.sin(elapsed * 0.18) * 0.08;
      material.opacity = 0.55 + progress * 0.25;
      core.scale.setScalar(0.45 + progress * 1.1 + Math.sin(elapsed * 0.8) * 0.04);
      (core.material as THREE.MeshBasicMaterial).opacity = 0.14 + progress * 0.46;
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    resizeObserver.observe(container);
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      core.geometry.dispose();
      core.material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={modelRef} className="absolute inset-0" aria-hidden="true" />;
}

export default function NebulaStoryPage(): React.ReactElement {
  const observerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("nebula-visible");
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observerRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const addToRefs = (el: HTMLDivElement | null) => {
    if (el && !observerRefs.current.includes(el)) {
      observerRefs.current.push(el);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020208] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
      {/* Dynamic Star Field Background */}
      <StarBackground />

      {/* Embedded Styles for High-Performance Scroll Reveal & Glow Effects */}
      <style jsx global>{`
        .nebula-display {
          font-family: Georgia, "Times New Roman", serif;
          letter-spacing: -0.035em;
        }

        .nebula-copy {
          font-family: var(--font-geist-sans), sans-serif;
          letter-spacing: -0.01em;
        }

        .nebula-reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }

        .nebula-reveal.nebula-visible {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .nebula-reveal {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
        }

        .text-glow-indigo {
          text-shadow: 0 0 24px rgba(99, 102, 241, 0.45),
                       0 0 48px rgba(99, 102, 241, 0.2);
        }

        .text-glow-violet {
          text-shadow: 0 0 32px rgba(139, 92, 246, 0.5),
                       0 0 64px rgba(139, 92, 246, 0.25);
        }

        @keyframes nebulaPulse {
          0%, 100% {
            opacity: 0.35;
            transform: scale(1);
          }
          50% {
            opacity: 0.55;
            transform: scale(1.06);
          }
        }

        .animate-nebula-pulse {
          animation: nebulaPulse 12s ease-in-out infinite;
        }

        @keyframes lineDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        .animate-scroll-line {
          animation: lineDown 2.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
      `}</style>

      {/* Floating Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 bg-[#020208]/60 backdrop-blur-md border-b border-white/[0.05]">
        <Link
          href="/nebula"
          className="flex items-center gap-2 group text-sm font-semibold tracking-widest text-zinc-200 hover:text-white transition-colors"
        >
          NEBULA
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-wider font-medium text-zinc-400 hover:text-zinc-100 transition-colors px-4 py-2 rounded-full border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
        >
          Dashboard
        </Link>
      </header>

      <main className="relative z-10">
        {/* SECTION 01 — HERO */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[320px] sm:h-[600px] bg-gradient-to-tr from-indigo-900/20 via-purple-900/10 to-transparent rounded-full blur-[120px] pointer-events-none animate-nebula-pulse" />

          <div
            ref={addToRefs}
            className="nebula-reveal max-w-4xl mx-auto flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/[0.05] text-[11px] font-mono tracking-widest text-indigo-300 uppercase mb-8">
              THE ORIGIN OF NEBULA
            </div>

            <h1 className="nebula-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal leading-[1.04] mb-8 text-zinc-100">
              Before there was a star, <br className="hidden sm:inline" />
              there was a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-400 to-purple-400 font-normal text-glow-indigo">
                nebula
              </span>
              .
            </h1>

            <p className="max-w-2xl text-base sm:text-lg md:text-xl text-zinc-400 font-normal leading-relaxed mb-16">
              Nebula, yıldızlar arası uzayda bulunan devasa gaz ve toz bulutlarına verilen isimdir.
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
              SCROLL TO EXPLORE
            </span>
            <div className="w-[1px] h-12 bg-zinc-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-indigo-400 to-purple-500 animate-scroll-line" />
            </div>
          </div>
        </section>

        {/* SECTION 02 — WHAT IS A NEBULA? */}
        <section className="relative py-32 px-6 border-t border-white/[0.04] bg-zinc-950/20">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div ref={addToRefs} className="nebula-reveal md:col-span-7 space-y-6">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                ASTRONOMICAL REALITY
              </span>
              <h2 className="nebula-display text-3xl sm:text-5xl font-normal text-zinc-100">
                What is a Nebula?
              </h2>
              <p className="text-lg text-zinc-300 leading-relaxed font-light">
                Nebula (bulutsu), yıldızlar arasındaki uzayda bulunan gaz ve toz bulutudur. Çoğunlukla hidrojen ve helyumdan oluşur.
              </p>
              <p className="text-base text-zinc-400 leading-relaxed font-light">
                Bazı bulutsular yeni yıldızların oluştuğu bölgelerdir. Bazıları ise yıldızların yaşamlarının sonlarında uzaya bıraktıkları maddelerden oluşur.
              </p>
            </div>

            {/* Abstract Aesthetic Nebula Graphic */}
            <div ref={addToRefs} className="nebula-reveal md:col-span-5 flex justify-center">
              <div className="relative h-72 w-full max-w-sm sm:h-80">
                <NebulaModel />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                    Composition
                  </span>
                  <div className="nebula-display mt-2 text-3xl text-amber-100/90">H + He</div>
                  <span className="mt-2 text-[10px] font-mono text-zinc-400">
                    Hydrogen &amp; Helium Cloud
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 03 — FROM CHAOS TO A STAR */}
        <section className="relative border-t border-white/[0.04] bg-[#030308]">
          <div className="max-w-6xl mx-auto">
            <div ref={addToRefs} className="nebula-reveal min-h-[60vh] flex items-center px-6 py-24 lg:px-12">
              <div className="max-w-2xl">
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">THE COSMIC TIMELINE</span>
                <h2 className="nebula-display mt-5 text-4xl sm:text-6xl font-normal text-zinc-100">From Chaos to a Star</h2>
                <p className="mt-6 text-base leading-relaxed text-zinc-400">Beş model. Beş aşama. Her kaydırmada yıldızın oluşumundaki bir sonraki adımı gör.</p>
              </div>
            </div>

            {TIMELINE_STEPS.map((step, index) => (
              <div key={step.id} ref={addToRefs} className="nebula-reveal min-h-screen snap-start grid items-center gap-10 border-t border-white/[0.04] px-6 py-20 lg:grid-cols-2 lg:gap-20 lg:px-12">
                <div className="relative h-[min(68vh,560px)] w-full overflow-hidden rounded-[2rem] border border-zinc-800/70 bg-zinc-950/40">
                  <NebulaModel stage={index} />
                  <div className="absolute inset-x-7 bottom-7 flex items-end justify-between pointer-events-none">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">STELLAR FORMATION</span>
                      <p className="mt-2 text-xl text-zinc-100">{step.title}</p>
                    </div>
                    <span className="text-xs font-mono text-zinc-600">0{index + 1} / 05</span>
                  </div>
                </div>

                <div className="max-w-xl py-10 lg:py-0">
                  <span className="text-xs font-mono tracking-[0.2em] text-amber-200/70">{step.tag}</span>
                  <h3 className="nebula-display mt-5 text-4xl sm:text-6xl font-normal text-zinc-100">{step.title}</h3>
                  <p className="mt-6 text-base sm:text-lg text-zinc-400 font-light leading-relaxed">{step.description}</p>
                  <div className="mt-10 flex items-center gap-3">
                    {TIMELINE_STEPS.map((_, dotIndex) => (
                      <span key={dotIndex} className={`h-1.5 rounded-full ${dotIndex === index ? "w-10 bg-amber-200" : "w-1.5 bg-zinc-700"}`} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 04 — WHY "NEBULA"? */}
        <section className="relative py-36 px-6 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent border-t border-white/[0.04]">
          <div className="max-w-4xl mx-auto text-center space-y-20">
            <div ref={addToRefs} className="nebula-reveal space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                THE METAPHOR
              </span>
              <h2 className="nebula-display text-4xl sm:text-6xl font-normal text-zinc-100">
                Why Nebula?
              </h2>
            </div>

            <div ref={addToRefs} className="nebula-reveal space-y-8 text-xl sm:text-2xl font-light text-zinc-300">
              <p className="text-zinc-400">Yıldızlar boşluktan ortaya çıkmaz.</p>
              <p className="text-zinc-300">Önce parçalar bir araya gelir.</p>
              <p className="text-zinc-200">Bir yapı oluşur.</p>
              <p className="text-zinc-100 font-normal">Ve o yapıdan yeni bir şey doğar.</p>
            </div>

            {/* Scattered Elements Grid */}
            <div ref={addToRefs} className="nebula-reveal grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-6">
              {["Projects.", "Tasks.", "People.", "Ideas."].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 text-zinc-400 font-mono text-sm sm:text-base hover:border-indigo-500/40 hover:text-indigo-200 transition-colors"
                >
                  {item}
                </div>
              ))}
            </div>

            <div ref={addToRefs} className="nebula-reveal pt-10">
              <p className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 text-glow-violet">
                Nebula brings them together.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 05 — NEBULA AS A PRODUCT */}
        <section className="relative py-36 px-6 border-t border-white/[0.04]">
          <div className="max-w-5xl mx-auto">
            <div ref={addToRefs} className="nebula-reveal text-center mb-20 space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                PRODUCT ARCHITECTURE
              </span>
              <h2 className="nebula-display text-3xl sm:text-5xl font-normal text-zinc-100">
                Built around one idea.
              </h2>
              <p className="text-lg text-zinc-400 font-light">
                Turn scattered work into something organized.
              </p>
            </div>

            {/* Hierarchy Cascade */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {PRODUCT_HIERARCHY.map((item) => (
                <div
                  key={item.level}
                  ref={addToRefs}
                  className="nebula-reveal flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-2xl border border-zinc-800/50 bg-zinc-950/40 hover:border-indigo-500/30 hover:bg-zinc-900/20 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-2 sm:mb-0">
                    <span className="text-xs font-mono text-indigo-400/70">{item.level}</span>
                    <h3 className="text-xl font-medium text-zinc-100 group-hover:text-indigo-200 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-400 font-light sm:text-right">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 06 — FINAL CTA */}
        <section className="relative py-40 px-6 border-t border-white/[0.04] text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/20 via-transparent to-transparent pointer-events-none" />

          <div ref={addToRefs} className="nebula-reveal max-w-3xl mx-auto space-y-8 relative z-10">
            <h2 className="nebula-display text-4xl sm:text-6xl md:text-7xl font-normal text-zinc-100">
              Create something <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 font-normal text-glow-indigo">
                that shines.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-zinc-400 font-light max-w-md mx-auto leading-relaxed">
              Your work is scattered. <br />
              <span className="text-zinc-200">Nebula brings it together.</span>
            </p>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/"
                className="nebula-copy w-full sm:w-auto px-8 py-4 rounded-full border border-amber-100/80 bg-amber-50 text-zinc-950 font-semibold text-sm tracking-wide transition-all duration-500 ease-out hover:-translate-y-1 hover:bg-amber-100 active:translate-y-0 active:scale-[0.98]"
              >
                Enter Nebula
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-4 text-xs font-mono tracking-widest text-zinc-400 hover:text-zinc-100 uppercase transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04] text-center text-xs font-mono text-zinc-600">
        NEBULA SYSTEM © {new Date().getFullYear()} — FROM CHAOS TO STRUCTURE
      </footer>
    </div>
  );
}