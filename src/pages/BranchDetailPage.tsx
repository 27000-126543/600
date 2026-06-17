import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { ArrowLeft, Clock, Users, Zap, Star, MapPin, CalendarDays } from 'lucide-react';
import KpiCard from '@/components/business/KpiCard';
import { getBranchDetail, getQueueData, getTransactions, getReviews } from '@/api';
import type { Branch, QueueRecord, Transaction, Review } from '@/api';

export default function BranchDetailPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [queueRecords, setQueueRecords] = useState<QueueRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!branchId) return;
    Promise.all([
      getBranchDetail(branchId),
      getQueueData(branchId),
      getTransactions(branchId),
      getReviews(branchId),
    ]).then(([b, q, t, r]) => {
      setBranch(b ?? null);
      setQueueRecords(q);
      setTransactions(t);
      setReviews(r);
      setLoading(false);
    });
  }, [branchId]);

  const kpiData = useMemo(() => {
    const currentWaiting = queueRecords.length > 0
      ? queueRecords[queueRecords.length - 1].waitingCustomers
      : 0;
    const avgWait = queueRecords.length > 0
      ? Math.round(queueRecords.reduce((s, r) => s + r.avgWaitTime, 0) / queueRecords.length * 10) / 10
      : 0;
    const tellerEfficiency = transactions.length > 0
      ? Math.round(transactions.reduce((s, t) => s + t.duration, 0) / transactions.length * 10) / 10
      : 0;
    const satisfaction = reviews.length > 0
      ? Math.round(reviews.reduce((s, r) => s + r.score, 0) / reviews.length * 10) / 10
      : 0;
    return { currentWaiting, avgWait, tellerEfficiency, satisfaction };
  }, [queueRecords, transactions, reviews]);

  const dailyWaitTrend = useMemo(() => {
    const byDate: Record<string, { sum: number; count: number }> = {};
    const sevenDaysAgo = dayjs().subtract(7, 'day');
    queueRecords
      .filter(r => dayjs(r.date).isAfter(sevenDaysAgo.subtract(1, 'day')))
      .forEach(r => {
        if (!byDate[r.date]) byDate[r.date] = { sum: 0, count: 0 };
        byDate[r.date].sum += r.avgWaitTime;
        byDate[r.date].count += 1;
      });
    const dates: string[] = [];
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const key = d.format('YYYY-MM-DD');
      dates.push(d.format('MM-DD'));
      values.push(byDate[key] ? Math.round(byDate[key].sum / byDate[key].count * 10) / 10 : 0);
    }
    return { dates, values };
  }, [queueRecords]);

  const hourlyWaitDist = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayRecords = queueRecords.filter(r => r.date === today);
    const byHour: Record<number, number> = {};
    for (let h = 9; h <= 17; h++) byHour[h] = 0;
    todayRecords.forEach(r => {
      if (r.hour >= 9 && r.hour <= 17) {
        byHour[r.hour] = (byHour[r.hour] || 0) + r.avgWaitTime;
      }
    });
    const hours = Object.keys(byHour).map(h => `${h}:00`);
    const values = Object.values(byHour).map(v => Math.round(v * 10) / 10);
    return { hours, values };
  }, [queueRecords]);

  const tellerStats = useMemo(() => {
    const byTeller: Record<string, { name: string; count: number; totalDuration: number }> = {};
    transactions.forEach(t => {
      if (!byTeller[t.tellerId]) {
        byTeller[t.tellerId] = { name: t.tellerName, count: 0, totalDuration: 0 };
      }
      byTeller[t.tellerId].count += 1;
      byTeller[t.tellerId].totalDuration += t.duration;
    });
    return Object.entries(byTeller)
      .map(([id, s]) => ({
        id,
        name: s.name,
        count: s.count,
        avgDuration: Math.round(s.totalDuration / s.count * 10) / 10,
        efficiency: Math.round(Math.min(100, (s.count / (s.totalDuration / s.count)) * 50) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  const satisfactionTrend = useMemo(() => {
    const byDate: Record<string, { sum: number; count: number }> = {};
    const thirtyDaysAgo = dayjs().subtract(30, 'day');
    reviews
      .filter(r => dayjs(r.timestamp).isAfter(thirtyDaysAgo.subtract(1, 'day')))
      .forEach(r => {
        const d = dayjs(r.timestamp).format('YYYY-MM-DD');
        if (!byDate[d]) byDate[d] = { sum: 0, count: 0 };
        byDate[d].sum += r.score;
        byDate[d].count += 1;
      });
    const dates: string[] = [];
    const values: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day');
      const key = d.format('YYYY-MM-DD');
      dates.push(d.format('MM-DD'));
      values.push(byDate[key] ? Math.round(byDate[key].sum / byDate[key].count * 10) / 10 : 0);
    }
    return { dates, values };
  }, [reviews]);

  const tagDistribution = useMemo(() => {
    const tagMap: Record<string, number> = {};
    reviews.forEach(r => {
      r.tags.forEach(tag => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      });
    });
    return Object.entries(tagMap).map(([name, value]) => ({ name, value }));
  }, [reviews]);

  const dailyLineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 15, top: 15, bottom: 30 },
    xAxis: { type: 'category' as const, data: dailyWaitTrend.dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'line' as const,
      data: dailyWaitTrend.values,
      smooth: true,
      areaStyle: { color: 'rgba(11,42,90,0.08)' },
      lineStyle: { color: '#0B2A5A', width: 2 },
      itemStyle: { color: '#0B2A5A' },
    }],
  }), [dailyWaitTrend]);

  const hourlyBarOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 50, right: 15, top: 15, bottom: 30 },
    xAxis: { type: 'category' as const, data: hourlyWaitDist.hours, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar' as const,
      data: hourlyWaitDist.values,
      itemStyle: { color: '#3D5999', borderRadius: [4, 4, 0, 0] },
      barWidth: '50%',
    }],
  }), [hourlyWaitDist]);

  const tellerBarOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 80, right: 20, top: 10, bottom: 10 },
    xAxis: { type: 'value' as const, axisLabel: { fontSize: 11 } },
    yAxis: {
      type: 'category' as const,
      data: tellerStats.map(t => t.name),
      axisLabel: { fontSize: 11 },
    },
    series: [{
      type: 'bar' as const,
      data: tellerStats.map(t => t.count),
      itemStyle: { color: '#C9A962', borderRadius: [0, 4, 4, 0] },
      barWidth: '50%',
    }],
  }), [tellerStats]);

  const satisfactionLineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 45, right: 15, top: 15, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: satisfactionTrend.dates,
      axisLabel: { fontSize: 10, interval: 4 },
    },
    yAxis: { type: 'value' as const, min: 0, max: 5, name: '分', axisLabel: { fontSize: 11 } },
    series: [{
      type: 'line' as const,
      data: satisfactionTrend.values,
      smooth: true,
      areaStyle: { color: 'rgba(201,169,98,0.1)' },
      lineStyle: { color: '#C9A962', width: 2 },
      itemStyle: { color: '#C9A962' },
    }],
  }), [satisfactionTrend]);

  const tagPieOption = useMemo(() => ({
    tooltip: { trigger: 'item' as const },
    legend: { bottom: 0, textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie' as const,
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}' },
      data: tagDistribution,
      color: ['#0B2A5A', '#3D5999', '#6279B3', '#C9A962', '#E53935', '#43A047', '#FB8C00', '#94A3B8'],
    }],
  }), [tagDistribution]);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-400">加载中...</div>;
  }

  if (!branch) {
    return <div className="flex h-full items-center justify-center text-gray-400">网点不存在</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{branch.name}</h1>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{branch.address}</span>
          <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />工作日 {branch.businessHours.weekday} / 周末 {branch.businessHours.weekend}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard title="实时等候人数" value={kpiData.currentWaiting} unit="人" icon={<Users className="h-5 w-5" />} color="#E53935" />
        <KpiCard title="日均等候时长" value={kpiData.avgWait} unit="分钟" icon={<Clock className="h-5 w-5" />} color="#0B2A5A" />
        <KpiCard title="柜员平均效率" value={kpiData.tellerEfficiency} unit="分钟/笔" icon={<Zap className="h-5 w-5" />} color="#C9A962" />
        <KpiCard title="客户满意度" value={kpiData.satisfaction} unit="分" icon={<Star className="h-5 w-5" />} color="#43A047" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-gray-700">最近7天平均等候时长</h2>
            <ReactECharts option={dailyLineOption} style={{ height: 220 }} />
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-gray-700">今日各时段等候时长</h2>
            <ReactECharts option={hourlyBarOption} style={{ height: 220 }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 text-base font-semibold text-gray-700">柜员业务量排名</h2>
            <ReactECharts option={tellerBarOption} style={{ height: 220 }} />
          </div>
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-5 py-3">
              <h2 className="text-base font-semibold text-gray-700">柜员效率详情</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500">姓名</th>
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500">业务量</th>
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500">平均处理时长</th>
                    <th className="px-5 py-2.5 text-left font-medium text-gray-500">效率评分</th>
                  </tr>
                </thead>
                <tbody>
                  {tellerStats.map(t => (
                    <tr key={t.id} className="border-b border-gray-50">
                      <td className="px-5 py-2.5 font-medium text-gray-800">{t.name}</td>
                      <td className="px-5 py-2.5 text-gray-600">{t.count}笔</td>
                      <td className="px-5 py-2.5 text-gray-600">{t.avgDuration}分钟</td>
                      <td className="px-5 py-2.5 text-gray-600">{t.efficiency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="mb-3 text-base font-semibold text-gray-700">客户满意度趋势（30天）</h2>
          <ReactECharts option={satisfactionLineOption} style={{ height: 260 }} />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-base font-semibold text-gray-700">评价标签分布</h2>
          <ReactECharts option={tagPieOption} style={{ height: 260 }} />
        </div>
      </div>
    </div>
  );
}
