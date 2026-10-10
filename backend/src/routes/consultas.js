const express = require("express");
const crypto = require("crypto");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { gerarSlotsFuturos, horasAte, HORAS_MINIMAS_CANCELAMENTO } = require("../utils/agenda");
const { paraLista } = require("../utils/listas");

const router = express.Router();

function gerarLinkTeleconsulta() {
  // RF4 - link único de videochamada, gerado automaticamente na confirmação do agendamento.
  // Usa o Jitsi Meet (sala pública, sem necessidade de credenciais de API) como plataforma de redirecionamento.
  const sala = crypto.randomBytes(8).toString("hex");
  return `https://meet.jit.si/psicoliga-${sala}`;
}

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
    linkVideo: consulta.linkVideo,
    valor: consulta.valor,
    canceladoPor: consulta.canceladoPor,
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
    },
    horariosDisponiveis: slots.map((s) => s.toISOString()),
  });
});

// UC04 - Agendar Consulta (RF3), com geração automática de link de teleconsulta quando online (RF4)
router.post("/", autenticar, exigirTipo("paciente"), async (req, res) => {
  const { estagiarioId, dataHora, tipo } = req.body || {};

  if (!estagiarioId || !dataHora) {
    return res.status(400).json({ codigo: "msg_campos_invalidos", mensagem: "Selecione um estagiário e um horário." });
  }

  const estagiario = await prisma.estagiario.findUnique({ where: { id: Number(estagiarioId) } });

  if (!estagiario || estagiario.valorConsulta === null) {
    return res.status(404).json({ codigo: "msg_estagiario_indisponivel", mensagem: "Estagiário não encontrado ou sem perfil de atendimento configurado." });
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
      linkVideo: tipoConsulta === "online" ? gerarLinkTeleconsulta() : null,
      pacienteId: req.usuario.id,
      estagiarioId: estagiario.id,
    },
    include: {
      paciente: { include: { usuario: { select: { nome: true } } } },
      estagiario: { include: { usuario: { select: { nome: true } } } },
    },
  });

  // RNF3.1 - notificação de confirmação (simulada: sem serviço real de e-mail/WhatsApp neste projeto)
  console.log(
    `[NOTIFICAÇÃO SIMULADA] Consulta confirmada em ${consulta.dataHora.toLocaleString("pt-BR")} entre ${consulta.paciente.usuario.nome} e ${consulta.estagiario.usuario.nome}.` +
      (consulta.linkVideo ? ` Link da videochamada: ${consulta.linkVideo}` : "")
  );

  return res.status(201).json({ mensagem: "Consulta agendada com sucesso.", consulta: formatarConsulta(consulta) });
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
    include: {
      paciente: { include: { usuario: { select: { nome: true } } } },
      estagiario: { include: { usuario: { select: { nome: true } } } },
    },
  });

  return res.json({ consultas: consultas.map(formatarConsulta) });
});

async function buscarConsultaDoUsuario(req, res) {
  const consulta = await prisma.consulta.findUnique({ where: { id: Number(req.params.id) } });

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
    include: {
      paciente: { include: { usuario: { select: { nome: true } } } },
      estagiario: { include: { usuario: { select: { nome: true } } } },
    },
  });

  console.log(`[NOTIFICAÇÃO SIMULADA] Consulta remarcada para ${atualizada.dataHora.toLocaleString("pt-BR")}.`);

  return res.json({ mensagem: "Consulta remarcada com sucesso.", consulta: formatarConsulta(atualizada) });
});

// Cancelar consulta (RF3) - paciente ou estagiário
router.put("/:id/cancelar", autenticar, exigirTipo("paciente", "estagiario"), async (req, res) => {
  const consulta = await buscarConsultaDoUsuario(req, res);
  if (!consulta) return;

  if (consulta.status !== "agendada") {
    return res.status(400).json({ codigo: "msg_consulta_nao_cancelavel", mensagem: "Esta consulta já foi cancelada ou realizada." });
  }

  // RNF3.3 - cancelamentos devem ser permitidos com no mínimo 12 horas de antecedência
  if (horasAte(consulta.dataHora) < HORAS_MINIMAS_CANCELAMENTO) {
    return res.status(400).json({
      codigo: "msg_prazo_cancelamento",
      mensagem: `Cancelamentos devem ser permitidos com no mínimo ${HORAS_MINIMAS_CANCELAMENTO} horas de antecedência.`,
    });
  }

  const atualizada = await prisma.consulta.update({
    where: { id: consulta.id },
    data: { status: "cancelada", canceladoPor: req.usuario.tipoUsuario },
    include: {
      paciente: { include: { usuario: { select: { nome: true } } } },
      estagiario: { include: { usuario: { select: { nome: true } } } },
    },
  });

  // RNF3.4 - a agenda do estagiário é liberada automaticamente (o horário deixa de contar como ocupado)
  console.log(`[NOTIFICAÇÃO SIMULADA] Consulta de ${atualizada.dataHora.toLocaleString("pt-BR")} cancelada por ${req.usuario.tipoUsuario}.`);

  return res.json({ mensagem: "Consulta cancelada com sucesso.", consulta: formatarConsulta(atualizada) });
});

module.exports = router;
