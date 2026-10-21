import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { Carregando } from "./components/Ui.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CadastroPage from "./pages/CadastroPage.jsx";
import EsqueciSenhaPage from "./pages/EsqueciSenhaPage.jsx";
import ResetarSenhaPage from "./pages/ResetarSenhaPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BuscaAtendimentoPage from "./pages/BuscaAtendimentoPage.jsx";
import PerfilEstagiarioPage from "./pages/PerfilEstagiarioPage.jsx";
import AgendamentoPage from "./pages/AgendamentoPage.jsx";
import MeusAgendamentosPage from "./pages/MeusAgendamentosPage.jsx";
import PagamentoPage from "./pages/PagamentoPage.jsx";
import ComprovantePage from "./pages/ComprovantePage.jsx";
import PagamentosRecebidosPage from "./pages/PagamentosRecebidosPage.jsx";
import ProntuarioPage from "./pages/ProntuarioPage.jsx";

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
    return <Carregando />;
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

      <Route
        path="/agendar/:estagiarioId"
        element={
          <ProtectedRoute tiposPermitidos={["paciente"]}>
            <AreaAutenticada>
              <AgendamentoPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/agendamentos"
        element={
          <ProtectedRoute tiposPermitidos={["paciente", "estagiario"]}>
            <AreaAutenticada>
              <MeusAgendamentosPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pagamento/:consultaId"
        element={
          <ProtectedRoute tiposPermitidos={["paciente"]}>
            <AreaAutenticada>
              <PagamentoPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/comprovantes/:pagamentoId"
        element={
          <ProtectedRoute tiposPermitidos={["paciente", "estagiario"]}>
            <AreaAutenticada>
              <ComprovantePage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/pagamentos"
        element={
          <ProtectedRoute tiposPermitidos={["estagiario"]}>
            <AreaAutenticada>
              <PagamentosRecebidosPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route
        path="/prontuarios"
        element={
          <ProtectedRoute tiposPermitidos={["estagiario", "professor"]}>
            <AreaAutenticada>
              <ProntuarioPage />
            </AreaAutenticada>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={usuario ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}
