import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/client.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta } from "../components/Ui.jsx";
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
    <AuthLayout titulo="Bem-vindo(a) de volta" subtitulo="Entre com seu e-mail e senha para continuar.">
      <form onSubmit={aoSubmeter} noValidate>
        {erro && (
          <Alerta tipo="erro">
            {bloqueado ? `Conta bloqueada. Tente novamente em ${minutos}:${segundos}.` : erro}
            {ofertarCadastro && (
              <>
                {" "}
                <Link to="/cadastro">Criar uma conta</Link>
              </>
            )}
          </Alerta>
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
            placeholder="Sua senha"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="botao-olho"
            onClick={() => setMostrarSenha((v) => !v)}
            aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
          >
            <Icone nome={mostrarSenha ? "olhoFechado" : "olho"} tamanho={18} />
          </button>
        </div>

        <button className="botao botao-primario botao-bloco botao-grande" type="submit" disabled={enviando || bloqueado}>
          {enviando ? "Entrando..." : "Entrar"}
        </button>

        <div className="auth-links">
          <Link to="/esqueci-senha">Esqueceu sua senha?</Link>
        </div>
      </form>

      <p className="auth-rodape">
        Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
      </p>
    </AuthLayout>
  );
}
