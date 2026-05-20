"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, BookOpen, DollarSign, Pencil, Trash2, ChevronDown, ChevronUp, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { calcularCustoPorCookie } from "@/lib/calculations"

interface Ingrediente {
  id: string
  nome: string
  unidadeMedida: string
  estoqueAtual: number
  compras: { precoPago: number; pesoComprado: number; quantidade: number }[]
}

interface ReceitaIngrediente {
  ingredienteId: string
  quantidade: number
  unidadeMedida: string
  ingrediente: Ingrediente
}

interface Receita {
  id: string
  nome: string
  qtdCookies: number
  pesoFinal: number | null
  tempoPreparo: number | null
  precoVenda: number | null
  margemDesejada: number | null
  observacoes: string | null
  ativa: boolean
  ingredientes: ReceitaIngrediente[]
  _count: { producoes: number }
}

function custoMedioIngrediente(ing: Ingrediente): number {
  if (!ing.compras.length) return 0
  const totalGasto = ing.compras.reduce((s, c) => s + c.precoPago, 0)
  const totalPeso = ing.compras.reduce((s, c) => s + c.pesoComprado * c.quantidade, 0)
  return totalPeso > 0 ? totalGasto / totalPeso : 0
}

function calcularCustoReceita(ingredientes: ReceitaIngrediente[]): number {
  return ingredientes.reduce((total, ri) => {
    const custo = custoMedioIngrediente(ri.ingrediente)
    return total + ri.quantidade * custo
  }, 0)
}

/**
 * Formulário de receita com UX de checkboxes para seleção de ingredientes.
 * Campos removidos: Peso Final, Tempo de Preparo, Margem Desejada.
 */
