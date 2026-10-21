const express = require("express");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { mascararChavePix } = require("../utils/pix");
const { gerarLinkTeleconsulta } = require("../utils/teleconsulta");

const router = express.Router();

const INCLUDE_PAGAMENTO = {
  consulta: {
    include: {
      paciente: { include: { usuario: { select: { nome: true, cpf: true } } } },
      estagiario: { include: { usuario: { select: { nome: true } } } },
    },
  },
};

function mascararCpf(cpf) {
  return cpf ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : "";
}

function gerarNumeroComprovante(pagamento) {
  return `PSL-${new Date().getFullYear()}-${String(pagamento.id).padStart(6, "0")}`;
}

// Libera o horário quando a reserva expira sem pagamento
async function expirarSeVencido(pagamento) {
  if (pagamento.status !== "pendente" || new Date(pagamento.expiraEm) > new Date()) return pagamento;

  await prisma.consulta.update({
    where: { id: pagamento.consultaId },
    data: { status: "cancelada", canceladoPor: "sistema" },
  });

  return prisma.pagamento.update({ where: { id: pagamento.id }, data: { status: "expirado" }, include: INCLUDE_PAGAMENTO });
}

function participante(pagamento, usuario) {
  if (usuario.tipoUsuario === "paciente") return pagamento.consulta.pacienteId === usuario.id;
  if (usuario.tipoUsuario === "estagiario") return pagamento.consulta.estagiarioId === usuario.id;
  return false;
}

function formatarPagamento(pagamento) {
  const { consulta } = pagamento;
  return {
    id: pagamento.id,
    valor: pagamento.valor,
    status: pagamento.status,
    formaPagamento: pagamento.formaPagamento,
    txid: pagamento.txid,
    numeroComprovante: pagamento.numeroComprovante,
    idTransacaoBanco: pagamento.idTransacaoBanco,
    expiraEm: pagamento.expiraEm,
    pagoEm: pagamento.pagoEm,
    confirmadoEm: pagamento.confirmadoEm,
    consulta: {
      id: consulta.id,
      dataHora: consulta.dataHora,
      tipo: consulta.tipo,
      status: consulta.status,
    },
    pagador: { nome: consulta.paciente.usuario.nome, cpf: mascararCpf(consulta.paciente.usuario.cpf) },
    recebedor: {
      nome: consulta.estagiario.usuario.nome,
      tipoChavePix: consulta.estagiario.tipoChavePix,
      chavePix: mascararChavePix(consulta.estagiario.tipoChavePix, pagamento.chavePix),
    },
  };
}

// Dados da cobrança PIX de uma consulta (tela de pagamento do paciente) - RF5 / RNF5.3
router.get("/consulta/:consultaId", autenticar, exigirTipo("paciente"), async (req, res) => {
  let pagamento = await prisma.pagamento.findUnique({
    where: { consultaId: Number(req.params.consultaId) },
    include: INCLUDE_PAGAMENTO,
  });

  if (!pagamento || pagamento.consulta.pacienteId !== req.usuario.id) {
    return res.status(404).json({ codigo: "msg_pagamento_nao_encontrado", mensagem: "Pagamento não encontrado." });
  }

  pagamento = await expirarSeVencido(pagamento);

  return res.json({
    pagamento: {
      ...formatarPagamento(pagamento),
      // a chave completa é necessária para o paciente pagar manualmente no app do banco
      chavePix: pagamento.chavePix,
      pixCopiaECola: pagamento.status === "pendente" ? pagamento.pixCopiaECola : null,
      qrCode: pagamento.status === "pendente" ? pagamento.qrCode : null,
    },
  });
});

