# Psicoliga

Implementação inicial da plataforma Psicoliga, cobrindo os requisitos funcionais:

- **RF1 — Cadastro e Autenticação de Usuário**: cadastro (paciente/estagiário/professor), login, bloqueio após 3 tentativas incorretas, recuperação de senha por e-mail.
- **RF2 — Busca de Atendimento**: busca de estagiários por abordagem, especialidade, tipo de atendimento e horário, com ordenação por preço/disponibilidade/avaliação.
- **RF3 — Agendamento de Consultas**: paciente agenda, remarca ou cancela consultas a partir dos horários semanais do estagiário; estagiário também pode cancelar. Cancelamentos/remarcações exigem 12h de antecedência. Notificação de confirmação e lembrete 24h antes são simulados no console do backend.
- **RF4 — Teleconsultas**: ao agendar uma consulta online, o sistema gera automaticamente um link único de videochamada (Jitsi Meet), disponível para paciente e estagiário na tela "Meus Agendamentos".


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

## Observações de escopo (RF3/RF4)

- O agendamento não exige pagamento prévio (RF5 ainda não implementado) — a consulta é confirmada diretamente após a escolha do horário.
- Os horários disponíveis para agendamento são gerados a partir da disponibilidade semanal cadastrada em "Meu Perfil de Atendimento" (ex: "Segunda - Manhã"), projetada para as próximas 4 semanas.
- O link de teleconsulta usa o Jitsi Meet (sala pública, sem necessidade de credenciais de API) como plataforma de videochamada.

