import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { gerarCodigoLote } from "@/lib/calculations"

/**
 * GET /api/producao — Lista todas as produções com receita.
 * POST /api/producao — Registra nova produção:
 *   0. Valida se há estoque suficiente de todos os ingredientes (HTTP 422 se não)
 *   1. Gera lote automático
 *   2. Desconta ingredientes do estoque
 *   3. Adiciona ao estoque de produtos
 *   4. Registra movimentações
 */
export async function GET() {
  try {
    const producoes = await prisma.producao.findMany({
      include: {
        receita: {
          select: { id: true, nome: true, qtdCookies: true, precoVenda: true },
        },
      },
      orderBy: { dataFabricacao: "desc" },
    })

    return NextResponse.json(producoes)
  } catch (error) {
    console.error("[GET /api/producao]", error)
    return NextResponse.json({ error: "Erro ao buscar produções" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receitaId, qtdProduzida, dataFabricacao, dataValidade, responsavel, observacoes } = body

    if (!receitaId || !qtdProduzida || !dataFabricacao) {
      return NextResponse.json(
        { error: "receitaId, qtdProduzida e dataFabricacao são obrigatórios" },
        { status: 400 }
      )
    }

    // Busca a receita com seus ingredientes
    const receita = await prisma.receita.findUnique({
      where: { id: receitaId },
      include: { ingredientes: true },
    })

    if (!receita) {
      return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 })
    }

    // Número de lotes produzidos (qtdProduzida / qtdCookies da receita = lotes)
    const lotes = Math.ceil(Number(qtdProduzida) / receita.qtdCookies)

    // ─────────────────────────────────────────────
    // 0. Validar estoque disponível para todos os ingredientes
    // ─────────────────────────────────────────────
    if (receita.ingredientes.length > 0) {
      const ingredienteIds = receita.ingredientes.map((ri) => ri.ingredienteId)
      const ingredientesDB = await prisma.ingrediente.findMany({
        where: { id: { in: ingredienteIds } },
        select: { id: true, nome: true, estoqueAtual: true, unidadeMedida: true },
      })

      const faltando: { nome: string; necessario: number; disponivel: number; unidade: string }[] = []

      for (const ri of receita.ingredientes) {
        const consumo = ri.quantidade * lotes
        const ing = ingredientesDB.find((i) => i.id === ri.ingredienteId)
        if (!ing) {
          faltando.push({
            nome: `Ingrediente desconhecido (${ri.ingredienteId})`,
            necessario: consumo,
            disponivel: 0,
            unidade: ri.unidadeMedida,
          })
          continue
        }
        if (ing.estoqueAtual < consumo) {
          faltando.push({
            nome: ing.nome,
            necessario: consumo,
            disponivel: ing.estoqueAtual,
            unidade: ing.unidadeMedida,
          })
        }
      }

      if (faltando.length > 0) {
        return NextResponse.json(
          {
            error: "Estoque insuficiente",
            faltando,
          },
          { status: 422 }
        )
      }
    }

    // Gerar código de lote único
    const today = new Date(dataFabricacao)
    const existingToday = await prisma.producao.count({
      where: {
        dataFabricacao: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    })
    const codigoLote = gerarCodigoLote(today, existingToday + 1)

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Criar registro de produção
      const producao = await tx.producao.create({
        data: {
          receitaId,
          qtdProduzida: Number(qtdProduzida),
          dataFabricacao: new Date(dataFabricacao),
          dataValidade: dataValidade ? new Date(dataValidade) : null,
          lote: codigoLote,
          responsavel: responsavel || null,
          observacoes: observacoes || null,
        },
      })

      // 2. Descontar ingredientes do estoque (proporcional aos lotes)
      for (const ing of receita.ingredientes) {
        const consumo = ing.quantidade * lotes
        await tx.ingrediente.update({
          where: { id: ing.ingredienteId },
          data: { estoqueAtual: { decrement: consumo } },
        })

        await tx.movimentacaoEstoque.create({
          data: {
            tipo: "SAIDA",
            ingredienteId: ing.ingredienteId,
            quantidade: consumo,
            motivo: "PRODUCAO",
            referenciaId: producao.id,
            data: new Date(dataFabricacao),
          },
        })
      }

      // 3. Adicionar ao estoque de produtos
      const estoqueProduto = await tx.estoqueProduto.create({
        data: {
          receitaId,
          quantidade: Number(qtdProduzida),
          lote: codigoLote,
          dataValidade: dataValidade ? new Date(dataValidade) : null,
        },
      })

      await tx.movimentacaoEstoque.create({
        data: {
          tipo: "ENTRADA",
          produtoId: estoqueProduto.id,
          quantidade: Number(qtdProduzida),
          motivo: "PRODUCAO",
          referenciaId: producao.id,
          data: new Date(dataFabricacao),
        },
      })

      return producao
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error("[POST /api/producao]", error)
    return NextResponse.json({ error: "Erro ao registrar produção" }, { status: 500 })
  }
}
