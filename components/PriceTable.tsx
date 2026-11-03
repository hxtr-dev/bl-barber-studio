"use client";
import { useEffect, useRef, useState } from "react";
import { brl } from "@/lib/money";
import { fmtDuration } from "@/lib/time";
import type { Service } from "@/lib/types";

function CountUp({ cents, run }: { cents: number; run: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(cents);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 1400);
      setV(Math.round(cents * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents, run]);
  return <>{brl(run ? v : 0)}</>;
}

export function PriceTable({ services }: { services: Service[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setRun(true), io.disconnect()), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="prices" ref={ref}>
      {services.map((s) => (
        <div className="price-row" key={s.id}>
          <div className="name">
            {s.name}
            <small>{fmtDuration(s.duration_min)}</small>
          </div>
          <div className="dots" />
          <div className="value">
            <CountUp cents={s.price_cents} run={run} />
          </div>
        </div>
      ))}
    </div>
  );
}
