export default function AIPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-2">AI Assistant</h1>
      <p className="text-text-dim mb-8">Get instant help with content, audits, and more</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          {
            title: 'Generate Post Copy',
            description: 'Create engaging social media captions in seconds',
            icon: '✍️',
          },
          {
            title: 'Lesson Summary',
            description: 'Get concise summaries of course content',
            icon: '📚',
          },
          {
            title: 'Ad Audit',
            description: 'Analyze and improve your ad performance',
            icon: '🔍',
          },
          {
            title: 'Practice Feedback',
            description: 'Get personalized feedback on your submissions',
            icon: '💬',
          },
        ].map((tool, i) => (
          <div
            key={i}
            className="bg-bg-2 border border-line rounded-lg p-6 hover:bg-bg-3 transition-colors cursor-pointer"
          >
            <div className="text-3xl mb-3">{tool.icon}</div>
            <h3 className="font-semibold mb-2">{tool.title}</h3>
            <p className="text-sm text-text-dim">{tool.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-bg-2 border border-line rounded-lg p-6">
        <h2 className="font-serif text-xl font-bold mb-4">AI Credits</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Credits Available</span>
              <span className="font-bold text-2xl text-amber">850</span>
            </div>
            <div className="w-full bg-bg rounded-full h-3">
              <div className="w-3/4 h-3 bg-amber rounded-full"></div>
            </div>
            <p className="text-xs text-text-dim mt-2">Resets on the 1st of each month</p>
          </div>
        </div>
      </div>
    </div>
  )
}
