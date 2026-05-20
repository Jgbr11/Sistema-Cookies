"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Plus, Search, ShoppingCart, Trash2, X, CheckCircle2,
  CreditCard, Banknote, QrCode, Smartphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface Receita {
  id: string
  nome: string
  precoVenda: number | null
}

interface EstoqueProduto {
  id: string
  quantidade: number
  lote: string
  receita: Receita
}

interface VendaItem {
  receitaId: string
  nome: string
  quantidade: number
  precoUnitario: number
}

interface Venda {
  id: string
  dataVenda: string
  total: number
  desconto: number
  formaPagamento: string
  status: string
  observacoes: string | null
  itens: {
    id: string
    quantidade: number
    precoUnitario: number
    subtotal: number
    receita: { nome: string }
  }[]
}

const FORMAS_PAGAMENTO = [
  { value: "PIX", label: "Pix", icon: QrCode },
  { value: "CREDITO", label: "Crédito", icon: CreditCard },
  { value: "DEBITO", label: "Débito", icon: Smartphone },
  { value: "DINHEIRO", label: "Dinheiro", icon: Banknote },
]

const STATUS_COLORS: Record<string, string> = {
  CONCLUIDA: "text-green-600 bg-green-50 border-green-200",
  CANCELADA: "text-red-600 bg-red-50 border-red-200",
}

