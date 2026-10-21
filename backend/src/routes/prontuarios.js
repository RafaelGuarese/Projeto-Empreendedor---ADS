const express = require("express");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { criptografar, descriptografar } = require("../utils/cripto");

const router = express.Router();

const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DURACAO_MAXIMA = 600;

function dataLocalIso(data) {
  return new Date(data).toLocaleDateString("sv-SE");
}

function normalizarBusca(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

// RNF6.2 - apenas o estagiário responsável e seu professor orientador acessam o prontuário
async function resolverEstagiario(req, res) {
  if (req.usuario.tipoUsuario === "estagiario") return req.usuario.id;

  const estagiarioId = Number(req.query.estagiarioId);
  if (!estagiarioId) {
    res.status(400).json({ codigo: "msg_estagiario_obrigatorio", mensagem: "Selecione um estagiário supervisionado." });
    return null;
  }

  const estagiario = await prisma.estagiario.findUnique({ where: { id: estagiarioId } });
  if (!estagiario || estagiario.professorId !== req.usuario.id) {
    res.status(403).json({ codigo: "msg_acesso_negado", mensagem: "Este estagiário não está sob sua supervisão." });
    return null;
  }

  return estagiarioId;
}

// Pacientes vinculados: possuem consulta confirmada com o estagiário ou registros já existentes no prontuário
async function pacientesVinculados(estagiarioId) {
  const [consultas, registros] = await Promise.all([
    prisma.consulta.findMany({
      where: { estagiarioId, status: { in: ["agendada", "realizada"] } },
      select: { pacienteId: true },
      distinct: ["pacienteId"],
    }),
    prisma.prontuario.findMany({ where: { estagiarioId }, select: { pacienteId: true }, distinct: ["pacienteId"] }),
  ]);

  return new Set([...consultas, ...registros].map((c) => c.pacienteId));
}

function validarRegistro(body) {
  const { dataSessao, duracao, descricao, observacoes } = body || {};

  if (!dataSessao || !duracao || !String(descricao || "").trim()) {
    return { erro: "Preencha os campos obrigatórios antes de salvar." };
  }

  // V1 - data válida e não futura
  if (!DATA_REGEX.test(dataSessao) || Number.isNaN(new Date(`${dataSessao}T12:00:00`).getTime())) {
    return { erro: "Informe uma data de sessão válida." };
  }
  if (dataSessao > dataLocalIso(new Date())) {
    return { erro: "A data da sessão não pode ser futura." };
  }

  // V2 - duração deve ser um número positivo
  const minutos = Number(duracao);
  if (!Number.isInteger(minutos) || minutos <= 0 || minutos > DURACAO_MAXIMA) {
    return { erro: `A duração deve ser um número inteiro de minutos entre 1 e ${DURACAO_MAXIMA}.` };
  }

  return {
    dados: {
      dataSessao: new Date(`${dataSessao}T12:00:00`),
      duracao: minutos,
      descricao: criptografar(String(descricao).trim()),
      observacoes: criptografar(String(observacoes || "").trim()),
    },
  };
}

function formatarRegistro(registro) {
  return {
    id: registro.id,
    dataSessao: dataLocalIso(registro.dataSessao),
    duracao: registro.duracao,
    descricao: descriptografar(registro.descricao),
    observacoes: descriptografar(registro.observacoes),
    criadoEm: registro.createdAt,
    atualizadoEm: registro.updatedAt,
  };
}

// Estagiários supervisionados pelo professor orientador
router.get("/estagiarios", autenticar, exigirTipo("professor"), async (req, res) => {
  const estagiarios = await prisma.estagiario.findMany({
    where: { professorId: req.usuario.id },
    include: { usuario: { select: { nome: true } } },
    orderBy: { usuario: { nome: "asc" } },
  });

  return res.json({
    estagiarios: estagiarios.map((e) => ({
      id: e.id,
      nome: e.usuario.nome,
      registroAcademico: e.registroAcademico,
      abordagem: e.abordagem,
    })),
  });
});

// RNF6.3 - lista e busca de pacientes do prontuário
router.get("/pacientes", autenticar, exigirTipo("estagiario", "professor"), async (req, res) => {
  const estagiarioId = await resolverEstagiario(req, res);
  if (!estagiarioId) return;

  const ids = await pacientesVinculados(estagiarioId);

  const pacientes = await prisma.paciente.findMany({
    where: { id: { in: [...ids] } },
    include: {
      usuario: { select: { nome: true } },
      prontuarios: { where: { estagiarioId }, select: { dataSessao: true } },
    },
  });

  const termo = normalizarBusca(req.query.busca);

  const resultado = pacientes
    .filter((p) => !termo || normalizarBusca(p.usuario.nome).includes(termo))
    .map((p) => {
      const datas = p.prontuarios.map((r) => r.dataSessao.getTime());
      return {
        id: p.id,
        nome: p.usuario.nome,
        totalRegistros: p.prontuarios.length,
        ultimaSessao: datas.length ? dataLocalIso(Math.max(...datas)) : null,
      };
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return res.json({ pacientes: resultado, somenteLeitura: req.usuario.tipoUsuario === "professor" });
});

router.get("/pacientes/:pacienteId/registros", autenticar, exigirTipo("estagiario", "professor"), async (req, res) => {
  const estagiarioId = await resolverEstagiario(req, res);
  if (!estagiarioId) return;

  const pacienteId = Number(req.params.pacienteId);
  const ids = await pacientesVinculados(estagiarioId);

  if (!ids.has(pacienteId)) {
    return res.status(403).json({ codigo: "msg_paciente_nao_vinculado", mensagem: "Paciente não vinculado a este estagiário." });
  }

  const [paciente, registros] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: pacienteId }, include: { usuario: { select: { nome: true } } } }),
    prisma.prontuario.findMany({
      where: { estagiarioId, pacienteId },
      orderBy: [{ dataSessao: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return res.json({
    paciente: { id: paciente.id, nome: paciente.usuario.nome },
    registros: registros.map(formatarRegistro),
    somenteLeitura: req.usuario.tipoUsuario === "professor",
  });
});

// UC05 - Registrar Prontuário (nova sessão)
router.post("/pacientes/:pacienteId/registros", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const pacienteId = Number(req.params.pacienteId);
  const ids = await pacientesVinculados(req.usuario.id);

  if (!ids.has(pacienteId)) {
    return res.status(403).json({ codigo: "msg_paciente_nao_vinculado", mensagem: "Paciente não vinculado a você." });
  }

  const { erro, dados } = validarRegistro(req.body);
  if (erro) return res.status(400).json({ codigo: "msg_registro_invalido", mensagem: erro });

  const registro = await prisma.prontuario.create({
    data: { ...dados, pacienteId, estagiarioId: req.usuario.id },
  });

  return res.status(201).json({ mensagem: "Sessão registrada com sucesso.", registro: formatarRegistro(registro) });
});

// UC05 - Fluxo alternativo: editar registro existente (somente o estagiário autor)
router.put("/registros/:id", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const existente = await prisma.prontuario.findUnique({ where: { id: Number(req.params.id) } });

  if (!existente || existente.estagiarioId !== req.usuario.id) {
    return res.status(404).json({ codigo: "msg_registro_nao_encontrado", mensagem: "Registro não encontrado." });
  }

  const { erro, dados } = validarRegistro(req.body);
  if (erro) return res.status(400).json({ codigo: "msg_registro_invalido", mensagem: erro });

  const registro = await prisma.prontuario.update({ where: { id: existente.id }, data: dados });

  return res.json({ mensagem: "Alterações salvas com sucesso.", registro: formatarRegistro(registro) });
});

module.exports = router;
