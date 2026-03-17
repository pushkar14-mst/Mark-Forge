"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { RiGoogleFill } from "react-icons/ri";

export function LoginClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  // Animated grid background on canvas
  useEffect(() => {
    setMounted(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let width = 0;
    let height = 0;

    function resize() {
      if (!canvas || !ctx) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    const CELL = 48;
    const COLS = () => Math.ceil(width / CELL) + 1;
    const ROWS = () => Math.ceil(height / CELL) + 1;

    // Each cell has a random flicker offset
    type Cell = { x: number; y: number; phase: number; speed: number };
    let cells: Cell[] = [];

    function buildCells() {
      cells = [];
      const cols = COLS();
      const rows = ROWS();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          cells.push({
            x: c * CELL,
            y: r * CELL,
            phase: Math.random() * Math.PI * 2,
            speed: 0.004 + Math.random() * 0.008,
          });
        }
      }
    }

    buildCells();
    window.addEventListener("resize", buildCells);

    let t = 0;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      t++;

      for (const cell of cells) {
        const alpha = (Math.sin(cell.phase + t * cell.speed) + 1) / 2;
        const clamped = 0.02 + alpha * 0.06;

        // Dot at intersection
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 57, 70, ${clamped * 1.5})`;
        ctx.fill();

        // Horizontal line segment
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y);
        ctx.lineTo(cell.x + CELL, cell.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${clamped * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Vertical line segment
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y);
        ctx.lineTo(cell.x, cell.y + CELL);
        ctx.stroke();
      }

      animFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", buildCells);
    };
  }, []);

  return (
    <div
      className="relative flex h-screen w-full items-center justify-center
                    bg-[#080808] overflow-hidden"
    >
      {/* Canvas grid background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Radial vignette over canvas */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, #080808 100%)",
        }}
      />

      {/* Card */}
      <div
        className={`relative z-10 flex flex-col items-center gap-8 transition-all duration-700
                    ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
            {/* M glyph */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M4 26V6L16 18L28 6V26"
                stroke="#e63946"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-2xl font-mono font-light tracking-[0.2em] text-[#f0f0f0] uppercase">
              Mark<span className="text-[#e63946] font-normal">Forge</span>
            </span>
          </div>
          <p className="text-[10px] font-mono tracking-[0.25em] text-[#333] uppercase">
            Markdown. Refined.
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-[#1a1a1a]" />

        {/* Login card */}
        <div
          className="flex flex-col items-center gap-6 px-10 py-8
                     border border-[#141414] bg-[#0a0a0a]/80
                     backdrop-blur-sm"
          style={{ minWidth: "320px" }}
        >
          <div className="text-center">
            <p className="text-xs font-mono text-[#555] tracking-widest uppercase">
              Sign in to continue
            </p>
          </div>

          <Button
            asChild
            className="w-full h-10 bg-transparent border border-[#222]
                       hover:border-[#e63946] hover:bg-[#e63946]/5
                       text-[#aaa] hover:text-[#f0f0f0]
                       font-mono text-xs tracking-widest uppercase
                       transition-all duration-200 rounded-none gap-3"
          >
            <a href="/api/auth/login">
              <RiGoogleFill className="text-base shrink-0" />
              Continue with Google
            </a>
          </Button>

          <p className="text-[10px] font-mono text-[#2a2a2a] text-center leading-relaxed">
            By continuing, you agree to our terms.
            <br />
            Your documents are private by default.
          </p>
        </div>

        {/* Bottom accent */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-px bg-[#141414]" />
          <span className="text-[9px] font-mono text-[#222] tracking-widest uppercase">
            WASM · AI · Markdown
          </span>
          <div className="w-12 h-px bg-[#141414]" />
        </div>
      </div>
    </div>
  );
}
