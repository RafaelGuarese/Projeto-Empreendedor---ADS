import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import { agruparPorData } from "../utils/agenda.js";

const LABEL_TIPO = { presencial: "Presencial", online: "Online", ambos: "Presencial e Online" };

export default function AgendamentoPage() {
  const { estagiarioId } = useParams();
  const navegar = useNavigate();

  const [estagiario, setEstagiario] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [tipoEscolhido, setTipoEscolhido] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  async function carregarDisponibilidade() {
    setCarregando(true);
    setErro(null);
    try {
      const { data } = await api.get(`/consultas/estagiario/${estagiarioId}/disponibilidade`);
      setEstagiario(data.estagiario);
      setSlots(data.horariosDisponiveis);
      if (data.estagiario.tipoAtendimento !== "ambos") {
        setTipoEscolhido(data.estagiario.tipoAtendimento);
      }
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível carregar a agenda deste estagiário.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDisponibilidade();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estagiarioId]);

  const grupos = useMemo(() => agruparPorData(slots), [slots]);

  async function confirmarAgendamento() {
    setErro(null);

    if (!slotSelecionado) {
      setErro("Selecione um horário disponível.");
      return;
    }
    if (estagiario.tipoAtendimento === "ambos" && !tipoEscolhido) {
      setErro("Selecione se o atendimento será presencial ou online.");
      return;
    }

    setConfirmando(true);

    try {
      const { data } = await api.post("/consultas", {
        estagiarioId: Number(estagiarioId),
        dataHora: slotSelecionado,
        tipo: tipoEscolhido || undefined,
      });
      setSucesso(data.mensagem);
      setTimeout(() => navegar("/agendamentos"), 1800);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível confirmar o agendamento.");
      if (err.response?.data?.codigo === "msg_horario_indisponivel") {
        setSlotSelecionado(null);
        carregarDisponibilidade();
      }
    } finally {
      setConfirmando(false);
    }
  }

  if (carregando) {
    return <div className="conteudo mensagem-carregando">Carregando agenda...</div>;
  }

  if (!estagiario) {
    return (
      <div className="conteudo">
        <div className="alerta alerta-erro">{erro}</div>
      </div>
    );
  }

  return (
    <div className="conteudo" style={{ maxWidth: 720 }}>
      <div className="dashboard-cabecalho">
        <h1>Agendar consulta</h1>
        <p>Escolha um dia e horário disponível para sua consulta.</p>
      </div>

      <div className="dashboard-card" style={{ marginTop: 16 }}>
        <span className="abordagem-tag">{estagiario.abordagem}</span>
        <h3 style={{ marginBottom: 4 }}>{estagiario.nome}</h3>
        <p style={{ margin: "0 0 4px" }}>{estagiario.especialidades.join(", ")}</p>
        <p style={{ margin: 0 }}>
          <strong>R$ {estagiario.valorConsulta?.toFixed(2)}</strong> · ★ {estagiario.avaliacao?.toFixed(1) ?? "-"} ·{" "}
          {LABEL_TIPO[estagiario.tipoAtendimento]}
        </p>
      </div>

      {erro && <div className="alerta alerta-erro" style={{ marginTop: 16 }}>{erro}</div>}
      {sucesso && <div className="alerta alerta-sucesso" style={{ marginTop: 16 }}>{sucesso} Redirecionando...</div>}

      {!sucesso && (
        <>
          {estagiario.tipoAtendimento === "ambos" && (
            <div className="campo" style={{ marginTop: 20 }}>
              <label>Tipo de atendimento</label>
              <div style={{ display: "flex", gap: 10 }}>
                {["presencial", "online"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={tipoEscolhido === t ? "botao-primario" : "botao-secundario"}
                    style={{ width: "auto", padding: "8px 18px" }}
                    onClick={() => setTipoEscolhido(t)}
                  >
                    {LABEL_TIPO[t]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
              Horários disponíveis
            </label>

            {grupos.length === 0 && (
              <div className="estado-vazio">Este estagiário não possui horários disponíveis no momento.</div>
            )}

            {grupos.map(([dataLabel, horarios]) => (
              <div key={dataLabel} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize", marginBottom: 8 }}>
                  {dataLabel}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {horarios.map((h) => (
                    <button
                      key={h.iso}
                      type="button"
                      className={slotSelecionado === h.iso ? "botao-primario" : "botao-secundario"}
                      style={{ width: "auto", padding: "8px 16px" }}
                      onClick={() => setSlotSelecionado(h.iso)}
                    >
                      {h.hora}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className="botao-primario" style={{ marginTop: 12 }} onClick={confirmarAgendamento} disabled={confirmando}>
            {confirmando ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </>
      )}
    </div>
  );
}
