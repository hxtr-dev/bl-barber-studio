"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BUSINESS, HERO_FRAMES } from "@/lib/content";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/**
 * "O corte no scroll": conforme o cliente rola, o degradê vai sendo feito de baixo para cima
 * e no fim aparece o logo com o botão de agendar.
 * Com quadros de vídeo em HERO_FRAMES, desenha a sequência num canvas.
 */
export function HeroScroll() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStatic, setStatic] = useState(false);
  const [outroOn, setOutroOn] = useState(false);
  const useFrames = HERO_FRAMES.count > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatic(true);
      el.style.setProperty("--p", "1");
      el.style.setProperty("--reveal", "1");
      el.style.setProperty("--outro", "1");
      el.style.setProperty("--lineo", "0");
      setOutroOn(true);
      return;
    }

    const frames: HTMLImageElement[] = [];
    if (useFrames) {
      for (let i = 0; i < HERO_FRAMES.count; i++) {
        const img = new Image();
        img.src = HERO_FRAMES.pattern(i);
        frames.push(img);
      }
    }
    let lastFrame = -1;
    const draw = (reveal: number) => {
      const c = canvasRef.current;
      if (!useFrames || !c) return;
      const idx = Math.round(reveal * (frames.length - 1));
      const img = frames[idx];
      if (idx === lastFrame || !img?.complete) return;
      lastFrame = idx;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };

    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - innerHeight));
      const reveal = clamp((p - 0.06) / 0.56);
      const outro = clamp((p - 0.66) / 0.22);
      el.style.setProperty("--p", p.toFixed(4));
      el.style.setProperty("--reveal", reveal.toFixed(4));
      el.style.setProperty("--outro", outro.toFixed(4));
      el.style.setProperty("--lineo", reveal > 0 && reveal < 1 ? "1" : "0");
      setOutroOn(outro > 0.6);
      draw(reveal);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [useFrames]);

  return (
    <section id="inicio" ref={ref} className={`hero ${isStatic ? "static" : ""}`} aria-label="Início">
      <div className="hero-stage">
        <div className="hero-glow" />
        {!isStatic && (
          <div className="hero-photo" aria-hidden>
            {useFrames ? (
              <canvas ref={canvasRef} />
            ) : (
              <>
                <img className="base" src="/corte.webp" alt="" />
                <img className="done" src="/corte.webp" alt="" />
                <div className="clipper-line">
                  <svg viewBox="0 0 64 64">
                    <rect x="22" y="4" width="20" height="44" rx="6" fill="#1b1b1e" stroke="currentColor" strokeWidth="2" />
                    <rect x="20" y="46" width="24" height="10" rx="2" fill="currentColor" />
                    <path d="M22 60 h20" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </div>
              </>
            )}
          </div>
        )}

        {!isStatic && (
          <div className="hero-intro">
            <p className="eyebrow">{BUSINESS.city}</p>
            <h1 className="shimmer">Mais que um corte. Sua identidade.</h1>
            <p>Role a página e veja o degradê ganhar forma.</p>
          </div>
        )}

        <div className={`hero-outro ${outroOn ? "on" : ""}`}>
          <img className="hero-logo" src="/logo-badge.webp" alt="BL Barber Studio" width={300} height={300} />
          <p className="slogan">
            Seu estilo, <span className="shimmer-gold">nosso compromisso</span>
          </p>
          <p className="tags">{BUSINESS.tagline.join(" · ")}</p>
          <Link href="/agendar" className="btn" tabIndex={outroOn ? 0 : -1}>
            Agendar meu estilo <span aria-hidden>→</span>
          </Link>
        </div>

        {!isStatic && (
          <div className="hero-hint" aria-hidden>
            <i />
            Role
          </div>
        )}
      </div>
    </section>
  );
}
