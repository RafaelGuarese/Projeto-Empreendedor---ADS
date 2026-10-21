import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta, CabecalhoPagina, Carregando, EstadoVazio } from "../components/Ui.jsx";
import { formatarDataHora } from "../utils/agenda.js";
import { LABEL_STATUS_PAGAMENTO } from "../utils/pagamento.js";

export default function PagamentosRecebidosPage() {
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api
      .get("/pagamentos/recebidos")
      .then(({ data }) => setPagamentos(data.pagamentos))
      .catch((err) => setErro(err.response?.data?.mensagem || "Não foi possível carregar os pagamentos."))
      .finally(() => setCarregando(false));
  }, []);

  const aguardando = pagamentos.filter((p) => p.status === "em_analise");
  const totalConfirmado = pagamentos.filter((p) => p.status === "aprovado").reduce((soma, p) => soma + p.valor, 0);
  const totalAguardando = aguardando.reduce((soma, p) => soma + p.valor, 0);

  return (
    <div className="conteudo">
      <CabecalhoPagina
        titulo="Pagamentos recebidos"
        subtitulo="Comprovantes dos pagamentos PIX feitos pelos pacientes na sua chave. Confira o crédito na sua conta e confirme."
      />

      {erro && <Alerta tipo="erro">{erro}</Alerta>}

      {carregando ? (
        <Carregando />
      ) : (
        <>
          <div className="estatisticas">
            <div className="estatistica">
              <span className="icone-circulo icone-circulo-aviso">
                <Icone nome="relogio" tamanho={20} />
              </span>
              <div>
                <strong>{aguardando.length}</strong>
                <span>Aguardando sua confirmação (R$ {totalAguardando.toFixed(2)})</span>
              </div>
            </div>
            <div className="estatistica">
              <span className="icone-circulo icone-circulo-sucesso">
                <Icone nome="check" tamanho={20} />
              </span>
              <div>
                <strong>R$ {totalConfirmado.toFixed(2)}</strong>
                <span>Total com recebimento confirmado</span>
              </div>
            </div>
          </div>

          {pagamentos.length === 0 ? (
            <EstadoVazio icone="carteira" titulo="Nenhum pagamento ainda">
              Quando um paciente pagar uma consulta via PIX, o comprovante aparecerá aqui.
            </EstadoVazio>
          ) : (
            <div className="tabela-container">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Consulta</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Comprovante</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pagamentos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className="celula-pessoa">
                          <Avatar nome={p.pagador.nome} tamanho={32} />
                          {p.pagador.nome}
                        </span>
                      </td>
                      <td>{formatarDataHora(p.consulta.dataHora)}</td>
                      <td>
                        <strong>R$ {p.valor.toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`tag status-${p.status}`}>{LABEL_STATUS_PAGAMENTO[p.status]}</span>
                      </td>
                      <td>
                        <code>{p.numeroComprovante}</code>
                      </td>
                      <td>
                        <Link
                          to={`/comprovantes/${p.id}`}
                          className={`botao botao-pequeno ${p.status === "em_analise" ? "botao-primario" : "botao-secundario"}`}
                        >
                          {p.status === "em_analise" ? "Conferir" : "Ver"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
