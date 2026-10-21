const TIPOS_CHAVE_PIX = ["cpf", "cnpj", "email", "telefone", "aleatoria"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Normaliza a chave para o formato exigido pelo BR Code; retorna null se for inválida para o tipo.
function normalizarChavePix(tipo, chave) {
  if (typeof chave !== "string") return null;
  const valor = chave.trim();
  const digitos = valor.replace(/\D/g, "");

  switch (tipo) {
    case "cpf":
      return digitos.length === 11 ? digitos : null;
    case "cnpj":
      return digitos.length === 14 ? digitos : null;
    case "email":
      return EMAIL_REGEX.test(valor) && valor.length <= 77 ? valor.toLowerCase() : null;
    case "telefone": {
      const semPais = digitos.length >= 12 && digitos.startsWith("55") ? digitos.slice(2) : digitos;
      return semPais.length === 10 || semPais.length === 11 ? `+55${semPais}` : null;
    }
    case "aleatoria":
      return UUID_REGEX.test(valor.toLowerCase()) ? valor.toLowerCase() : null;
    default:
      return null;
  }
}

function campo(id, valor) {
  const texto = String(valor);
  return `${id}${String(texto.length).padStart(2, "0")}${texto}`;
}

function textoBrCode(texto, max) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no campo 63 do BR Code
function crc16(payload) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Gera o "PIX copia e cola" estático (padrão EMV/BR Code do Banco Central) com valor e identificador da cobrança
function gerarPixCopiaECola({ chave, nomeRecebedor, cidade, valor, txid }) {
  const contaRecebedor = campo("00", "br.gov.bcb.pix") + campo("01", chave);

  const semCrc =
    campo("00", "01") +
    campo("26", contaRecebedor) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", Number(valor).toFixed(2)) +
    campo("58", "BR") +
    campo("59", textoBrCode(nomeRecebedor, 25) || "RECEBEDOR") +
    campo("60", textoBrCode(cidade, 15) || "BRASIL") +
    campo("62", campo("05", txid)) +
    "6304";

  return semCrc + crc16(semCrc);
}

function mascararChavePix(tipo, chave) {
  if (!chave) return "";
  if (tipo === "cpf") return `***.${chave.slice(3, 6)}.${chave.slice(6, 9)}-**`;
  if (tipo === "telefone") return `${chave.slice(0, 5)}*****${chave.slice(-4)}`;
  return chave;
}

module.exports = { TIPOS_CHAVE_PIX, normalizarChavePix, gerarPixCopiaECola, mascararChavePix };
