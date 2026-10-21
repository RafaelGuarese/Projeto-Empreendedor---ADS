import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import Icone from "../components/Icone.jsx";
import SeletorHorario from "../components/SeletorHorario.jsx";
import { Alerta, CabecalhoPagina, Carregando, EstadoVazio } from "../components/Ui.jsx";
import { formatarDataHora } from "../utils/agenda.js";

const LABEL_TIPO = { presencial: "Presencial", online: "Online", ambos: "Presencial e online" };

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

  async function carregarDisponibilidade() {
    setCarregando(true);
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

  async function confirmarAgendamento() {
    setErro(null);

    if (estagiario.tipoAtendimento === "ambos" && !tipoEscolhido) {
      setErro("Selecione se o atendimento será presencial ou online.");
      return;
    }
    if (!slotSelecionado) {
      setErro("Selecione um horário disponível.");
      return;
    }

    setConfirmando(true);

    try {
      const { data } = await api.post("/consultas", {
        estagiarioId: Number(estagiarioId),
        dataHora: slotSelecionado,
        tipo: tipoEscolhido || undefined,
      });
      navegar(`/pagamento/${data.consulta.id}`);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível reservar o horário.");
      if (err.response?.data?.codigo === "msg_horario_indisponivel") {
        setSlotSelecionado(null);
        carregarDisponibilidade();
      }
    } finally {
      setConfirmando(false);
    }
  }

  if (carregando && !estagiario) {
    return (
      <div className="conteudo">
        <Carregando texto="Carregando agenda..." />
      </div>
    );
  }

  if (!estagiario) {
    return (
      <div className="conteudo conteudo-estreito">
        <Alerta tipo="erro">{erro}</Alerta>
        <Link to="/busca" className="link-voltar">
          <Icone nome="voltar" tamanho={16} /> Voltar para a busca
        </Link>
      </div>
    );
  }

  const precisaTipo = estagiario.tipoAtendimento === "ambos";

  return (
    <div className="conteudo conteudo-medio">
      <Link to="/busca" className="link-voltar">
        <Icone nome="voltar" tamanho={16} /> Voltar para a busca
      </Link>
      <CabecalhoPagina titulo="Agendar consulta" subtitulo="Escolha o melhor dia e horário. O pagamento é feito em seguida, via PIX." />

      <div className="agendamento-layout">
        <aside className="cartao perfil-resumo">
          <Avatar nome={estagiario.nome} tamanho={76} />
          <h2>{estagiario.nome}</h2>
          <span className="tag" style={{ marginTop: 6 }}>
            {estagiario.abordagem}
          </span>
          <div className="chips">
            {estagiario.especialidades.map((esp) => (
              <span key={esp} className="chip">
                {esp}
              </span>
            ))}
          </div>
          <div className="perfil-resumo-linhas">
            <span className="info-linha">
              Valor da sessão <strong>R$ {estagiario.valorConsulta?.toFixed(2)}</strong>
            </span>
            <span className="info-linha">
              Avaliação
              <strong style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#b7791f" }}>
                <Icone nome="estrela" tamanho={14} preenchido />
                {estagiario.avaliacao ? estagiario.avaliacao.toFixed(1) : "Novo"}
              </strong>
            </span>
            <span className="info-linha">
              Atendimento <strong>{LABEL_TIPO[estagiario.tipoAtendimento]}</strong>
            </span>
          </div>
        </aside>

        <section className="cartao">
          {erro && <Alerta tipo="erro">{erro}</Alerta>}

          {!estagiario.aceitaPix ? (
            <EstadoVazio icone="pix" titulo="Agendamento indisponível no momento">
              Este estagiário ainda não cadastrou uma chave PIX para receber os pagamentos.
            </EstadoVazio>
          ) : slots.length === 0 ? (
            <EstadoVazio icone="calendario" titulo="Sem horários livres">
              Este estagiário não possui horários disponíveis nas próximas semanas.
            </EstadoVazio>
          ) : (
            <>
              {precisaTipo && (
                <div className="passo">
                  <span className="passo-numero">1</span>
                  <div className="passo-conteudo">
                    <h3>Como prefere ser atendido(a)?</h3>
                    <div className="segmentado">
                      {["presencial", "online"].map((t) => (
                        <button key={t} type="button" className={tipoEscolhido === t ? "ativo" : ""} onClick={() => setTipoEscolhido(t)}>
                          <Icone nome={t === "online" ? "video" : "local"} tamanho={17} />
                          {LABEL_TIPO[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="passo">
                <span className="passo-numero">{precisaTipo ? 2 : 1}</span>
                <div className="passo-conteudo">
                  <h3>Quando?</h3>
                  <SeletorHorario slots={slots} selecionado={slotSelecionado} onSelecionar={setSlotSelecionado} />
                </div>
              </div>

              <div className="resumo-reserva">
                <span className="texto">
                  {slotSelecionado ? (
                    <>
                      <strong>{formatarDataHora(slotSelecionado)}</strong>
                      {tipoEscolhido ? LABEL_TIPO[tipoEscolhido] : "Escolha o tipo de atendimento"} · R$ {estagiario.valorConsulta?.toFixed(2)}
                    </>
                  ) : (
                    <>
                      <strong>Nenhum horário escolhido</strong>
                      Selecione um dia e um horário acima.
                    </>
                  )}
                </span>
                <button className="botao botao-primario botao-grande" onClick={confirmarAgendamento} disabled={confirmando}>
                  {confirmando ? "Reservando..." : "Continuar para pagamento"}
                  {!confirmando && <Icone nome="seta" tamanho={18} />}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
