const express = require("express");
const QRCode = require("qrcode");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { gerarSlotsFuturos, horasAte, HORAS_MINIMAS_CANCELAMENTO } = require("../utils/agenda");
const { paraLista } = require("../utils/listas");
const { gerarPixCopiaECola } = require("../utils/pix");

const router = express.Router();

// Tempo que o horário fica reservado aguardando o pagamento PIX
const RESERVA_MINUTOS = 30;

const INCLUDE_CONSULTA = {
  paciente: { include: { usuario: { select: { nome: true } } } },
  estagiario: { include: { usuario: { select: { nome: true } } } },
  pagamento: { select: { id: true, status: true, numeroComprovante: true, expiraEm: true } },
};

async function horariosLivres(estagiario) {
  const slots = gerarSlotsFuturos(estagiario.horariosDisponiveis);

  const consultasAtivas = await prisma.consulta.findMany({
    where: { estagiarioId: estagiario.id, status: { not: "cancelada" }, dataHora: { gte: new Date() } },
    select: { dataHora: true },
  });

  const ocupados = new Set(consultasAtivas.map((c) => c.dataHora.getTime()));

  return slots.filter((slot) => !ocupados.has(slot.getTime()));
}

function formatarConsulta(consulta) {
  return {
    id: consulta.id,
    dataHora: consulta.dataHora,
    status: consulta.status,
    tipo: consulta.tipo,
    linkVideo: consulta.status === "agendada" ? consulta.linkVideo : null,
    valor: consulta.valor,
    canceladoPor: consulta.canceladoPor,
    pagamento: consulta.pagamento || null,
    paciente: consulta.paciente ? { id: consulta.paciente.id, nome: consulta.paciente.usuario.nome } : undefined,
    estagiario: consulta.estagiario
      ? { id: consulta.estagiario.id, nome: consulta.estagiario.usuario.nome, abordagem: consulta.estagiario.abordagem }
      : undefined,
  };
}

// RF2/RF3 - perfil resumido + horários concretos disponíveis para agendar com um estagiário
router.get("/estagiario/:id/disponibilidade", autenticar, exigirTipo("paciente"), async (req, res) => {
  const estagiarioId = Number(req.params.id);

  const estagiario = await prisma.estagiario.findUnique({
    where: { id: estagiarioId },
    include: { usuario: { select: { nome: true } } },
  });

  if (!estagiario || estagiario.valorConsulta === null) {
    return res.status(404).json({ codigo: "msg_estagiario_indisponivel", mensagem: "Estagiário não encontrado ou sem perfil de atendimento configurado." });
  }

  const slots = await horariosLivres(estagiario);

  return res.json({
    estagiario: {
      id: estagiario.id,
      nome: estagiario.usuario.nome,
      abordagem: estagiario.abordagem,
      especialidades: paraLista(estagiario.especialidades),
      tipoAtendimento: estagiario.tipoAtendimento,
      valorConsulta: estagiario.valorConsulta,
      avaliacao: estagiario.avaliacao,
      aceitaPix: Boolean(estagiario.chavePix),
    },
    horariosDisponiveis: slots.map((s) => s.toISOString()),
  });
});

