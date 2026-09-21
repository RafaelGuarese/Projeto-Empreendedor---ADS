# Psicoliga

Implementação inicial da plataforma Psicoliga, cobrindo os requisitos funcionais:

- **RF1 — Cadastro e Autenticação de Usuário**: cadastro (paciente/estagiário/professor), login, bloqueio após 3 tentativas incorretas, recuperação de senha por e-mail.
- **RF2 — Busca de Atendimento**: busca de estagiários por abordagem, especialidade, tipo de atendimento e horário, com ordenação por preço/disponibilidade/avaliação.

Os demais requisitos (RF3 a RF6) descritos na documentação de Engenharia de Software ainda não foram implementados.

## Stack

- **Backend**: Node.js + Express + Prisma + SQLite (`backend/`)
- **Frontend**: React + Vite + React Router (`frontend/`)

## Como rodar

### 1. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

A API sobe em `http://localhost:3001`.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

A aplicação abre em `http://localhost:5173` (o Vite já faz proxy de `/api` para o backend).

## Contas de demonstração

Criadas pelo script de seed (`backend/prisma/seed.js`), todas com senha `Senha123`:

| Perfil     | E-mail                          |
|------------|----------------------------------|
| Paciente   | paciente@psicoliga.com          |
| Estagiário | leonardo.estagiario@psicoliga.com |
| Professor  | professor@psicoliga.com         |

Há mais 4 estagiários cadastrados (perfis diferentes de abordagem/especialidade) para testar os filtros da busca — veja `backend/prisma/seed.js`.

## Observações de escopo

- O recurso de e-mail de recuperação de senha é **simulado**: o link é impresso no console do backend em vez de enviado por um serviço de e-mail real.
- Estagiários cadastrados pela tela de Cadastro entram sem perfil de atendimento preenchido (não aparecem na busca). Após o primeiro login, eles preenchem abordagem, especialidades, tipo de atendimento, horários e valor da consulta na tela **"Meu Perfil de Atendimento"** (acessível pelo Dashboard) — a partir daí passam a aparecer nos resultados de busca dos pacientes.
- O botão "Agendar" na busca é um placeholder: o Agendamento de Consultas é o RF3, ainda não implementado.
