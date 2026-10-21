-- AlterTable
ALTER TABLE "Estagiario" ADD COLUMN "chavePix" TEXT;
ALTER TABLE "Estagiario" ADD COLUMN "tipoChavePix" TEXT;

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "valor" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "formaPagamento" TEXT NOT NULL DEFAULT 'pix',
    "chavePix" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "pixCopiaECola" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "idTransacaoBanco" TEXT,
    "numeroComprovante" TEXT,
    "expiraEm" DATETIME NOT NULL,
    "pagoEm" DATETIME,
    "confirmadoEm" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consultaId" INTEGER NOT NULL,
    CONSTRAINT "Pagamento_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consulta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Prontuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataSessao" DATETIME NOT NULL,
    "duracao" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pacienteId" INTEGER NOT NULL,
    "estagiarioId" INTEGER NOT NULL,
    CONSTRAINT "Prontuario_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prontuario_estagiarioId_fkey" FOREIGN KEY ("estagiarioId") REFERENCES "Estagiario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Consulta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataHora" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aguardando_pagamento',
    "tipo" TEXT NOT NULL,
    "linkVideo" TEXT,
    "valor" REAL,
    "canceladoPor" TEXT,
    "lembreteEnviado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pacienteId" INTEGER NOT NULL,
    "estagiarioId" INTEGER NOT NULL,
    CONSTRAINT "Consulta_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Consulta_estagiarioId_fkey" FOREIGN KEY ("estagiarioId") REFERENCES "Estagiario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Consulta" ("canceladoPor", "createdAt", "dataHora", "estagiarioId", "id", "lembreteEnviado", "linkVideo", "pacienteId", "status", "tipo", "valor") SELECT "canceladoPor", "createdAt", "dataHora", "estagiarioId", "id", "lembreteEnviado", "linkVideo", "pacienteId", "status", "tipo", "valor" FROM "Consulta";
DROP TABLE "Consulta";
ALTER TABLE "new_Consulta" RENAME TO "Consulta";
CREATE INDEX "Consulta_estagiarioId_dataHora_idx" ON "Consulta"("estagiarioId", "dataHora");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_numeroComprovante_key" ON "Pagamento"("numeroComprovante");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_consultaId_key" ON "Pagamento"("consultaId");

-- CreateIndex
CREATE INDEX "Prontuario_estagiarioId_pacienteId_idx" ON "Prontuario"("estagiarioId", "pacienteId");
