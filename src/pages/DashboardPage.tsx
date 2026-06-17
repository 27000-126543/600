import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Smile, Users, TrendingUp } from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import KpiCard from '@/components/business/KpiCard'
import { getNationalMetrics, getCityMetrics } from '@/api'
import { cities as citiesData } from '@/api/mock'
import { useAuth } from '@/hooks/useAuth'

interface CityMetricsData {
  cityId: string
  cityName: string
  avgWaitTime: number
  satisfactionScore: number
  dailyTransactions: number
  totalBranches: number
}

type RankTab = 'wait' | 'efficiency' | 'satisfaction'

const rankTabs: { key: RankTab; label: string }[] = [
  { key: 'wait', label: '等候时长排名' },
  { key: 'efficiency', label: '效率排名' },
  { key: 'satisfaction', label: '满意度排名' },
]

const medalColors = ['#D97706', '#9CA3AF', '#B45309']

const businessDistribution = [
  { name: '个人存取款', value: 40 },
  { name: '对公业务', value: 20 },
  { name: '理财业务', value: 15 },
  { name: '贷款业务', value: 15 },
  { name: '外汇业务', value: 10 },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { isHeadquarters } = useAuth()
  const [loading, setLoading] = useState(true)
  const [nationalMetrics, setNationalMetrics] = useState<{
    totalCities: number
    totalBranches: number
    avgWaitTime: number
    satisfactionScore: number
    dailyTransactions: number
    warningCount: number
  } | null>(null)
  const [cityMetricsList, setCityMetricsList] = useState<CityMetricsData[]>([])
  const [activeTab, setActiveTab] = useState<RankTab>('wait')

  useEffect(() => {
    async function fetchData() {
      try {
        const [metrics, ...cityResults] = await Promise.all([
          getNationalMetrics(),
          ...citiesData.map(city => getCityMetrics(city.id)),
        ])
        setNationalMetrics(metrics)
        setCityMetricsList(
          cityResults.map(r => ({
            cityId: r.cityId,
            cityName: r.cityName,
            avgWaitTime: r.avgWaitTime,
            satisfactionScore: r.satisfactionScore,
            dailyTransactions: r.dailyTransactions,
            totalBranches: r.totalBranches,
          }))
        )
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const scatterData = useMemo(() => {
    return cityMetricsList
      .map(cm => {
        const city = citiesData.find(c => c.id === cm.cityId)
        if (!city) return null
        return {
          value: [city.coordinates.lng, city.coordinates.lat, cm.avgWaitTime],
          name: cm.cityName,
          cityId: cm.cityId,
        }
      })
      .filter(Boolean) as { value: number[]; name: string; cityId: string }[]
  }, [cityMetricsList])

  const rankedList = useMemo(() => {
    const sorted = [...cityMetricsList]
    if (activeTab === 'wait') {
      sorted.sort((a, b) => b.avgWaitTime - a.avgWaitTime)
    } else if (activeTab === 'efficiency') {
      sorted.sort(
        (a, b) =>
          b.dailyTransactions / b.totalBranches -
          a.dailyTransactions / a.totalBranches
      )
    } else {
      sorted.sort((a, b) => b.satisfactionScore - a.satisfactionScore)
    }
    return sorted
  }, [cityMetricsList, activeTab])

  const maxRankValue = useMemo(() => {
    if (rankedList.length === 0) return 1
    if (activeTab === 'wait') return rankedList[0].avgWaitTime
    if (activeTab === 'efficiency')
      return rankedList[0].dailyTransactions / rankedList[0].totalBranches
    return rankedList[0].satisfactionScore
  }, [rankedList, activeTab])

  const getRankDisplay = (item: CityMetricsData) => {
    if (activeTab === 'wait') return { value: item.avgWaitTime, unit: '分钟' }
    if (activeTab === 'efficiency')
      return {
        value: Math.round(item.dailyTransactions / item.totalBranches),
        unit: '笔/网点',
      }
    return { value: item.satisfactionScore, unit: '分' }
  }

  const getRankProgress = (item: CityMetricsData) => {
    const { value } = getRankDisplay(item)
    return (value / maxRankValue) * 100
  }

  const scatterOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item' as const,
        formatter: (params: any) =>
          `${params.name}<br/>平均等候: ${params.value[2]}分钟`,
      },
      visualMap: {
        min: 5,
        max: 30,
        inRange: { color: ['#43A047', '#FDD835', '#E53935'] },
        text: ['高', '低'],
        textStyle: { color: '#666' },
        left: 20,
        bottom: 20,
      },
      xAxis: { min: 73, max: 135, show: false },
      yAxis: { min: 18, max: 54, show: false },
      series: [
        {
          type: 'scatter' as const,
          data: scatterData,
          symbolSize: 18,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          emphasis: {
            itemStyle: {
              borderColor: '#333',
              borderWidth: 2,
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)',
            },
          },
        },
      ],
      grid: { left: 30, right: 30, top: 30, bottom: 60 },
    }),
    [scatterData]
  )

  const onScatterClick = (params: any) => {
    const cityId = params.data?.cityId
    if (cityId) navigate(`/city/${cityId}`)
  }

  const trendOption = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return `${d.getMonth() + 1}/${d.getDate()}`
    })
    const base = nationalMetrics?.avgWaitTime ?? 15
    const data = days.map(
      () => Math.round((base + (Math.random() - 0.5) * 8) * 10) / 10
    )
    return {
      tooltip: { trigger: 'axis' as const },
      xAxis: {
        type: 'category' as const,
        data: days,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: { color: '#666' },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: '#666' },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
      },
      series: [
        {
          type: 'line' as const,
          data,
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.3)' },
                { offset: 1, color: 'rgba(59,130,246,0.01)' },
              ],
            },
          },
          lineStyle: { color: '#3B82F6', width: 2 },
          itemStyle: { color: '#3B82F6' },
        },
      ],
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
    }
  }, [nationalMetrics])

  const pieOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'item' as const,
        formatter: '{b}: {c}%',
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#666' },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false, position: 'center' as const },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' as const },
          },
          data: businessDistribution,
          color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'],
        },
      ],
    }),
    []
  )

  const activeTellers = Math.round(
    (nationalMetrics?.totalBranches ?? 0) * 5.2
  )

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
        <div className="flex gap-5">
          <div className="h-[420px] w-[60%] animate-pulse rounded-lg bg-gray-100" />
          <div className="h-[420px] w-[40%] animate-pulse rounded-lg bg-gray-100" />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="h-[300px] animate-pulse rounded-lg bg-gray-100" />
          <div className="h-[300px] animate-pulse rounded-lg bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          title="全国平均等候时长"
          value={nationalMetrics?.avgWaitTime ?? '--'}
          unit="分钟"
          icon={<Clock className="h-5 w-5" />}
          color="#3B82F6"
        />
        <KpiCard
          title="总体满意度"
          value={nationalMetrics?.satisfactionScore ?? '--'}
          unit="分"
          icon={<Smile className="h-5 w-5" />}
          color="#10B981"
        />
        <KpiCard
          title="活跃柜员数"
          value={activeTellers}
          unit="人"
          icon={<Users className="h-5 w-5" />}
          color="#F59E0B"
        />
        <KpiCard
          title="今日业务量"
          value={nationalMetrics?.dailyTransactions ?? '--'}
          unit="笔"
          icon={<TrendingUp className="h-5 w-5" />}
          color="#8B5CF6"
        />
      </div>

      <div className="flex gap-5">
        <div className="card w-[60%] p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-700">
            运营热力图
          </h3>
          <ReactECharts
            option={scatterOption}
            style={{ height: 360 }}
            onEvents={{ click: onScatterClick }}
          />
        </div>
        <div className="card w-[40%] p-5">
          <div className="mb-4 flex gap-1">
            {rankTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {rankedList.map((item, idx) => {
              const { value, unit } = getRankDisplay(item)
              return (
                <div
                  key={item.cityId}
                  className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
                >
                  <span
                    className={`w-6 text-center text-sm font-bold ${
                      idx < 3 ? medalColors[idx] : 'text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="w-16 shrink-0 text-sm font-medium text-gray-700">
                    {item.cityName}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${getRankProgress(item)}%`,
                          backgroundColor:
                            idx < 3 ? medalColors[idx] : '#6366F1',
                        }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-gray-600">
                    {value} {unit}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-700">
            最近7天全国等候时长趋势
          </h3>
          <ReactECharts option={trendOption} style={{ height: 260 }} />
        </div>
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-gray-700">
            业务类型占比
          </h3>
          <ReactECharts option={pieOption} style={{ height: 260 }} />
        </div>
      </div>
    </div>
  )
}
