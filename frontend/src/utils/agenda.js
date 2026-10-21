export function agruparPorData(slotsIso) {
  const grupos = new Map();

  slotsIso.forEach((iso) => {
    const data = new Date(iso);
    const chave = data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push({ iso, hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  });

  return Array.from(grupos.entries());
}

export function partesData(iso) {
  const data = new Date(iso);
  return {
    dia: data.toLocaleDateString("pt-BR", { day: "2-digit" }),
    mes: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    semana: data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    semanaLonga: data.toLocaleDateString("pt-BR", { weekday: "long" }),
    hora: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    chaveDia: data.toLocaleDateString("sv-SE"),
  };
}

export function formatarDataHora(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
