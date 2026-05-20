import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { startOfDay, startOfMonth, endOfDay, endOfMonth, subMonths } from "date-fns"

/**
 * GET /api/dashboard — Retorna métricas agregadas para o painel principal.
 * Inclui: vendas do dia/mês, produção do dia, estoque baixo, produtos vencendo,
 * lucro estimado, vendas por forma de pagamento, top produtos.
 */
export async function GET() {
  try {
    const hoje = new Date()
    const inicioDia = startOfDay(hoje)
    const fimDia = endOfDay(hoje)
    const inicioMes = startOfMonth(hoje)
    const fimMes = endOfMonth(hoje)
    const inicioMesPassado = startOfMonth(subMonths(hoje, 1))
    const fimMesPassado = endOfMonth(subMonths(hoje, 1))

    // Executar todas as queries em paralelo
    const [
      vendasHoje,
      vendasMes,
      vendasMesPassado,
      producaoHoje,
      estoqueBaixo,
      produtosVencendo,
      ingredientesVencendo,
      topProdutos,
      vendasPorPagamento,
      financeiroMes,
    ] = await Promise.all([
      // Vendas do dia (só CONCLUIDAS)
      prisma.venda.aggregate({
        where: {
          dataVenda: { gte: inicioDia, lte: fimDia },
          status: "CONCLUIDA",
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Vendas do mês
      prisma.venda.aggregate({
        where: {
          dataVenda: { gte: inicioMes, lte: fimMes },
          status: "CONCLUIDA",
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Vendas mês passado
      prisma.venda.aggregate({
        where: {
          dataVenda: { gte: inicioMesPassado, lte: fimMesPassado },
          status: "CONCLUIDA",
        },
        _sum: { total: true },
      }),

      // Produção do dia
      prisma.producao.aggregate({
        where: { dataFabricacao: { gte: inicioDia, lte: fimDia } },
        _sum: { qtdProduzida: true },
        _count: { id: true },
      }),

      // Ingredientes com estoque baixo
      prisma.ingrediente.findMany({
        where: {
          estoqueAtual: { lte: prisma.ingrediente.fields.estoqueMinimo },
        },
        select: { id: true, nome: true, estoqueAtual: true, estoqueMinimo: true, unidadeMedida: true },
        take: 10,
      }).catch(() =>
        // Fallback: busca ingredientes com estoque=0 ou muito baixo
        prisma.$queryRaw<{ id: string; nome: string; estoque_atual: number; estoque_minimo: number; unidade_medida: string }[]>`
          SELECT id, nome, estoque_atual, estoque_minimo, unidade_medida
          FROM ingredientes
          WHERE estoque_atual <= estoque_minimo
          LIMIT 10
        `
      ),

      // Produtos vencendo nos próximos 3 dias
      prisma.estoqueProduto.findMany({
        where: {
          dataValidade: {
            gte: hoje,
            lte: new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
          quantidade: { gt: 0 },
        },
        include: { receita: { select: { nome: true } } },
        orderBy: { dataValidade: "asc" },
        take: 5,
      }),

      // Ingredientes vencendo nos próximos 7 dias
      prisma.compraIngrediente.findMany({
        where: {
          validade: {
            gte: hoje,
            lte: new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: { ingrediente: { select: { nome: true } } },
        orderBy: { validade: "asc" },
        take: 5,
      }),

      // Top 5 receitas mais vendidas no mês
      prisma.vendaItem.groupBy({
        by: ["receitaId"],
        where: {
          venda: {
            dataVenda: { gte: inicioMes, lte: fimMes },
            status: "CONCLUIDA",
          },
        },
        _sum: { quantidade: true, subtotal: true },
        orderBy: { _sum: { quantidade: "desc" } },
        take: 5,
      }),

      // Vendas por forma de pagamento no mês
      prisma.venda.groupBy({
        by: ["formaPagamento"],
        where: {
          dataVenda: { gte: inicioMes, lte: fimMes },
          status: "CONCLUIDA",
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Financeiro do mês (saídas = custos)
      prisma.financeiro.aggregate({
        where: {
          data: { gte: inicioMes, lte: fimMes },
          tipo: "SAIDA",
        },
        _sum: { valor: true },
      }),
    ])

    // Buscar nomes das receitas top
    const receitaIds = topProdutos.map((tp) => tp.receitaId)
    const receitas = await prisma.receita.findMany({
      where: { id: { in: receitaIds } },
      select: { id: true, nome: true, precoVenda: true },
    })

    const topProdutosComNome = topProdutos.map((tp) => ({
      ...tp,
      receita: receitas.find((r) => r.id === tp.receitaId),
    }))

    const faturamentoMes = vendasMes._sum.total ?? 0
    const custosMes = financeiroMes._sum.valor ?? 0
    const lucroEstimado = faturamentoMes - custosMes
    const faturamentoMesPassado = vendasMesPassado._sum.total ?? 0
    const variacaoMensal =
      faturamentoMesPassado > 0
        ? ((faturamentoMes - faturamentoMesPassado) / faturamentoMesPassado) * 100
        : 0

    return NextResponse.json({
      vendasHoje: {
        total: vendasHoje._sum.total ?? 0,
        quantidade: vendasHoje._count.id,
      },
      vendasMes: {
        total: faturamentoMes,
        quantidade: vendasMes._count.id,
        variacaoMensal,
      },
      producaoHoje: {
        total: producaoHoje._sum.qtdProduzida ?? 0,
        lotes: producaoHoje._count.id,
      },
      lucroEstimado,
      custosMes,
      margemLucro: faturamentoMes > 0 ? (lucroEstimado / faturamentoMes) * 100 : 0,
      alertas: {
        estoqueBaixo: Array.isArray(estoqueBaixo) ? estoqueBaixo : [],
        produtosVencendo,
        ingredientesVencendo,
      },
      topProdutos: topProdutosComNome,
      vendasPorPagamento,
    })
  } catch (error) {
    console.error("[GET /api/dashboard]", error)
    return NextResponse.json({ error: "Erro ao buscar métricas" }, { status: 500 })
  }
}
