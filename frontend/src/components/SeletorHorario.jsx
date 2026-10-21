import { useEffect, useMemo, useState } from "react";

import { partesData } from "../utils/agenda.js";
import Icone from "./Icone.jsx";

export default function SeletorHorario({ slots, selecionado, onSelecionar }) {
  const dias = useMemo(() => {
    const mapa = new Map();
    slots.forEach((iso) => {
      const partes = partesData(iso);
      if (!mapa.has(partes.chaveDia)) mapa.set(partes.chaveDia, { ...partes, horarios: [] });
      mapa.get(partes.chaveDia).horarios.push({ iso, hora: partes.hora });
    });
    return Array.from(mapa.values());
  }, [slots]);

  const [diaAtivo, setDiaAtivo] = useState(null);

  useEffect(() => {
    if (dias.length === 0) {
      setDiaAtivo(null);
    } else if (!dias.some((d) => d.chaveDia === diaAtivo)) {
      setDiaAtivo(dias[0].chaveDia);
    }
  }, [dias, diaAtivo]);

  const dia = dias.find((d) => d.chaveDia === diaAtivo);

  return (
    <div>
      <span className="rotulo">Escolha o dia</span>
      <div className="dias-opcoes" role="listbox" aria-label="Dias disponíveis">
        {dias.map((d) => (
          <button
            key={d.chaveDia}
            type="button"
            role="option"
            aria-selected={d.chaveDia === diaAtivo}
            className={`dia-opcao ${d.chaveDia === diaAtivo ? "ativo" : ""}`}
            onClick={() => setDiaAtivo(d.chaveDia)}
          >
            <span className="semana">{d.semana}</span>
            <span className="numero">{d.dia}</span>
            <span className="mes">{d.mes}</span>
          </button>
        ))}
      </div>

      {dia && (
        <>
          <span className="rotulo" style={{ marginTop: 14, textTransform: "none" }}>
            Horários de {dia.semanaLonga}
          </span>
          <div className="horarios-opcoes">
            {dia.horarios.map((h) => (
              <button
                key={h.iso}
                type="button"
                className={`horario-opcao ${selecionado === h.iso ? "ativo" : ""}`}
                onClick={() => onSelecionar(h.iso)}
              >
                <Icone nome={selecionado === h.iso ? "check" : "relogio"} tamanho={16} />
                {h.hora}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
