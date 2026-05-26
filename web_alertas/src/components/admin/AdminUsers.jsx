import { useCallback, useEffect, useState } from 'react'
import { getUsers } from '../../api/users'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="admin-card overflow-hidden">
      <table className="admin-table w-full">
        <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Teléfono</th>
            <th className="px-4 py-3 text-left">Rol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {loading ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">
                Cargando usuarios…
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-[var(--muted)]">
                No hay usuarios o no tienes permiso para listarlos.
              </td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id} className="hover:bg-[var(--surface-hover)]">
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted)] truncate max-w-[120px]">
                  {u.id}
                </td>
                <td className="px-4 py-3 font-medium text-[var(--ink)]">
                  {u.first_name} {u.last_name}
                </td>
                <td className="px-4 py-3 text-[var(--body)]">{u.phone}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
                    {u.role?.name || '—'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
