# Sistema Cookies — Especificação de Design

## Visão Geral

Sistema web completo para gerenciamento de uma empresa de cookies artesanais, com foco em controle de produção, estoque, receitas, vendas e financeiro. Mobile-first, hospedado na Vercel.

## Decisões de Design

| Decisão | Escolha |
|---------|---------|
| Autenticação | Login único (administrador) |
| Banco de Dados | Neon PostgreSQL |
| Escopo Fase 1 | Todos os módulos com CRUD + cálculos automáticos |
| Idioma/Moeda | PT-BR / R$ / DD/MM/YYYY |
| Preço dos Cookies | Flexível por receita, com sugestão automática por margem |
| Styling | TailwindCSS v4 + Shadcn/UI |
| Gráficos | Recharts (pizza, barras, temporal) |
| Arquitetura | Next.js 15 App Router + Server Actions |

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Styling | TailwindCSS v4 + Shadcn/UI |
| ORM | Prisma |
| Banco | Neon PostgreSQL |
| Auth | NextAuth.js v5 (Auth.js) |
| Gráficos | Recharts |
| Deploy | Vercel |

## Paleta de Cores

| Uso | Cor | Hex |
|-----|-----|-----|
| Primária (sidebar, botões, headers) | Azul Marinho | `#0a0a50` |
| Background / Cards | Creme Suave | `#eff7cf` |
| Acentos / Detalhes | Marrom Terroso | `#644536` |
| Texto principal | Escuro | `#1a1a2e` |
| Sucesso | Verde | `#22c55e` |
| Alerta | Âmbar | `#f59e0b` |
| Erro | Vermelho | `#ef4444` |
| Background geral | Off-white | `#fafaf5` |

## Arquitetura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + Header
│   │   ├── page.tsx            # Dashboard principal
│   │   ├── ingredientes/
│   │   ├── receitas/
│   │   ├── estoque/
│   │   ├── producao/
│   │   ├── vendas/
│   │   ├── financeiro/
│   │   └── relatorios/
│   ├── api/
│   └── layout.tsx
├── components/
│   ├── ui/                     # Shadcn/UI
│   ├── layout/                 # Sidebar, Header, MobileNav
│   ├── charts/                 # Wrappers Recharts
│   └── forms/                  # Formulários reutilizáveis
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── calculations.ts
├── actions/
│   ├── ingredientes.ts
│   ├── receitas.ts
│   ├── estoque.ts
│   ├── producao.ts
│   ├── vendas.ts
│   └── financeiro.ts
└── prisma/
    └── schema.prisma
