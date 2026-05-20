import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/financeiro — Lista lançamentos financeiros com filtros opcionais.
 * POST /api/financeiro — Cria lançamento manual (despesa, receita extra, etc).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") // ENTRADA | SAIDA
    const mes = searchParams.get("mes") // YYYY-MM
    const categoria = searchParams.get("categoria")

    let dataInicio: Date | undefined
    let dataFim: Date | undefined

    if (mes) {
      const [year, month] = mes.split("-").map(Number)
      dataInicio = new Date(year, month - 1, 1)
      dataFim = new Date(year, month, 0, 23, 59, 59)
    }

    const lancamentos = await prisma.financeiro.findMany({
      where: {
        ...(tipo && { tipo }),
        ...(categoria && { categoria }),
        ...(dataInicio && dataFim && { data: { gte: dataInicio, lte: dataFim } }),
      },
      orderBy: { data: "desc" },
    })

    // Calcular resumo
    const totalEntradas = lancamentos
      .filter((l) => l.tipo === "ENTRADA")
      .reduce((sum, l) => sum + l.valor, 0)

    const totalSaidas = lancamentos
      .filter((l) => l.tipo === "SAIDA")
      .reduce((sum, l) => sum + l.valor, 0)

    return NextResponse.json({
      lancamentos,
      resumo: {
        totalEntradas,
        totalSaidas,
        saldo: totalEntradas - totalSaidas,
      },
    })
  } catch (error) {
    console.error("[GET /api/financeiro]", error)
    return NextResponse.json({ error: "Erro ao buscar lançamentos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, categoria, descricao, valor, data } = body

    if (!tipo || !categoria || !descricao || !valor || !data) {
      return NextResponse.json(
        { error: "tipo, categoria, descricao, valor e data são obrigatórios" },
        { status: 400 }
      )
    }

    const lancamento = await prisma.financeiro.create({
      data: {
        tipo,
        categoria,
        descricao,
        valor: Number(valor),
        data: new Date(data),
      },
    })

    return NextResponse.json(lancamento, { status: 201 })
  } catch (error) {
    console.error("[POST /api/financeiro]", error)
    return NextResponse.json({ error: "Erro ao criar lançamento" }, { status: 500 })
  }
}
