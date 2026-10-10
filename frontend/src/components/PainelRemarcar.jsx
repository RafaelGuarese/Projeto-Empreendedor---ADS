import { useEffect, useState } from "react";

import api from "../api/client.js";
import { agruparPorData } from "../utils/agenda.js";

export default function PainelRemarcar({ consulta, onRemarcada, onCancelar }) {
  const [slots, setSlots] = useState([]);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get(`/consultas/estagiario/${consulta.estagiario.id}/disponibilidade`)
      .then(({ data }) => setSlots(data.horariosDisponiveis))
      .catch((err) => setErro(err.response?.data?.mensagem || "Não foi possível carregar os horários."))
      .finally(() => setCarregando(false));
  }, [consulta.estagiario.id]);

  const grupos = agruparPorData(slots);

  async function confirmar() {
    if (!slotSelecionado) {
      setErro("Selecione um novo horário.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      await api.put(`/consultas/${consulta.id}/remarcar`, { novaDataHora: slotSelecionado });
      onRemarcada();
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível remarcar a consulta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="painel-remarcar">
      {erro && <div className="alerta alerta-erro">{erro}</div>}

      {carregando ? (
        <div className="mensagem-carregando">Carregando horários...</div>
      ) : grupos.length === 0 ? (
        <div className="estado-vazio">Nenhum horário disponível para remarcar.</div>
      ) : (
        grupos.map(([dataLabel, horarios]) => (
          <div key={dataLabel} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", marginBottom: 6 }}>{dataLabel}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {horarios.map((h) => (
                <button
                  key={h.iso}
                  type="button"
                  className={slotSelecionado === h.iso ? "botao-primario" : "botao-secundario"}
                  style={{ width: "auto", padding: "6px 12px", fontSize: 13 }}
                  onClick={() => setSlotSelecionado(h.iso)}
                >
                  {h.hora}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
        <button className="botao-primario" style={{ width: "auto", padding: "8px 16px" }} onClick={confirmar} disabled={enviando}>
          {enviando ? "Salvando..." : "Confirmar nova data"}
        </button>
        <button type="button" className="botao-secundario" style={{ width: "auto", padding: "8px 16px" }} onClick={onCancelar}>
          Voltar
        </button>
      </div>
    </div>
  );
}
