# EBR Consultoria — Plataforma GovAnalytics

Plataforma SaaS de análise de dados públicos e apoio à decisão para gestão pública, consultores, prefeituras e jornalistas investigativos.

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Git

## Instalação local (desenvolvimento)

```bash
# Copiar variáveis de ambiente
cp .env.example .env
# Editar o .env com suas configurações

# Subir banco de dados e Redis
docker-compose up -d db redis

# Instalar dependências e iniciar API
cd apps/api
npm install
npx prisma migrate dev
npm run dev

# Em outro terminal — iniciar frontend
cd apps/web
npm install
npm run dev
```

Acesse: http://localhost:3000

**Credenciais de demonstração:**
- Admin: `admin@ebrconsultoria.com.br` / `Admin@2026`
- Demo: `demo@ebrconsultoria.com.br` / `Demo@2026`

## Deploy com Docker Compose

```bash
cp .env.example .env
# Configure todas as variáveis, especialmente:
# - Senhas fortes para DB e Redis
# - JWT secrets (node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - Configuração de SMTP real
# - Certificados SSL em nginx/ssl/

docker-compose up -d
```

## Configurar API do Portal da Transparência

1. Acessar https://portaldatransparencia.gov.br/api-de-dados/cadastrar
2. Solicitar chave gratuita
3. Adicionar ao `.env`: `CGU_API_KEY=sua_chave`

## Subsistemas

| Módulo | Descrição | APIs |
|--------|-----------|------|
| **LicitaAlerta** | Busca e monitoramento de licitações | PNCP |
| **TransparênciaPro** | Análise de gastos públicos | Portal da Transparência (CGU) |
| **Raio-X Público** | Análises e rankings temáticos | IBGE, IPEA |
| **GovAnalytics** | Detecção de anomalias | PNCP, CGU |
| **SAD (F1–F6)** | Processo de apoio à decisão | — |

## Planos

| Plano | Preço | SAD | Alertas |
|-------|-------|-----|---------|
| FREE | Gratuito | 3 casos | 2 alertas |
| Starter | R$ 99/mês | Ilimitado | 10 alertas |
| Professional | R$ 299/mês | Ilimitado | Ilimitado + relatórios |
| Enterprise | Customizado | White-label | — |

## Estrutura do projeto

```
ebr-platform/
├── apps/
│   ├── api/          # Backend Fastify + Prisma + Redis
│   └── web/          # Frontend Next.js 14 + Tailwind + shadcn/ui
├── nginx/            # Configuração Nginx
├── docker-compose.yml
└── .env.example
```