// UC04 - Agendar Consulta (RF3): reserva o horário e gera a cobrança PIX (RF5).
// A consulta só é confirmada (status "agendada") depois que o paciente informa o pagamento.
router.post("/", autenticar, exigirTipo("paciente"), async (req, res) => {
  const { estagiarioId, dataHora, tipo } = req.body || {};

  if (!estagiarioId || !dataHora) {
    return res.status(400).json({ codigo: "msg_campos_invalidos", mensagem: "Selecione um estagiário e um horário." });
  }

  const estagiario = await prisma.estagiario.findUnique({
    where: { id: Number(estagiarioId) },
    include: { usuario: { select: { nome: true } } },
  });

  if (!estagiario || estagiario.valorConsulta === null) {
    return res.status(404).json({ codigo: "msg_estagiario_indisponivel", mensagem: "Estagiário não encontrado ou sem perfil de atendimento configurado." });
  }

  if (!estagiario.chavePix) {
    return res.status(400).json({
      codigo: "msg_estagiario_sem_pix",
      mensagem: "Este estagiário ainda não cadastrou uma chave PIX para receber pagamentos.",
    });
  }

  let tipoConsulta = estagiario.tipoAtendimento;
  if (estagiario.tipoAtendimento === "ambos") {
    if (!tipo || !["presencial", "online"].includes(tipo)) {
      return res.status(400).json({ codigo: "msg_tipo_invalido", mensagem: "Selecione se o atendimento será presencial ou online." });
    }
    tipoConsulta = tipo;
  }

  const dataHoraSelecionada = new Date(dataHora);

  if (Number.isNaN(dataHoraSelecionada.getTime()) || dataHoraSelecionada <= new Date()) {
    return res.status(400).json({ codigo: "msg_horario_invalido", mensagem: "Selecione um horário futuro válido." });
  }

  // V1 - horário deve estar dentro dos horários disponíveis do estagiário
  const slotsValidos = gerarSlotsFuturos(estagiario.horariosDisponiveis);
  const horarioValido = slotsValidos.some((s) => s.getTime() === dataHoraSelecionada.getTime());

  if (!horarioValido) {
    return res.status(400).json({ codigo: "msg_horario_fora_agenda", mensagem: "O horário selecionado não faz parte da agenda do estagiário." });
  }

  // 6.a - horário ficou indisponível entre a seleção e a confirmação
  const conflito = await prisma.consulta.findFirst({
    where: { estagiarioId: estagiario.id, dataHora: dataHoraSelecionada, status: { not: "cancelada" } },
  });

  if (conflito) {
    return res.status(409).json({
      codigo: "msg_horario_indisponivel",
      mensagem: "Horário não está mais disponível. Por favor, selecione outro horário.",
    });
  }

  const consulta = await prisma.consulta.create({
    data: {
      dataHora: dataHoraSelecionada,
      tipo: tipoConsulta,
      valor: estagiario.valorConsulta,
      status: "aguardando_pagamento",
      pacienteId: req.usuario.id,
      estagiarioId: estagiario.id,
    },
  });

  const txid = `PSICOLIGA${String(consulta.id).padStart(8, "0")}`;
  const pixCopiaECola = gerarPixCopiaECola({
    chave: estagiario.chavePix,
    nomeRecebedor: estagiario.usuario.nome,
    cidade: process.env.PIX_CIDADE || "CAXIAS DO SUL",
    valor: estagiario.valorConsulta,
    txid,
  });
  const qrCode = await QRCode.toDataURL(pixCopiaECola, { margin: 1, width: 280 });

  await prisma.pagamento.create({
    data: {
      consultaId: consulta.id,
      valor: estagiario.valorConsulta,
      chavePix: estagiario.chavePix,
      txid,
      pixCopiaECola,
      qrCode,
      expiraEm: new Date(Date.now() + RESERVA_MINUTOS * 60 * 1000),
    },
  });

  const completa = await prisma.consulta.findUnique({ where: { id: consulta.id }, include: INCLUDE_CONSULTA });

  // RNF5.1 - envio do link de pagamento ao paciente (simulado: sem serviço real de e-mail/WhatsApp)
  console.log(
    `[NOTIFICAÇÃO SIMULADA] Horário de ${completa.dataHora.toLocaleString("pt-BR")} reservado para ${completa.paciente.usuario.nome}. ` +
      `Pague via PIX em até ${RESERVA_MINUTOS} minutos: /pagamento/${consulta.id}`
  );

  return res.status(201).json({
    mensagem: `Horário reservado. Realize o pagamento via PIX em até ${RESERVA_MINUTOS} minutos para confirmar a consulta.`,
    consulta: formatarConsulta(completa),
  });
});

// Lista as consultas do usuário logado (paciente ou estagiário)
router.get("/minhas", autenticar, async (req, res) => {
  const { tipoUsuario, id } = req.usuario;

  if (!["paciente", "estagiario"].includes(tipoUsuario)) {
    return res.status(403).json({ codigo: "msg_acesso_negado", mensagem: "Perfil sem consultas associadas." });
  }

  const where = tipoUsuario === "paciente" ? { pacienteId: id } : { estagiarioId: id };

  const consultas = await prisma.consulta.findMany({
    where,
    orderBy: { dataHora: "asc" },
    include: INCLUDE_CONSULTA,
  });

  return res.json({ consultas: consultas.map(formatarConsulta) });
});

async function buscarConsultaDoUsuario(req, res) {
  const consulta = await prisma.consulta.findUnique({
    where: { id: Number(req.params.id) },
    include: { pagamento: true },
  });

  if (!consulta) {
    res.status(404).json({ codigo: "msg_consulta_nao_encontrada", mensagem: "Consulta não encontrada." });
    return null;
  }

  const { tipoUsuario, id } = req.usuario;
  const dono =
    (tipoUsuario === "paciente" && consulta.pacienteId === id) ||
    (tipoUsuario === "estagiario" && consulta.estagiarioId === id);

  if (!dono) {
    res.status(403).json({ codigo: "msg_acesso_negado", mensagem: "Você não tem permissão para alterar esta consulta." });
    return null;
  }

  return consulta;
}

