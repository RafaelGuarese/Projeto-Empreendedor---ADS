const PALETA = [
  ["#dcefee", "#2c5c61"],
  ["#e8e4f7", "#55489a"],
  ["#fde8da", "#9a4f1f"],
  ["#e1edfb", "#2f5b8f"],
  ["#f6e2ec", "#8f3a63"],
  ["#e5f1dd", "#3f6a2a"],
];

function iniciais(nome = "") {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

export default function Avatar({ nome, tamanho = 44 }) {
  const indice = [...(nome || "")].reduce((soma, c) => soma + c.charCodeAt(0), 0) % PALETA.length;
  const [fundo, texto] = PALETA[indice];

  return (
    <span
      className="avatar"
      style={{ width: tamanho, height: tamanho, background: fundo, color: texto, fontSize: tamanho * 0.38 }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}
