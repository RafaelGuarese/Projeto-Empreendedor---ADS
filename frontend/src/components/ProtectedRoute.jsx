import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, tiposPermitidos }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="mensagem-carregando">Carregando...</div>;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (tiposPermitidos && !tiposPermitidos.includes(usuario.tipoUsuario)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
