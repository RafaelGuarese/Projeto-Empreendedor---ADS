import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta, CabecalhoPagina, Carregando, EstadoVazio } from "../components/Ui.jsx";
import { formatarDataHora } from "../utils/agenda.js";

function tempoRestante(expiraEm) {
  const segundos = Math.max(0, Math.floor((new Date(expiraEm).getTime() - Date.now()) / 1000));
  return { segundos, texto: `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}` };
}

export default function PagamentoPage() {
  const { consultaId } = useParams();
  const navegar = useNavigate();

  const [pagamento, setPagamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [idTransacao, setIdTransacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(null);
  const [restante, setRestante] = useState(null);

  async function carregar() {
    try {
      const { data } = await api.get(`/pagamentos/consulta/${consultaId}`);
      setPagamento(data.pagamento);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível carregar o pagamento.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultaId]);

  useEffect(() => {
    if (pagamento?.status !== "pendente") return undefined;

    const atualizar = () => {
      const tempo = tempoRestante(pagamento.expiraEm);
      setRestante(tempo);
      if (tempo.segundos === 0) carregar();
    };

    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagamento]);

  async function copiar(texto, qual) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setErro("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  async function informarPagamento() {
    setErro(null);
    setEnviando(true);

    try {
      const { data } = await api.post(`/pagamentos/${pagamento.id}/informar`, { idTransacaoBanco: idTransacao.trim() });
      navegar(`/comprovantes/${data.pagamento.id}`);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível registrar o pagamento.");
      carregar();
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="conteudo">
        <Carregando texto="Carregando pagamento..." />
      </div>
    );
  }

  if (!pagamento) {
    return (
      <div className="conteudo conteudo-estreito">
        <Alerta tipo="erro">{erro}</Alerta>
      </div>
    );
  }

  const encerrado = {
    expirado: {
      icone: "relogio",
      titulo: "O prazo para pagamento expirou",
      texto: "O horário foi liberado porque o pagamento não foi informado a tempo.",
    },
    cancelado: { icone: "fechar", titulo: "Reserva cancelada", texto: "Esta reserva foi cancelada antes do pagamento." },
  }[pagamento.status];

  return (
    <div className="conteudo conteudo-medio">
      <Link to="/agendamentos" className="link-voltar">
        <Icone nome="voltar" tamanho={16} /> Meus agendamentos
      </Link>
      <CabecalhoPagina
        sobretitulo="Pagamento via PIX"
        titulo="Falta pouco para confirmar sua consulta"
        subtitulo="O horário fica reservado para você enquanto o pagamento é feito."
      />

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {encerrado && (
        <EstadoVazio icone={encerrado.icone} titulo={encerrado.titulo}>
          {encerrado.texto} <Link to="/busca">Fazer um novo agendamento</Link>
        </EstadoVazio>
      )}

      {["em_analise", "aprovado", "recusado"].includes(pagamento.status) && (
        <EstadoVazio icone="check" titulo="Pagamento já informado">
          O comprovante desta consulta já foi gerado. <Link to={`/comprovantes/${pagamento.id}`}>Ver comprovante</Link>
        </EstadoVazio>
      )}

      {pagamento.status === "pendente" && (
        <div className="pagamento-layout">
          <aside className="cartao pix-qr">
            <span className="rotulo" style={{ textAlign: "center" }}>
              Valor a pagar
            </span>
            <div className="pix-valor">R$ {pagamento.valor.toFixed(2)}</div>
            {restante && (
              <span className={`pix-prazo ${restante.segundos < 300 ? "pix-prazo-urgente" : ""}`} style={{ marginTop: 8 }}>
                <Icone nome="relogio" tamanho={15} /> Reservado por {restante.texto}
              </span>
            )}
            <img src={pagamento.qrCode} alt="QR Code PIX para pagamento da consulta" width="260" height="260" />
            <div className="celula-pessoa" style={{ justifyContent: "center" }}>
              <Avatar nome={pagamento.recebedor.nome} tamanho={34} />
              <div style={{ textAlign: "left" }}>
                <span className="detalhe">Recebedor</span>
                {pagamento.recebedor.nome}
              </div>
            </div>
            <p className="campo-ajuda" style={{ marginTop: 12 }}>
              Consulta {pagamento.consulta.tipo === "online" ? "online" : "presencial"} em{" "}
              {formatarDataHora(pagamento.consulta.dataHora)}
            </p>
          </aside>

          <section className="cartao">
            <div className="cartao-cabecalho">
              <span className="icone-circulo">
                <Icone nome="pix" tamanho={20} />
              </span>
              <div>
                <h2>Como pagar</h2>
                <p>Leva menos de um minuto pelo app do seu banco.</p>
              </div>
            </div>

            <ol className="passos-lista">
              <li>Abra o app do seu banco e escolha pagar com PIX.</li>
              <li>Escaneie o QR Code ou cole o código abaixo.</li>
              <li>Confira o nome do recebedor e o valor, e conclua o pagamento.</li>
              <li>Volte aqui e toque em "Já realizei o pagamento".</li>
            </ol>

            <div className="campo">
              <span className="rotulo">PIX copia e cola</span>
              <div className="copiar-linha">
                <div className="valor-copiavel codigo">{pagamento.pixCopiaECola}</div>
                <button type="button" className="botao botao-suave" onClick={() => copiar(pagamento.pixCopiaECola, "codigo")}>
                  <Icone nome={copiado === "codigo" ? "check" : "copiar"} tamanho={17} />
                  {copiado === "codigo" ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="campo">
              <span className="rotulo">Ou use a chave PIX</span>
              <div className="copiar-linha">
                <div className="valor-copiavel">{pagamento.chavePix}</div>
                <button type="button" className="botao botao-suave" onClick={() => copiar(pagamento.chavePix, "chave")}>
                  <Icone nome={copiado === "chave" ? "check" : "copiar"} tamanho={17} />
                  {copiado === "chave" ? "Copiada" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="idTransacao">ID da transação (opcional)</label>
              <input
                id="idTransacao"
                value={idTransacao}
                onChange={(e) => setIdTransacao(e.target.value)}
                placeholder="Ex: E18236120202610101530s0123ABCD"
                maxLength={64}
              />
              <p className="campo-ajuda">Aparece no comprovante do seu banco e ajuda o estagiário a localizar o pagamento.</p>
            </div>

            <button className="botao botao-primario botao-bloco botao-grande" onClick={informarPagamento} disabled={enviando}>
              <Icone nome="check" tamanho={19} />
              {enviando ? "Gerando comprovante..." : "Já realizei o pagamento"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
