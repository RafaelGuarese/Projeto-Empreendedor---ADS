const express = require("express");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { paraLista, paraTexto } = require("../utils/listas");
const { TIPOS_CHAVE_PIX, normalizarChavePix } = require("../utils/pix");

const router = express.Router();

const ABORDAGENS = ["TCC", "Psicanalise", "Humanista", "Gestalt", "Sistemica", "Analise do Comportamento"];
const ESPECIALIDADES = ["ansiedade", "depressao", "infantil", "casal", "geral", "luto", "autoestima", "estresse"];
const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const PERIODOS = ["Manhã", "Tarde", "Noite"];
const TIPOS_ATENDIMENTO = ["presencial", "online", "ambos"];

function formatarPerfil(estagiario) {
  return {
    registroAcademico: estagiario.registroAcademico || "",
    abordagem: estagiario.abordagem || "",
    especialidades: paraLista(estagiario.especialidades),
    tipoAtendimento: estagiario.tipoAtendimento || "ambos",
    horariosDisponiveis: paraLista(estagiario.horariosDisponiveis),
    valorConsulta: estagiario.valorConsulta,
    avaliacao: estagiario.avaliacao,
    tipoChavePix: estagiario.tipoChavePix || "",
    chavePix: estagiario.chavePix || "",
    professorId: estagiario.professorId,
    perfilCompleto: Boolean(
      estagiario.abordagem &&
        estagiario.especialidades &&
        estagiario.horariosDisponiveis &&
        estagiario.valorConsulta &&
        estagiario.chavePix
    ),
  };
}

// Catálogo de opções para montar os selects/checkboxes da tela "Meu Perfil de Atendimento"
router.get("/opcoes", autenticar, (_req, res) => {
  res.json({
    abordagens: ABORDAGENS,
    especialidades: ESPECIALIDADES,
    diasSemana: DIAS_SEMANA,
    periodos: PERIODOS,
    tiposAtendimento: TIPOS_ATENDIMENTO,
    tiposChavePix: TIPOS_CHAVE_PIX,
  });
});

// Professores orientadores disponíveis para o estagiário vincular-se (supervisão - RF6)
router.get("/professores", autenticar, exigirTipo("estagiario"), async (_req, res) => {
  const professores = await prisma.professor.findMany({
    include: { usuario: { select: { nome: true } } },
    orderBy: { usuario: { nome: "asc" } },
  });

  return res.json({
    professores: professores.map((p) => ({ id: p.id, nome: p.usuario.nome, departamento: p.departamento })),
  });
});

router.get("/meu-perfil", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const estagiario = await prisma.estagiario.findUnique({ where: { id: req.usuario.id } });

  if (!estagiario) {
    return res.status(404).json({ codigo: "msg_perfil_nao_encontrado", mensagem: "Perfil de estagiário não encontrado." });
  }

  return res.json({ perfil: formatarPerfil(estagiario) });
});

router.put("/meu-perfil", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const {
    registroAcademico,
    abordagem,
    especialidades,
    tipoAtendimento,
    horariosDisponiveis,
    valorConsulta,
    tipoChavePix,
    chavePix,
    professorId,
  } = req.body || {};

  if (!abordagem || !ABORDAGENS.includes(abordagem)) {
    return res.status(400).json({ codigo: "msg_abordagem_invalida", mensagem: "Selecione uma abordagem válida." });
  }

  if (!Array.isArray(especialidades) || especialidades.length === 0) {
    return res.status(400).json({
      codigo: "msg_especialidades_obrigatorias",
      mensagem: "Selecione ao menos uma especialidade/necessidade atendida.",
    });
  }

  if (!tipoAtendimento || !TIPOS_ATENDIMENTO.includes(tipoAtendimento)) {
    return res.status(400).json({ codigo: "msg_tipo_atendimento_invalido", mensagem: "Selecione o tipo de atendimento." });
  }

  if (!Array.isArray(horariosDisponiveis) || horariosDisponiveis.length === 0) {
    return res.status(400).json({
      codigo: "msg_horarios_obrigatorios",
      mensagem: "Adicione ao menos um horário disponível.",
    });
  }

  const valor = Number(valorConsulta);
  if (!valorConsulta || Number.isNaN(valor) || valor <= 0) {
    return res.status(400).json({ codigo: "msg_valor_invalido", mensagem: "Informe um valor de consulta válido." });
  }

  // RF5 - chave PIX onde o estagiário recebe os pagamentos das consultas
  if (!TIPOS_CHAVE_PIX.includes(tipoChavePix)) {
    return res.status(400).json({ codigo: "msg_tipo_chave_pix_invalido", mensagem: "Selecione o tipo da chave PIX." });
  }

  const chaveNormalizada = normalizarChavePix(tipoChavePix, chavePix);
  if (!chaveNormalizada) {
    return res.status(400).json({
      codigo: "msg_chave_pix_invalida",
      mensagem: "Chave PIX inválida para o tipo selecionado.",
    });
  }

  let professorVinculado = null;
  if (professorId) {
    professorVinculado = await prisma.professor.findUnique({ where: { id: Number(professorId) } });
    if (!professorVinculado) {
      return res.status(400).json({ codigo: "msg_professor_invalido", mensagem: "Professor orientador não encontrado." });
    }
  }

  const estagiario = await prisma.estagiario.update({
    where: { id: req.usuario.id },
    data: {
      registroAcademico: registroAcademico || null,
      abordagem,
      especialidades: paraTexto(especialidades),
      tipoAtendimento,
      horariosDisponiveis: paraTexto(horariosDisponiveis),
      valorConsulta: valor,
      tipoChavePix,
      chavePix: chaveNormalizada,
      professorId: professorVinculado ? professorVinculado.id : null,
    },
  });

  return res.json({
    mensagem: "Perfil de atendimento atualizado com sucesso. Você já pode aparecer nas buscas dos pacientes.",
    perfil: formatarPerfil(estagiario),
  });
});

module.exports = router;
