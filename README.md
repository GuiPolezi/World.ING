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

- Autenticação por e-mail e senha (entrar e criar conta), sessão persistente e rota protegida
- Galeria em grid, com miniatura de cada design
- Upload por arrastar-e-soltar (ou clique), com título, descrição e tags
- Geração de miniatura no navegador — canvas para imagens, primeira página via pdf.js para PDF
- Arquivos privados: as imagens do grid usam signed URLs temporárias
- Visualizador em modal (imagem ou PDF), com abrir em nova aba e excluir
- pdf.js carregado sob demanda, só quando há um PDF (bundle inicial leve)

## Estrutura

```
src/
├── lib/
│   ├── supabase.ts        Cliente do Supabase (lê o .env)
│   ├── storage.ts         Caminhos, upload, signed URLs, remoção de arquivos
│   ├── thumbnails.ts      Geração de miniatura (imagem e PDF)
│   └── designs.ts         Upload e exclusão de designs (com limpeza de órfãos)
├── types/database.ts      Tipos que espelham o schema SQL
├── context/AuthContext.tsx  Sessão + sign in / sign up / sign out
├── hooks/useDesigns.ts    Carrega os designs + signed URLs das miniaturas
├── components/
│   ├── ProtectedRoute.tsx Redireciona para /login sem sessão
│   ├── Wordmark.tsx       Marca "World.ING"
│   ├── DesignCard.tsx     Card do grid
│   ├── UploadDialog.tsx   Modal de upload
│   └── DesignViewer.tsx   Modal de visualização
├── pages/
│   ├── Login.tsx          Tela de acesso
│   └── Home.tsx           Galeria (grid + upload + visualizador)
├── App.tsx                Rotas
└── main.tsx               Entrada (Router + AuthProvider)
```

## Convenção de arquivos no Storage

Cada design guarda dois arquivos no bucket privado `designs`, sob uma pasta com o id do dono:

```
{user_id}/{design_id}/original.<ext>   arquivo exportado do Figma
{user_id}/{design_id}/thumb.png        miniatura gerada no upload
```

As políticas de Storage garantem que cada usuário só acessa a própria pasta.

## Próximos passos possíveis

- Projetos (agrupar designs) e filtro por tags
- Busca por título
- Reordenar / renomear designs
- Trocar o carregamento manual por React Query (cache e revalidação)
