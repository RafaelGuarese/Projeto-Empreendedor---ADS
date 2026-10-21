import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { Carregando } from "./Ui.jsx";

export default function ProtectedRoute({ children, tiposPermitidos }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <Carregando />;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (tiposPermitidos && !tiposPermitidos.includes(usuario.tipoUsuario)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
