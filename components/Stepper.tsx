import { Icon } from "./Icon";

const STEPS = [
  { icon: "tesoura", label: "Serviços e horário" },
  { icon: "user", label: "Seus dados" },
  { icon: "pix", label: "Pagamento" },
];

/** ------✂------👤------$------  A linha dourada "carrega" até a etapa atual. */
export function Stepper({ step, done = false }: { step: 1 | 2 | 3; done?: boolean }) {
  const fill = done ? 100 : step * 25;
  return (
    <div className="stepper" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label={`Etapa ${step} de 3`}>
      <div className="stepper-track">
        <div className="stepper-fill" style={{ width: `${fill}%` }} />
      </div>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const state = done || n < step ? "past" : n === step ? "current" : "next";
        return (
          <div key={s.icon} className={`stepper-node ${state}`} style={{ left: `${(i + 1) * 25}%` }}>
            <span className="dot">
              <Icon name={done || n < step ? "check" : s.icon} />
            </span>
            <span className="lbl">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
