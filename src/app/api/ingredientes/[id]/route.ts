import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET /api/ingredientes/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ingrediente = await prisma.ingrediente.findUnique({
      where: { id },
      include: {
        fornecedor: true,
        compras: { orderBy: { dataCompra: "desc" } },
        movimentacoes: { orderBy: { data: "desc" }, take: 20 },
      },
    })

    if (!ingrediente) {
      return NextResponse.json(
        { error: "Ingrediente não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(ingrediente)
  } catch (error) {
    console.error("[GET /api/ingredientes/[id]]", error)
    return NextResponse.json(
      { error: "Erro ao buscar ingrediente" },
      { status: 500 }
    )
  }
}

// PUT /api/ingredientes/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, unidadeMedida, categoria, estoqueMinimo, estoqueAtual, fornecedorId } =
      body as {
        nome?: string
        unidadeMedida?: string
        categoria?: string
        estoqueMinimo?: number
        estoqueAtual?: number
        fornecedorId?: string | null
      }

    const ingrediente = await prisma.ingrediente.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(unidadeMedida !== undefined && { unidadeMedida }),
        ...(categoria !== undefined && { categoria }),
        ...(estoqueMinimo !== undefined && { estoqueMinimo }),
        ...(estoqueAtual !== undefined && { estoqueAtual }),
        ...(fornecedorId !== undefined && { fornecedorId }),
      },
      include: { fornecedor: true },
    })

    return NextResponse.json(ingrediente)
  } catch (error: unknown) {
    console.error("[PUT /api/ingredientes/[id]]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Ingrediente não encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao atualizar ingrediente" },
      { status: 500 }
    )
  }
}

// DELETE /api/ingredientes/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.ingrediente.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    console.error("[DELETE /api/ingredientes/[id]]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Ingrediente não encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao deletar ingrediente" },
      { status: 500 }
    )
  }
}
