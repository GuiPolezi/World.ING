# World.ING

Organizador de designs. Reúna as telas que você exporta do Figma (PNG, JPG, SVG e PDF) em projetos, navegue por elas em um slider e encontre tudo por busca e tags. Acesso privado com login.

Stack: React + TypeScript + Vite + Tailwind CSS + Supabase.

## Modelo

Hierarquia em três níveis:

- **Projeto** agrupa designs (opcional)
- **Design** é um card da galeria; agrupa uma ou mais telas
- **Tela** é um arquivo exportado do Figma

## Pré-requisitos

- Node.js 18 ou superior
- Um projeto no Supabase

## Banco de dados

No Dashboard do Supabase → SQL Editor → New query, rode:

- **Instalação nova:** `db/schema.sql`
- **Já rodou a versão anterior (arquivo único por design):** `db/migration_v1_to_v2.sql`

## Como rodar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o `.env` (Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-public-key
   ```

3. Suba o servidor:

   ```bash
   npm run dev
   ```

Abra o endereço mostrado no terminal (por padrão http://localhost:5173).

## O que já funciona

- Login por e-mail e senha, sessão persistente e rota protegida
- Galeria em grid, agrupada por projeto, responsiva
- Busca por título e filtro por tags
- Upload de uma ou várias telas por design (arrastar-e-soltar ou clique)
- Criar projeto direto no upload e atribuir o design a ele
- Miniatura gerada no navegador — canvas para imagens, pdf.js para PDF
- Arquivos privados via signed URLs temporárias
- Visualizador em modal com slider entre as telas (setas, teclado, miniaturas)
- pdf.js carregado sob demanda (bundle inicial leve)
- Limpeza de órfãos: uploads incompletos não deixam lixo no Storage
- Página de configurações: criar/renomear/excluir projetos, trocar senha e visão geral de armazenamento

## Estrutura

```
db/
├── schema.sql               Schema completo (instalação nova)
└── migration_v1_to_v2.sql   Migração da versão anterior
src/
├── lib/
│   ├── supabase.ts          Cliente do Supabase
│   ├── storage.ts           Caminhos, upload, signed URLs
│   ├── thumbnails.ts        Miniatura (imagem e PDF)
│   ├── designs.ts           Criar/excluir design com telas
│   └── projects.ts          Criar/excluir projeto
├── types/database.ts        Tipos do schema
├── context/AuthContext.tsx  Sessão + auth
├── hooks/
│   ├── useGallery.ts        Projetos + designs + telas + signed URLs
│   └── useProjectStats.ts   Projetos + contagens + totais de armazenamento
├── components/
│   ├── ProtectedRoute.tsx
│   ├── Wordmark.tsx
│   ├── GalleryToolbar.tsx   Busca, filtro de projeto, chips de tags
│   ├── DesignCard.tsx       Card com capa e contador de telas
│   ├── UploadDialog.tsx     Upload de várias telas + projeto
│   └── DesignViewer.tsx     Slider entre as telas
├── pages/
│   ├── Login.tsx
│   ├── Home.tsx             Galeria (toolbar + grupos + diálogos)
│   └── Settings.tsx         Projetos, conta e armazenamento
├── App.tsx
└── main.tsx
```

## Convenção de arquivos no Storage

Bucket privado `designs`, uma pasta por tela:

```
{user_id}/{design_id}/{screen_id}/original.<ext>
{user_id}/{design_id}/{screen_id}/thumb.png
```

## Próximos passos possíveis

- Reordenar as telas de um design (arrastar)
- Adicionar/remover telas de um design existente
- Renomear e excluir projetos pela interface
- Trocar o carregamento manual por React Query (cache e revalidação)