function ReceitaForm({
  receita,
  ingredientesDisponiveis,
  onSave,
  onCancel,
}: {
  receita: Partial<Receita> | null
  ingredientesDisponiveis: Ingrediente[]
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nome: receita?.nome ?? "",
    qtdCookies: String(receita?.qtdCookies ?? ""),
    precoVenda: String(receita?.precoVenda ?? ""),
    observacoes: receita?.observacoes ?? "",
  })

  // Mapa: ingredienteId → quantidade selecionada (string para o input)
  const initialSelected: Record<string, string> = {}
  receita?.ingredientes?.forEach((ri) => {
    initialSelected[ri.ingredienteId] = String(ri.quantidade)
  })
  const [selecionados, setSelecionados] = useState<Record<string, string>>(initialSelected)

  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState("")

  const ingredientesFiltrados = ingredientesDisponiveis.filter((i) =>
    i.nome.toLowerCase().includes(busca.toLowerCase())
  )

  function toggleIngrediente(id: string, unidade: string) {
    setSelecionados((prev) => {
      if (id in prev) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: "" }
    })
    void unidade // usado implicitamente via ingrediente
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = receita?.id ? `/api/receitas/${receita.id}` : "/api/receitas"
      const method = receita?.id ? "PUT" : "POST"

      const ingredientesPayload = Object.entries(selecionados)
        .filter(([, qtd]) => qtd !== "" && Number(qtd) > 0)
        .map(([ingredienteId, quantidade]) => {
          const ing = ingredientesDisponiveis.find((i) => i.id === ingredienteId)
          return {
            ingredienteId,
            quantidade: Number(quantidade),
            unidadeMedida: ing?.unidadeMedida ?? "g",
          }
        })

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          qtdCookies: Number(form.qtdCookies),
          precoVenda: form.precoVenda ? Number(form.precoVenda) : null,
          observacoes: form.observacoes || null,
          ingredientes: ingredientesPayload,
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(receita?.id ? "Receita atualizada!" : "Receita criada!")
      onSave()
    } catch {
      toast.error("Erro ao salvar receita")
    } finally {
      setSaving(false)
    }
  }

  const qtdSelecionados = Object.keys(selecionados).length

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Dados básicos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="nome-rec">Nome da Receita</Label>
          <Input
            id="nome-rec"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
            placeholder="Ex: Cookie de Nutella"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="qtd-cookies">Qtd de Cookies por Lote</Label>
          <Input
            id="qtd-cookies"
            type="number"
            min="1"
            value={form.qtdCookies}
            onChange={(e) => setForm({ ...form, qtdCookies: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="preco-venda">Preço de Venda (R$)</Label>
          <Input
            id="preco-venda"
            type="number"
            min="0"
            step="0.01"
            value={form.precoVenda}
            onChange={(e) => setForm({ ...form, precoVenda: e.target.value })}
            placeholder="Ex: 7.50"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="obs-rec">Observações</Label>
          <Textarea
            id="obs-rec"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      {/* Seleção de ingredientes via checkbox */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            Ingredientes
            {qtdSelecionados > 0 && (
              <span className="ml-2 text-xs font-normal text-[#0a0a50] bg-[#0a0a50]/10 px-2 py-0.5 rounded-full">
                {qtdSelecionados} selecionado(s)
              </span>
            )}
          </Label>
        </div>

        {ingredientesDisponiveis.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Nenhum ingrediente cadastrado. Cadastre ingredientes primeiro.
          </p>
        ) : (
          <>
            {/* Busca dentro do modal */}
            <Input
              placeholder="Filtrar ingredientes..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-8 text-sm"
              id="busca-ing-receita"
            />

            <div className="border rounded-lg divide-y max-h-52 overflow-y-auto">
              {ingredientesFiltrados.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Nenhum encontrado</p>
              ) : (
                ingredientesFiltrados.map((ing) => {
                  const checked = ing.id in selecionados
                  return (
                    <div key={ing.id} className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors ${checked ? "bg-[#0a0a50]/5" : ""}`}>
                      <Checkbox
                        id={`ing-check-${ing.id}`}
                        checked={checked}
                        onCheckedChange={() => toggleIngrediente(ing.id, ing.unidadeMedida)}
                      />
                      <label
                        htmlFor={`ing-check-${ing.id}`}
                        className="flex-1 text-sm cursor-pointer select-none flex items-center justify-between"
                      >
                        <span className={checked ? "font-medium text-[#0a0a50]" : ""}>{ing.nome}</span>
                        <span className="text-xs text-muted-foreground">{ing.unidadeMedida}</span>
                      </label>
                      {checked && (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="Qtd"
                            value={selecionados[ing.id] ?? ""}
                            onChange={(e) =>
                              setSelecionados((prev) => ({ ...prev, [ing.id]: e.target.value }))
                            }
                            className="w-20 h-7 text-sm"
                            id={`qtd-ing-${ing.id}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground w-8">{ing.unidadeMedida}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} id="rec-form-cancel">Cancelar</Button>
        <Button type="submit" disabled={saving} id="rec-form-save" className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Página de Gestão de Receitas.
 * Lista receitas com cálculo automático de custo, lucro por cookie e sugestão de preço.
 */
export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState<"criar" | "editar" | null>(null)
  const [selecionado, setSelecionado] = useState<Receita | null>(null)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [resRec, resIng] = await Promise.all([
        fetch("/api/receitas"),
        fetch("/api/ingredientes"),
      ])
      setReceitas(await resRec.json())
      setIngredientes(await resIng.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir a receita "${nome}"?`)) return
    try {
      const res = await fetch(`/api/receitas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Receita excluída!")
      carregar()
    } catch {
      toast.error("Erro ao excluir receita")
    }
  }

  function toggleExpand(id: string) {
    setExpandidos((prev) => {
      const novo = new Set(prev)
      novo.has(id) ? novo.delete(id) : novo.add(id)
      return novo
    })
  }

  const filtradas = receitas.filter((r) =>
    r.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {receitas.length} receita(s) cadastrada(s)
        </p>
        <Button
          id="btn-nova-receita"
          onClick={() => { setSelecionado(null); setDialogo("criar") }}
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Receita
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="busca-receitas"
          placeholder="Buscar receita..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <BookOpen className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? "Nenhuma receita encontrada" : "Nenhuma receita cadastrada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((rec) => {
            const custoTotal = calcularCustoReceita(rec.ingredientes)
            const custoCookie = calcularCustoPorCookie(custoTotal, rec.qtdCookies)
            const lucroPorCookie = rec.precoVenda != null ? rec.precoVenda - custoCookie : null
            const expanded = expandidos.has(rec.id)

            return (
              <Card key={rec.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold text-[#0a0a50] truncate">
                          {rec.nome}
                        </CardTitle>
                        {!rec.ativa && (
                          <Badge variant="outline" className="text-xs">Inativa</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {rec.qtdCookies} cookies/lote
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rec._count.producoes} produção(ões)
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelecionado(rec); setDialogo("editar") }} id={`edit-rec-${rec.id}`}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(rec.id, rec.nome)} id={`delete-rec-${rec.id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(rec.id)} id={`expand-rec-${rec.id}`}>
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {/* Métricas de custo — 4 cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Custo Total</p>
                      <p className="text-sm font-semibold text-[#0a0a50]">{formatCurrency(custoTotal)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Custo/Cookie</p>
                      <p className="text-sm font-semibold text-[#0a0a50]">{formatCurrency(custoCookie)}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Preço de Venda</p>
                      <p className="text-sm font-semibold text-[#644536] flex items-center justify-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {rec.precoVenda ? formatCurrency(rec.precoVenda) : "—"}
                      </p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50 border border-green-100">
                      <p className="text-xs text-muted-foreground">Lucro/Cookie</p>
                      <p className={`text-sm font-semibold flex items-center justify-center gap-1 ${lucroPorCookie != null && lucroPorCookie >= 0 ? "text-green-700" : "text-destructive"}`}>
                        <TrendingUp className="w-3 h-3" />
                        {lucroPorCookie != null ? formatCurrency(lucroPorCookie) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Ingredientes expandidos */}
                  {expanded && rec.ingredientes.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Ingredientes</p>
                      <div className="space-y-1">
                        {rec.ingredientes.map((ri) => (
                          <div key={ri.ingredienteId} className="flex items-center justify-between text-sm">
                            <span>{ri.ingrediente.nome}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">
                                {formatNumber(ri.quantidade, 0)} {ri.unidadeMedida}
                              </span>
                              <span className="text-xs text-[#644536] font-medium">
                                {formatCurrency(ri.quantidade * custoMedioIngrediente(ri.ingrediente))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expanded && rec.ingredientes.length === 0 && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Nenhum ingrediente associado a esta receita.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogo === "editar" ? `Editar: ${selecionado?.nome}` : "Nova Receita"}
            </DialogTitle>
          </DialogHeader>
          <ReceitaForm
            receita={selecionado}
            ingredientesDisponiveis={ingredientes}
            onSave={() => { setDialogo(null); carregar() }}
            onCancel={() => setDialogo(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
