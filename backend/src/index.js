require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const atendimentosRoutes = require("./routes/atendimentos");
const estagiariosRoutes = require("./routes/estagiarios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/atendimentos", atendimentosRoutes);
app.use("/api/estagiarios", estagiariosRoutes);

app.use((req, res) => {
  res.status(404).json({ codigo: "msg_rota_nao_encontrada", mensagem: "Rota não encontrada." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ codigo: "msg_erro_interno", mensagem: "Erro interno do servidor." });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Psicoliga API rodando em http://localhost:${PORT}`);
});
