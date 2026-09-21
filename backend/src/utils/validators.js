const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const TIPOS_USUARIO = ["paciente", "estagiario", "professor"];

function emailValido(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email);
}

function senhaValida(senha) {
  return typeof senha === "string" && SENHA_REGEX.test(senha);
}

function cpfLimpo(cpf) {
  return typeof cpf === "string" ? cpf.replace(/\D/g, "") : "";
}

function cpfValido(cpf) {
  const limpo = cpfLimpo(cpf);
  return limpo.length === 11 && !/^(\d)\1{10}$/.test(limpo);
}

function tipoUsuarioValido(tipo) {
  return TIPOS_USUARIO.includes(tipo);
}

module.exports = {
  emailValido,
  senhaValida,
  cpfLimpo,
  cpfValido,
  tipoUsuarioValido,
  TIPOS_USUARIO,
};
