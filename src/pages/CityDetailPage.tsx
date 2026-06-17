import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { ArrowLeft, Clock, Smile, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/business/KpiCard';
import { getCityMetrics, getBranches, getQueueData, getTransactions } from '@/api';
import { getCityById } from '@/api/mock/cities';
import type { Branch, QueueRecord, Transaction } from '@/api';

type TimeRange = 7 | 30 | 90;

export default function CityDetailPage() {
  const { cityId } = useParams<{ cityId: string }>();
  const navigate = useNavigate();
  const [cityName, setCityName] = useState('');
  const [metrics, setMetrics] = useState<{ avgWaitTime: number; satisfactionScore: number; dailyTransactions: number } | null>(null);
  const [branchList, setBranchList] = useState<Branch[]>([]);
  const [queueRecords, setQueueRecords] = useState<QueueRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityId) return;
    const city = getCityById(cityId);
    if (city) setCityName(city.name);

    Promise.all([
      getCityMetrics(cityId),
      getBranches(cityId),
      getQueueData(undefined, cityId),
      getTransactions(undefined, cityId),
    ]).then(([m, b, q, t]) => {
      setMetrics(m);
      setBranchList(b);
      setQueueRecords(q);
      setTransactions(t);
      setLoading(false);
    });
  }, [cityId]);

  const trendData = useMemo(() => {
    const end = dayjs();
    const start = end.subtract(timeRange, 'day');
    const filtered = queueRecords.filter(
      r => dayjs(r.date).isAfter(start.subtract(1, 'day')) && dayjs(r.date).isBefore(end.add(1, 'day'))
    );
    const byDate: Record<string, { sum: number; count: number }> = {};
    filtered.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { sum: 0, count: 0 };
      byDate[r.date].sum += r.avgWaitTime;
      byDate[r.date].count += 1;
    });
    const dates: string[] = [];
    const values: number[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = end.subtract(i, 'day').format('MM-DD');
      const key = end.subtract(i, 'day').format('YYYY-MM-DD');
      dates.push(d);
      values.push(byDate[key] ? Math.round((byDate[key].sum / byDate[key].count) * 10) / 10 : 0);
    }
    return { dates, values };
  }, [queueRecords, timeRange]);

  const businessTypeData = useMemo(() => {
    const countMap: Record<string, number> = {};
    transactions.forEach(t => {
      countMap[t.businessType] = (countMap[t.businessType] || 0) + 1;
    });
    return Object.entries(countMap).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const lineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category' as const, data: trendData.dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'line' as const,
      data: trendData.values,
      smooth: true,
      areaStyle: { color: 'rgba(11,42,90,0.1)' },
      lineStyle: { color: '#0B2A5A', width: 2 },
      itemStyle: { color: '#0B2A5A' },
    }],
  }), [trendData]);

  const pieOption = useMemo(() => ({
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie' as const,
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {d}%' },
      data: businessTypeData,
      color: ['#0B2A5A', '#3D5999', '#6279B3', '#C9A962', '#E53935'],
    }],
  }), [businessTypeData]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span>返回</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{cityName}</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          title="平均等候时长"
          value={metrics?.avgWaitTime ?? '--'}
          unit="分钟"
          icon={<Clock className="h-5 w-5" />}
          color="#0B2A5A"
        />
        <KpiCard
          title="客户满意度"
          value={metrics?.satisfactionScore ?? '--'}
          unit="分"
          icon={<Smile className="h-5 w-5" />}
          color="#C9A962"
        />
        <KpiCard
          title="日均业务量"
          value={metrics?.dailyTransactions ?? '--'}
          unit="笔"
          icon={<TrendingUp className="h-5 w-5" />}
          color="#43A047"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">客流趋势</h2>
            <div className="flex gap-1">
              {([7, 30, 90] as TimeRange[]).map(d => (
                <button
                  key={d}
                  onClick={() => setTimeRange(d)}
                  className={`rounded px-3 py-1 text-xs font-medium transition-colors ${timeRange === d ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d}天
                </button>
              ))}
            </div>
          </div>
          <ReactECharts option={lineOption} style={{ height: 300 }} />
        </div>

        <div className="card p-5">
          <h2 className="mb-3 text-base font-semibold text-gray-700">业务类型占比</h2>
          <ReactECharts option={pieOption} style={{ height: 300 }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-700">网点列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-5 py-3 text-left font-medium text-gray-500">网点名称</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">窗口数</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">柜员数</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">平均等候时长</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">满意度</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody>
              {branchList.map(branch => (
                <tr
                  key={branch.id}
                  onClick={() => navigate(`/branch/${branch.id}`)}
                  className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-primary-50/50"
                >
                  <td className="px-5 py-3 font-medium text-gray-800">{branch.name}</td>
                  <td className="px-5 py-3 text-gray-600">{branch.windowCount}</td>
                  <td className="px-5 py-3 text-gray-600">{branch.tellerCount}</td>
                  <td className="px-5 py-3 text-gray-600">{(10 + Math.random() * 15).toFixed(1)}分钟</td>
                  <td className="px-5 py-3 text-gray-600">{(3 + Math.random() * 2).toFixed(1)}</td>
                  <td className="px-5 py-3">
                    <span className={`status-badge status-${branch.status}`}>
                      {{ normal: '正常', warning: '预警', critical: '异常' }[branch.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