function CarrinhoVenda({
  estoque,
  onClose,
  onSave,
}: {
  estoque: EstoqueProduto[]
  onClose: () => void
  onSave: () => void
}) {
  const [itens, setItens] = useState<VendaItem[]>([])
  const [formaPagamento, setFormaPagamento] = useState("")
  const [desconto, setDesconto] = useState("0")
  const [observacoes, setObservacoes] = useState("")
  const [step, setStep] = useState<"carrinho" | "pagamento">("carrinho")
  const [saving, setSaving] = useState(false)

  const receitasDisponiveis = estoque.filter(
    (ep, idx, arr) =>
      ep.quantidade > 0 &&
      arr.findIndex((x) => x.receita.id === ep.receita.id) === idx
  )

  function addItem(ep: EstoqueProduto) {
    const existente = itens.find((i) => i.receitaId === ep.receita.id)
    if (existente) {
      setItens(itens.map((i) =>
        i.receitaId === ep.receita.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ))
    } else {
      setItens([...itens, {
        receitaId: ep.receita.id,
        nome: ep.receita.nome,
        quantidade: 1,
        precoUnitario: ep.receita.precoVenda ?? 0,
      }])
    }
  }

  function removeItem(receitaId: string) {
    setItens(itens.filter((i) => i.receitaId !== receitaId))
  }

  function updateQtd(receitaId: string, qtd: number) {
    if (qtd <= 0) {
      removeItem(receitaId)
    } else {
      setItens(itens.map((i) => i.receitaId === receitaId ? { ...i, quantidade: qtd } : i))
    }
  }

  function updatePreco(receitaId: string, preco: number) {
    setItens(itens.map((i) => i.receitaId === receitaId ? { ...i, precoUnitario: preco } : i))
  }

  const subtotal = itens.reduce((sum, i) => sum + i.quantidade * i.precoUnitario, 0)
  const descontoVal = Number(desconto) || 0
  const total = subtotal - descontoVal

  async function handleFinalizar() {
    if (!formaPagamento) {
      toast.error("Selecione uma forma de pagamento")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formaPagamento,
          desconto: descontoVal,
          observacoes: observacoes || null,
          itens: itens.map((i) => ({
            receitaId: i.receitaId,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
          })),
        }),
      })

      if (!res.ok) throw new Error("Erro ao finalizar venda")
      toast.success("Venda registrada com sucesso!")
      onSave()
    } catch {
      toast.error("Erro ao registrar venda")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {step === "carrinho" ? (
        <>
          {/* Produtos disponíveis */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Adicionar ao carrinho</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {receitasDisponiveis.map((ep) => (
                <button
                  key={ep.receita.id}
                  type="button"
                  onClick={() => addItem(ep)}
                  id={`add-produto-${ep.receita.id}`}
                  className="p-3 text-left border rounded-lg hover:bg-[#0a0a50]/5 hover:border-[#0a0a50]/30 transition-all duration-150"
                >
                  <p className="text-sm font-medium text-[#0a0a50] leading-tight">{ep.receita.nome}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">{ep.quantidade} em estoque</p>
                    <p className="text-xs font-medium text-[#644536]">
                      {ep.receita.precoVenda ? formatCurrency(ep.receita.precoVenda) : "sem preço"}
                    </p>
                  </div>
                </button>
              ))}
              {receitasDisponiveis.length === 0 && (
                <p className="col-span-2 text-center text-muted-foreground text-sm py-4">
                  Nenhum produto em estoque
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Itens do carrinho */}
          <div className="space-y-2">
            {itens.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">
                Carrinho vazio — adicione produtos acima
              </p>
            ) : (
              itens.map((item) => (
                <div key={item.receitaId} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nome}</p>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => updateQtd(item.receitaId, Number(e.target.value))}
                    className="w-16 h-7 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precoUnitario}
                    onChange={(e) => updatePreco(item.receitaId, Number(e.target.value))}
                    className="w-20 h-7 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive flex-shrink-0"
                    onClick={() => removeItem(item.receitaId)}
                    id={`rm-item-${item.receitaId}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {itens.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-xs">R$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    className="w-20 h-6 text-sm"
                    id="desconto-venda"
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-[#0a0a50]">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} id="carrinho-cancelar">Cancelar</Button>
            <Button
              type="button"
              disabled={itens.length === 0}
              onClick={() => setStep("pagamento")}
              id="carrinho-continuar"
              className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90"
            >
              Continuar →
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Resumo */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium">Resumo do Pedido</p>
            <div className="mt-2 space-y-1">
              {itens.map((item) => (
                <div key={item.receitaId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.nome} × {item.quantidade}</span>
                  <span>{formatCurrency(item.quantidade * item.precoUnitario)}</span>
                </div>
              ))}
              {descontoVal > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Desconto</span>
                  <span>- {formatCurrency(descontoVal)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#0a0a50]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Forma de pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGAMENTO.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  id={`pagamento-${value.toLowerCase()}`}
                  onClick={() => setFormaPagamento(value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all duration-150 ${
                    formaPagamento === value
                      ? "bg-[#0a0a50] text-[#eff7cf] border-[#0a0a50]"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label htmlFor="obs-venda">Observações</Label>
            <Input
              id="obs-venda"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Opcional..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setStep("carrinho")} id="volta-carrinho">
              ← Voltar
            </Button>
            <Button
              type="button"
              onClick={handleFinalizar}
              disabled={saving || !formaPagamento}
              id="finalizar-venda"
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Finalizar Venda"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Página de Gestão de Vendas.
 * Carrinho de compras com baixa automática no estoque.
 */
export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [estoque, setEstoque] = useState<EstoqueProduto[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [resV, resE] = await Promise.all([
        fetch("/api/vendas"),
        fetch("/api/estoque"),
      ])
      setVendas(await resV.json())
      const estoqueData = await resE.json()
      setEstoque(estoqueData.produtos ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleCancelar(id: string) {
    if (!confirm("Cancelar esta venda?")) return
    try {
      const res = await fetch(`/api/vendas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Venda cancelada!")
      carregar()
    } catch {
      toast.error("Erro ao cancelar venda")
    }
  }

  const filtradas = vendas.filter((v) =>
    v.itens.some((i) => i.receita.nome.toLowerCase().includes(busca.toLowerCase())) ||
    v.id.toLowerCase().includes(busca.toLowerCase())
  )

  const totalHoje = vendas
    .filter((v) => {
      const hoje = new Date().toISOString().split("T")[0]
      return v.dataVenda.startsWith(hoje) && v.status === "CONCLUIDA"
    })
    .reduce((sum, v) => sum + v.total, 0)

  return (
    <div className="space-y-5">
      {/* Total do dia */}
      {totalHoje > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Vendas de hoje</p>
              <p className="text-xs text-green-600">
                {vendas.filter((v) => v.dataVenda.startsWith(new Date().toISOString().split("T")[0]) && v.status === "CONCLUIDA").length} pedido(s)
              </p>
            </div>
          </div>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalHoje)}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-muted-foreground text-sm">{vendas.length} venda(s)</p>
        <Button
          id="btn-nova-venda"
          onClick={() => setDialogo(true)}
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="busca-vendas"
          placeholder="Buscar venda..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ShoppingCart className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? "Nenhuma venda encontrada" : "Nenhuma venda registrada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((venda) => {
            const PayIcon = FORMAS_PAGAMENTO.find((f) => f.value === venda.formaPagamento)?.icon ?? Banknote

            return (
              <Card key={venda.id} className={venda.status === "CANCELADA" ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[venda.status] ?? ""}`}
                        >
                          {venda.status === "CONCLUIDA" ? "Concluída" : "Cancelada"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <PayIcon className="w-3 h-3" />
                          {FORMAS_PAGAMENTO.find((f) => f.value === venda.formaPagamento)?.label ?? venda.formaPagamento}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(venda.dataVenda)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {venda.itens.map((item) => (
                          <span key={item.id} className="mr-2">
                            {item.receita.nome} × {item.quantidade}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-[#0a0a50]">
                          {formatCurrency(venda.total)}
                        </p>
                        {venda.desconto > 0 && (
                          <p className="text-xs text-muted-foreground">
                            desc: {formatCurrency(venda.desconto)}
                          </p>
                        )}
                      </div>
                      {venda.status === "CONCLUIDA" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleCancelar(venda.id)}
                          id={`cancelar-venda-${venda.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#0a0a50]" />
              Nova Venda
            </DialogTitle>
          </DialogHeader>
          <CarrinhoVenda
            estoque={estoque}
            onClose={() => setDialogo(false)}
            onSave={() => { setDialogo(false); carregar() }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