```

## Layout Responsivo

- **Desktop (≥1024px):** Sidebar fixa à esquerda (240px) + área de conteúdo
- **Tablet (768-1023px):** Sidebar colapsável (ícones) + conteúdo expandido
- **Mobile (<768px):** Sem sidebar → Bottom Navigation com 5 ícones principais + menu "mais"

---

## Schema do Banco de Dados

### Tabela: `usuarios`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| email | String | Unique |
| senha_hash | String | Bcrypt hash |
| nome | String | Nome do usuário |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Tabela: `fornecedores`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| nome | String | Nome do fornecedor |
| contato | String? | Contato |
| telefone | String? | Telefone |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Tabela: `ingredientes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| nome | String | Nome do ingrediente |
| unidade_medida | String | g, kg, ml, unidade |
| categoria | String | Categoria |
| estoque_atual | Float | Quantidade em estoque |
| estoque_minimo | Float | Alerta de estoque baixo |
| fornecedor_id | String? | FK → fornecedores |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Tabela: `compras_ingredientes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| ingrediente_id | String | FK → ingredientes |
| quantidade | Float | Quantidade comprada |
| peso_comprado | Float | Peso total |
| preco_pago | Float | Preço total pago |
| data_compra | DateTime | Data da compra |
| validade | DateTime? | Data de validade |
| fornecedor_id | String? | FK → fornecedores |
| created_at | DateTime | Auto |

### Tabela: `receitas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| nome | String | Nome do sabor |
| peso_final | Float? | Peso final da massa |
| qtd_cookies | Int | Quantidade de cookies produzidos |
| tempo_preparo | Int? | Minutos |
| preco_venda | Float? | Preço unitário do cookie |
| margem_desejada | Float? | % de margem desejada |
| observacoes | String? | Notas |
| ativa | Boolean | Default true |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Tabela: `receitas_ingredientes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| receita_id | String | FK → receitas |
| ingrediente_id | String | FK → ingredientes |
| quantidade | Float | Quantidade usada |
| unidade_medida | String | Unidade |

### Tabela: `producoes`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| receita_id | String | FK → receitas |
| qtd_produzida | Int | Cookies produzidos |
| data_fabricacao | DateTime | Data de fabricação |
| data_validade | DateTime? | Validade dos cookies |
| lote | String | Unique, auto-gerado LOT-YYYYMMDD-XXXX |
| responsavel | String? | Quem produziu |
| observacoes | String? | Notas |
| created_at | DateTime | Auto |

### Tabela: `estoque_produtos`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| receita_id | String | FK → receitas |
| quantidade | Int | Quantidade em estoque |
| lote | String | Referência ao lote |
| data_validade | DateTime? | Validade |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto |

### Tabela: `vendas`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| data_venda | DateTime | Data/hora da venda |
| total | Float | Valor total |
| desconto | Float | Default 0 |
| forma_pagamento | String | PIX, CREDITO, DEBITO, DINHEIRO |
| status | String | CONCLUIDA, CANCELADA |
| observacoes | String? | Notas |
| created_at | DateTime | Auto |

### Tabela: `venda_itens`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| venda_id | String | FK → vendas |
| receita_id | String | FK → receitas |
| quantidade | Int | Quantidade vendida |
| preco_unitario | Float | Preço no momento da venda |
| subtotal | Float | quantidade × preco_unitario |

### Tabela: `movimentacoes_estoque`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| tipo | String | ENTRADA, SAIDA |
| ingrediente_id | String? | FK → ingredientes (se for ingrediente) |
| produto_id | String? | FK → estoque_produtos (se for produto) |
| quantidade | Float | Quantidade movimentada |
| motivo | String | COMPRA, PRODUCAO, VENDA, AJUSTE, PERDA |
| referencia_id | String? | ID da compra/produção/venda |
| data | DateTime | Data da movimentação |
| created_at | DateTime | Auto |

### Tabela: `financeiro`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (cuid) | PK |
| tipo | String | ENTRADA, SAIDA |
| categoria | String | VENDA, INGREDIENTE, EMBALAGEM, GAS, ENERGIA, FUNCIONARIO, TAXA, OUTROS |
| descricao | String | Descrição da movimentação |
| valor | Float | Valor |
| data | DateTime | Data da movimentação |
| referencia_id | String? | ID da venda/compra vinculada |
| referencia_tipo | String? | VENDA, COMPRA |
| created_at | DateTime | Auto |

### Regras de Negócio Automáticas

1. **Compra de ingrediente** → `compras_ingredientes` + atualiza `estoque_atual` em `ingredientes` + `movimentacao_estoque` (ENTRADA) + `financeiro` (SAÍDA)
2. **Produção registrada** → desconta ingredientes do estoque + cria `estoque_produtos` + `movimentacoes_estoque` (SAÍDA ingredientes, ENTRADA produto)
3. **Venda realizada** → `vendas` + `venda_itens` + reduz `estoque_produtos` + `financeiro` (ENTRADA) + `movimentacoes_estoque` (SAÍDA produto)
4. **Cancelar venda** → estorna estoque + cria movimentação reversa + marca financeiro como cancelado
5. **Custo da receita** = Σ (quantidade_ingrediente × custo_médio_ingrediente)
6. **Custo médio** = média ponderada dos preços de compra do ingrediente

### Campos Automáticos
- `lote`: gerado como `LOT-YYYYMMDD-XXXX` (sequencial no dia)
- Todos os registros têm `created_at` e `updated_at` auto

---

## Módulos — Design Detalhado

### Módulo 1: Ingredientes

**Tela principal:** Tabela com todos ingredientes, barra de busca, filtro por categoria
**Alertas visuais:** Badge vermelho = estoque baixo, badge âmbar = próximo do vencimento

| Funcionalidade | Descrição |
|---|---|
| Listar | Tabela com nome, estoque, unidade, custo médio, status |
| Cadastrar/Editar | Modal com formulário (nome, unidade, categoria, estoque mínimo, fornecedor) |
| Registrar Compra | Modal separado: quantidade, preço, data, validade, fornecedor |
| Histórico de Preços | Gráfico temporal (linha) mostrando variação do preço por ingrediente |
| Consumo Médio | Card com cálculo automático baseado nas produções dos últimos 30 dias |

### Módulo 2: Receitas

**Tela principal:** Cards visuais por receita (nome, custo, preço venda, margem)

| Funcionalidade | Descrição |
|---|---|
| Cadastrar Receita | Formulário: dados básicos → ingredientes → precificação |
| Ingredientes da Receita | Tabela editável: selecionar ingrediente, informar quantidade |
| Cálculos Automáticos | Custo total, custo/cookie, margem de lucro (tempo real) |
| Simulador de Preço | Slider de margem desejada → preço sugerido atualiza automaticamente |
| Viabilidade | Badge: "Estoque suficiente para X receitas" ou lista de faltantes |
| Duplicar Receita | Botão que clona a receita inteira |

### Módulo 3: Estoque

**Tela principal:** Duas abas — "Ingredientes" e "Cookies Produzidos"

**Aba Ingredientes:**
- Tabela com estoque atual, estoque mínimo, status (OK / Baixo / Crítico)
- Indicadores de capacidade e previsão de reposição

**Aba Cookies Produzidos:**
- Tabela com sabor, quantidade, lote, validade
- Destaque visual: vencendo em 3 dias (âmbar), vencidos (vermelho)
- Ajuste manual de estoque (perdas/desperdício) com motivo obrigatório

### Módulo 4: Produção

**Tela principal:** Lista de produções + botão "Nova Produção"

| Funcionalidade | Descrição |
|---|---|
| Registrar Produção | Selecionar receita → auto-preenche ingredientes → quantidade → confirmar |
| Lote Automático | LOT-YYYYMMDD-XXXX ao confirmar |
| Validação | Verifica ingredientes suficientes antes de confirmar |
| Efeitos Automáticos | Desconta ingredientes + adiciona ao estoque de cookies |
| Histórico | Tabela com filtros por período, receita, responsável |
| Métricas | Cards: produção dia/semana/mês. Gráfico de barras por receita |

### Módulo 5: Vendas

**Tela principal:** Lista de vendas + botão "Nova Venda"

**Fluxo da Nova Venda (carrinho POS):**
1. Grid de sabores disponíveis (cards com nome + estoque + preço)
2. Clicar no sabor → botões +/- para quantidade
3. Carrinho lateral mostra itens, quantidades, subtotais
4. "Finalizar" → modal de pagamento (Pix, Crédito, Débito, Dinheiro)
5. Campo opcional de desconto e observações
6. Confirmar → venda registrada, estoque atualizado

| Funcionalidade Extra | Descrição |
|---|---|
| Cancelar Venda | Estorna estoque automaticamente |
| Histórico | Tabela com data, total, forma pagamento, itens |
| Métricas | Ticket médio, mais vendidos (pizza), vendas por período (barras) |

### Módulo 6: Financeiro

**Tela principal:** Dashboard financeiro com cards KPI + tabela

| Card | Valor |
|---|---|
| Faturamento do Mês | Soma das vendas |
| Custos do Mês | Soma das saídas |
| Lucro Líquido | Faturamento - Custos |
| Margem | (Lucro / Faturamento) × 100% |

**Gráficos:**
- Barras: Faturamento vs Custos vs Lucro por mês (últimos 6 meses)
- Pizza: Distribuição de custos por categoria
- Temporal: Evolução do faturamento diário

**Registro de Despesas:** Modal para cadastrar saídas manuais

### Módulo 7: Dashboard Principal

| Linha | Conteúdo |
|---|---|
| KPIs (4 cards) | Vendas hoje, Produção hoje, Lucro do mês, Estoque total |
| Gráfico 1 | Barras — Vendas dos últimos 7 dias |
| Gráfico 2 | Pizza — Sabores mais vendidos do mês |
| Alertas | Lista: estoque baixo, produtos vencendo, ingredientes acabando |
| Últimas Vendas | Mini-tabela com as 5 últimas vendas |

### Módulo 8: Relatórios (Fase 1)

- Relatórios em tela (tabelas filtráveis por período)
- Tipos: Vendas, Financeiro, Estoque, Produção
- Exportação PDF/Excel → Fase 2

---

## Funcionalidades da Fase 2 (Futuro)

- QR Code de lote
- PWA (instalar como app no celular)
- Exportação PDF/Excel
- Gestão de Clientes (cadastro, histórico, fidelidade)
- Gestão de Embalagens
- Agenda de Produção (calendário)
- Notificações push
- Backup automático
- Logs do sistema
- Múltiplos usuários com perfis
- Controle de versões de receitas
- Ficha técnica automática
