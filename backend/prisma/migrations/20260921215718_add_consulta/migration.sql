-- CreateTable
CREATE TABLE "Consulta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dataHora" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'agendada',
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

-- CreateIndex
CREATE INDEX "Consulta_estagiarioId_dataHora_idx" ON "Consulta"("estagiarioId", "dataHora");
