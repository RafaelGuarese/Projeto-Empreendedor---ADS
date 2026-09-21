import { useEffect, useState } from "react";

import api from "../api/client.js";
import CardEstagiario from "../components/CardEstagiario.jsx";

const PERIODOS = ["Manhã", "Tarde", "Noite"];

export default function BuscaAtendimentoPage() {
  const [opcoes, setOpcoes] = useState({ abordagens: [], especialidades: [] });
  const [filtros, setFiltros] = useState({
    abordagem: "",
    especialidade: "",
    tipoAtendimento: "",
    horario: "",
    precoMax: "",
  });
  const [ordenarPor, setOrdenarPor] = useState("avaliacao");
  const [resultados, setResultados] = useState([]);
  const [total, setTotal] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  useEffect(() => {
    api
      .get("/atendimentos/filtros")
      .then(({ data }) => setOpcoes(data))
      .catch(() => {});
  }, []);

  function atualizarFiltro(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  async function buscar(ordenarPorParam = ordenarPor) {
    const algumFiltroSelecionado = Object.values(filtros).some((v) => v);

    if (!algumFiltroSelecionado) {
      setErro("Selecione ao menos um filtro para realizar a busca.");
      setResultados([]);
      setTotal(null);
      return;
    }

    setErro(null);
    setCarregando(true);
    setBuscaRealizada(true);

    try {
      const params = { ordenarPor: ordenarPorParam };
      Object.entries(filtros).forEach(([chave, valor]) => {
        if (valor) params[chave] = valor;
      });

      const { data } = await api.get("/atendimentos/buscar", { params });
      setResultados(data.resultados);
      setTotal(data.total);
      setMensagem(data.mensagem || null);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível realizar a busca.");
      setResultados([]);
      setTotal(null);
    } finally {
      setCarregando(false);
    }
  }

  function aoMudarOrdenacao(valor) {
    setOrdenarPor(valor);
    if (buscaRealizada) buscar(valor);
  }

  return (
    <div className="conteudo">
      <div className="dashboard-cabecalho">
        <h1>Buscar Atendimento</h1>
        <p>Encontre estagiários disponíveis conforme sua preferência de abordagem e necessidade.</p>
      </div>

      <div className="busca-layout" style={{ marginTop: 20 }}>
        <aside className="painel-filtros">
          <h3>Filtros</h3>

          <div className="campo">
            <label htmlFor="abordagem">Abordagem psicológica</label>
            <select
              id="abordagem"
              value={filtros.abordagem}
              onChange={(e) => atualizarFiltro("abordagem", e.target.value)}
            >
              <option value="">Qualquer</option>
              {opcoes.abordagens.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="especialidade">Especialidade / necessidade</label>
            <select
              id="especialidade"
              value={filtros.especialidade}
              onChange={(e) => atualizarFiltro("especialidade", e.target.value)}
            >
              <option value="">Qualquer</option>
              {opcoes.especialidades.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="tipoAtendimento">Tipo de atendimento</label>
            <select
              id="tipoAtendimento"
              value={filtros.tipoAtendimento}
              onChange={(e) => atualizarFiltro("tipoAtendimento", e.target.value)}
            >
              <option value="">Qualquer</option>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="horario">Período</label>
            <select id="horario" value={filtros.horario} onChange={(e) => atualizarFiltro("horario", e.target.value)}>
              <option value="">Qualquer</option>
              {PERIODOS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="precoMax">Valor máximo (R$)</label>
            <input
              id="precoMax"
              type="number"
              min="0"
              value={filtros.precoMax}
              onChange={(e) => atualizarFiltro("precoMax", e.target.value)}
              placeholder="Ex: 100"
            />
          </div>

          <button className="botao-primario" onClick={() => buscar()} disabled={carregando}>
            {carregando ? "Buscando..." : "Buscar"}
          </button>
        </aside>

        <section>
          {erro && <div className="alerta alerta-erro">{erro}</div>}

          {buscaRealizada && !erro && (
            <div className="resultados-cabecalho">
              <span className="contagem">
                {total !== null ? `${total} resultado(s) encontrado(s)` : ""}
              </span>
              <div className="campo" style={{ margin: 0, minWidth: 200 }}>
                <select value={ordenarPor} onChange={(e) => aoMudarOrdenacao(e.target.value)}>
                  <option value="avaliacao">Ordenar por: Avaliação</option>
                  <option value="preco_asc">Ordenar por: Menor preço</option>
                  <option value="preco_desc">Ordenar por: Maior preço</option>
                  <option value="disponibilidade">Ordenar por: Disponibilidade</option>
                </select>
              </div>
            </div>
          )}

          {carregando && <div className="mensagem-carregando">Buscando estagiários disponíveis...</div>}

          {!carregando && buscaRealizada && resultados.length === 0 && !erro && (
            <div className="estado-vazio">{mensagem || "Nenhum profissional encontrado."}</div>
          )}

          {!carregando && resultados.length > 0 && (
            <div className="grid-cards">
              {resultados.map((estagiario) => (
                <CardEstagiario key={estagiario.id} estagiario={estagiario} />
              ))}
            </div>
          )}

          {!buscaRealizada && !erro && (
            <div className="estado-vazio">Selecione ao menos um filtro e clique em "Buscar" para ver os resultados.</div>
          )}
        </section>
      </div>
    </div>
  );
}
