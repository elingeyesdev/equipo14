import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { createReportType, deleteReportType, getReportTypes } from '../../api/reportTypes'

export default function AdminReportTypes() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getReportTypes()
      setTypes(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createReportType(newName.trim())
      setNewName('')
      load()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar el tipo "${name}"?`)) return
    try {
      await deleteReportType(id)
      load()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre del tipo (ej. Robo, Incendio)"
          className="flex-1 h-10 px-3 rounded-lg border border-[var(--border-strong)] bg-[var(--elevated)] text-sm text-[var(--ink)]"
        />
        <button type="submit" disabled={saving} className="btn-primary !h-10 shrink-0">
          <Plus className="h-4 w-4" />
          Agregar tipo
        </button>
      </form>

      <div className="admin-card overflow-hidden">
        <table className="admin-table w-full">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Peso base</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">
                  Cargando…
                </td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">
                  No hay tipos registrados.
                </td>
              </tr>
            ) : (
              types.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--surface-hover)]">
                  <td className="px-4 py-3 font-mono text-[var(--muted)]">#{t.id}</td>
                  <td className="px-4 py-3 font-medium text-[var(--ink)]">{t.name}</td>
                  <td className="px-4 py-3 text-[var(--body)]">{t.base_weight ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id, t.name)}
                      className="p-2 rounded-lg text-[var(--danger)] hover:bg-[var(--surface-hover)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
