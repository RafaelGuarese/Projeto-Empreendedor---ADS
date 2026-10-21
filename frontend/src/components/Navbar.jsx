import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import Icone from "./Icone.jsx";
import Logo from "./Logo.jsx";

const LINKS = {
  paciente: [
    { para: "/busca", texto: "Buscar atendimento", icone: "busca" },
    { para: "/agendamentos", texto: "Meus agendamentos", icone: "calendario" },
  ],
  estagiario: [
    { para: "/agendamentos", texto: "Agenda", icone: "calendario" },
    { para: "/pagamentos", texto: "Pagamentos", icone: "carteira" },
    { para: "/prontuarios", texto: "Prontuários", icone: "prontuario" },
    { para: "/meu-perfil", texto: "Meu perfil", icone: "usuario" },
  ],
  professor: [{ para: "/prontuarios", texto: "Prontuários", icone: "prontuario" }],
};

const LABEL_PAPEL = { paciente: "Paciente", estagiario: "Estagiário(a)", professor: "Professor(a) orientador(a)" };

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();

  function sair() {
    logout();
    navegar("/login");
  }

  const links = LINKS[usuario?.tipoUsuario] || [];

  return (
    <header className="navbar">
      <div className="navbar-interno">
        <div className="navbar-marca">
          <button className="botao-home" onClick={() => navegar("/dashboard")} aria-label="Ir para a tela inicial" title="Início">
            <Icone nome="casa" tamanho={19} />
          </button>
          <Logo tamanho={30} />
        </div>

        <nav className="nav-links" aria-label="Navegação principal">
          {links.map((link) => (
            <NavLink key={link.para} to={link.para} className={({ isActive }) => `nav-link ${isActive ? "ativo" : ""}`}>
              <Icone nome={link.icone} tamanho={17} />
              {link.texto}
            </NavLink>
          ))}
        </nav>

        {usuario && (
          <div className="usuario-menu">
            <Avatar nome={usuario.nome} tamanho={36} />
            <div className="usuario-identificacao">
              <span className="usuario-nome">{usuario.nome}</span>
              <span className="usuario-papel">{LABEL_PAPEL[usuario.tipoUsuario]}</span>
            </div>
            <button className="botao-sair" onClick={sair} title="Sair">
              <Icone nome="sair" tamanho={18} />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
