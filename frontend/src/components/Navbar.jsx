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
      <span className="marca">Psicoliga</span>
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
