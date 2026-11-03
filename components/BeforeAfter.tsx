"use client";
import { useState } from "react";

export function BeforeAfter({ before, after, label }: { before: string; after: string; label: string }) {
  const [pos, setPos] = useState(50);
  return (
    <figure style={{ margin: 0 }}>
      <div className="ba" style={{ "--pos": `${pos}%` } as React.CSSProperties}>
        <img src={before} alt={`Antes: ${label}`} />
        <img className="after" src={after} alt={`Depois: ${label}`} />
        <span className="lbl" style={{ left: 14 }}>Antes</span>
        <span className="lbl" style={{ right: 14 }}>Depois</span>
        <div className="handle" />
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Comparar antes e depois" />
      </div>
      <figcaption style={{ textAlign: "center", marginTop: 12, color: "var(--grey)" }}>{label}</figcaption>
    </figure>
  );
}
