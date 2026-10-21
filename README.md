# Psicoliga

Implementação inicial da plataforma Psicoliga, cobrindo os requisitos funcionais:

- **RF1 — Cadastro e Autenticação de Usuário**: cadastro (paciente/estagiário/professor), login, bloqueio após 3 tentativas incorretas, recuperação de senha por e-mail.
- **RF2 — Busca de Atendimento**: busca de estagiários por abordagem, especialidade, tipo de atendimento e horário, com ordenação por preço/disponibilidade/avaliação.
- **RF3 — Agendamento de Consultas**: paciente agenda, remarca ou cancela consultas a partir dos horários semanais do estagiário; estagiário também pode cancelar. Cancelamentos/remarcações exigem 12h de antecedência. Notificação de confirmação e lembrete 24h antes são simulados no console do backend.
- **RF4 — Teleconsultas**: ao confirmar uma consulta online, o sistema gera automaticamente um link único de videochamada (Jitsi Meet), disponível para paciente e estagiário na tela "Meus Agendamentos".
- **RF5 — Pagamentos**: o estagiário cadastra sua chave PIX no perfil. Ao agendar, o paciente recebe QR Code e código "copia e cola" (BR Code no padrão do Banco Central) com o valor da consulta, paga no app do banco e informa o pagamento — o sistema gera um comprovante para o estagiário, que confirma ou recusa o recebimento.
- **RF6 — Prontuário Eletrônico**: o estagiário registra e edita sessões (data, duração, descrição, observações) dos pacientes atendidos, com busca por paciente. O conteúdo clínico é criptografado no banco (AES-256-GCM) e só é acessível ao estagiário responsável e ao seu professor orientador (somente leitura).


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

## Configuração (`backend/.env`)

O arquivo `.env` não vai para o Git. Copie `backend/.env.example` para `backend/.env` e ajuste os valores. Atenção ao `PRONTUARIO_SECRET`: é a chave que criptografa os prontuários — se ela mudar, os registros já gravados deixam de poder ser lidos.

## Observações de escopo

- Os horários disponíveis para agendamento são gerados a partir da disponibilidade semanal cadastrada em "Meu Perfil de Atendimento" (ex: "Segunda - Manhã"), projetada para as próximas 4 semanas.
- O link de teleconsulta usa o Jitsi Meet (sala pública, sem necessidade de credenciais de API) como plataforma de videochamada.
- **Fluxo de pagamento**: ao escolher o horário, ele fica reservado por 30 minutos aguardando o PIX. Quando o paciente informa o pagamento, a consulta é confirmada e o comprovante vai para o estagiário. Reservas não pagas no prazo são liberadas automaticamente.
- **O sistema não verifica o PIX junto ao banco** (não há integração com gateway de pagamento): o pagamento acontece direto entre o paciente e a chave do estagiário, e é o estagiário quem confere o crédito na conta e confirma (ou recusa, o que cancela a consulta).
- Notificações (confirmação, lembrete 24h antes, comprovante enviado) são simuladas no console do backend.
- Os estagiários de demonstração do seed usam o próprio e-mail fictício como chave PIX — o QR Code é válido, mas não aponta para uma conta real.

