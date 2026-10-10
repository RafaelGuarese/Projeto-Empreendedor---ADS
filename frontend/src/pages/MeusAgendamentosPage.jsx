import { useEffect, useState } from "react";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { formatarDataHora } from "../utils/agenda.js";
import PainelRemarcar from "../components/PainelRemarcar.jsx";

const LABEL_TIPO = { presencial: "Presencial", online: "Online" };
const LABEL_STATUS = { agendada: "Agendada", cancelada: "Cancelada", realizada: "Realizada" };

export default function MeusAgendamentosPage() {
  const { usuario } = useAuth();
  const [consultas, setConsultas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [remarcandoId, setRemarcandoId] = useState(null);
  const [erroPorConsulta, setErroPorConsulta] = useState({});

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get("/consultas/minhas");
      setConsultas(data.consultas);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível carregar seus agendamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function cancelar(consulta) {
    if (!window.confirm("Tem certeza que deseja cancelar esta consulta?")) return;

    setErroPorConsulta((atual) => ({ ...atual, [consulta.id]: null }));

    try {
      await api.put(`/consultas/${consulta.id}/cancelar`);
      carregar();
    } catch (err) {
      setErroPorConsulta((atual) => ({
        ...atual,
        [consulta.id]: err.response?.data?.mensagem || "Não foi possível cancelar a consulta.",
      }));
    }
  }

  const agora = new Date();
  const proximas = consultas.filter((c) => c.status === "agendada" && new Date(c.dataHora) >= agora);
  const historico = consultas.filter((c) => !(c.status === "agendada" && new Date(c.dataHora) >= agora));

  function renderConsulta(consulta, permiteAcoes) {
    const contraparte = usuario.tipoUsuario === "paciente" ? consulta.estagiario : consulta.paciente;

    return (
      <div key={consulta.id} className="dashboard-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>{contraparte?.nome}</h3>
            <p style={{ margin: "0 0 4px" }}>{formatarDataHora(consulta.dataHora)}</p>
            <p style={{ margin: 0, fontSize: 13 }}>
              <span className="tipo-atendimento-tag">{LABEL_TIPO[consulta.tipo] || consulta.tipo}</span>
              {"  ·  R$ "}
              {consulta.valor?.toFixed(2)}
            </p>
          </div>
          <span className="perfil-tag" style={{ whiteSpace: "nowrap" }}>
            {LABEL_STATUS[consulta.status] || consulta.status}
            {consulta.status === "cancelada" && consulta.canceladoPor ? ` (${consulta.canceladoPor})` : ""}
          </span>
        </div>

        {erroPorConsulta[consulta.id] && <div className="alerta alerta-erro" style={{ marginTop: 10 }}>{erroPorConsulta[consulta.id]}</div>}

        {permiteAcoes && consulta.tipo === "online" && (
          <div style={{ marginTop: 10 }}>
            {consulta.linkVideo ? (
              <a href={consulta.linkVideo} target="_blank" rel="noopener noreferrer">
                <button type="button" className="botao-agendar" style={{ width: "auto" }}>
                  Entrar na videochamada
                </button>
              </a>
            ) : (
              <div className="alerta alerta-erro">Link de videochamada indisponível. Tente novamente mais tarde.</div>
            )}
          </div>
        )}

        {permiteAcoes && remarcandoId === consulta.id && (
          <div style={{ marginTop: 12 }}>
            <PainelRemarcar
              consulta={consulta}
              onRemarcada={() => {
                setRemarcandoId(null);
                carregar();
              }}
              onCancelar={() => setRemarcandoId(null)}
            />
          </div>
        )}

        {permiteAcoes && remarcandoId !== consulta.id && (
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {usuario.tipoUsuario === "paciente" && (
              <button
                type="button"
                className="botao-secundario"
                style={{ width: "auto", padding: "8px 16px" }}
                onClick={() => setRemarcandoId(consulta.id)}
              >
                Remarcar
              </button>
            )}
            <button
              type="button"
              className="botao-secundario"
              style={{ width: "auto", padding: "8px 16px", borderColor: "var(--cor-erro)", color: "var(--cor-erro)" }}
              onClick={() => cancelar(consulta)}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="conteudo">
      <div className="dashboard-cabecalho">
        <h1>Meus Agendamentos</h1>
        <p>Acompanhe, remarque ou cancele suas consultas.</p>
      </div>

      {erro && <div className="alerta alerta-erro" style={{ marginTop: 16 }}>{erro}</div>}

      {carregando ? (
        <div className="mensagem-carregando">Carregando...</div>
      ) : (
        <>
          <h3 style={{ marginTop: 24 }}>Próximas consultas</h3>
          {proximas.length === 0 ? (
            <div className="estado-vazio">Nenhuma consulta agendada.</div>
          ) : (
            <div className="dashboard-grid">{proximas.map((c) => renderConsulta(c, true))}</div>
          )}

          {historico.length > 0 && (
            <>
              <h3 style={{ marginTop: 32 }}>Histórico</h3>
              <div className="dashboard-grid">{historico.map((c) => renderConsulta(c, false))}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
