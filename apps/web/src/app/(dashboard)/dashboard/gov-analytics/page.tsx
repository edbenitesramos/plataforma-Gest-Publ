'use client'

export default function GovAnalyticsPage() {
  const anomalies = [
    { id: 1, type: 'Preço atípico', description: 'Contrato CNPJ 00.000.000/0001-00: R$ 2.1M (mediana: R$ 800K)', severity: 'high' },
    { id: 2, type: 'Fornecedor suspeito', description: 'Empresa X: 15 contratos em 3 estados no mesmo dia', severity: 'medium' },
    { id: 3, type: 'Obra parada', description: 'Verba liberada R$ 500K — execução 0% após 6 meses', severity: 'high' },
  ]

  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">GovAnalytics</h2>
        <p className="text-gray-500 text-sm mt-1">Detecção de anomalias e padrões suspeitos em dados públicos</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Anomalias detectadas', value: '3', color: 'bg-red-500' },
          { label: 'Contratos analisados', value: '1.247', color: 'bg-navy' },
          { label: 'Desvio médio', value: '+163%', color: 'bg-orange-500' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color.replace('bg-', 'text-')}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Anomalias identificadas</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {anomalies.map((a) => (
            <div key={a.id} className="p-4 flex items-start gap-4">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${colors[a.severity]}`}>
                {a.type}
              </span>
              <p className="text-sm text-gray-700 flex-1">{a.description}</p>
              <button className="text-xs text-teal hover:underline">Investigar</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Nota:</strong> Os dados acima são demonstrativos. A integração completa com PNCP e Portal da Transparência
          para detecção automática de anomalias está em desenvolvimento na Fase 4.
        </p>
      </div>
    </div>
  )
}
