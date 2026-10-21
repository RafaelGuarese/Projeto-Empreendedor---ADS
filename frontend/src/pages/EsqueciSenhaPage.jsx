import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta } from "../components/Ui.jsx";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState(null);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);
    setMensagem(null);

    if (!email) {
      setErro("Informe o e-mail cadastrado.");
      return;
    }

    setEnviando(true);

    try {
      const { data } = await api.post("/auth/esqueci-senha", { email });
      setMensagem(data.mensagem);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível processar a solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Recuperar senha" subtitulo="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.">
      <form onSubmit={aoSubmeter} noValidate>
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        {mensagem && <Alerta tipo="sucesso">{mensagem}</Alerta>}

        <div className="campo">
          <label htmlFor="email">E-mail cadastrado</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            autoComplete="username"
          />
        </div>

        <button className="botao botao-primario botao-bloco botao-grande" type="submit" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar link de redefinição"}
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
