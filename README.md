# World.ING

Galeria pessoal de designs. Reúna, organize e revisite os frames que você exporta do Figma (PNG, JPG, SVG e PDF) em um só lugar. Acesso privado com login.

Stack: React + TypeScript + Vite + Tailwind CSS + Supabase.

## Pré-requisitos

- Node.js 18 ou superior
- Um projeto no Supabase com o schema já aplicado (arquivo `worlding_schema.sql`)

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente. Copie o exemplo e preencha com os dados do seu projeto (Dashboard do Supabase → Project Settings → API):

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-public-key
   ```

3. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

Abra o endereço mostrado no terminal (por padrão http://localhost:5173).

## O que já funciona

- Autenticação por e-mail e senha (entrar e criar conta)
- Sessão persistente e rota protegida — a home só abre logado
- Tela de login e a base visual do sistema

## Estrutura

```
src/
├── lib/supabase.ts          Cliente do Supabase (lê o .env)
├── types/database.ts        Tipos que espelham o schema SQL
├── context/AuthContext.tsx  Sessão + sign in / sign up / sign out
├── components/
│   ├── ProtectedRoute.tsx   Redireciona para /login sem sessão
│   └── Wordmark.tsx         Marca "World.ING"
├── pages/
│   ├── Login.tsx            Tela de acesso
│   └── Home.tsx             Galeria (estado vazio por enquanto)
├── App.tsx                  Rotas
└── main.tsx                 Entrada (Router + AuthProvider)
```

## Próximos passos

- Grid de cards lendo os designs do banco
- Fluxo de upload (arquivo do Figma + metadados) com signed URLs
- Geração de miniatura para PDFs
- Visualização em modal
```
