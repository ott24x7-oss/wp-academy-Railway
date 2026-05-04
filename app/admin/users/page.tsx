'use client'

import { useEffect, useState } from 'react'
import { Search, Loader2, Crown, ShieldOff, Edit3 } from 'lucide-react'
import { createSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/auth-client'

interface AdminUser {
  id: string
  email: string
  name?: string
  plan: string
  plan_expires_at?: string
  ai_credits_remaining: number
  role: string
  created_at: string
}

const PLANS = ['free', 'creator', 'pro', 'agency', 'lifetime']

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setUsers((data as AdminUser[]) || [])
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(id: string, updates: Partial<AdminUser>) {
    if (!isSupabaseConfigured()) return
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.from('users').update(updates).eq('id', id)
    if (error) {
      alert(error.message)
    } else {
      setEditingUser(null)
      load()
    }
  }

  async function toggleRole(u: AdminUser) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    if (!confirm(`Change role to "${newRole}" for ${u.email}?`)) return
    await updateUser(u.id, { role: newRole })
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Users</h1>
        <p className="text-text-dim text-sm">
          Manage all signups, assign plans, change roles
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-2 border border-line rounded-xl text-sm focus:outline-none focus:border-sky"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['free', 'creator', 'pro', 'agency'].map((p) => (
          <div key={p} className="bg-bg-2 border border-line rounded-2xl p-4">
            <p className="text-xs text-text-dim capitalize">{p}</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.plan === p).length}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-bg-2 border border-line rounded-2xl">
          <p className="text-text-dim">No users yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="bg-bg-2 border border-line rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber to-gold flex items-center justify-center text-bg font-bold text-sm flex-shrink-0">
                {(u.name || u.email)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{u.name || u.email}</p>
                  {u.role === 'admin' && (
                    <Crown className="w-3.5 h-3.5 text-amber flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-text-dim truncate">
                  {u.email} · {u.plan} · {u.ai_credits_remaining} credits
                </p>
              </div>
              <button
                onClick={() => setEditingUser(u)}
                className="p-2 text-text-dim hover:text-text"
                aria-label="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-2 border border-line rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-serif text-xl font-bold">Edit user</h3>
            <div className="text-sm text-text-dim">
              <p>{editingUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Plan</label>
              <select
                value={editingUser.plan}
                onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg text-sm capitalize"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">AI credits remaining</label>
              <input
                type="number"
                value={editingUser.ai_credits_remaining}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    ai_credits_remaining: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Plan expires</label>
              <input
                type="datetime-local"
                value={editingUser.plan_expires_at ? editingUser.plan_expires_at.slice(0, 16) : ''}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, plan_expires_at: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-bg border border-line rounded-lg text-sm"
              />
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => toggleRole(editingUser)}
                className="text-sm text-amber inline-flex items-center gap-1"
              >
                {editingUser.role === 'admin' ? (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Demote
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Make admin
                  </>
                )}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm text-text-dim hover:text-text"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateUser(editingUser.id, {
                      plan: editingUser.plan,
                      ai_credits_remaining: editingUser.ai_credits_remaining,
                      plan_expires_at: editingUser.plan_expires_at,
                    })
                  }
                  className="px-4 py-2 bg-amber text-bg rounded-lg font-semibold text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
