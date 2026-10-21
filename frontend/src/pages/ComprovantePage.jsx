import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/client.js";
import Icone from "../components/Icone.jsx";
import Logo from "../components/Logo.jsx";
import { Alerta, Carregando } from "../components/Ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatarDataHora } from "../utils/agenda.js";
import { LABEL_CHAVE_PIX, LABEL_STATUS_PAGAMENTO } from "../utils/pagamento.js";

export default function ComprovantePage() {
  const { pagamentoId } = useParams();
  const { usuario } = useAuth();

  const [comprovante, setComprovante] = useState(null);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    api
      .get(`/pagamentos/${pagamentoId}/comprovante`)
      .then(({ data }) => setComprovante(data.comprovante))
      .catch((err) => setErro(err.response?.data?.mensagem || "Não foi possível carregar o comprovante."));
  }, [pagamentoId]);

  async function decidir(acao) {
    if (acao === "recusar" && !window.confirm("Recusar este pagamento cancela a consulta. Deseja continuar?")) return;

    setProcessando(true);
    setErro(null);
    try {
      const { data } = await api.put(`/pagamentos/${pagamentoId}/${acao}`);
      setComprovante(data.pagamento);
      setMensagem(data.mensagem);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível atualizar o pagamento.");
    } finally {
      setProcessando(false);
    }
  }

  const ehEstagiario = usuario?.tipoUsuario === "estagiario";

  if (!comprovante) {
    return (
      <div className="conteudo conteudo-estreito">{erro ? <Alerta tipo="erro">{erro}</Alerta> : <Carregando />}</div>
    );
  }

  return (
    <div className="conteudo conteudo-estreito">
      <Link to={ehEstagiario ? "/pagamentos" : "/agendamentos"} className="link-voltar nao-imprimir">
        <Icone nome="voltar" tamanho={16} /> {ehEstagiario ? "Pagamentos recebidos" : "Meus agendamentos"}
      </Link>

      {usuario?.tipoUsuario === "paciente" && comprovante.status === "em_analise" && (
        <Alerta tipo="sucesso" className="nao-imprimir">
          <strong>Pagamento informado!</strong> Sua consulta está confirmada e este comprovante foi enviado ao estagiário.
        </Alerta>
      )}
      {ehEstagiario && comprovante.status === "em_analise" && !mensagem && (
        <Alerta tipo="aviso" className="nao-imprimir">
          Confira se o valor caiu na sua conta antes de confirmar o recebimento.
        </Alerta>
      )}
      {mensagem && (
        <Alerta tipo="sucesso" className="nao-imprimir">
          {mensagem}
        </Alerta>
      )}
      {erro && (
        <Alerta tipo="erro" className="nao-imprimir">
          {erro}
        </Alerta>
      )}

      <div className="comprovante">
        <div className="comprovante-topo">
          <div>
            <Logo claro tamanho={28} />
            <div className="comprovante-titulo">Comprovante de pagamento</div>
          </div>
          <span className={`tag status-${comprovante.status}`}>{LABEL_STATUS_PAGAMENTO[comprovante.status]}</span>
        </div>

        <div className="comprovante-corpo">
          <div className="comprovante-valor">
            <span className="valor">R$ {comprovante.valor.toFixed(2)}</span>
            <span className="tag tag-neutra">
              <Icone nome="pix" tamanho={13} /> PIX
            </span>
          </div>

          <dl className="comprovante-dados">
            <dt>Nº do comprovante</dt>
            <dd>{comprovante.numeroComprovante}</dd>
            <dt>Pago em</dt>
            <dd>{formatarDataHora(comprovante.pagoEm)}</dd>

            <dt className="comprovante-secao">Pagador</dt>
            <dd className="comprovante-secao">
              {comprovante.pagador.nome}
              <br />
              <small>CPF {comprovante.pagador.cpf}</small>
            </dd>

            <dt>Recebedor</dt>
            <dd>
              {comprovante.recebedor.nome}
              <br />
              <small>
                Chave PIX ({LABEL_CHAVE_PIX[comprovante.recebedor.tipoChavePix] || "PIX"}): {comprovante.recebedor.chavePix}
              </small>
            </dd>

            <dt className="comprovante-secao">Referente a</dt>
            <dd className="comprovante-secao">
              Consulta {comprovante.consulta.tipo === "online" ? "online" : "presencial"} em{" "}
              {formatarDataHora(comprovante.consulta.dataHora)}
            </dd>
            <dt>Identificador (txid)</dt>
            <dd>
              <code>{comprovante.txid}</code>
            </dd>
            {comprovante.idTransacaoBanco && (
              <>
                <dt>ID da transação no banco</dt>
                <dd>
                  <code>{comprovante.idTransacaoBanco}</code>
                </dd>
              </>
            )}
            {comprovante.confirmadoEm && (
              <>
                <dt>{comprovante.status === "recusado" ? "Recusado em" : "Confirmado em"}</dt>
                <dd>{formatarDataHora(comprovante.confirmadoEm)}</dd>
              </>
            )}
          </dl>

          <p className="comprovante-rodape">
            Comprovante emitido pela plataforma Psicoliga a partir do pagamento informado pelo paciente. A confirmação
            do recebimento é feita pelo estagiário após conferir o crédito em sua conta.
          </p>
        </div>
      </div>

      <div className="comprovante-acoes nao-imprimir">
        {ehEstagiario && comprovante.status === "em_analise" && (
          <>
            <button className="botao botao-primario" disabled={processando} onClick={() => decidir("confirmar")}>
              <Icone nome="check" tamanho={18} /> Confirmar recebimento
            </button>
            <button className="botao botao-perigo" disabled={processando} onClick={() => decidir("recusar")}>
              Não recebi — recusar
            </button>
          </>
        )}
        <button className="botao botao-secundario" onClick={() => window.print()}>
          <Icone nome="impressora" tamanho={18} /> Imprimir / salvar PDF
        </button>
      </div>
    </div>
  );
}
