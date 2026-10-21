import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";
import Icone from "../components/Icone.jsx";
import PainelRemarcar from "../components/PainelRemarcar.jsx";
import { Alerta, CabecalhoPagina, Carregando, EstadoVazio } from "../components/Ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { partesData } from "../utils/agenda.js";
import { LABEL_STATUS_PAGAMENTO } from "../utils/pagamento.js";

const LABEL_STATUS = {
  aguardando_pagamento: "Aguardando pagamento",
  agendada: "Confirmada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};
const LABEL_CANCELADO_POR = { paciente: "pelo paciente", estagiario: "pelo estagiário", sistema: "pagamento não realizado" };
const STATUS_ATIVOS = ["agendada", "aguardando_pagamento"];

export default function MeusAgendamentosPage() {
  const { usuario } = useAuth();
  const [consultas, setConsultas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [remarcandoId, setRemarcandoId] = useState(null);
  const [erroPorConsulta, setErroPorConsulta] = useState({});

  const ehPaciente = usuario.tipoUsuario === "paciente";

  async function carregar() {
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
    const pergunta =
      consulta.status === "aguardando_pagamento"
        ? "Deseja desistir desta reserva? O horário será liberado."
        : "Tem certeza que deseja cancelar esta consulta?";
    if (!window.confirm(pergunta)) return;

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
  const ehProxima = (c) => STATUS_ATIVOS.includes(c.status) && new Date(c.dataHora) >= agora;
  const proximas = consultas.filter(ehProxima);
  const historico = consultas.filter((c) => !ehProxima(c)).reverse();

  function renderConsulta(consulta, ativa) {
    const contraparte = ehPaciente ? consulta.estagiario : consulta.paciente;
    const partes = partesData(consulta.dataHora);
    const remarcando = remarcandoId === consulta.id;

    return (
      <article key={consulta.id} className={`consulta-item ${ativa ? "" : "passada"}`}>
        <div className="consulta-linha">
          <div className={`bloco-data ${ativa ? "" : "inativo"}`}>
            <span className="dia">{partes.dia}</span>
            <span className="mes">{partes.mes}</span>
          </div>

          <div className="consulta-info">
            <div className="nome">{contraparte?.nome}</div>
            <div className="consulta-meta">
              <span className="info-linha">
                <Icone nome="relogio" tamanho={15} />
                {partes.semanaLonga.charAt(0).toUpperCase() + partes.semanaLonga.slice(1)}, {partes.hora}
              </span>
              <span className="info-linha">
                <Icone nome={consulta.tipo === "online" ? "video" : "local"} tamanho={15} />
                {consulta.tipo === "online" ? "Online" : "Presencial"}
              </span>
              <span className="info-linha">
                <Icone nome="dinheiro" tamanho={15} />
                R$ {consulta.valor?.toFixed(2)}
              </span>
            </div>
            <div className="consulta-tags">
              <span className={`tag status-${consulta.status}`}>
                {LABEL_STATUS[consulta.status] || consulta.status}
                {consulta.status === "cancelada" && consulta.canceladoPor
                  ? ` (${LABEL_CANCELADO_POR[consulta.canceladoPor] || consulta.canceladoPor})`
                  : ""}
              </span>
              {consulta.pagamento?.numeroComprovante && (
                <span className={`tag status-${consulta.pagamento.status}`}>
                  <Icone nome="pix" tamanho={13} />
                  {LABEL_STATUS_PAGAMENTO[consulta.pagamento.status]}
                </span>
              )}
            </div>
          </div>

          {ativa && !remarcando && (
            <div className="consulta-acoes">
              {consulta.status === "aguardando_pagamento" && ehPaciente && (
                <Link to={`/pagamento/${consulta.id}`} className="botao botao-destaque botao-pequeno">
                  <Icone nome="pix" tamanho={16} /> Pagar com PIX
                </Link>
              )}
              {consulta.status === "agendada" && consulta.tipo === "online" && consulta.linkVideo && (
                <a href={consulta.linkVideo} target="_blank" rel="noopener noreferrer" className="botao botao-destaque botao-pequeno">
                  <Icone nome="video" tamanho={16} /> Entrar na videochamada
                </a>
              )}
            </div>
          )}
        </div>

        {erroPorConsulta[consulta.id] && (
          <Alerta tipo="erro" className="nao-imprimir" >
            {erroPorConsulta[consulta.id]}
          </Alerta>
        )}

        {ativa && remarcando && (
          <PainelRemarcar
            consulta={consulta}
            onRemarcada={() => {
              setRemarcandoId(null);
              carregar();
            }}
            onCancelar={() => setRemarcandoId(null)}
          />
        )}

        {(ativa && !remarcando) || consulta.pagamento?.numeroComprovante ? (
          <div className="consulta-rodape">
            <div>
              {consulta.pagamento?.numeroComprovante && (
                <Link to={`/comprovantes/${consulta.pagamento.id}`} className="botao botao-texto botao-pequeno">
                  <Icone nome="prontuario" tamanho={16} /> Ver comprovante
                </Link>
              )}
            </div>
            {ativa && !remarcando && (
              <div className="consulta-acoes">
                {ehPaciente && consulta.status === "agendada" && (
                  <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => setRemarcandoId(consulta.id)}>
                    <Icone nome="calendario" tamanho={16} /> Remarcar
                  </button>
                )}
                <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => cancelar(consulta)}>
                  {consulta.status !== "aguardando_pagamento" ? "Cancelar" : ehPaciente ? "Desistir da reserva" : "Cancelar reserva"}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="conteudo conteudo-medio">
      <CabecalhoPagina
        titulo={ehPaciente ? "Meus agendamentos" : "Minha agenda"}
        subtitulo={
          ehPaciente
            ? "Acompanhe suas consultas, pague reservas pendentes, remarque ou cancele."
            : "Consultas marcadas pelos pacientes. Cancelamentos precisam de 12h de antecedência."
        }
        acoes={
          ehPaciente && (
            <Link to="/busca" className="botao botao-primario">
              <Icone nome="mais" tamanho={18} /> Nova consulta
            </Link>
          )
        }
      />

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {carregando ? (
        <Carregando />
      ) : (
        <>
          <h2 className="titulo-secao" style={{ marginTop: 0 }}>
            Próximas <span className="contador">{proximas.length}</span>
          </h2>
          {proximas.length === 0 ? (
            <EstadoVazio icone="calendario" titulo="Nenhuma consulta marcada">
              {ehPaciente ? (
                <>
                  Que tal agendar uma? <Link to="/busca">Buscar atendimento</Link>
                </>
              ) : (
                "Quando um paciente agendar com você, a consulta aparecerá aqui."
              )}
            </EstadoVazio>
          ) : (
            <div className="lista-consultas">{proximas.map((c) => renderConsulta(c, true))}</div>
          )}

          {historico.length > 0 && (
            <>
              <h2 className="titulo-secao">
                Histórico <span className="contador">{historico.length}</span>
              </h2>
              <div className="lista-consultas">{historico.map((c) => renderConsulta(c, false))}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
