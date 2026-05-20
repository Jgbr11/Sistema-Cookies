"use client"

import { useEffect, useState, useCallback } from "react"
import { Package, Wheat, Cookie, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatNumber } from "@/lib/utils"

interface IngredienteEstoque {
  id: string
  nome: string
  unidadeMedida: string
  categoria: string
  estoqueAtual: number
  estoqueMinimo: number
  fornecedor: { nome: string } | null
  compras: {
    dataCompra: string
    validade: string | null
    precoPago: number
    pesoComprado: number
    quantidade: number
  }[]
}

interface ProdutoEstoque {
  id: string
  quantidade: number
  lote: string
  dataValidade: string | null
  createdAt: string
  receita: { id: string; nome: string; precoVenda: number | null }
}

interface EstoqueData {
  ingredientes: IngredienteEstoque[]
  produtos: ProdutoEstoque[]
}

/**
 * Página de Estoque.
 * Dois tabs: Ingredientes (matéria-prima) e Produtos (cookies prontos).
 */
export default function EstoquePage() {
  const [data, setData] = useState<EstoqueData | null>(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/estoque")
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const ingredientesBaixo = (data?.ingredientes ?? []).filter(
    (ing) => ing.estoqueAtual <= ing.estoqueMinimo
  )

  const produtosVencendo = (data?.produtos ?? []).filter((p) => {
    if (!p.dataValidade) return false
    const diff = new Date(p.dataValidade).getTime() - Date.now()
    return diff < 7 * 24 * 60 * 60 * 1000
  })

  function ultimaValidade(ing: IngredienteEstoque): string | null {
    const comp = ing.compras.find((c) => c.validade)
    return comp?.validade ?? null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Package className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {(ingredientesBaixo.length > 0 || produtosVencendo.length > 0) && (
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-warning-foreground">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold">
              {ingredientesBaixo.length + produtosVencendo.length} alerta(s)
            </span>
          </div>
          {ingredientesBaixo.length > 0 && (
            <p className="text-xs text-muted-foreground">
              📦 {ingredientesBaixo.length} ingrediente(s) com estoque abaixo do mínimo:
              {" "}<span className="text-foreground font-medium">{ingredientesBaixo.map(i => i.nome).join(", ")}</span>
            </p>
          )}
          {produtosVencendo.length > 0 && (
            <p className="text-xs text-muted-foreground">
              ⏰ {produtosVencendo.length} lote(s) de cookies vencendo em menos de 7 dias.
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue="ingredientes">
        <TabsList>
          <TabsTrigger value="ingredientes" className="flex items-center gap-1.5" id="tab-ing-estoque">
            <Wheat className="w-3.5 h-3.5" />
            Ingredientes ({data?.ingredientes.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="produtos" className="flex items-center gap-1.5" id="tab-prod-estoque">
            <Cookie className="w-3.5 h-3.5" />
            Cookies ({data?.produtos.length ?? 0} lotes)
          </TabsTrigger>
        </TabsList>

        {/* Tab Ingredientes */}
        <TabsContent value="ingredientes" className="mt-4">
          {!data?.ingredientes.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40 text-center">
                <Wheat className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Nenhum ingrediente cadastrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-3 font-medium">Ingrediente</th>
                    <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">Categoria</th>
                    <th className="text-right py-2 px-3 font-medium">Estoque Atual</th>
                    <th className="text-right py-2 px-3 font-medium hidden md:table-cell">Mínimo</th>
                    <th className="text-center py-2 px-3 font-medium hidden lg:table-cell">Validade</th>
                    <th className="text-center py-2 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ingredientes.map((ing) => {
                    const baixo = ing.estoqueAtual <= ing.estoqueMinimo
                    const validade = ultimaValidade(ing)

                    return (
                      <tr key={ing.id} className={`border-b last:border-0 hover:bg-muted/30 ${baixo ? "bg-destructive/5" : ""}`}>
                        <td className="py-2.5 px-3 font-medium">{ing.nome}</td>
                        <td className="py-2.5 px-3 text-muted-foreground hidden sm:table-cell">
                          <Badge variant="secondary" className="text-xs">{ing.categoria}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`font-semibold ${baixo ? "text-destructive" : "text-foreground"}`}>
                            {formatNumber(ing.estoqueAtual, 0)} {ing.unidadeMedida}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-muted-foreground hidden md:table-cell">
                          {formatNumber(ing.estoqueMinimo, 0)} {ing.unidadeMedida}
                        </td>
                        <td className="py-2.5 px-3 text-center hidden lg:table-cell">
                          {validade ? (
                            <span className="text-xs">{formatDate(validade)}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {baixo ? (
                            <Badge variant="destructive" className="text-xs">Baixo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">OK</Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Tab Produtos */}
        <TabsContent value="produtos" className="mt-4">
          {!data?.produtos.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40 text-center">
                <Cookie className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Nenhum cookie em estoque. Registre uma produção.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data.produtos.map((prod) => {
                const vencendo = produtosVencendo.some((p) => p.id === prod.id)

                return (
                  <Card key={prod.id} className={vencendo ? "border-warning/40 bg-warning/5" : ""}>
                    <CardHeader className="pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-semibold text-[#0a0a50]">
                            {prod.receita.nome}
                          </CardTitle>
                          <Badge variant="outline" className="text-xs font-mono mt-1">
                            {prod.lote}
                          </Badge>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 text-[#0a0a50]">
                            <Cookie className="w-3.5 h-3.5" />
                            <span className="text-lg font-bold">{prod.quantidade}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">unidades</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {prod.dataValidade && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className={`w-3 h-3 ${vencendo ? "text-orange-500" : "text-muted-foreground"}`} />
                          <span className={`${vencendo ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                            Validade: {formatDate(prod.dataValidade)}
                            {vencendo && " ⚠️"}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
