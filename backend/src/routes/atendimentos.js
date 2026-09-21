const express = require("express");

const prisma = require("../prismaClient");
const { autenticar, exigirTipo } = require("../middleware/auth");
const { paraLista } = require("../utils/listas");

const router = express.Router();

function ordenar(lista, criterio) {
  const copia = [...lista];

  switch (criterio) {
    case "preco_asc":
      return copia.sort((a, b) => (a.valorConsulta ?? 0) - (b.valorConsulta ?? 0));
    case "preco_desc":
      return copia.sort((a, b) => (b.valorConsulta ?? 0) - (a.valorConsulta ?? 0));
    case "disponibilidade":
      return copia.sort((a, b) => paraLista(b.horariosDisponiveis).length - paraLista(a.horariosDisponiveis).length);
    case "avaliacao":
      return copia.sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0));
    default:
      return copia.sort((a, b) => (b.avaliacao ?? 0) - (a.avaliacao ?? 0));
  }
}

// UC03 - Buscar Atendimento (RF2)
router.get("/buscar", autenticar, exigirTipo("paciente"), async (req, res) => {
  const { abordagem, especialidade, tipoAtendimento, horario, precoMax, ordenarPor } = req.query;

  // V1 - Ao menos um filtro deve ser selecionado para realizar a busca
  if (!abordagem && !especialidade && !tipoAtendimento && !horario && !precoMax) {
    return res.status(400).json({
      codigo: "msg_filtro_obrigatorio",
      mensagem: "Selecione ao menos um filtro para realizar a busca.",
    });
  }

  const where = {
    AND: [],
  };

  if (abordagem) {
    where.AND.push({ abordagem: { equals: String(abordagem) } });
  }

  if (especialidade) {
    where.AND.push({ especialidades: { contains: String(especialidade) } });
  }

  if (tipoAtendimento) {
    where.AND.push({
      OR: [{ tipoAtendimento: String(tipoAtendimento) }, { tipoAtendimento: "ambos" }],
    });
  }

  if (horario) {
    where.AND.push({ horariosDisponiveis: { contains: String(horario) } });
  }

  if (precoMax) {
    where.AND.push({ valorConsulta: { lte: Number(precoMax) } });
  }

  // Só retorna estagiários com perfil de atendimento configurado (valor definido)
  where.AND.push({ valorConsulta: { not: null } });

  const inicio = Date.now();

  const estagiarios = await prisma.estagiario.findMany({
    where,
    include: { usuario: { select: { nome: true } } },
  });

  const resultados = ordenar(estagiarios, ordenarPor).map((e) => ({
    id: e.id,
    nome: e.usuario.nome,
    abordagem: e.abordagem,
    especialidades: paraLista(e.especialidades),
    tipoAtendimento: e.tipoAtendimento,
    horariosDisponiveis: paraLista(e.horariosDisponiveis),
    valorConsulta: e.valorConsulta,
    avaliacao: e.avaliacao,
  }));

  const tempoMs = Date.now() - inicio;

  // RNF2.1 - a busca deve retornar resultados em até 3 segundos
  return res.json({
    total: resultados.length,
    tempoMs,
    resultados,
    mensagem:
      resultados.length === 0
        ? "Nenhum profissional encontrado com os filtros selecionados. Tente outros critérios."
        : undefined,
  });
});

// Lista os valores disponíveis para popular os filtros no frontend
router.get("/filtros", autenticar, async (_req, res) => {
  const estagiarios = await prisma.estagiario.findMany({
    where: { valorConsulta: { not: null } },
    select: { abordagem: true, especialidades: true },
  });

  const abordagens = new Set();
  const especialidades = new Set();

  estagiarios.forEach((e) => {
    if (e.abordagem) abordagens.add(e.abordagem);
    paraLista(e.especialidades).forEach((esp) => especialidades.add(esp));
  });

  return res.json({
    abordagens: Array.from(abordagens).sort(),
    especialidades: Array.from(especialidades).sort(),
  });
});

module.exports = router;
