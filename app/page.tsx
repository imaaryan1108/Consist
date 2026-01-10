export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
          Consist
        </h1>
        <p className="text-xl text-gray-300 max-w-md mx-auto">
          Build consistency together through daily gym check-ins, streaks, and social accountability.
        </p>
        <div className="pt-4">
          <button className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-orange-500/50">
            Get Started
          </button>
        </div>
      </div>
    </main>
  )
}
