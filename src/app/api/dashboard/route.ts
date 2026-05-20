import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import {
  startOfDay,
  startOfMonth,
  endOfDay,
  endOfMonth,
  subMonths,
  parse,
  isValid,
} from "date-fns"

/**
 * GET /api/dashboard — Retorna métricas agregadas para o painel principal.
 * Query param: ?mes=YYYY-MM  (opcional) — filtra métricas mensais para o mês indicado.
 * Os cards "hoje" são sempre do dia corrente, independente do filtro.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mesParam = searchParams.get("mes") // "YYYY-MM"

    const hoje = new Date()
    const inicioDia = startOfDay(hoje)
    const fimDia = endOfDay(hoje)

    // Determina o mês de referência para as métricas mensais
    let mesSelecionado = hoje
    if (mesParam) {
      const parsed = parse(mesParam, "yyyy-MM", new Date())
      if (isValid(parsed)) mesSelecionado = parsed
    }

    const inicioMes = startOfMonth(mesSelecionado)
    const fimMes = endOfMonth(mesSelecionado)

    // Mês anterior para variação (sempre relativo ao mês selecionado)
    const inicioMesPassado = startOfMonth(subMonths(mesSelecionado, 1))
    const fimMesPassado = endOfMonth(subMonths(mesSelecionado, 1))

    const [
      vendasHoje,
      cookiesHoje,
      vendasMes,
      vendasMesPassado,
      producaoHoje,
      producaoMes,
      estoqueBaixo,
      produtosVencendo,
      ingredientesVencendo,
      topProdutos,
      vendasPorPagamento,
      financeiroMes,
      financeiroIngredientesMes,
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

      // Cookies vendidos hoje (soma de itens de vendas do dia)
      prisma.vendaItem.aggregate({
        where: {
          venda: {
            dataVenda: { gte: inicioDia, lte: fimDia },
            status: "CONCLUIDA",
          },
        },
        _sum: { quantidade: true },
      }),

      // Vendas do mês selecionado
      prisma.venda.aggregate({
        where: {
          dataVenda: { gte: inicioMes, lte: fimMes },
          status: "CONCLUIDA",
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Vendas mês anterior
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

      // Produção do mês selecionado
      prisma.producao.aggregate({
        where: { dataFabricacao: { gte: inicioMes, lte: fimMes } },
        _sum: { qtdProduzida: true },
        _count: { id: true },
      }),

      // Ingredientes com estoque baixo (raw query como fallback)
      prisma.$queryRaw<
        { id: string; nome: string; estoque_atual: number; estoque_minimo: number; unidade_medida: string }[]
      >`
        SELECT id, nome, estoque_atual, estoque_minimo, unidade_medida
        FROM ingredientes
        WHERE estoque_atual <= estoque_minimo
        LIMIT 10
      `,

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

      // Top 5 sabores mais vendidos no mês
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

      // Todos os custos do mês (SAIDA) — para Lucro Total
      prisma.financeiro.aggregate({
        where: {
          data: { gte: inicioMes, lte: fimMes },
          tipo: "SAIDA",
        },
        _sum: { valor: true },
      }),

      // Apenas custos com ingredientes do mês — para Lucro das Vendas
      prisma.financeiro.aggregate({
        where: {
          data: { gte: inicioMes, lte: fimMes },
          tipo: "SAIDA",
          categoria: "INGREDIENTE",
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
    const custosTotaisMes = financeiroMes._sum.valor ?? 0
    const custosIngredientesMes = financeiroIngredientesMes._sum.valor ?? 0

    // Lucro das Vendas = faturamento − custo de ingredientes apenas
    const lucroDasVendas = faturamentoMes - custosIngredientesMes
    // Lucro Total = faturamento − todos os custos
    const lucroTotal = faturamentoMes - custosTotaisMes

    const faturamentoMesPassado = vendasMesPassado._sum.total ?? 0
    const variacaoMensal =
      faturamentoMesPassado > 0
        ? ((faturamentoMes - faturamentoMesPassado) / faturamentoMesPassado) * 100
        : 0

    // Normaliza resultado do raw query de estoque baixo
    const estoqueBaixoNorm = (estoqueBaixo as { id: string; nome: string; estoque_atual: number; estoque_minimo: number; unidade_medida: string }[]).map(
      (e) => ({
        id: e.id,
        nome: e.nome,
        estoqueAtual: e.estoque_atual,
        estoqueMinimo: e.estoque_minimo,
        unidadeMedida: e.unidade_medida,
      })
    )

    return NextResponse.json({
      // Cards fixos no dia atual
      vendasHoje: {
        total: vendasHoje._sum.total ?? 0,
        quantidade: vendasHoje._count.id,
        cookiesVendidos: cookiesHoje._sum.quantidade ?? 0,
      },
      producaoHoje: {
        total: producaoHoje._sum.qtdProduzida ?? 0,
        lotes: producaoHoje._count.id,
      },
      // Métricas do mês selecionado
      vendasMes: {
        total: faturamentoMes,
        quantidade: vendasMes._count.id,
        variacaoMensal,
      },
      producaoMes: {
        total: producaoMes._sum.qtdProduzida ?? 0,
        lotes: producaoMes._count.id,
      },
      lucroDasVendas,
      lucroTotal,
      custosMes: custosTotaisMes,
      margemLucro: faturamentoMes > 0 ? (lucroTotal / faturamentoMes) * 100 : 0,
      alertas: {
        estoqueBaixo: estoqueBaixoNorm,
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
