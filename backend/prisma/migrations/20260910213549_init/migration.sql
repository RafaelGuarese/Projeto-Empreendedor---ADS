-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "senha" TEXT NOT NULL,
    "tipoUsuario" TEXT NOT NULL,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "resetToken" TEXT,
    "resetTokenExpires" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "historicoConsultas" TEXT,
    CONSTRAINT "Paciente_id_fkey" FOREIGN KEY ("id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Estagiario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registroAcademico" TEXT,
    "abordagem" TEXT,
    "especialidades" TEXT,
    "tipoAtendimento" TEXT NOT NULL DEFAULT 'ambos',
    "horariosDisponiveis" TEXT,
    "valorConsulta" REAL,
    "avaliacao" REAL NOT NULL DEFAULT 0,
    "professorId" INTEGER,
    CONSTRAINT "Estagiario_id_fkey" FOREIGN KEY ("id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Estagiario_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Professor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "departamento" TEXT,
    CONSTRAINT "Professor_id_fkey" FOREIGN KEY ("id") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");
