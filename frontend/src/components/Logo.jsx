import { useId } from "react";

export default function Logo({ tamanho = 34, comTexto = true, claro = false }) {
  const idGradiente = `logo-gradiente-${useId().replace(/:/g, "")}`;

  return (
    <span className={`logo ${claro ? "logo-claro" : ""}`}>
      <svg viewBox="0 0 32 32" width={tamanho} height={tamanho} aria-hidden="true">
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4a8c91" />
            <stop offset="1" stopColor="#7d6fc0" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={claro ? "rgba(255,255,255,0.18)" : `url(#${idGradiente})`} />
        <path d="M16 8v16M10 10v4a6 6 0 0 0 12 0v-4" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      {comTexto && <span className="logo-texto">Psicoliga</span>}
    </span>
  );
}
