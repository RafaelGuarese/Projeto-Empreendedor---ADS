const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "psicoliga_dev_secret_change_me";

function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ codigo: "msg_nao_autenticado", mensagem: "Faça login para continuar." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ codigo: "msg_token_invalido", mensagem: "Sessão expirada. Faça login novamente." });
  }
}

function exigirTipo(...tipos) {
  return (req, res, next) => {
    if (!req.usuario || !tipos.includes(req.usuario.tipoUsuario)) {
      return res.status(403).json({ codigo: "msg_acesso_negado", mensagem: "Você não tem permissão para acessar este recurso." });
    }
    next();
  };
}

module.exports = { autenticar, exigirTipo, JWT_SECRET };
