const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const prisma = require("../prismaClient");
const { autenticar } = require("../middleware/auth");
const {
  emailValido,
  senhaValida,
  cpfLimpo,
  cpfValido,
  tipoUsuarioValido,
} = require("../utils/validators");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "psicoliga_dev_secret_change_me";

const MAX_TENTATIVAS = 3;
const BLOQUEIO_MINUTOS = 5;

// UC01 - Cadastrar-se (RF1 / RNF1.1, RNF1.3, RNF1.4)
router.post("/cadastro", async (req, res) => {
  const { tipoUsuario, nome, email, cpf, telefone, senha, confirmarSenha } = req.body || {};

  // 6.a - Campos obrigatórios não preenchidos
  if (!tipoUsuario || !nome || !email || !cpf || !senha || !confirmarSenha) {
    return res.status(400).json({
      codigo: "msg_campos_invalidos",
      mensagem: "Preencha todos os campos obrigatórios.",
    });
  }

  // V5 - Tipo de usuário obrigatório e válido
  if (!tipoUsuarioValido(tipoUsuario)) {
    return res.status(400).json({ codigo: "msg_tipo_invalido", mensagem: "Selecione um tipo de usuário válido." });
  }

  // 6.b - Senha e Confirmar Senha não coincidem
  if (senha !== confirmarSenha) {
    return res.status(400).json({
      codigo: "msg_senhas_diferentes",
      mensagem: "As senhas informadas não coincidem.",
    });
  }

  // V1 - E-mail deve possuir formato válido
  if (!emailValido(email)) {
    return res.status(400).json({ codigo: "msg_email_invalido", mensagem: "Informe um e-mail em formato válido." });
  }

  // V2 - CPF válido
  if (!cpfValido(cpf)) {
    return res.status(400).json({ codigo: "msg_cpf_invalido", mensagem: "Informe um CPF válido." });
  }

  // V3 / RNF1.4 - Senha com no mínimo 8 caracteres, letras e números
  if (!senhaValida(senha)) {
    return res.status(400).json({
      codigo: "msg_senha_fraca",
      mensagem: "A senha deve ter no mínimo 8 caracteres, incluindo letras e números.",
    });
  }

  const cpfNumeros = cpfLimpo(cpf);

  // 7.a - E-mail ou CPF já cadastrado
  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ email }, { cpf: cpfNumeros }] },
  });

  if (existente) {
    return res.status(409).json({
      codigo: "msg_email_cpf_duplicado",
      mensagem: "E-mail ou CPF já cadastrado no sistema.",
    });
  }

  const senhaCriptografada = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      cpf: cpfNumeros,
      telefone: telefone || null,
      senha: senhaCriptografada,
      tipoUsuario,
      ...(tipoUsuario === "paciente" && { paciente: { create: {} } }),
      ...(tipoUsuario === "estagiario" && { estagiario: { create: {} } }),
      ...(tipoUsuario === "professor" && { professor: { create: {} } }),
    },
  });

  return res.status(201).json({
    mensagem: "Cadastro realizado com sucesso. Faça login para continuar.",
    usuario: { id: usuario.id, nome: usuario.nome, tipoUsuario: usuario.tipoUsuario },
  });
});