// Paciente informa que realizou o PIX: gera o comprovante para o estagiário e confirma a consulta
router.post("/:id/informar", autenticar, exigirTipo("paciente"), async (req, res) => {
  let pagamento = await prisma.pagamento.findUnique({ where: { id: Number(req.params.id) }, include: INCLUDE_PAGAMENTO });

  if (!pagamento || pagamento.consulta.pacienteId !== req.usuario.id) {
    return res.status(404).json({ codigo: "msg_pagamento_nao_encontrado", mensagem: "Pagamento não encontrado." });
  }

  pagamento = await expirarSeVencido(pagamento);

  if (pagamento.status === "expirado") {
    return res.status(400).json({
      codigo: "msg_reserva_expirada",
      mensagem: "O prazo para pagamento expirou e o horário foi liberado. Faça um novo agendamento.",
    });
  }

  if (pagamento.status !== "pendente") {
    return res.status(400).json({ codigo: "msg_pagamento_ja_informado", mensagem: "Este pagamento já foi informado." });
  }

  const idTransacaoBanco = String(req.body?.idTransacaoBanco || "").trim();
  if (idTransacaoBanco && !/^[A-Za-z0-9-]{1,64}$/.test(idTransacaoBanco)) {
    return res.status(400).json({
      codigo: "msg_id_transacao_invalido",
      mensagem: "O ID da transação deve conter apenas letras, números e hífen (até 64 caracteres).",
    });
  }

  const { consulta } = pagamento;

  await prisma.consulta.update({
    where: { id: consulta.id },
    data: {
      status: "agendada",
      // RNF4.4 - link da videochamada gerado após a confirmação do agendamento
      linkVideo: consulta.tipo === "online" ? gerarLinkTeleconsulta() : null,
    },
  });

  const atualizado = await prisma.pagamento.update({
    where: { id: pagamento.id },
    data: {
      status: "em_analise",
      pagoEm: new Date(),
      idTransacaoBanco: idTransacaoBanco || null,
      numeroComprovante: gerarNumeroComprovante(pagamento),
    },
    include: INCLUDE_PAGAMENTO,
  });

  console.log(
    `[NOTIFICAÇÃO SIMULADA] Comprovante ${atualizado.numeroComprovante} enviado a ${consulta.estagiario.usuario.nome}: ` +
      `${consulta.paciente.usuario.nome} informou pagamento PIX de R$ ${atualizado.valor.toFixed(2)}. Consulta confirmada.`
  );

  return res.json({
    mensagem: "Pagamento informado! Sua consulta está confirmada e o comprovante foi enviado ao estagiário.",
    pagamento: formatarPagamento(atualizado),
  });
});

// Pagamentos recebidos pelo estagiário (comprovantes)
router.get("/recebidos", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const pagamentos = await prisma.pagamento.findMany({
    where: {
      consulta: { estagiarioId: req.usuario.id },
      status: { in: ["em_analise", "aprovado", "recusado"] },
    },
    include: INCLUDE_PAGAMENTO,
    orderBy: { pagoEm: "desc" },
  });

  return res.json({ pagamentos: pagamentos.map(formatarPagamento) });
});

router.get("/:id/comprovante", autenticar, exigirTipo("paciente", "estagiario"), async (req, res) => {
  const pagamento = await prisma.pagamento.findUnique({ where: { id: Number(req.params.id) }, include: INCLUDE_PAGAMENTO });

  if (!pagamento || !participante(pagamento, req.usuario)) {
    return res.status(404).json({ codigo: "msg_pagamento_nao_encontrado", mensagem: "Comprovante não encontrado." });
  }

  if (!pagamento.numeroComprovante) {
    return res.status(400).json({ codigo: "msg_sem_comprovante", mensagem: "Este pagamento ainda não possui comprovante." });
  }

  return res.json({ comprovante: formatarPagamento(pagamento) });
});

async function decidirPagamento(req, res, aprovar) {
  const pagamento = await prisma.pagamento.findUnique({ where: { id: Number(req.params.id) }, include: INCLUDE_PAGAMENTO });

  if (!pagamento || pagamento.consulta.estagiarioId !== req.usuario.id) {
    return res.status(404).json({ codigo: "msg_pagamento_nao_encontrado", mensagem: "Pagamento não encontrado." });
  }

  if (pagamento.status !== "em_analise") {
    return res.status(400).json({ codigo: "msg_pagamento_ja_decidido", mensagem: "Este pagamento já foi confirmado ou recusado." });
  }

  if (!aprovar) {
    await prisma.consulta.update({
      where: { id: pagamento.consultaId },
      data: { status: "cancelada", canceladoPor: "estagiario" },
    });
  }

  // RNF5.4 - status do pagamento atualizado na plataforma
  const atualizado = await prisma.pagamento.update({
    where: { id: pagamento.id },
    data: { status: aprovar ? "aprovado" : "recusado", confirmadoEm: new Date() },
    include: INCLUDE_PAGAMENTO,
  });

  console.log(
    `[NOTIFICAÇÃO SIMULADA] Pagamento ${atualizado.numeroComprovante} ${aprovar ? "confirmado" : "recusado"} por ${atualizado.consulta.estagiario.usuario.nome}.` +
      (aprovar ? "" : " A consulta foi cancelada.")
  );

  return res.json({
    mensagem: aprovar ? "Recebimento confirmado." : "Pagamento recusado e consulta cancelada.",
    pagamento: formatarPagamento(atualizado),
  });
}

router.put("/:id/confirmar", autenticar, exigirTipo("estagiario"), (req, res) => decidirPagamento(req, res, true));
router.put("/:id/recusar", autenticar, exigirTipo("estagiario"), (req, res) => decidirPagamento(req, res, false));

module.exports = router;
