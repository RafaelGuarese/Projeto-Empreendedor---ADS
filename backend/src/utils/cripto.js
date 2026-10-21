const crypto = require("crypto");

const ALGORITMO = "aes-256-gcm";

if (!process.env.PRONTUARIO_SECRET) {
  console.warn("[AVISO] PRONTUARIO_SECRET não definido no .env — usando chave de desenvolvimento para criptografar prontuários.");
}

const CHAVE = crypto
  .createHash("sha256")
  .update(process.env.PRONTUARIO_SECRET || "psicoliga_prontuario_dev_secret")
  .digest();

// RNF6.1 - conteúdo clínico armazenado criptografado (formato: iv:authTag:conteudo, em base64)
function criptografar(texto) {
  if (texto === undefined || texto === null || texto === "") return null;

  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv(ALGORITMO, CHAVE, iv);
  const conteudo = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);

  return [iv, cifra.getAuthTag(), conteudo].map((b) => b.toString("base64")).join(":");
}

function descriptografar(valor) {
  if (!valor) return "";

  try {
    const [iv, tag, conteudo] = valor.split(":").map((parte) => Buffer.from(parte, "base64"));
    const decifra = crypto.createDecipheriv(ALGORITMO, CHAVE, iv);
    decifra.setAuthTag(tag);

    return Buffer.concat([decifra.update(conteudo), decifra.final()]).toString("utf8");
  } catch {
    // Ocorre se o PRONTUARIO_SECRET mudou depois que o registro foi gravado
    return "[Conteúdo indisponível: não foi possível descriptografar com a chave atual]";
  }
}

module.exports = { criptografar, descriptografar };
