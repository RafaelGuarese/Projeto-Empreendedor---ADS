import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/client.js";
import AuthLayout from "../components/AuthLayout.jsx";
import Icone from "../components/Icone.jsx";
import { Alerta } from "../components/Ui.jsx";
import { mascararCpf, mascararTelefone } from "../utils/masks.js";

const SENHA_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const PERFIS = [
  { valor: "paciente", titulo: "Paciente", descricao: "Busco atendimento", icone: "coracao" },
  { valor: "estagiario", titulo: "Estagiário(a)", descricao: "Ofereço atendimento", icone: "usuario" },
  { valor: "professor", titulo: "Professor(a)", descricao: "Supervisiono", icone: "pessoas" },
];

export default function CadastroPage() {
  const [form, setForm] = useState({
    tipoUsuario: "",
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const navegar = useNavigate();

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validarLocalmente() {
    if (!form.tipoUsuario) {
      return "Escolha como você vai usar a plataforma.";
    }
    if (!form.nome || !form.email || !form.cpf || !form.senha || !form.confirmarSenha) {
      return "Preencha todos os campos obrigatórios.";
    }
    if (form.senha !== form.confirmarSenha) {
      return "As senhas informadas não coincidem.";
    }
    if (!SENHA_REGEX.test(form.senha)) {
      return "A senha deve ter no mínimo 8 caracteres, incluindo letras e números.";
    }
    if (form.cpf.replace(/\D/g, "").length !== 11) {
      return "Informe um CPF válido.";
    }
    return null;
  }

  async function aoSubmeter(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    const erroLocal = validarLocalmente();
    if (erroLocal) {
      setErro(erroLocal);
      return;
    }

    setEnviando(true);

    try {
      await api.post("/auth/cadastro", form);
      setSucesso("Cadastro realizado com sucesso! Redirecionando para o login...");
      setTimeout(() => navegar("/login"), 1800);
    } catch (err) {
      setErro(err.response?.data?.mensagem || "Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout titulo="Criar conta" subtitulo="Leva menos de um minuto. Todos os campos são obrigatórios, exceto o telefone." largo>
      <form onSubmit={aoSubmeter} noValidate>
        {erro && <Alerta tipo="erro">{erro}</Alerta>}
        {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}

        <div className="campo">
          <span className="rotulo">Como você vai usar o Psicoliga?</span>
          <div className="opcoes-perfil" role="radiogroup" aria-label="Tipo de usuário">
            {PERFIS.map((perfil) => (
              <button
                key={perfil.valor}
                type="button"
                role="radio"
                aria-checked={form.tipoUsuario === perfil.valor}
                className={`opcao-perfil ${form.tipoUsuario === perfil.valor ? "ativa" : ""}`}
                onClick={() => atualizar("tipoUsuario", perfil.valor)}
              >
                <Icone nome={perfil.icone} tamanho={22} />
                <span>
                  {perfil.titulo}
                  <br />
                  <small>{perfil.descricao}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} autoComplete="name" />
        </div>

        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => atualizar("email", e.target.value)}
            placeholder="seuemail@exemplo.com"
            autoComplete="username"
          />
        </div>

        <div className="grade-2">
          <div className="campo">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              value={form.cpf}
              onChange={(e) => atualizar("cpf", mascararCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>
          <div className="campo">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              value={form.telefone}
              onChange={(e) => atualizar("telefone", mascararTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
              inputMode="tel"
            />
          </div>
        </div>

        <div className="grade-2">
          <div className="campo">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={form.senha}
              onChange={(e) => atualizar("senha", e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="campo">
            <label htmlFor="confirmarSenha">Confirmar senha</label>
            <input
              id="confirmarSenha"
              type="password"
              value={form.confirmarSenha}
              onChange={(e) => atualizar("confirmarSenha", e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="campo-ajuda" style={{ marginTop: -8, marginBottom: 20 }}>
          Mínimo de 8 caracteres, com letras e números.
        </p>

        <button className="botao botao-primario botao-bloco botao-grande" type="submit" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Criar conta"}
        </button>
      </form>

      <p className="auth-rodape">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </AuthLayout>
  );
}
