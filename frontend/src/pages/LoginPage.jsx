import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [ofertarCadastro, setOfertarCadastro] = useState(false);
  const [segundosBloqueio, setSegundosBloqueio] = useState(0);
  const [enviando, setEnviando] = useState(false);

  const navegar = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (segundosBloqueio <= 0) return;
    const intervalo = setInterval(() => {
      setSegundosBloqueio((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [segundosBloqueio]);

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);
    setOfertarCadastro(false);

    if (!email || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }

    setEnviando(true);

    try {
      const { data } = await api.post("/auth/login", { email, senha });
      login(data.token, data.usuario);
      navegar("/dashboard");
    } catch (err) {
      const resposta = err.response?.data;

      if (resposta?.codigo === "msg_email_nao_cadastrado") {
        setOfertarCadastro(true);
      }

      if (resposta?.codigo === "msg_conta_bloqueada") {
        setSegundosBloqueio(resposta.segundosRestantes || 300);
      }

      setErro(resposta?.mensagem || "Não foi possível realizar o login. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const bloqueado = segundosBloqueio > 0;
  const minutos = String(Math.floor(segundosBloqueio / 60)).padStart(2, "0");
  const segundos = String(segundosBloqueio % 60).padStart(2, "0");

  return (
    <div className="pagina-central">
      <div className="cartao-auth">
        <div className="logo-auth">
          <div className="titulo">Psicoliga</div>
          <div className="subtitulo">Atendimento psicológico em estágio supervisionado</div>
        </div>

        <form onSubmit={aoSubmeter} style={{ marginTop: 24 }}>
          {erro && (
            <div className="alerta alerta-erro">
              {bloqueado ? `Conta bloqueada. Tente novamente em ${minutos}:${segundos}.` : erro}
              {ofertarCadastro && (
                <>
                  {" "}
                  <Link to="/cadastro">Cadastre-se aqui.</Link>
                </>
              )}
            </div>
          )}

          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              autoComplete="username"
            />
          </div>

          <div className="campo campo-senha">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setMostrarSenha((v) => !v)}>
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <button className="botao-primario" type="submit" disabled={enviando || bloqueado}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="links-auth">
          <Link to="/cadastro">Cadastrar-se</Link>
          <Link to="/esqueci-senha">Esqueceu sua senha?</Link>
        </div>
      </div>
    </div>
  );
}
