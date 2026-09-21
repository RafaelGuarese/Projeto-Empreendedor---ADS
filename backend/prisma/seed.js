const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SENHA_PADRAO = "Senha123";

async function criarUsuarioComPerfil({ nome, email, cpf, telefone, tipoUsuario, perfil }) {
  const senha = await bcrypt.hash(SENHA_PADRAO, 10);

  return prisma.usuario.create({
    data: {
      nome,
      email,
      cpf,
      telefone,
      senha,
      tipoUsuario,
      ...(tipoUsuario === "paciente" && { paciente: { create: perfil || {} } }),
      ...(tipoUsuario === "estagiario" && { estagiario: { create: perfil || {} } }),
      ...(tipoUsuario === "professor" && { professor: { create: perfil || {} } }),
    },
  });
}

async function main() {
  console.log("Limpando dados existentes...");
  await prisma.estagiario.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("Criando professor orientador...");
  const professorUsuario = await criarUsuarioComPerfil({
    nome: "Jason Rodolpho dos Santos",
    email: "professor@psicoliga.com",
    cpf: "11122233344",
    telefone: "54999990001",
    tipoUsuario: "professor",
    perfil: { departamento: "Psicologia Clínica" },
  });

  console.log("Criando paciente de demonstração...");
  await criarUsuarioComPerfil({
    nome: "Ana Beatriz Souza",
    email: "paciente@psicoliga.com",
    cpf: "22233344455",
    telefone: "54999990002",
    tipoUsuario: "paciente",
  });

  console.log("Criando estagiários com perfil de atendimento (para a busca - RF2)...");

  const estagiarios = [
    {
      nome: "Leonardo Silva da Silveira",
      email: "leonardo.estagiario@psicoliga.com",
      cpf: "33344455566",
      telefone: "54999990003",
      perfil: {
        registroAcademico: "2023001",
        abordagem: "TCC",
        especialidades: "ansiedade,depressao",
        tipoAtendimento: "ambos",
        horariosDisponiveis: "Segunda - Manhã,Quarta - Tarde,Sexta - Manhã",
        valorConsulta: 80,
        avaliacao: 4.8,
        professorId: professorUsuario.id,
      },
    },
    {
      nome: "Kauã Feltes de Moura",
      email: "kaue.estagiario@psicoliga.com",
      cpf: "44455566677",
      telefone: "54999990004",
      perfil: {
        registroAcademico: "2023002",
        abordagem: "Psicanalise",
        especialidades: "casal,ansiedade",
        tipoAtendimento: "presencial",
        horariosDisponiveis: "Terça - Tarde,Quinta - Tarde",
        valorConsulta: 100,
        avaliacao: 4.5,
        professorId: professorUsuario.id,
      },
    },
    {
      nome: "Emanuel Carvalho dos Santos",
      email: "emanuel.estagiario@psicoliga.com",
      cpf: "55566677788",
      telefone: "54999990005",
      perfil: {
        registroAcademico: "2023003",
        abordagem: "Humanista",
        especialidades: "infantil,depressao",
        tipoAtendimento: "online",
        horariosDisponiveis: "Segunda - Noite,Terça - Noite,Quarta - Noite",
        valorConsulta: 70,
        avaliacao: 4.2,
        professorId: professorUsuario.id,
      },
    },
    {
      nome: "Rafael Guarese Sasseti",
      email: "rafael.estagiario@psicoliga.com",
      cpf: "66677788899",
      telefone: "54999990006",
      perfil: {
        registroAcademico: "2023004",
        abordagem: "TCC",
        especialidades: "infantil,casal,ansiedade",
        tipoAtendimento: "ambos",
        horariosDisponiveis: "Sexta - Tarde,Sábado - Manhã",
        valorConsulta: 90,
        avaliacao: 4.9,
        professorId: professorUsuario.id,
      },
    },
    {
      nome: "Marina Costa Lima",
      email: "marina.estagiaria@psicoliga.com",
      cpf: "77788899900",
      telefone: "54999990007",
      perfil: {
        registroAcademico: "2023005",
        abordagem: "Gestalt",
        especialidades: "depressao,ansiedade,geral",
        tipoAtendimento: "online",
        horariosDisponiveis: "Segunda - Tarde,Quinta - Manhã",
        valorConsulta: 60,
        avaliacao: 4.0,
        professorId: professorUsuario.id,
      },
    },
  ];

  for (const est of estagiarios) {
    await criarUsuarioComPerfil({ ...est, tipoUsuario: "estagiario" });
  }

  console.log("\nSeed concluído!");
  console.log("Contas de demonstração (senha para todas: Senha123):");
  console.log("  Paciente:   paciente@psicoliga.com");
  console.log("  Estagiário: leonardo.estagiario@psicoliga.com");
  console.log("  Professor:  professor@psicoliga.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
