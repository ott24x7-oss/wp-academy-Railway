export default function LearnPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="font-serif text-3xl font-bold mb-2">Learn</h1>
      <p className="text-text-dim mb-8">Explore courses and master digital marketing</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-bg-2 border border-line rounded-lg overflow-hidden hover:border-amber transition-colors cursor-pointer">
            <div className="w-full h-40 bg-gradient-to-br from-amber/20 to-sky/20"></div>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Course Title {i + 1}</h3>
              <p className="text-sm text-text-dim mb-4">Learn the fundamentals of digital marketing</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-emerald/20 text-emerald px-2 py-1 rounded">Beginner</span>
                <span className="text-xs text-text-dim">8 lessons</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
