import { useEffect, useState } from "react";

import api from "../api/client.js";
import Avatar from "../components/Avatar.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta, CabecalhoPagina, Carregando, EstadoVazio } from "../components/Ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const FORMULARIO_VAZIO = { id: null, dataSessao: "", duracao: "50", descricao: "", observacoes: "" };

function hojeIso() {
  return new Date().toLocaleDateString("sv-SE");
}

function formatarData(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatarDataLonga(iso) {
  const texto = new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function ProntuarioPage() {
  const { usuario } = useAuth();
  const ehProfessor = usuario?.tipoUsuario === "professor";

  const [estagiarios, setEstagiarios] = useState([]);
  const [estagiarioId, setEstagiarioId] = useState("");
  const [busca, setBusca] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [carregandoPacientes, setCarregandoPacientes] = useState(false);
  const [versaoLista, setVersaoLista] = useState(0);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [carregandoRegistros, setCarregandoRegistros] = useState(false);
  const [formulario, setFormulario] = useState(null);
  const [camposInvalidos, setCamposInvalidos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const parametros = ehProfessor ? { estagiarioId } : {};
  const podeConsultar = !ehProfessor || Boolean(estagiarioId);

  useEffect(() => {
    if (!ehProfessor) return;
    api
      .get("/prontuarios/estagiarios")
      .then(({ data }) => setEstagiarios(data.estagiarios))
      .catch((err) => setErro(err.response?.data?.mensagem || "Não foi possível carregar os estagiários."));
  }, [ehProfessor]);

  // RNF6.3 - busca de pacientes do prontuário
  useEffect(() => {
    if (!podeConsultar) {
      setPacientes([]);
      return undefined;
    }

    setCarregandoPacientes(true);
    const espera = setTimeout(() => {
      api
        .get("/prontuarios/pacientes", { params: { ...parametros, busca } })
        .then(({ data }) => setPacientes(data.pacientes))
        .catch((err) => setErro(err.response?.data?.mensagem || "Não foi possível carregar os pacientes."))
        .finally(() => setCarregandoPacientes(false));
    }, 300);

    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, estagiarioId, versaoLista]);

  async function abrirPaciente(paciente) {
    setPacienteSelecionado(paciente);
    setFormulario(null);
    setMensagem(null);
    setErro(null);
    setCarregandoRegistros(true);

    try {
      const { data } = await api.get(`/prontuarios/pacientes/${paciente.id}/registros`, { params: parametros });
      setRegistros(data.registros);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível carregar o prontuário.");
      setRegistros([]);
    } finally {
      setCarregandoRegistros(false);
    }
  }

  function trocarEstagiario(id) {
    setEstagiarioId(id);
    setPacienteSelecionado(null);
    setRegistros([]);
  }

  function abrirFormulario(dados) {
    setMensagem(null);
    setErro(null);
    setCamposInvalidos([]);
    setFormulario(dados);
  }

  function editarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setCamposInvalidos((atual) => atual.filter((c) => c !== campo));
  }

  function validar() {
    const invalidos = [];
    if (!formulario.dataSessao || formulario.dataSessao > hojeIso()) invalidos.push("dataSessao");
    const duracao = Number(formulario.duracao);
    if (!Number.isInteger(duracao) || duracao <= 0) invalidos.push("duracao");
    if (!formulario.descricao.trim()) invalidos.push("descricao");
    return invalidos;
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);

    const invalidos = validar();
    if (invalidos.length) {
      setCamposInvalidos(invalidos);
      setErro(
        invalidos.includes("dataSessao") && formulario.dataSessao > hojeIso()
          ? "A data da sessão não pode ser futura."
          : "Preencha os campos obrigatórios antes de salvar."
      );
      return;
    }

    setSalvando(true);
    const corpo = {
      dataSessao: formulario.dataSessao,
      duracao: Number(formulario.duracao),
      descricao: formulario.descricao,
      observacoes: formulario.observacoes,
    };

    try {
      const { data } = formulario.id
        ? await api.put(`/prontuarios/registros/${formulario.id}`, corpo)
        : await api.post(`/prontuarios/pacientes/${pacienteSelecionado.id}/registros`, corpo);

      setFormulario(null);
      await abrirPaciente(pacienteSelecionado);
      setMensagem(data.mensagem);
      setVersaoLista((v) => v + 1);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível salvar o registro.");
    } finally {
      setSalvando(false);
    }
  }

  const classeCampo = (campo) => (camposInvalidos.includes(campo) ? "campo campo-invalido" : "campo");

  return (
    <div className="conteudo">
      <CabecalhoPagina
        titulo="Prontuário eletrônico"
        subtitulo={
          ehProfessor
            ? "Acompanhe os registros de sessão dos estagiários que você supervisiona."
            : "Registre e consulte as sessões dos seus pacientes."
        }
        acoes={
          <span className="aviso-seguranca">
            <Icone nome="escudo" tamanho={17} />
            {ehProfessor ? "Somente leitura · conteúdo criptografado" : "Conteúdo criptografado e sigiloso"}
          </span>
        }
      />

      <div className="busca-layout">
        <aside className="painel-lateral">
          {ehProfessor && (
            <div className="campo">
              <label htmlFor="estagiario">Estagiário supervisionado</label>
              <select id="estagiario" value={estagiarioId} onChange={(e) => trocarEstagiario(e.target.value)}>
                <option value="">Selecione...</option>
                {estagiarios.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nome}
                  </option>
                ))}
              </select>
              {estagiarios.length === 0 && <p className="campo-ajuda">Nenhum estagiário vinculado a você ainda.</p>}
            </div>
          )}

          <div className="campo">
            <label htmlFor="busca">Pacientes</label>
            <input
              id="busca"
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pelo nome"
              disabled={!podeConsultar}
            />
          </div>

          {podeConsultar && !carregandoPacientes && pacientes.length === 0 && (
            <p className="campo-ajuda">
              {busca ? "Nenhum paciente encontrado." : "Nenhum paciente com consulta confirmada ainda."}
            </p>
          )}

          <ul className="lista-pacientes">
            {pacientes.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={`item-paciente ${pacienteSelecionado?.id === p.id ? "ativo" : ""}`}
                  onClick={() => abrirPaciente(p)}
                >
                  <Avatar nome={p.nome} tamanho={36} />
                  <span>
                    <span className="nome">{p.nome}</span>
                    <span className="detalhe">
                      {p.totalRegistros === 1 ? "1 sessão" : `${p.totalRegistros} sessões`}
                      {p.ultimaSessao ? ` · última em ${formatarData(p.ultimaSessao)}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section>
          {erro && <Alerta tipo="erro">{erro}</Alerta>}
          {mensagem && <Alerta tipo="sucesso">{mensagem}</Alerta>}

          {!pacienteSelecionado ? (
            <EstadoVazio icone="prontuario" titulo={ehProfessor && !estagiarioId ? "Escolha um estagiário" : "Selecione um paciente"}>
              {ehProfessor && !estagiarioId
                ? "Selecione um estagiário supervisionado para ver os pacientes atendidos."
                : "Escolha um paciente na lista ao lado para ver o histórico de sessões."}
            </EstadoVazio>
          ) : (
            <>
              <div className="cartao" style={{ marginBottom: 18 }}>
                <div className="cartao-cabecalho" style={{ marginBottom: 0 }}>
                  <Avatar nome={pacienteSelecionado.nome} tamanho={48} />
                  <div style={{ flex: 1 }}>
                    <h2>{pacienteSelecionado.nome}</h2>
                    <p>{registros.length === 1 ? "1 sessão registrada" : `${registros.length} sessões registradas`}</p>
                  </div>
                  {!ehProfessor && !formulario && (
                    <button className="botao botao-primario" onClick={() => abrirFormulario({ ...FORMULARIO_VAZIO, dataSessao: hojeIso() })}>
                      <Icone nome="mais" tamanho={18} /> Nova sessão
                    </button>
                  )}
                </div>
              </div>

              {formulario && (
                <form className="cartao" style={{ marginBottom: 18 }} onSubmit={salvar} noValidate>
                  <div className="cartao-cabecalho">
                    <span className="icone-circulo">
                      <Icone nome={formulario.id ? "editar" : "mais"} tamanho={19} />
                    </span>
                    <div>
                      <h3>{formulario.id ? "Editar registro" : "Nova sessão"}</h3>
                      <p>Campos com * são obrigatórios.</p>
                    </div>
                  </div>
                  <div className="grade-2">
                    <div className={classeCampo("dataSessao")}>
                      <label htmlFor="dataSessao">Data da sessão *</label>
                      <input
                        id="dataSessao"
                        type="date"
                        max={hojeIso()}
                        value={formulario.dataSessao}
                        onChange={(e) => editarCampo("dataSessao", e.target.value)}
                      />
                    </div>
                    <div className={classeCampo("duracao")}>
                      <label htmlFor="duracao">Duração (minutos) *</label>
                      <input
                        id="duracao"
                        type="number"
                        min="1"
                        step="1"
                        value={formulario.duracao}
                        onChange={(e) => editarCampo("duracao", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={classeCampo("descricao")}>
                    <label htmlFor="descricao">Descrição do atendimento *</label>
                    <textarea
                      id="descricao"
                      rows={5}
                      value={formulario.descricao}
                      onChange={(e) => editarCampo("descricao", e.target.value)}
                      placeholder="Temas trabalhados, intervenções realizadas, evolução..."
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="observacoes">Observações clínicas</label>
                    <textarea
                      id="observacoes"
                      rows={3}
                      value={formulario.observacoes}
                      onChange={(e) => editarCampo("observacoes", e.target.value)}
                      placeholder="Pontos de atenção, encaminhamentos, próximos passos..."
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="botao botao-primario" type="submit" disabled={salvando}>
                      {salvando ? "Salvando..." : formulario.id ? "Salvar alterações" : "Salvar sessão"}
                    </button>
                    <button
                      type="button"
                      className="botao botao-secundario"
                      onClick={() => {
                        setFormulario(null);
                        setErro(null);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {carregandoRegistros ? (
                <Carregando texto="Carregando histórico..." />
              ) : registros.length === 0 ? (
                <EstadoVazio icone="prontuario" titulo="Nenhuma sessão registrada">
                  {ehProfessor ? "O estagiário ainda não registrou sessões para este paciente." : 'Use "Nova sessão" para registrar o primeiro atendimento.'}
                </EstadoVazio>
              ) : (
                <div className="linha-tempo">
                  {registros.map((r) => (
                    <article key={r.id} className="cartao registro-sessao" style={{ marginTop: 0 }}>
                      <div className="registro-cabecalho">
                        <strong>{formatarDataLonga(r.dataSessao)}</strong>
                        <span className="tag tag-neutra">
                          <Icone nome="relogio" tamanho={13} /> {r.duracao} min
                        </span>
                        {!ehProfessor && !formulario && (
                          <button
                            type="button"
                            className="botao botao-texto botao-pequeno"
                            onClick={() => abrirFormulario({ ...r, duracao: String(r.duracao) })}
                          >
                            <Icone nome="editar" tamanho={15} /> Editar
                          </button>
                        )}
                      </div>
                      <p className="registro-texto">{r.descricao}</p>
                      {r.observacoes && (
                        <p className="registro-texto registro-observacoes">
                          <strong>Observações:</strong> {r.observacoes}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
