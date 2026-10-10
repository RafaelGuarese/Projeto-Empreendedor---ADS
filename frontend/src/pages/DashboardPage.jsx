import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function DashboardPage() {
  const { usuario } = useAuth();
  const navegar = useNavigate();

  return (
    <div className="conteudo">
      <div className="dashboard-cabecalho">
        <h1>Olá, {usuario?.nome}</h1>
        <p>Bem-vindo(a) à sua área do Psicoliga.</p>
      </div>

      {usuario?.tipoUsuario === "paciente" && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Buscar Atendimento</h3>
            <p>Encontre estagiários de psicologia por abordagem, especialidade, horário e tipo de atendimento.</p>
            <button className="botao-primario" onClick={() => navegar("/busca")}>
              Buscar agora
            </button>
          </div>
          <div className="dashboard-card">
            <h3>Meus Agendamentos</h3>
            <p>Acompanhe, remarque ou cancele suas consultas agendadas.</p>
            <button className="botao-primario" onClick={() => navegar("/agendamentos")}>
              Ver agendamentos
            </button>
          </div>
        </div>
      )}

      {usuario?.tipoUsuario === "estagiario" && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Meu Perfil de Atendimento</h3>
            <p>Preencha sua abordagem, especialidades, horários e valor da consulta para aparecer nas buscas dos pacientes.</p>
            <button className="botao-primario" onClick={() => navegar("/meu-perfil")}>
              Editar meu perfil
            </button>
          </div>
          <div className="dashboard-card">
            <h3>Minha Agenda</h3>
            <p>Veja as consultas marcadas pelos pacientes e gerencie cancelamentos.</p>
            <button className="botao-primario" onClick={() => navegar("/agendamentos")}>
              Ver agenda
            </button>
          </div>
        </div>
      )}

      {usuario?.tipoUsuario === "professor" && (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Estagiários Supervisionados</h3>
            <p>O acompanhamento de atendimentos supervisionados será disponibilizado em uma próxima etapa.</p>
          </div>
        </div>
      )}
    </div>
  );
}
