import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET /api/fornecedores/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id },
      include: {
        ingredientes: true,
        compras: { orderBy: { dataCompra: "desc" }, take: 10 },
      },
    })

    if (!fornecedor) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(fornecedor)
  } catch (error) {
    console.error("[GET /api/fornecedores/[id]]", error)
    return NextResponse.json(
      { error: "Erro ao buscar fornecedor" },
      { status: 500 }
    )
  }
}

// PUT /api/fornecedores/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, contato, telefone } = body as {
      nome?: string
      contato?: string | null
      telefone?: string | null
    }

    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(contato !== undefined && { contato }),
        ...(telefone !== undefined && { telefone }),
      },
    })

    return NextResponse.json(fornecedor)
  } catch (error: unknown) {
    console.error("[PUT /api/fornecedores/[id]]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao atualizar fornecedor" },
      { status: 500 }
    )
  }
}

// DELETE /api/fornecedores/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.fornecedor.delete({ where: { id } })

    return new NextResponse(null, { status: 204 })
  } catch (error: unknown) {
    console.error("[DELETE /api/fornecedores/[id]]", error)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: "Erro ao deletar fornecedor" },
      { status: 500 }
    )
  }
}