// Remarcar consulta (RF3) - somente o paciente remarca
router.put("/:id/remarcar", autenticar, exigirTipo("paciente"), async (req, res) => {
  const consulta = await buscarConsultaDoUsuario(req, res);
  if (!consulta) return;

  if (consulta.status !== "agendada") {
    return res.status(400).json({ codigo: "msg_consulta_nao_remarcavel", mensagem: "Apenas consultas agendadas podem ser remarcadas." });
  }

  if (horasAte(consulta.dataHora) < HORAS_MINIMAS_CANCELAMENTO) {
    return res.status(400).json({
      codigo: "msg_prazo_remarcacao",
      mensagem: `Remarcações devem ser feitas com no mínimo ${HORAS_MINIMAS_CANCELAMENTO} horas de antecedência.`,
    });
  }

  const { novaDataHora } = req.body || {};
  const novaData = new Date(novaDataHora);

  if (!novaDataHora || Number.isNaN(novaData.getTime()) || novaData <= new Date()) {
    return res.status(400).json({ codigo: "msg_horario_invalido", mensagem: "Selecione um novo horário válido." });
  }

  const estagiario = await prisma.estagiario.findUnique({ where: { id: consulta.estagiarioId } });
  const slotsValidos = gerarSlotsFuturos(estagiario.horariosDisponiveis);
  const horarioValido = slotsValidos.some((s) => s.getTime() === novaData.getTime());

  if (!horarioValido) {
    return res.status(400).json({ codigo: "msg_horario_fora_agenda", mensagem: "O horário selecionado não faz parte da agenda do estagiário." });
  }

  const conflito = await prisma.consulta.findFirst({
    where: { estagiarioId: consulta.estagiarioId, dataHora: novaData, status: { not: "cancelada" }, id: { not: consulta.id } },
  });

  if (conflito) {
    return res.status(409).json({ codigo: "msg_horario_indisponivel", mensagem: "Horário não está mais disponível. Por favor, selecione outro horário." });
  }

  const atualizada = await prisma.consulta.update({
    where: { id: consulta.id },
    data: { dataHora: novaData, lembreteEnviado: false },
    include: INCLUDE_CONSULTA,
  });

  console.log(`[NOTIFICAÇÃO SIMULADA] Consulta remarcada para ${atualizada.dataHora.toLocaleString("pt-BR")}.`);

  return res.json({ mensagem: "Consulta remarcada com sucesso.", consulta: formatarConsulta(atualizada) });
});

// Cancelar consulta (RF3) - paciente ou estagiário
router.put("/:id/cancelar", autenticar, exigirTipo("paciente", "estagiario"), async (req, res) => {
  const consulta = await buscarConsultaDoUsuario(req, res);
  if (!consulta) return;

  if (!["agendada", "aguardando_pagamento"].includes(consulta.status)) {
    return res.status(400).json({ codigo: "msg_consulta_nao_cancelavel", mensagem: "Esta consulta já foi cancelada ou realizada." });
  }

  // RNF3.3 - cancelamentos devem ser permitidos com no mínimo 12 horas de antecedência
  // (uma reserva ainda não paga pode ser desistida a qualquer momento)
  if (consulta.status === "agendada" && horasAte(consulta.dataHora) < HORAS_MINIMAS_CANCELAMENTO) {
    return res.status(400).json({
      codigo: "msg_prazo_cancelamento",
      mensagem: `Cancelamentos devem ser permitidos com no mínimo ${HORAS_MINIMAS_CANCELAMENTO} horas de antecedência.`,
    });
  }

  const atualizada = await prisma.consulta.update({
    where: { id: consulta.id },
    data: { status: "cancelada", canceladoPor: req.usuario.tipoUsuario },
    include: INCLUDE_CONSULTA,
  });

  if (consulta.pagamento?.status === "pendente") {
    await prisma.pagamento.update({ where: { id: consulta.pagamento.id }, data: { status: "cancelado" } });
  }

  // RNF3.4 - a agenda do estagiário é liberada automaticamente (o horário deixa de contar como ocupado)
  console.log(`[NOTIFICAÇÃO SIMULADA] Consulta de ${atualizada.dataHora.toLocaleString("pt-BR")} cancelada por ${req.usuario.tipoUsuario}.`);

  return res.json({ mensagem: "Consulta cancelada com sucesso.", consulta: formatarConsulta(atualizada) });
});

module.exports = router;
