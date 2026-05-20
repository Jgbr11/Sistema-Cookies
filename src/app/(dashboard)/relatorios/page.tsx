"use client"

import { useState } from "react"
import { FileText, Download, BarChart3, Package, ShoppingCart, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"
import { toast } from "sonner"

interface RelatorioVendas {
  total: number
  quantidade: number
  ticketMedio: number
  porFormaPagamento: { formaPagamento: string; total: number; quantidade: number }[]
  topProdutos: { nome: string; quantidade: number; faturamento: number }[]
}

interface RelatorioEstoque {
  ingredientes: { nome: string; estoqueAtual: number; estoqueMinimo: number; unidadeMedida: string; status: string }[]
  produtos: { nome: string; quantidade: number; lote: string; dataValidade: string | null }[]
}

/**
 * Página de Relatórios.
 * Permite gerar relatórios de vendas, estoque e financeiro por período.
 */
export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    fim: new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState<string | null>(null)
  const [relatorioVendas, setRelatorioVendas] = useState<RelatorioVendas | null>(null)
  const [relatorioEstoque, setRelatorioEstoque] = useState<RelatorioEstoque | null>(null)

  async function gerarVendas() {
    setLoading("vendas")
    try {
      const [resVendas] = await Promise.all([
        fetch(`/api/vendas?inicio=${periodo.inicio}&fim=${periodo.fim}`),
      ])
      const vendas = await resVendas.json()

      // Agregar dados
      const concluidas = vendas.filter((v: { status: string }) => v.status === "CONCLUIDA")
      const total = concluidas.reduce((s: number, v: { total: number }) => s + v.total, 0)
      const quantidade = concluidas.length
      const ticketMedio = quantidade > 0 ? total / quantidade : 0

      // Por forma de pagamento
      const pagMap: Record<string, { total: number; quantidade: number }> = {}
      for (const v of concluidas) {
        if (!pagMap[v.formaPagamento]) pagMap[v.formaPagamento] = { total: 0, quantidade: 0 }
        pagMap[v.formaPagamento].total += v.total
        pagMap[v.formaPagamento].quantidade += 1
      }

      // Top produtos
      const prodMap: Record<string, { quantidade: number; faturamento: number }> = {}
      for (const v of concluidas) {
        for (const item of v.itens) {
          const nome = item.receita.nome
          if (!prodMap[nome]) prodMap[nome] = { quantidade: 0, faturamento: 0 }
          prodMap[nome].quantidade += item.quantidade
          prodMap[nome].faturamento += item.subtotal
        }
      }

      setRelatorioVendas({
        total,
        quantidade,
        ticketMedio,
        porFormaPagamento: Object.entries(pagMap).map(([fp, data]) => ({ formaPagamento: fp, ...data })),
        topProdutos: Object.entries(prodMap)
          .map(([nome, data]) => ({ nome, ...data }))
          .sort((a, b) => b.faturamento - a.faturamento)
          .slice(0, 10),
      })
    } catch {
      toast.error("Erro ao gerar relatório de vendas")
    } finally {
      setLoading(null)
    }
  }

  async function gerarEstoque() {
    setLoading("estoque")
    try {
      const res = await fetch("/api/estoque")
      const data = await res.json()

      setRelatorioEstoque({
        ingredientes: data.ingredientes.map((ing: {
          nome: string
          estoqueAtual: number
          estoqueMinimo: number
          unidadeMedida: string
        }) => ({
          nome: ing.nome,
          estoqueAtual: ing.estoqueAtual,
          estoqueMinimo: ing.estoqueMinimo,
          unidadeMedida: ing.unidadeMedida,
          status: ing.estoqueAtual <= ing.estoqueMinimo ? "Baixo" : "OK",
        })),
        produtos: data.produtos.map((p: {
          receita: { nome: string }
          quantidade: number
          lote: string
          dataValidade: string | null
        }) => ({
          nome: p.receita.nome,
          quantidade: p.quantidade,
          lote: p.lote,
          dataValidade: p.dataValidade,
        })),
      })
    } catch {
      toast.error("Erro ao gerar relatório de estoque")
    } finally {
      setLoading(null)
    }
  }

  const LABELS: Record<string, string> = {
    PIX: "Pix", CREDITO: "Crédito", DEBITO: "Débito", DINHEIRO: "Dinheiro",
  }

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#644536]" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-1 flex-1">
              <Label htmlFor="rel-inicio">Data Início</Label>
              <Input
                id="rel-inicio"
                type="date"
                value={periodo.inicio}
                onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })}
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="rel-fim">Data Fim</Label>
              <Input
                id="rel-fim"
                type="date"
                value={periodo.fim}
                onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de geração */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          id="btn-rel-vendas"
          onClick={gerarVendas}
          disabled={loading !== null}
          className="p-4 border rounded-xl text-left hover:bg-[#0a0a50]/5 hover:border-[#0a0a50]/30 transition-all duration-200 group"
        >
          <ShoppingCart className="w-6 h-6 text-[#0a0a50] mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-sm">Relatório de Vendas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Faturamento, ticket médio, top produtos e formas de pagamento
          </p>
        </button>

        <button
          id="btn-rel-estoque"
          onClick={gerarEstoque}
          disabled={loading !== null}
          className="p-4 border rounded-xl text-left hover:bg-[#0a0a50]/5 hover:border-[#0a0a50]/30 transition-all duration-200 group"
        >
          <Package className="w-6 h-6 text-[#644536] mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-sm">Relatório de Estoque</p>
          <p className="text-xs text-muted-foreground mt-1">
            Posição atual de ingredientes e produtos prontos
          </p>
        </button>

        <button
          id="btn-rel-financeiro"
          onClick={() => toast.info("Em breve: relatório financeiro completo com DRE")}
          className="p-4 border rounded-xl text-left hover:bg-[#0a0a50]/5 hover:border-[#0a0a50]/30 transition-all duration-200 group opacity-80"
        >
          <DollarSign className="w-6 h-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
          <p className="font-semibold text-sm">Relatório Financeiro</p>
          <p className="text-xs text-muted-foreground mt-1">
            DRE, fluxo de caixa e análise de custos
          </p>
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-24">
          <BarChart3 className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      )}

      {/* Relatório de Vendas */}
      {relatorioVendas && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#0a0a50]">
              Relatório de Vendas — {formatDate(periodo.inicio)} a {formatDate(periodo.fim)}
            </h3>
            <Button variant="outline" size="sm" onClick={() => window.print()} id="print-relatorio">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Imprimir
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Faturamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-[#0a0a50]">
                  {formatCurrency(relatorioVendas.total)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-[#0a0a50]">
                  {relatorioVendas.quantidade}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardTitle className="text-xs text-muted-foreground">Ticket Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-[#0a0a50]">
                  {formatCurrency(relatorioVendas.ticketMedio)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Por forma de pagamento */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {relatorioVendas.porFormaPagamento.map((fp) => (
                  <div key={fp.formaPagamento} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{LABELS[fp.formaPagamento] ?? fp.formaPagamento}</span>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">{fp.quantidade} pedido(s)</span>
                      <span className="font-medium">{formatCurrency(fp.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top produtos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {relatorioVendas.topProdutos.map((prod, i) => (
                  <div key={prod.nome} className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground w-5 text-center">#{i + 1}</span>
                    <span className="flex-1">{prod.nome}</span>
                    <span className="text-muted-foreground">{formatNumber(prod.quantidade, 0)} un</span>
                    <span className="font-medium">{formatCurrency(prod.faturamento)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Relatório de Estoque */}
      {relatorioEstoque && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#0a0a50]">Relatório de Estoque</h3>
            <Button variant="outline" size="sm" onClick={() => window.print()} id="print-estoque">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Imprimir
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingredientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground text-xs">
                      <th className="text-left py-1.5 pr-3">Ingrediente</th>
                      <th className="text-right py-1.5 px-3">Estoque</th>
                      <th className="text-right py-1.5 px-3">Mínimo</th>
                      <th className="text-center py-1.5 pl-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorioEstoque.ingredientes.map((ing) => (
                      <tr key={ing.nome} className="border-b last:border-0">
                        <td className="py-2 pr-3">{ing.nome}</td>
                        <td className="py-2 px-3 text-right">{formatNumber(ing.estoqueAtual, 0)} {ing.unidadeMedida}</td>
                        <td className="py-2 px-3 text-right text-muted-foreground">{formatNumber(ing.estoqueMinimo, 0)} {ing.unidadeMedida}</td>
                        <td className="py-2 pl-3 text-center">
                          <span className={`text-xs font-medium ${ing.status === "Baixo" ? "text-destructive" : "text-green-600"}`}>
                            {ing.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {relatorioEstoque.produtos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cookies em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {relatorioEstoque.produtos.map((p) => (
                    <div key={p.lote} className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-xs text-muted-foreground ml-2">({p.lote})</span>
                      </div>
                      <div className="text-right">
                        <span>{p.quantidade} un</span>
                        {p.dataValidade && (
                          <span className="text-xs text-muted-foreground ml-2">
                            val: {formatDate(p.dataValidade)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
