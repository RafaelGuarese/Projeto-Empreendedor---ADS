import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/client.js";
import Icone from "../components/Icone.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { partesData } from "../utils/agenda.js";

const ACOES = {
  paciente: [
    {
      para: "/busca",
      icone: "busca",
      titulo: "Buscar atendimento",
      texto: "Encontre estagiários por abordagem, necessidade, horário e tipo de atendimento.",
      link: "Começar busca",
    },
    {
      para: "/agendamentos",
      icone: "calendario",
      titulo: "Meus agendamentos",
      texto: "Acompanhe, pague, remarque ou cancele suas consultas.",
      link: "Ver agendamentos",
      variante: "secundario",
    },
  ],
  estagiario: [
    {
      para: "/agendamentos",
      icone: "calendario",
      titulo: "Minha agenda",
      texto: "Consultas marcadas pelos pacientes e cancelamentos.",
      link: "Ver agenda",
    },
    {
      para: "/pagamentos",
      icone: "carteira",
      titulo: "Pagamentos recebidos",
      texto: "Confira os comprovantes PIX e confirme os recebimentos.",
      link: "Ver pagamentos",
      variante: "secundario",
    },
    {
      para: "/prontuarios",
      icone: "prontuario",
      titulo: "Prontuários",
      texto: "Registre as sessões e consulte o histórico dos pacientes.",
      link: "Abrir prontuários",
    },
    {
      para: "/meu-perfil",
      icone: "usuario",
      titulo: "Meu perfil de atendimento",
      texto: "Abordagem, horários, valor da consulta e chave PIX.",
      link: "Editar perfil",
      variante: "secundario",
    },
  ],
  professor: [
    {
      para: "/prontuarios",
      icone: "pessoas",
      titulo: "Estagiários supervisionados",
      texto: "Acompanhe os prontuários dos pacientes atendidos pelos seus orientandos (somente leitura).",
      link: "Ver prontuários",
    },
  ],
};

const SUBTITULO = {
  paciente: "Que bom ter você aqui. Como podemos ajudar hoje?",
  estagiario: "Aqui está um resumo da sua prática supervisionada.",
  professor: "Acompanhe o trabalho dos estagiários sob sua orientação.",
};

const CTA = {
  paciente: { para: "/busca", texto: "Agendar uma consulta", icone: "busca" },
  estagiario: { para: "/prontuarios", texto: "Registrar sessão", icone: "mais" },
  professor: { para: "/prontuarios", texto: "Abrir prontuários", icone: "prontuario" },
};

function ProximaConsulta({ consulta, tipoUsuario }) {
  const partes = partesData(consulta.dataHora);
  const contraparte = tipoUsuario === "paciente" ? consulta.estagiario : consulta.paciente;
  const aguardandoPagamento = consulta.status === "aguardando_pagamento";

  return (
    <div className="proxima-consulta">
      <div className="bloco-data">
        <span className="dia">{partes.dia}</span>
        <span className="mes">{partes.mes}</span>
      </div>
      <div className="proxima-consulta-info">
        <span className="rotulo-pequeno">{aguardandoPagamento ? "Reserva aguardando pagamento" : "Próxima consulta"}</span>
        <strong>{contraparte?.nome}</strong>
        <span>
          {partes.semanaLonga}, às {partes.hora} · {consulta.tipo === "online" ? "Online" : "Presencial"}
        </span>
      </div>
      {aguardandoPagamento && tipoUsuario === "paciente" ? (
        <Link to={`/pagamento/${consulta.id}`} className="botao botao-destaque">
          <Icone nome="pix" tamanho={18} /> Pagar com PIX
        </Link>
      ) : consulta.status === "agendada" && consulta.linkVideo ? (
        <a href={consulta.linkVideo} target="_blank" rel="noopener noreferrer" className="botao botao-destaque">
          <Icone nome="video" tamanho={18} /> Entrar na videochamada
        </a>
      ) : (
        <Link to="/agendamentos" className="botao botao-secundario">
          Ver detalhes
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [proxima, setProxima] = useState(null);

  const tipo = usuario?.tipoUsuario;

  useEffect(() => {
    if (!["paciente", "estagiario"].includes(tipo)) return;

    api
      .get("/consultas/minhas")
      .then(({ data }) => {
        const agora = new Date();
        const futuras = data.consultas.filter(
          (c) => ["agendada", "aguardando_pagamento"].includes(c.status) && new Date(c.dataHora) >= agora
        );
        setProxima(futuras[0] || null);
      })
      .catch(() => setProxima(null));
  }, [tipo]);

  const primeiroNome = usuario?.nome?.split(" ")[0];
  const dataPorExtenso = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const hoje = dataPorExtenso.charAt(0).toUpperCase() + dataPorExtenso.slice(1);
  const cta = CTA[tipo];

  return (
    <div className="conteudo">
      <section className="saudacao">
        <div>
          <span className="data-hoje">{hoje}</span>
          <h1>Olá, {primeiroNome}!</h1>
          <p>{SUBTITULO[tipo]}</p>
        </div>
        {cta && (
          <button className="botao botao-grande" onClick={() => navegar(cta.para)}>
            <Icone nome={cta.icone} tamanho={19} /> {cta.texto}
          </button>
        )}
      </section>

      {proxima && <ProximaConsulta consulta={proxima} tipoUsuario={tipo} />}

      <div className="acoes-grid">
        {(ACOES[tipo] || []).map((acao) => (
          <button key={acao.para} className="acao-card" onClick={() => navegar(acao.para)}>
            <span className={`icone-circulo ${acao.variante === "secundario" ? "icone-circulo-secundario" : ""}`}>
              <Icone nome={acao.icone} tamanho={21} />
            </span>
            <h3>{acao.titulo}</h3>
            <p>{acao.texto}</p>
            <span className="acao-link">
              {acao.link} <Icone nome="seta" tamanho={16} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
