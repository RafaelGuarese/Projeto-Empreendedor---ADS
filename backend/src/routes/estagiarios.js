const express = require("express");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { paraLista, paraTexto } = require("../utils/listas");

const router = express.Router();

const ABORDAGENS = ["TCC", "Psicanalise", "Humanista", "Gestalt", "Sistemica", "Analise do Comportamento"];
const ESPECIALIDADES = ["ansiedade", "depressao", "infantil", "casal", "geral", "luto", "autoestima", "estresse"];
const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const PERIODOS = ["Manhã", "Tarde", "Noite"];
const TIPOS_ATENDIMENTO = ["presencial", "online", "ambos"];

// Catálogo de opções para montar os selects/checkboxes da tela "Meu Perfil de Atendimento"
router.get("/opcoes", autenticar, (_req, res) => {
  res.json({
    abordagens: ABORDAGENS,
    especialidades: ESPECIALIDADES,
    diasSemana: DIAS_SEMANA,
    periodos: PERIODOS,
    tiposAtendimento: TIPOS_ATENDIMENTO,
  });
});

router.get("/meu-perfil", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const estagiario = await prisma.estagiario.findUnique({
    where: { id: req.usuario.id },
    include: { usuario: { select: { nome: true, email: true } } },
  });

  if (!estagiario) {
    return res.status(404).json({ codigo: "msg_perfil_nao_encontrado", mensagem: "Perfil de estagiário não encontrado." });
  }

  return res.json({
    perfil: {
      registroAcademico: estagiario.registroAcademico || "",
      abordagem: estagiario.abordagem || "",
      especialidades: paraLista(estagiario.especialidades),
      tipoAtendimento: estagiario.tipoAtendimento || "ambos",
      horariosDisponiveis: paraLista(estagiario.horariosDisponiveis),
      valorConsulta: estagiario.valorConsulta,
      avaliacao: estagiario.avaliacao,
      perfilCompleto: Boolean(
        estagiario.abordagem && estagiario.especialidades && estagiario.horariosDisponiveis && estagiario.valorConsulta
      ),
    },
  });
});

router.put("/meu-perfil", autenticar, exigirTipo("estagiario"), async (req, res) => {
  const { registroAcademico, abordagem, especialidades, tipoAtendimento, horariosDisponiveis, valorConsulta } =
    req.body || {};

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

  const estagiario = await prisma.estagiario.update({
    where: { id: req.usuario.id },
    data: {
      registroAcademico: registroAcademico || null,
      abordagem,
      especialidades: paraTexto(especialidades),
      tipoAtendimento,
      horariosDisponiveis: paraTexto(horariosDisponiveis),
      valorConsulta: valor,
    },
  });

  return res.json({
    mensagem: "Perfil de atendimento atualizado com sucesso. Você já pode aparecer nas buscas dos pacientes.",
    perfil: {
      registroAcademico: estagiario.registroAcademico || "",
      abordagem: estagiario.abordagem,
      especialidades: paraLista(estagiario.especialidades),
      tipoAtendimento: estagiario.tipoAtendimento,
      horariosDisponiveis: paraLista(estagiario.horariosDisponiveis),
      valorConsulta: estagiario.valorConsulta,
    },
  });
});

module.exports = router;
