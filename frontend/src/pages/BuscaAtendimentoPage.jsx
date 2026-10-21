import { useEffect, useState } from "react";

import api from "../api/client.js";
import CardEstagiario from "../components/CardEstagiario.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta, CabecalhoPagina, Carregando, EstadoVazio } from "../components/Ui.jsx";

const PERIODOS = ["Manhã", "Tarde", "Noite"];
const FILTROS_VAZIOS = { abordagem: "", especialidade: "", tipoAtendimento: "", horario: "", precoMax: "" };

export default function BuscaAtendimentoPage() {
  const [opcoes, setOpcoes] = useState({ abordagens: [], especialidades: [] });
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
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

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
    setResultados([]);
    setTotal(null);
    setErro(null);
    setBuscaRealizada(false);
  }

  const temFiltro = Object.values(filtros).some((v) => v);

  return (
    <div className="conteudo">
      <CabecalhoPagina
        sobretitulo="Encontre seu atendimento"
        titulo="Buscar atendimento"
        subtitulo="Escolha o que é importante para você e veja os estagiários disponíveis."
      />

      <div className="busca-layout">
        <aside className="painel-lateral">
          <div className="painel-lateral-titulo">
            <Icone nome="filtro" tamanho={18} /> Filtros
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              buscar();
            }}
          >
            <div className="campo">
              <label htmlFor="especialidade">O que você precisa?</label>
              <select id="especialidade" value={filtros.especialidade} onChange={(e) => atualizarFiltro("especialidade", e.target.value)}>
                <option value="">Qualquer necessidade</option>
                {opcoes.especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp.charAt(0).toUpperCase() + esp.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="abordagem">Abordagem psicológica</label>
              <select id="abordagem" value={filtros.abordagem} onChange={(e) => atualizarFiltro("abordagem", e.target.value)}>
                <option value="">Qualquer abordagem</option>
                {opcoes.abordagens.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <span className="rotulo">Tipo de atendimento</span>
              <div className="segmentado" style={{ display: "flex" }}>
                {[
                  { valor: "", texto: "Todos" },
                  { valor: "presencial", texto: "Presencial" },
                  { valor: "online", texto: "Online" },
                ].map((op) => (
                  <button
                    key={op.valor || "todos"}
                    type="button"
                    style={{ flex: 1, justifyContent: "center", padding: "8px 6px" }}
                    className={filtros.tipoAtendimento === op.valor ? "ativo" : ""}
                    onClick={() => atualizarFiltro("tipoAtendimento", op.valor)}
                  >
                    {op.texto}
                  </button>
                ))}
              </div>
            </div>

            <div className="campo">
              <span className="rotulo">Período</span>
              <div className="chips">
                {PERIODOS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`chip ${filtros.horario === p ? "ativo" : ""}`}
                    onClick={() => atualizarFiltro("horario", filtros.horario === p ? "" : p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="campo">
              <label htmlFor="precoMax">Valor máximo por sessão</label>
              <input
                id="precoMax"
                type="number"
                min="0"
                value={filtros.precoMax}
                onChange={(e) => atualizarFiltro("precoMax", e.target.value)}
                placeholder="Ex: 100"
              />
            </div>

            <button className="botao botao-primario botao-bloco" type="submit" disabled={carregando}>
              <Icone nome="busca" tamanho={18} />
              {carregando ? "Buscando..." : "Buscar"}
            </button>
            {temFiltro && (
              <button type="button" className="botao botao-texto botao-bloco" style={{ marginTop: 6 }} onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </form>
        </aside>

        <section>
          {erro && <Alerta tipo="aviso">{erro}</Alerta>}

          {buscaRealizada && !erro && !carregando && (
            <div className="resultados-cabecalho">
              <span className="contagem">
                {total === 1 ? "1 estagiário encontrado" : `${total ?? 0} estagiários encontrados`}
              </span>
              <div className="campo">
                <select value={ordenarPor} onChange={(e) => aoMudarOrdenacao(e.target.value)} aria-label="Ordenar resultados">
                  <option value="avaliacao">Ordenar por: melhor avaliação</option>
                  <option value="preco_asc">Ordenar por: menor preço</option>
                  <option value="preco_desc">Ordenar por: maior preço</option>
                  <option value="disponibilidade">Ordenar por: mais horários</option>
                </select>
              </div>
            </div>
          )}

          {carregando && <Carregando texto="Buscando estagiários disponíveis..." />}

          {!carregando && buscaRealizada && resultados.length === 0 && !erro && (
            <EstadoVazio icone="busca" titulo="Nenhum estagiário encontrado">
              {mensagem || "Tente remover algum filtro ou escolher outro período."}
            </EstadoVazio>
          )}

          {!carregando && resultados.length > 0 && (
            <div className="grid-cards">
              {resultados.map((estagiario) => (
                <CardEstagiario key={estagiario.id} estagiario={estagiario} />
              ))}
            </div>
          )}

          {!buscaRealizada && !erro && (
            <EstadoVazio icone="filtro" titulo="Comece pelos filtros">
              Escolha ao menos um filtro ao lado — por exemplo, a sua necessidade — e clique em "Buscar".
            </EstadoVazio>
          )}
        </section>
      </div>
    </div>
  );
}
