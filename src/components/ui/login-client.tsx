"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RiGoogleFill } from "react-icons/ri";

type Mode = "login" | "register";

export function LoginClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

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
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 57, 70, ${clamped * 1.5})`;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y);
        ctx.lineTo(cell.x + CELL, cell.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${clamped * 0.4})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const url = mode === "register" ? "/api/auth/register" : "/api/auth/signin";
    const body =
      mode === "register" ? { email, password, name } : { email, password };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Something went wrong");
    }

    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setErr(null);
    setEmail("");
    setPassword("");
    setName("");
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-[#080808] overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, #080808 100%)",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center gap-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1">
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
          <p className="text-[10px] font-mono tracking-[0.25em] text-[#777] uppercase">
            Markdown. Refined.
          </p>
        </div>

        <div className="w-px h-8 bg-[#2a2a2a]" />

        {/* Card */}
        <div
          className="flex flex-col items-center gap-5 px-10 py-8 border border-[#2a2a2a] bg-[#0d0d0d]/90 backdrop-blur-sm"
          style={{ minWidth: "320px" }}
        >
          {/* Mode toggle */}
          <div className="flex w-full border border-[#2a2a2a]">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 text-[10px] font-mono tracking-widest uppercase transition-colors ${
                  mode === m
                    ? "bg-[#e63946]/10 text-[#e63946]"
                    : "text-[#888] hover:text-[#ccc]"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
            {mode === "register" && (
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-transparent border border-[#1a1a1a] px-3 py-2 text-xs font-mono text-[#e0e0e0] placeholder-[#555] focus:outline-none focus:border-[#e63946]/50"
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border border-[#1a1a1a] px-3 py-2 text-xs font-mono text-[#e0e0e0] placeholder-[#555] focus:outline-none focus:border-[#e63946]/40"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent border border-[#1a1a1a] px-3 py-2 text-xs font-mono text-[#e0e0e0] placeholder-[#555] focus:outline-none focus:border-[#e63946]/40"
            />

            {err && (
              <p className="text-[10px] font-mono text-[#e63946] text-center">
                {err}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#e63946] hover:bg-[#c1121f] text-[#f0f0f0] font-mono text-xs tracking-widest uppercase transition-all duration-200 rounded-none disabled:opacity-40"
            >
              {loading
                ? "..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>

          {/* Divider */}
          {/* <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[9px] font-mono text-[#777] tracking-widest uppercase">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div> */}

          {/* Google OAuth */}
          {/* <Button
            asChild
            className="w-full h-10 bg-transparent border border-[#333] hover:border-[#e63946] hover:bg-[#e63946]/5 text-[#bbb] hover:text-[#f0f0f0] font-mono text-xs tracking-widest uppercase transition-all duration-200 rounded-none gap-3"
          >
            <a href="/api/auth/login">
              <RiGoogleFill className="text-base shrink-0" />
              Continue with Google
            </a>
          </Button> */}

          <p className="text-[10px] font-mono text-[#777] text-center leading-relaxed">
            Your documents are private by default.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-px bg-[#2a2a2a]" />
          <span className="text-[9px] font-mono text-[#777] tracking-widest uppercase">
            WASM · AI · Markdown
          </span>
          <div className="w-12 h-px bg-[#2a2a2a]" />
        </div>
      </div>
    </div>
  );
}
