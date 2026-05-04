import { Plus } from 'lucide-react'

export default function TeamPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold">Team Members</h1>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber text-bg rounded-lg font-semibold hover:bg-amber/90 transition-colors">
          <Plus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      <div className="bg-bg-2 border border-line rounded-lg overflow-hidden">
        <div className="divide-y divide-line">
          {[
            { name: 'You', email: 'user@example.com', role: 'Owner', status: 'active' },
            { name: 'John Doe', email: 'john@example.com', role: 'Editor', status: 'active' },
            { name: 'Jane Smith', email: 'jane@example.com', role: 'Viewer', status: 'pending' },
          ].map((member, i) => (
            <div key={i} className="p-6 flex items-center justify-between hover:bg-bg-3 transition-colors">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-text-dim">{member.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  defaultValue={member.role}
                  className="px-3 py-1 bg-bg border border-line rounded text-sm focus:outline-none focus:border-sky"
                >
                  <option>Viewer</option>
                  <option>Editor</option>
                  <option>Owner</option>
                </select>
                {member.status === 'pending' && (
                  <span className="text-xs bg-amber/20 text-amber px-2 py-1 rounded">Pending</span>
                )}
                {i > 0 && (
                  <button className="text-rose text-sm hover:opacity-80 transition-opacity">Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
