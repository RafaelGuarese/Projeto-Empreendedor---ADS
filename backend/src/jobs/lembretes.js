const prisma = require("../prismaClient");

const INTERVALO_VERIFICACAO_MS = 5 * 60 * 1000; // a cada 5 minutos
const JANELA_LEMBRETE_HORAS = 24;

// RNF3.2 - envia lembrete (simulado) 24h antes da consulta
async function verificarLembretes() {
  const agora = new Date();
  const inicioJanela = new Date(agora.getTime() + (JANELA_LEMBRETE_HORAS - 1) * 60 * 60 * 1000);
  const fimJanela = new Date(agora.getTime() + (JANELA_LEMBRETE_HORAS + 1) * 60 * 60 * 1000);

  const consultas = await prisma.consulta.findMany({
    where: {
      status: "agendada",
      lembreteEnviado: false,
      dataHora: { gte: inicioJanela, lte: fimJanela },
    },
    include: {
      paciente: { include: { usuario: { select: { nome: true } } } },
      estagiario: { include: { usuario: { select: { nome: true } } } },
    },
  });

  for (const consulta of consultas) {
    console.log(
      `[NOTIFICAÇÃO SIMULADA] Lembrete: consulta de ${consulta.paciente.usuario.nome} com ${consulta.estagiario.usuario.nome} amanhã às ${consulta.dataHora.toLocaleString("pt-BR")}.`
    );

    await prisma.consulta.update({ where: { id: consulta.id }, data: { lembreteEnviado: true } });
  }
}

function iniciarJobLembretes() {
  verificarLembretes().catch((err) => console.error("Erro ao verificar lembretes:", err));
  setInterval(() => {
    verificarLembretes().catch((err) => console.error("Erro ao verificar lembretes:", err));
  }, INTERVALO_VERIFICACAO_MS);
}

module.exports = { iniciarJobLembretes };
