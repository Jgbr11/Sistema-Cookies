import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/receitas — Lista todas as receitas com ingredientes e cálculo de custo.
 * POST /api/receitas — Cria nova receita com seus ingredientes.
 */
export async function GET() {
  try {
    const receitas = await prisma.receita.findMany({
      include: {
        ingredientes: {
          include: {
            ingrediente: {
              select: {
                id: true,
                nome: true,
                unidadeMedida: true,
                estoqueAtual: true,
                compras: {
                  orderBy: { dataCompra: "desc" },
                  take: 1,
                  select: { precoPago: true, pesoComprado: true, quantidade: true },
                },
              },
            },
          },
        },
        _count: { select: { producoes: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(receitas)
  } catch (error) {
    console.error("[GET /api/receitas]", error)
    return NextResponse.json(
      { error: "Erro ao buscar receitas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nome,
      pesoFinal,
      qtdCookies,
      tempoPreparo,
      precoVenda,
      margemDesejada,
      observacoes,
      ingredientes, // { ingredienteId, quantidade, unidadeMedida }[]
    } = body

    if (!nome || !qtdCookies) {
      return NextResponse.json(
        { error: "Nome e quantidade de cookies são obrigatórios" },
        { status: 400 }
      )
    }

    const receita = await prisma.receita.create({
      data: {
        nome,
        pesoFinal: pesoFinal ? Number(pesoFinal) : null,
        qtdCookies: Number(qtdCookies),
        tempoPreparo: tempoPreparo ? Number(tempoPreparo) : null,
        precoVenda: precoVenda ? Number(precoVenda) : null,
        margemDesejada: margemDesejada ? Number(margemDesejada) : null,
        observacoes: observacoes || null,
        ingredientes: {
          create:
            ingredientes?.map(
              (ing: { ingredienteId: string; quantidade: number; unidadeMedida: string }) => ({
                ingredienteId: ing.ingredienteId,
                quantidade: Number(ing.quantidade),
                unidadeMedida: ing.unidadeMedida,
              })
            ) ?? [],
        },
      },
      include: {
        ingredientes: {
          include: { ingrediente: true },
        },
      },
    })

    return NextResponse.json(receita, { status: 201 })
  } catch (error) {
    console.error("[POST /api/receitas]", error)
    return NextResponse.json(
      { error: "Erro ao criar receita" },
      { status: 500 }
    )
  }
}
