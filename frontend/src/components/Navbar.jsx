import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navegar = useNavigate();

  function sair() {
    logout();
    navegar("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-marca">
        <button className="botao-home" onClick={() => navegar("/dashboard")} aria-label="Ir para a tela inicial" title="Início">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11.5 12 4l9 7.5" />
            <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
          </svg>
        </button>
        <span className="marca">Psicoliga</span>
      </div>
      {usuario && (
        <div className="usuario-info">
          <span>{usuario.nome}</span>
          <span className="perfil-tag">{usuario.tipoUsuario}</span>
          <button className="botao-sair" onClick={sair}>
            Sair
          </button>
        </div>
      )}
    </header>
  );
}
