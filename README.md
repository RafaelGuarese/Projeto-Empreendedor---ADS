# Psicoliga

Implementação inicial da plataforma Psicoliga, cobrindo os requisitos funcionais:

- **RF1 — Cadastro e Autenticação de Usuário**
  
- **RF2 — Busca de Atendimento**
  
- **RF3 — Agendamento de Consultas**
  
- **RF4 — Teleconsultas**
  
- **RF5 — Pagamentos**
  
- **RF6 — Prontuário Eletrônico**


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

