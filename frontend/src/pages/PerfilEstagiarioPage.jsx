import { useEffect, useState } from "react";

import api from "../api/client.js";

const LABEL_TIPO_ATENDIMENTO = {
  presencial: "Presencial",
  online: "Online",
  ambos: "Presencial e Online",
};

export default function PerfilEstagiarioPage() {
  const [opcoes, setOpcoes] = useState({
    abordagens: [],
    especialidades: [],
    diasSemana: [],
    periodos: [],
    tiposAtendimento: [],
  });

  const [registroAcademico, setRegistroAcademico] = useState("");
  const [abordagem, setAbordagem] = useState("");
  const [especialidades, setEspecialidades] = useState([]);
  const [tipoAtendimento, setTipoAtendimento] = useState("ambos");
  const [horarios, setHorarios] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState("");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("");
  const [valorConsulta, setValorConsulta] = useState("");

  const [perfilCompleto, setPerfilCompleto] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [{ data: dadosOpcoes }, { data: dadosPerfil }] = await Promise.all([
          api.get("/estagiarios/opcoes"),
          api.get("/estagiarios/meu-perfil"),
        ]);

        setOpcoes(dadosOpcoes);

        const perfil = dadosPerfil.perfil;
        setRegistroAcademico(perfil.registroAcademico || "");
        setAbordagem(perfil.abordagem || "");
        setEspecialidades(perfil.especialidades || []);
        setTipoAtendimento(perfil.tipoAtendimento || "ambos");
        setHorarios(perfil.horariosDisponiveis || []);
        setValorConsulta(perfil.valorConsulta ?? "");
        setPerfilCompleto(perfil.perfilCompleto);
        if (dadosOpcoes.diasSemana.length) setDiaSelecionado(dadosOpcoes.diasSemana[0]);
        if (dadosOpcoes.periodos.length) setPeriodoSelecionado(dadosOpcoes.periodos[0]);
      } catch (err) {
        setErro(err.response?.data?.mensagem || "Não foi possível carregar seu perfil.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, []);

  function alternarEspecialidade(esp) {
    setEspecialidades((atual) => (atual.includes(esp) ? atual.filter((e) => e !== esp) : [...atual, esp]));
  }

  function adicionarHorario() {
    if (!diaSelecionado || !periodoSelecionado) return;
    const novoHorario = `${diaSelecionado} - ${periodoSelecionado}`;
    if (horarios.includes(novoHorario)) return;
    setHorarios((atual) => [...atual, novoHorario]);
  }

  function removerHorario(horario) {
    setHorarios((atual) => atual.filter((h) => h !== horario));
  }

  async function salvar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!abordagem) {
      setErro("Selecione uma abordagem.");
      return;
    }
    if (especialidades.length === 0) {
      setErro("Selecione ao menos uma especialidade/necessidade atendida.");
      return;
    }
    if (horarios.length === 0) {
      setErro("Adicione ao menos um horário disponível.");
      return;
    }
    if (!valorConsulta || Number(valorConsulta) <= 0) {
      setErro("Informe um valor de consulta válido.");
      return;
    }

    setSalvando(true);

    try {
      const { data } = await api.put("/estagiarios/meu-perfil", {
        registroAcademico,
        abordagem,
        especialidades,
        tipoAtendimento,
        horariosDisponiveis: horarios,
        valorConsulta: Number(valorConsulta),
      });
      setSucesso(data.mensagem);
      setPerfilCompleto(true);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível salvar seu perfil.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <div className="conteudo mensagem-carregando">Carregando seu perfil...</div>;
  }

  return (
    <div className="conteudo" style={{ maxWidth: 640 }}>
      <div className="dashboard-cabecalho">
        <h1>Meu Perfil de Atendimento</h1>
        <p>Preencha estes dados para aparecer nas buscas dos pacientes (RF2).</p>
      </div>

      {!perfilCompleto && !sucesso && (
        <div className="alerta alerta-erro" style={{ marginTop: 16 }}>
          Seu perfil ainda não está completo. Enquanto isso, você não aparece nos resultados de busca dos pacientes.
        </div>
      )}

      <form onSubmit={salvar} style={{ marginTop: 20 }}>
        {erro && <div className="alerta alerta-erro">{erro}</div>}
        {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

        <div className="campo">
          <label htmlFor="registroAcademico">Registro acadêmico (matrícula)</label>
          <input
            id="registroAcademico"
            value={registroAcademico}
            onChange={(e) => setRegistroAcademico(e.target.value)}
            placeholder="Ex: 2026001"
          />
        </div>

        <div className="campo">
          <label htmlFor="abordagem">Abordagem psicológica</label>
          <select id="abordagem" value={abordagem} onChange={(e) => setAbordagem(e.target.value)}>
            <option value="">Selecione...</option>
            {opcoes.abordagens.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Especialidades / necessidades atendidas</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {opcoes.especialidades.map((esp) => (
              <label key={esp} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 400, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={especialidades.includes(esp)}
                  onChange={() => alternarEspecialidade(esp)}
                />
                {esp}
              </label>
            ))}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="tipoAtendimento">Tipo de atendimento</label>
          <select id="tipoAtendimento" value={tipoAtendimento} onChange={(e) => setTipoAtendimento(e.target.value)}>
            {opcoes.tiposAtendimento.map((t) => (
              <option key={t} value={t}>
                {LABEL_TIPO_ATENDIMENTO[t] || t}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Horários disponíveis</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <select value={diaSelecionado} onChange={(e) => setDiaSelecionado(e.target.value)} style={{ flex: 1 }}>
              {opcoes.diasSemana.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={periodoSelecionado} onChange={(e) => setPeriodoSelecionado(e.target.value)} style={{ flex: 1 }}>
              {opcoes.periodos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="button" className="botao-secundario" style={{ width: "auto", padding: "0 16px" }} onClick={adicionarHorario}>
              Adicionar
            </button>
          </div>

          {horarios.length === 0 && <p style={{ fontSize: 13, color: "var(--cor-texto-suave)" }}>Nenhum horário adicionado ainda.</p>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {horarios.map((h) => (
              <span key={h} className="abordagem-tag" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {h}
                <button
                  type="button"
                  onClick={() => removerHorario(h)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--cor-primaria-escura)" }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="valorConsulta">Valor da consulta (R$)</label>
          <input
            id="valorConsulta"
            type="number"
            min="0"
            step="0.01"
            value={valorConsulta}
            onChange={(e) => setValorConsulta(e.target.value)}
            placeholder="Ex: 80.00"
          />
        </div>

        <button className="botao-primario" type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar perfil"}
        </button>
      </form>
    </div>
  );
}
