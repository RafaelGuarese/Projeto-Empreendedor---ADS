const { paraLista } = require("./listas");

const DIA_SEMANA_NUMERO = {
  Domingo: 0,
  Segunda: 1,
  Terça: 2,
  Quarta: 3,
  Quinta: 4,
  Sexta: 5,
  Sábado: 6,
};

const PERIODO_HORA = {
  Manhã: 9,
  Tarde: 14,
  Noite: 19,
};

const SEMANAS_PADRAO = 4;
const HORAS_MINIMAS_CANCELAMENTO = 12;

// Converte a disponibilidade semanal do estagiário (ex: "Segunda - Manhã")
// nos próximos horários concretos (data + hora) para o paciente escolher no agendamento (RF3).
function gerarSlotsFuturos(horariosDisponiveis, semanas = SEMANAS_PADRAO) {
  const horarios = paraLista(horariosDisponiveis);
  const slots = [];
  const agora = new Date();

  for (let diaOffset = 1; diaOffset <= semanas * 7; diaOffset++) {
    const data = new Date(agora);
    data.setDate(data.getDate() + diaOffset);
    data.setHours(0, 0, 0, 0);
    const diaSemana = data.getDay();

    horarios.forEach((horario) => {
      const [diaNome, periodo] = horario.split(" - ").map((s) => s.trim());
      if (DIA_SEMANA_NUMERO[diaNome] !== diaSemana) return;

      const dataHora = new Date(data);
      dataHora.setHours(PERIODO_HORA[periodo] ?? 9, 0, 0, 0);
      slots.push(dataHora);
    });
  }

  return slots.sort((a, b) => a - b);
}

function horasAte(dataHora) {
  return (new Date(dataHora).getTime() - Date.now()) / (1000 * 60 * 60);
}

module.exports = { gerarSlotsFuturos, horasAte, HORAS_MINIMAS_CANCELAMENTO };
