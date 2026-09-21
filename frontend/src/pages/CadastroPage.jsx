import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/client.js";
import { mascararCpf, mascararTelefone } from "../utils/masks.js";

const SENHA_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

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
    if (!form.tipoUsuario || !form.nome || !form.email || !form.cpf || !form.senha || !form.confirmarSenha) {
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
    <div className="pagina-central">
      <div className="cartao-auth" style={{ maxWidth: 460 }}>
        <div className="logo-auth">
          <div className="titulo">Criar conta</div>
          <div className="subtitulo">Junte-se à plataforma Psicoliga</div>
        </div>

        <form onSubmit={aoSubmeter} style={{ marginTop: 24 }}>
          {erro && <div className="alerta alerta-erro">{erro}</div>}
          {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

          <div className="campo">
            <label htmlFor="tipoUsuario">Tipo de usuário</label>
            <select
              id="tipoUsuario"
              value={form.tipoUsuario}
              onChange={(e) => atualizar("tipoUsuario", e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="paciente">Paciente</option>
              <option value="estagiario">Estagiário</option>
              <option value="professor">Professor Orientador</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="nome">Nome completo</label>
            <input id="nome" value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} />
          </div>

          <div className="campo">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => atualizar("email", e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="campo">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              value={form.cpf}
              onChange={(e) => atualizar("cpf", mascararCpf(e.target.value))}
              placeholder="000.000.000-00"
            />
          </div>

          <div className="campo">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              value={form.telefone}
              onChange={(e) => atualizar("telefone", mascararTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </div>

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

          <button className="botao-primario" type="submit" disabled={enviando}>
            {enviando ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div className="linha-divisoria">
          Já tem conta? <Link to="/login">Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
