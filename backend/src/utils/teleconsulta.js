const crypto = require("crypto");

// RF4 - link único de videochamada. Usa o Jitsi Meet (sala pública, sem necessidade de credenciais de API).
function gerarLinkTeleconsulta() {
  const sala = crypto.randomBytes(8).toString("hex");
  return `https://meet.jit.si/psicoliga-${sala}`;
}

module.exports = { gerarLinkTeleconsulta };
