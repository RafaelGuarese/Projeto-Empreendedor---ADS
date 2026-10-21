const prisma = require("../prismaClient");

const INTERVALO_VERIFICACAO_MS = 60 * 1000;

// Libera os horários reservados cujo prazo de pagamento PIX expirou
async function expirarReservas() {
  const vencidos = await prisma.pagamento.findMany({
    where: { status: "pendente", expiraEm: { lt: new Date() } },
    select: { id: true, consultaId: true },
  });

  if (vencidos.length === 0) return;

  await prisma.$transaction([
    prisma.consulta.updateMany({
      where: { id: { in: vencidos.map((p) => p.consultaId) }, status: "aguardando_pagamento" },
      data: { status: "cancelada", canceladoPor: "sistema" },
    }),
    prisma.pagamento.updateMany({
      where: { id: { in: vencidos.map((p) => p.id) } },
      data: { status: "expirado" },
    }),
  ]);

  console.log(`[RESERVAS] ${vencidos.length} reserva(s) expirada(s) por falta de pagamento — horários liberados.`);
}

function iniciarJobReservas() {
  const executar = () => expirarReservas().catch((err) => console.error("Erro ao expirar reservas:", err));
  executar();
  setInterval(executar, INTERVALO_VERIFICACAO_MS);
}

module.exports = { iniciarJobReservas };
