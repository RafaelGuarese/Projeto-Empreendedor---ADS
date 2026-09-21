import { useState } from "react";
import { Link } from "react-router-dom";

import api from "../api/client.js";

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
    <div className="pagina-central">
      <div className="cartao-auth">
        <div className="logo-auth">
          <div className="titulo">Recuperar senha</div>
          <div className="subtitulo">Enviaremos um link de redefinição para o seu e-mail</div>
        </div>

        <form onSubmit={aoSubmeter} style={{ marginTop: 24 }}>
          {erro && <div className="alerta alerta-erro">{erro}</div>}
          {mensagem && <div className="alerta alerta-sucesso">{mensagem}</div>}

          <div className="campo">
            <label htmlFor="email">E-mail cadastrado</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <button className="botao-primario" type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar link de redefinição"}
          </button>
        </form>

        <div className="linha-divisoria">
          <Link to="/login">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
