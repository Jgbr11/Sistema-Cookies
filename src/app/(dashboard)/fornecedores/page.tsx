"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, Truck, Pencil, Trash2, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Fornecedor {
  id: string
  nome: string
  contato: string | null
  telefone: string | null
  _count: { ingredientes: number; compras: number }
}

function FornecedorForm({
  fornecedor,
  onSave,
  onCancel,
}: {
  fornecedor: Partial<Fornecedor> | null
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nome: fornecedor?.nome ?? "",
    contato: fornecedor?.contato ?? "",
    telefone: fornecedor?.telefone ?? "",
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = fornecedor?.id
        ? `/api/fornecedores/${fornecedor.id}`
        : "/api/fornecedores"
      const method = fornecedor?.id ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          contato: form.contato || null,
          telefone: form.telefone || null,
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(fornecedor?.id ? "Fornecedor atualizado!" : "Fornecedor criado!")
      onSave()
    } catch {
      toast.error("Erro ao salvar fornecedor")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="nome-forn">Nome</Label>
        <Input
          id="nome-forn"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          required
          placeholder="Ex: Armazém do Trigo"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="contato-forn">Email / Contato</Label>
        <Input
          id="contato-forn"
          value={form.contato}
          onChange={(e) => setForm({ ...form, contato: e.target.value })}
          placeholder="contato@fornecedor.com"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tel-forn">Telefone</Label>
        <Input
          id="tel-forn"
          value={form.telefone}
          onChange={(e) => setForm({ ...form, telefone: e.target.value })}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} id="forn-cancel">Cancelar</Button>
        <Button type="submit" disabled={saving} id="forn-save" className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Página de Gestão de Fornecedores.
 */
export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState<"criar" | "editar" | null>(null)
  const [selecionado, setSelecionado] = useState<Fornecedor | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/fornecedores")
      setFornecedores(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"?`)) return
    try {
      const res = await fetch(`/api/fornecedores/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Fornecedor excluído!")
      carregar()
    } catch {
      toast.error("Erro ao excluir fornecedor")
    }
  }

  const filtrados = fornecedores.filter((f) =>
    f.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {fornecedores.length} fornecedor(es) cadastrado(s)
        </p>
        <Button
          id="btn-novo-fornecedor"
          onClick={() => { setSelecionado(null); setDialogo("criar") }}
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="busca-fornecedores"
          placeholder="Buscar fornecedor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Truck className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <Truck className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((forn) => (
            <Card key={forn.id} className="hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0a0a50]/10 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 text-[#0a0a50]" />
                    </div>
                    <CardTitle className="text-base font-semibold text-[#0a0a50] truncate">
                      {forn.nome}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setSelecionado(forn); setDialogo("editar") }}
                      id={`edit-forn-${forn.id}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(forn.id, forn.nome)}
                      id={`delete-forn-${forn.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {forn.contato && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{forn.contato}</span>
                  </div>
                )}
                {forn.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{forn.telefone}</span>
                  </div>
                )}
                <div className="flex gap-4 pt-1 text-xs text-muted-foreground">
                  <span>{forn._count.ingredientes} ingrediente(s)</span>
                  <span>{forn._count.compras} compra(s)</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogo === "editar" ? `Editar: ${selecionado?.nome}` : "Novo Fornecedor"}
            </DialogTitle>
          </DialogHeader>
          <FornecedorForm
            fornecedor={selecionado}
            onSave={() => { setDialogo(null); carregar() }}
            onCancel={() => setDialogo(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
