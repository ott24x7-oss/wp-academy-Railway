export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-8">Billing & Plans</h1>

      <div className="bg-bg-2 border border-line rounded-lg p-6 mb-8">
        <h2 className="font-serif text-xl font-bold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold">Creator</p>
            <p className="text-text-dim text-sm">$19/month</p>
          </div>
          <button className="px-6 py-2 border border-line text-text rounded-lg font-semibold hover:bg-bg-3 transition-colors">
            Upgrade
          </button>
        </div>
        <p className="text-sm text-text-dim mb-4">Next billing date: June 4, 2024</p>
        <button className="px-4 py-2 text-rose text-sm font-semibold hover:opacity-80 transition-opacity">
          Cancel Subscription
        </button>
      </div>

      <div className="bg-bg-2 border border-line rounded-lg p-6 mb-8">
        <h2 className="font-serif text-xl font-bold mb-4">Payment Method</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Visa ending in 4242</p>
            <p className="text-sm text-text-dim">Expires 12/25</p>
          </div>
          <button className="px-4 py-2 border border-line text-text rounded-lg text-sm hover:bg-bg-3 transition-colors">
            Update
          </button>
        </div>
      </div>

      <div className="bg-bg-2 border border-line rounded-lg p-6">
        <h2 className="font-serif text-xl font-bold mb-4">Billing History</h2>
        <div className="space-y-4">
          {[
            { date: 'May 4, 2024', amount: '$19.00', status: 'Paid' },
            { date: 'Apr 4, 2024', amount: '$19.00', status: 'Paid' },
            { date: 'Mar 4, 2024', amount: '$19.00', status: 'Paid' },
          ].map((invoice, i) => (
            <div key={i} className="flex items-center justify-between p-4 border border-line rounded-lg">
              <div>
                <p className="font-semibold text-sm">{invoice.date}</p>
                <p className="text-xs text-text-dim">Invoice</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{invoice.amount}</p>
                <p className="text-xs text-emerald">{invoice.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
