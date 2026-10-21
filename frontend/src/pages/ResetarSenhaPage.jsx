import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta } from "../components/Ui.jsx";

export default function ResetarSenhaPage() {
  const { token } = useParams();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const navegar = useNavigate();

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);
    setEnviando(true);

    try {
      const { data } = await api.post("/auth/resetar-senha", { token, novaSenha, confirmarSenha });
      setSucesso(data.mensagem);
      setTimeout(() => navegar("/login"), 1800);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível redefinir a senha.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Criar nova senha" subtitulo="Use no mínimo 8 caracteres, com letras e números.">
      <form onSubmit={aoSubmeter} noValidate>
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

        <div className="campo">
          <label htmlFor="novaSenha">Nova senha</label>
          <input
            id="novaSenha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="campo">
          <label htmlFor="confirmarSenha">Confirmar nova senha</label>
          <input
            id="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button className="botao botao-primario botao-bloco botao-grande" type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>

      <p className="auth-rodape">
        <Link to="/login" className="link-voltar" style={{ margin: 0 }}>
          <Icone nome="voltar" tamanho={16} /> Voltar para o login
        </Link>
      </p>
    </AuthLayout>
  );
}