// UC02 - Realizar Login (RF1 / RNF1.8)
router.post("/login", async (req, res) => {
  const { email, senha } = req.body || {};

  // RNF1.8 - campos vazios
  if (!email || !senha) {
    return res.status(400).json({ codigo: "msg_campos_invalidos", mensagem: "Informe e-mail e senha." });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // 5.a - E-mail não cadastrado
  if (!usuario) {
    return res.status(404).json({
      codigo: "msg_email_nao_cadastrado",
      mensagem: "E-mail não cadastrado.",
      ofertarCadastro: true,
    });
  }

  // 6.b - Conta bloqueada por excesso de tentativas
  if (usuario.lockedUntil && new Date(usuario.lockedUntil) > new Date()) {
    const segundosRestantes = Math.ceil((new Date(usuario.lockedUntil) - new Date()) / 1000);
    return res.status(423).json({
      codigo: "msg_conta_bloqueada",
      mensagem: "Conta bloqueada por 5 minutos devido a múltiplas tentativas inválidas.",
      segundosRestantes,
    });
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

  if (!senhaCorreta) {
    const tentativas = usuario.loginAttempts + 1;
    const dadosAtualizados = { loginAttempts: tentativas };

    // 6.b.1 - Terceira tentativa incorreta consecutiva
    if (tentativas >= MAX_TENTATIVAS) {
      dadosAtualizados.lockedUntil = new Date(Date.now() + BLOQUEIO_MINUTOS * 60 * 1000);
      dadosAtualizados.loginAttempts = 0;
    }

    await prisma.usuario.update({ where: { id: usuario.id }, data: dadosAtualizados });

    if (dadosAtualizados.lockedUntil) {
      return res.status(423).json({
        codigo: "msg_conta_bloqueada",
        mensagem: "Conta bloqueada por 5 minutos devido a múltiplas tentativas inválidas.",
        segundosRestantes: BLOQUEIO_MINUTOS * 60,
      });
    }

    return res.status(401).json({
      codigo: "msg_senha_incorreta",
      mensagem: "Senha incorreta. Tente novamente.",
      tentativasRestantes: MAX_TENTATIVAS - tentativas,
    });
  }

  // Login bem-sucedido: reseta tentativas e cria sessão (7/8)
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { loginAttempts: 0, lockedUntil: null },
  });

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, tipoUsuario: usuario.tipoUsuario },
    JWT_SECRET,
    { expiresIn: "8h" }
  );

  return res.json({
    mensagem: "Login realizado com sucesso.",
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipoUsuario: usuario.tipoUsuario },
  });
});

// RNF1.7 - Recuperação de senha por e-mail (RNF1.6: só "envia" se e-mail existir)
router.post("/esqueci-senha", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ codigo: "msg_campos_invalidos", mensagem: "Informe o e-mail cadastrado." });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (usuario) {
    const resetToken = crypto.randomBytes(24).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { resetToken, resetTokenExpires },
    });

    // Simulação de envio de e-mail (sem serviço de SMTP configurado neste projeto de demonstração)
    console.log(`[E-MAIL SIMULADO] Link de redefinição de senha para ${email}: /resetar-senha/${resetToken}`);
  }

  // Resposta genérica para não confirmar/negar publicamente se o e-mail existe
  return res.json({
    mensagem: "Se o e-mail informado estiver cadastrado, você receberá as instruções de redefinição de senha.",
  });
});

router.post("/resetar-senha", async (req, res) => {
  const { token, novaSenha, confirmarSenha } = req.body || {};

  if (!token || !novaSenha || !confirmarSenha) {
    return res.status(400).json({ codigo: "msg_campos_invalidos", mensagem: "Preencha todos os campos." });
  }

  if (novaSenha !== confirmarSenha) {
    return res.status(400).json({ codigo: "msg_senhas_diferentes", mensagem: "As senhas informadas não coincidem." });
  }

  if (!senhaValida(novaSenha)) {
    return res.status(400).json({
      codigo: "msg_senha_fraca",
      mensagem: "A senha deve ter no mínimo 8 caracteres, incluindo letras e números.",
    });
  }

  const usuario = await prisma.usuario.findFirst({ where: { resetToken: token } });

  if (!usuario || !usuario.resetTokenExpires || new Date(usuario.resetTokenExpires) < new Date()) {
    return res.status(400).json({ codigo: "msg_token_invalido", mensagem: "Link de redefinição inválido ou expirado." });
  }

  const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      senha: senhaCriptografada,
      resetToken: null,
      resetTokenExpires: null,
      loginAttempts: 0,
      lockedUntil: null,
    },
  });

  return res.json({ mensagem: "Senha redefinida com sucesso. Faça login com sua nova senha." });
});

// Retorna os dados do usuário autenticado (usado pelo Dashboard - RNF1.2 confirmar dados)
router.get("/me", autenticar, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario.id },
    select: { id: true, nome: true, email: true, telefone: true, tipoUsuario: true, createdAt: true },
  });

  if (!usuario) {
    return res.status(404).json({ codigo: "msg_usuario_nao_encontrado", mensagem: "Usuário não encontrado." });
  }

  return res.json({ usuario });
});

module.exports = router;
