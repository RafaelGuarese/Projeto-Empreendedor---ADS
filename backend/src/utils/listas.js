function paraLista(valor) {
  return valor
    ? valor
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function paraTexto(lista) {
  if (!Array.isArray(lista)) return null;
  const limpa = lista.map((item) => String(item).trim()).filter(Boolean);
  return limpa.length > 0 ? limpa.join(",") : null;
}

module.exports = { paraLista, paraTexto };
