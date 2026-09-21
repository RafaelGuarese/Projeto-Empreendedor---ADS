import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CadastroPage from "./pages/CadastroPage.jsx";
import EsqueciSenhaPage from "./pages/EsqueciSenhaPage.jsx";
import ResetarSenhaPage from "./pages/ResetarSenhaPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BuscaAtendimentoPage from "./pages/BuscaAtendimentoPage.jsx";
import PerfilEstagiarioPage from "./pages/PerfilEstagiarioPage.jsx";

function AreaAutenticada({ children }) {
  return (
    <div className="app-shell">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="mensagem-carregando">Carregando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/cadastro" element={usuario ? <Navigate to="/dashboard" /> : <CadastroPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route path="/resetar-senha/:token" element={<ResetarSenhaPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AreaAutenticada>
              <DashboardPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/busca"
        element={
          <ProtectedRoute tiposPermitidos={["paciente"]}>
            <AreaAutenticada>
              <BuscaAtendimentoPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/meu-perfil"
        element={
          <ProtectedRoute tiposPermitidos={["estagiario"]}>
            <AreaAutenticada>
              <PerfilEstagiarioPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={usuario ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}
