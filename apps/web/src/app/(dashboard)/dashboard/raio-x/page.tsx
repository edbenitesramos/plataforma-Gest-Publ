'use client'

export default function RaioXPage() {
  const analyses = [
    { id: 1, title: 'Análise: Gastos com Saúde em SC 2025', date: '15/04/2026', views: 342, category: 'Saúde' },
    { id: 2, title: 'Ranking: Municípios com maior gasto em educação per capita', date: '10/03/2026', views: 891, category: 'Educação' },
    { id: 3, title: 'Alerta: Concentração de contratos em fornecedores únicos', date: '02/02/2026', views: 1204, category: 'Contratos' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Raio-X Público</h2>
        <p className="text-gray-500 text-sm mt-1">Análises publicadas e rankings temáticos</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {analyses.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-teal transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full mb-2">{a.category}</span>
                <h3 className="font-semibold text-gray-800">{a.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{a.date} · {a.views} visualizações</p>
              </div>
              <button className="text-sm text-teal hover:underline">Ver análise</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-400 text-sm">Mais análises disponíveis nos planos Starter e Professional.</p>
      </div>
    </div>
  )
}
