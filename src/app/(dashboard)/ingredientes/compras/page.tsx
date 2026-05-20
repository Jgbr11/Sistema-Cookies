"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, ShoppingBag, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Ingrediente {
  id: string
  nome: string
  unidadeMedida: string
}

interface Fornecedor {
  id: string
  nome: string
}

interface Compra {
  id: string
  quantidade: number
  pesoComprado: number
  precoPago: number
  dataCompra: string
  validade: string | null
  ingrediente: Ingrediente
  fornecedor: Fornecedor | null
}

function CompraForm({
  ingredientes,
  fornecedores,
  onSave,
  onCancel,
}: {
  ingredientes: Ingrediente[]
  fornecedores: Fornecedor[]
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    ingredienteId: "",
    quantidade: "1",
    pesoComprado: "",
    precoPago: "",
    dataCompra: new Date().toISOString().split("T")[0],
    validade: "",
    fornecedorId: "",
  })
  const [saving, setSaving] = useState(false)

  const ingredienteSelecionado = ingredientes.find((i) => i.id === form.ingredienteId)

  // Cálculo do custo por unidade
  const totalAdicionado = Number(form.pesoComprado) * Number(form.quantidade)
  const custoPorUnidade = totalAdicionado > 0
    ? Number(form.precoPago) / totalAdicionado
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredienteId: form.ingredienteId,
          quantidade: Number(form.quantidade),
          pesoComprado: Number(form.pesoComprado),
          precoPago: Number(form.precoPago),
          dataCompra: form.dataCompra,
          validade: form.validade || null,
          fornecedorId: form.fornecedorId || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erro")
      }

      toast.success("Compra registrada! Estoque atualizado.")
      onSave()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar compra")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="ing-compra">Ingrediente</Label>
          <Select value={form.ingredienteId} onValueChange={(v) => setForm({ ...form, ingredienteId: v || "" })}>
            <SelectTrigger id="ing-compra">
              <SelectValue placeholder="Selecionar ingrediente..." />
            </SelectTrigger>
            <SelectContent>
              {ingredientes.map((ing) => (
                <SelectItem key={ing.id} value={ing.id}>
                  {ing.nome} ({ing.unidadeMedida})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="qtd-compra">Quantidade de Pacotes/Unidades</Label>
          <Input
            id="qtd-compra"
            type="number"
            min="1"
            value={form.quantidade}
            onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="peso-compra">
            Peso/Volume por Pacote ({ingredienteSelecionado?.unidadeMedida ?? "unidade"})
          </Label>
          <Input
            id="peso-compra"
            type="number"
            min="0"
            step="0.001"
            value={form.pesoComprado}
            onChange={(e) => setForm({ ...form, pesoComprado: e.target.value })}
            required
            placeholder="Ex: 5000"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="preco-compra">Preço Total Pago (R$)</Label>
          <Input
            id="preco-compra"
            type="number"
            min="0"
            step="0.01"
            value={form.precoPago}
            onChange={(e) => setForm({ ...form, precoPago: e.target.value })}
            required
            placeholder="Ex: 20.87"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="data-compra">Data da Compra</Label>
          <Input
            id="data-compra"
            type="date"
            value={form.dataCompra}
            onChange={(e) => setForm({ ...form, dataCompra: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="validade-compra">Validade</Label>
          <Input
            id="validade-compra"
            type="date"
            value={form.validade}
            onChange={(e) => setForm({ ...form, validade: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="forn-compra">Fornecedor</Label>
          <Select value={form.fornecedorId} onValueChange={(v) => setForm({ ...form, fornecedorId: v || "" })}>
            <SelectTrigger id="forn-compra">
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo automático */}
      {totalAdicionado > 0 && (
        <div className="p-3 bg-[#0a0a50]/5 rounded-lg text-sm space-y-1">
          <p className="text-muted-foreground">
            Total adicionado ao estoque:{" "}
            <span className="text-[#0a0a50] font-medium">
              {totalAdicionado} {ingredienteSelecionado?.unidadeMedida ?? "unidades"}
            </span>
          </p>
          {custoPorUnidade > 0 && (
            <p className="text-muted-foreground">
              Custo por {ingredienteSelecionado?.unidadeMedida ?? "unidade"}:{" "}
              <span className="text-[#644536] font-medium">
                {formatCurrency(custoPorUnidade)}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} id="compra-cancel">Cancelar</Button>
        <Button type="submit" disabled={saving} id="compra-save" className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90">
          {saving ? "Registrando..." : "Registrar Compra"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Página de Compras de Ingredientes.
 * Registra compras com cálculo automático de custo e atualização de estoque.
 */
export default function ComprasPage() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [resC, resI, resF] = await Promise.all([
        fetch("/api/compras"),
        fetch("/api/ingredientes"),
        fetch("/api/fornecedores"),
      ])
      setCompras(await resC.json())
      setIngredientes(await resI.json())
      setFornecedores(await resF.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const filtradas = compras.filter((c) =>
    c.ingrediente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.fornecedor?.nome ?? "").toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {compras.length} compra(s) registrada(s)
        </p>
        <Button
          id="btn-nova-compra"
          onClick={() => setDialogo(true)}
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Compra
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="busca-compras"
          placeholder="Buscar por ingrediente ou fornecedor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <ShoppingBag className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? "Nenhuma compra encontrada" : "Nenhuma compra registrada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((compra) => {
            const totalAdicionado = compra.pesoComprado * compra.quantidade
            const custoPorUnidade = totalAdicionado > 0 ? compra.precoPago / totalAdicionado : 0

            return (
              <Card key={compra.id} className="hover:shadow-sm transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-[#0a0a50] truncate">
                        {compra.ingrediente.nome}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatDate(compra.dataCompra)}</span>
                        {compra.fornecedor && (
                          <Badge variant="secondary" className="text-xs">{compra.fornecedor.nome}</Badge>
                        )}
                        {compra.validade && (
                          <span className="text-xs text-muted-foreground">
                            val: {formatDate(compra.validade)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-bold text-[#0a0a50]">{formatCurrency(compra.precoPago)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      {compra.quantidade} × {compra.pesoComprado} {compra.ingrediente.unidadeMedida}
                      {" = "}
                      <span className="text-foreground font-medium">
                        {totalAdicionado} {compra.ingrediente.unidadeMedida}
                      </span>
                    </span>
                    {custoPorUnidade > 0 && (
                      <span className="text-[#644536]">
                        {formatCurrency(custoPorUnidade)}/{compra.ingrediente.unidadeMedida}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#0a0a50]" />
              Registrar Compra de Ingrediente
            </DialogTitle>
          </DialogHeader>
          <CompraForm
            ingredientes={ingredientes}
            fornecedores={fornecedores}
            onSave={() => { setDialogo(false); carregar() }}
            onCancel={() => setDialogo(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
