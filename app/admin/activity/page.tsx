'use client'

import { useState, useEffect } from 'react'
import { History, Loader2 } from 'lucide-react'

interface Activity {
  id: string
  admin_id: string
  admin_email: string
  action: string
  target_type: string | null
  target_id: string | null
  details: any
  created_at: string
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/activity')
      .then((r) => r.json())
      .then((d) => setActivity(d.activity || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1 flex items-center gap-2">
          <History className="text-amber" /> Admin Activity Log
        </h1>
        <p className="text-text-dim text-sm">Last 100 admin actions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber" />
        </div>
      ) : activity.length === 0 ? (
        <div className="bg-bg-2 border border-line border-dashed rounded-2xl p-8 text-center text-text-dim">
          No admin activity yet
        </div>
      ) : (
        <div className="bg-bg-2 border border-line rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-text-dim uppercase">
              <tr className="border-b border-line">
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Admin</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Target</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-b border-line/50 hover:bg-bg/50">
                  <td className="p-3 text-xs text-text-dim whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-xs">{a.admin_email}</td>
                  <td className="p-3 font-mono text-xs font-semibold text-amber">{a.action}</td>
                  <td className="p-3 text-xs text-text-dim">
                    {a.target_type && (
                      <>
                        <span className="font-mono">{a.target_type}</span>
                        {a.target_id && (
                          <>
                            <br />
                            <span className="text-[10px]">{a.target_id}</span>
                          </>
                        )}
                      </>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {a.details && (
                      <pre className="text-[10px] text-text-dim font-mono max-w-md overflow-x-auto">
                        {JSON.stringify(a.details, null, 2)}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
