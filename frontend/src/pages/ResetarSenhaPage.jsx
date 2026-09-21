import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/client.js";

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
    <div className="pagina-central">
      <div className="cartao-auth">
        <div className="logo-auth">
          <div className="titulo">Nova senha</div>
          <div className="subtitulo">Defina uma nova senha para sua conta</div>
        </div>

        <form onSubmit={aoSubmeter} style={{ marginTop: 24 }}>
          {erro && <div className="alerta alerta-erro">{erro}</div>}
          {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

          <div className="campo">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              id="novaSenha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="confirmarSenha">Confirmar nova senha</label>
            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>

          <button className="botao-primario" type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : "Redefinir senha"}
          </button>
        </form>

        <div className="linha-divisoria">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
