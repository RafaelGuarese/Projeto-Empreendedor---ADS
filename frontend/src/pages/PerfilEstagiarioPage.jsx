import { useEffect, useState } from "react";

import api from "../api/client.js";
import Icone from "../components/Icone.jsx";
import { Alerta, CabecalhoPagina, Carregando } from "../components/Ui.jsx";

const LABEL_TIPO_ATENDIMENTO = {
  presencial: "Presencial",
  online: "Online",
  ambos: "Presencial e online",
};

const ICONE_TIPO_ATENDIMENTO = { presencial: "local", online: "video", ambos: "pessoas" };

const CHAVE_PIX = {
  cpf: { label: "CPF", placeholder: "000.000.000-00" },
  cnpj: { label: "CNPJ", placeholder: "00.000.000/0000-00" },
  email: { label: "E-mail", placeholder: "seuemail@exemplo.com" },
  telefone: { label: "Telefone", placeholder: "(54) 99999-9999" },
  aleatoria: { label: "Chave aleatória", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
};

function Secao({ icone, titulo, descricao, children }) {
  return (
    <section className="cartao">
      <div className="cartao-cabecalho">
        <span className="icone-circulo">
          <Icone nome={icone} tamanho={20} />
        </span>
        <div>
          <h2>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function PerfilEstagiarioPage() {
  const [opcoes, setOpcoes] = useState({
    abordagens: [],
    especialidades: [],
    diasSemana: [],
    periodos: [],
    tiposAtendimento: [],
    tiposChavePix: [],
  });
  const [professores, setProfessores] = useState([]);

  const [registroAcademico, setRegistroAcademico] = useState("");
  const [abordagem, setAbordagem] = useState("");
  const [especialidades, setEspecialidades] = useState([]);
  const [tipoAtendimento, setTipoAtendimento] = useState("ambos");
  const [horarios, setHorarios] = useState([]);
  const [valorConsulta, setValorConsulta] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [professorId, setProfessorId] = useState("");

  const [perfilCompleto, setPerfilCompleto] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  useEffect(() => {
    async function carregar() {
      try {
        const [{ data: dadosOpcoes }, { data: dadosPerfil }, { data: dadosProfessores }] = await Promise.all([
          api.get("/estagiarios/opcoes"),
          api.get("/estagiarios/meu-perfil"),
          api.get("/estagiarios/professores"),
        ]);

        setOpcoes(dadosOpcoes);
        setProfessores(dadosProfessores.professores);

        const perfil = dadosPerfil.perfil;
        setRegistroAcademico(perfil.registroAcademico || "");
        setAbordagem(perfil.abordagem || "");
        setEspecialidades(perfil.especialidades || []);
        setTipoAtendimento(perfil.tipoAtendimento || "ambos");
        setHorarios(perfil.horariosDisponiveis || []);
        setValorConsulta(perfil.valorConsulta ?? "");
        setTipoChavePix(perfil.tipoChavePix || "");
        setChavePix(perfil.chavePix || "");
        setProfessorId(perfil.professorId ? String(perfil.professorId) : "");
        setPerfilCompleto(perfil.perfilCompleto);
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

  function alternarHorario(dia, periodo) {
    const horario = `${dia} - ${periodo}`;
    setHorarios((atual) => {
      const novos = atual.includes(horario) ? atual.filter((h) => h !== horario) : [...atual, horario];
      const ordem = (h) => {
        const [d, p] = h.split(" - ");
        return opcoes.diasSemana.indexOf(d) * 10 + opcoes.periodos.indexOf(p);
      };
      return novos.sort((a, b) => ordem(a) - ordem(b));
    });
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
      setErro("Marque ao menos um horário disponível na grade.");
      return;
    }
    if (!valorConsulta || Number(valorConsulta) <= 0) {
      setErro("Informe um valor de consulta válido.");
      return;
    }
    if (!tipoChavePix || !chavePix.trim()) {
      setErro("Cadastre sua chave PIX para receber os pagamentos das consultas.");
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
        tipoChavePix,
        chavePix,
        professorId: professorId ? Number(professorId) : null,
      });
      setChavePix(data.perfil.chavePix);
      setSucesso(data.mensagem);
      setPerfilCompleto(true);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível salvar seu perfil.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="conteudo">
        <Carregando texto="Carregando seu perfil..." />
      </div>
    );
  }

  return (
    <div className="conteudo conteudo-estreito">
      <CabecalhoPagina
        titulo="Meu perfil de atendimento"
        subtitulo="Estas informações aparecem para os pacientes na busca e no agendamento."
      />

      {!perfilCompleto && !sucesso && (
        <Alerta tipo="aviso">
          <strong>Perfil incompleto.</strong> Enquanto isso, você não aparece nas buscas nem pode receber agendamentos.
        </Alerta>
      )}

      <form onSubmit={salvar} noValidate>
        <Secao icone="usuario" titulo="Sobre o atendimento" descricao="Como você trabalha e quanto cobra por sessão.">
          <div className="grade-2">
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
              <label htmlFor="valorConsulta">Valor da sessão (R$)</label>
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
          </div>

          <div className="campo">
            <span className="rotulo">Tipo de atendimento</span>
            <div className="segmentado">
              {opcoes.tiposAtendimento.map((t) => (
                <button key={t} type="button" className={tipoAtendimento === t ? "ativo" : ""} onClick={() => setTipoAtendimento(t)}>
                  <Icone nome={ICONE_TIPO_ATENDIMENTO[t]} tamanho={17} />
                  {LABEL_TIPO_ATENDIMENTO[t] || t}
                </button>
              ))}
            </div>
          </div>

          <div className="campo" style={{ marginBottom: 0 }}>
            <label htmlFor="registroAcademico">Registro acadêmico (matrícula)</label>
            <input
              id="registroAcademico"
              value={registroAcademico}
              onChange={(e) => setRegistroAcademico(e.target.value)}
              placeholder="Ex: 2026001"
            />
          </div>
        </Secao>

        <Secao icone="coracao" titulo="Especialidades" descricao="Toque para marcar as necessidades que você atende.">
          <div className="chips">
            {opcoes.especialidades.map((esp) => (
              <button
                key={esp}
                type="button"
                className={`chip ${especialidades.includes(esp) ? "ativo" : ""}`}
                aria-pressed={especialidades.includes(esp)}
                onClick={() => alternarEspecialidade(esp)}
              >
                {especialidades.includes(esp) && <Icone nome="check" tamanho={14} />}
                {esp}
              </button>
            ))}
          </div>
        </Secao>

        <Secao
          icone="calendario"
          titulo="Horários disponíveis"
          descricao="Marque os períodos em que você atende toda semana. Manhã 9h · Tarde 14h · Noite 19h."
        >
          <div className="grade-horarios" role="group" aria-label="Grade de horários">
            <span />
            {opcoes.periodos.map((p) => (
              <span key={p} className="grade-horarios-titulo">
                {p}
              </span>
            ))}
            {opcoes.diasSemana.map((dia) => (
              <div key={dia} className="grade-horarios-linha">
                <span className="grade-horarios-dia">{dia}</span>
                {opcoes.periodos.map((periodo) => {
                  const ativo = horarios.includes(`${dia} - ${periodo}`);
                  return (
                    <button
                      key={periodo}
                      type="button"
                      className={`celula-horario ${ativo ? "ativo" : ""}`}
                      aria-pressed={ativo}
                      aria-label={`${dia} - ${periodo}`}
                      onClick={() => alternarHorario(dia, periodo)}
                    >
                      {ativo && <Icone nome="check" tamanho={16} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="campo-ajuda">
            {horarios.length === 0
              ? "Nenhum horário marcado ainda."
              : `${horarios.length} ${horarios.length === 1 ? "período marcado" : "períodos marcados"} por semana.`}
          </p>
        </Secao>

        <Secao icone="pix" titulo="Recebimento via PIX" descricao="Os pacientes pagam a sessão diretamente nesta chave.">
          <div className="grade-chave-pix">
            <div className="campo">
              <label htmlFor="tipoChavePix">Tipo de chave</label>
              <select id="tipoChavePix" value={tipoChavePix} onChange={(e) => setTipoChavePix(e.target.value)}>
                <option value="">Selecione...</option>
                {opcoes.tiposChavePix.map((t) => (
                  <option key={t} value={t}>
                    {CHAVE_PIX[t]?.label || t}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="chavePix">Chave PIX</label>
              <input
                id="chavePix"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder={CHAVE_PIX[tipoChavePix]?.placeholder || "Escolha o tipo de chave primeiro"}
                disabled={!tipoChavePix}
              />
            </div>
          </div>
        </Secao>

        <Secao icone="pessoas" titulo="Supervisão" descricao="Seu professor orientador pode ler os prontuários dos seus pacientes.">
          <div className="campo" style={{ marginBottom: 0 }}>
            <label htmlFor="professorId">Professor orientador</label>
            <select id="professorId" value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
              <option value="">Sem orientador definido</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                  {p.departamento ? ` — ${p.departamento}` : ""}
                </option>
              ))}
            </select>
          </div>
        </Secao>

        <div className="barra-salvar">
          {erro && <Alerta tipo="erro">{erro}</Alerta>}
          {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}
          <button className="botao botao-primario botao-bloco botao-grande" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}
