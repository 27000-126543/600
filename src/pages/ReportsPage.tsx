import { useState, useEffect, useMemo } from 'react';
import { FileText, ArrowLeft, TrendingUp, TrendingDown, Clock, MapPin, Calendar, Plus, AlertCircle } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getReports, getReportDetail } from '@/api';
import type { Report, ReportScope } from '@/api';
import { useAuth } from '@/hooks/useAuth';

const scopeOptions: { value: ReportScope | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'national', label: '全国' },
  { value: 'city', label: '城市' },
  { value: 'branch', label: '网点' },
];

const scopeLabelMap: Record<ReportScope, string> = {
  national: '全国',
  city: '城市',
  branch: '网点',
};

const scopeColorMap: Record<ReportScope, string> = {
  national: 'bg-blue-100 text-blue-700',
  city: 'bg-purple-100 text-purple-700',
  branch: 'bg-emerald-100 text-emerald-700',
};

const trendIcon = (change: number) => (
  change <= 0
    ? <TrendingDown className="h-5 w-5 text-green-600" />
    : <TrendingUp className="h-5 w-5 text-red-500" />
);

const trendClass = (change: number) => (
  change <= 0 ? 'text-green-600' : 'text-red-500'
);

function ReportCard({ report, onView }: { report: Report; onView: () => void }) {
  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-all cursor-pointer" onClick={onView}>
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-800 leading-snug flex-1">{report.title}</h3>
        <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${scopeColorMap[report.scope]}`}>
          {scopeLabelMap[report.scope]}
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{report.content.summary}</p>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Calendar className="h-3.5 w-3.5" />
        <span>{report.period}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Clock className="h-3.5 w-3.5" />
        <span>生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}</span>
      </div>
      <div className="mt-auto self-end text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
        查看详情 →
      </div>
    </div>
  );
}

function ReportDetailView({ report, onBack }: { report: Report; onBack: () => void }) {
  const { waitTimeAnalysis, complaintDistribution, deviceFailureRate, recommendations, summary } = report.content;

  const dailyTrendOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: waitTimeAnalysis.dailyTrend.map(d => d.date),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'value' as const,
      name: '分钟',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' },
    },
    series: [{
      type: 'line' as const,
      data: waitTimeAnalysis.dailyTrend.map(d => d.waitTime),
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { color: '#0B2A5A', width: 2.5 },
      itemStyle: { color: '#0B2A5A' },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(11,42,90,0.2)' },
            { offset: 1, color: 'rgba(11,42,90,0)' },
          ],
        },
      },
      markLine: {
        silent: true,
        lineStyle: { color: '#C9A962', type: 'dashed' as const },
        data: [{ type: 'average' as const, name: '周平均' }],
      },
    }],
  }), [waitTimeAnalysis.dailyTrend]);

  const complaintBarOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const, formatter: '{b}: {c}件 ({d}%)' },
    grid: { left: 100, right: 40, top: 10, bottom: 30 },
    xAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', formatter: '{value}件' },
    },
    yAxis: {
      type: 'category' as const,
      data: complaintDistribution.map(c => c.type).reverse(),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#374151', fontSize: 12 },
    },
    series: [{
      type: 'bar' as const,
      data: complaintDistribution.map(c => c.count).reverse(),
      barWidth: 18,
      label: {
        show: true,
        position: 'right',
        formatter: (p: any) => `${complaintDistribution[complaintDistribution.length - 1 - p.dataIndex].percentage}%`,
        color: '#6b7280',
        fontSize: 12,
      },
      itemStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#0B2A5A' },
            { offset: 1, color: '#1e40af' },
          ],
        },
        borderRadius: [0, 4, 4, 0],
      },
    }],
  }), [complaintDistribution]);

  const complaintPieOption = useMemo(() => ({
    tooltip: { trigger: 'item' as const, formatter: '{b}: {c}件 ({d}%)' },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: '#6b7280' } },
    color: ['#0B2A5A', '#C9A962', '#1e40af', '#f59e0b', '#10b981', '#ef4444'],
    series: [{
      type: 'pie' as const,
      radius: ['45%', '70%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
      data: complaintDistribution.map(c => ({ value: c.count, name: c.type })),
    }],
  }), [complaintDistribution]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{report.title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scopeColorMap[report.scope]}`}>
          {scopeLabelMap[report.scope]} · {report.scopeName}
        </span>
        <span className="text-sm text-gray-400">{report.period}</span>
      </div>

      <div className="card p-5 bg-gradient-to-r from-primary-50 to-amber-50/50 border border-primary-100">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          等候时长分析（本周每日）
        </h3>
        <div className="grid grid-cols-4 gap-5 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">平均等候时长</div>
            <div className="text-3xl font-bold text-primary-700">{waitTimeAnalysis.avgWaitTime}<span className="text-base ml-1">分钟</span></div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">环比上周</div>
            <div className={`flex items-center gap-1 text-2xl font-bold ${trendClass(waitTimeAnalysis.wowChange)}`}>
              {trendIcon(waitTimeAnalysis.wowChange)}
              {Math.abs(waitTimeAnalysis.wowChange)}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">同比去年</div>
            <div className={`flex items-center gap-1 text-2xl font-bold ${trendClass(waitTimeAnalysis.yoyChange)}`}>
              {trendIcon(waitTimeAnalysis.yoyChange)}
              {Math.abs(waitTimeAnalysis.yoyChange)}%
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">高峰时段</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {waitTimeAnalysis.peakHours.map(h => (
                <span key={h} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-sm font-medium">{h}:00</span>
              ))}
            </div>
          </div>
        </div>
        <ReactECharts option={dailyTrendOption} style={{ height: 280 }} />
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          投诉分布（本周）
        </h3>
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-5">
            <ReactECharts option={complaintPieOption} style={{ height: 280 }} />
          </div>
          <div className="col-span-7">
            <ReactECharts option={complaintBarOption} style={{ height: 280 }} />
          </div>
        </div>
        <div className="mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2.5 text-gray-600 font-medium">投诉类别</th>
                <th className="text-right py-2.5 text-gray-600 font-medium">数量（件）</th>
                <th className="text-right py-2.5 text-gray-600 font-medium">占比</th>
                <th className="text-right py-2.5 text-gray-600 font-medium">变化趋势</th>
              </tr>
            </thead>
            <tbody>
              {complaintDistribution.map((item, i) => {
                const isHigh = item.percentage >= 25;
                return (
                  <tr key={i} className={`border-b border-gray-50 ${isHigh ? 'bg-red-50/50' : ''}`}>
                    <td className="py-2.5 text-gray-800">{item.type}</td>
                    <td className={`py-2.5 text-right ${isHigh ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{item.count}</td>
                    <td className={`py-2.5 text-right ${isHigh ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{item.percentage}%</td>
                    <td className="py-2.5 text-right text-gray-400">
                      {i < 2 ? <span className="inline-flex items-center gap-0.5 text-red-500 text-xs"><TrendingUp className="w-3 h-3" />偏高</span> : <span className="text-xs">正常</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          设备故障率（本周）
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2.5 text-gray-600 font-medium">设备类型</th>
              <th className="text-right py-2.5 text-gray-600 font-medium">故障次数</th>
              <th className="text-right py-2.5 text-gray-600 font-medium">故障率</th>
              <th className="text-right py-2.5 text-gray-600 font-medium">趋势</th>
            </tr>
          </thead>
          <tbody>
            {deviceFailureRate.map((item, i) => {
              const isHigh = item.failureRate > 5;
              return (
                <tr key={i} className={`border-b border-gray-50 ${isHigh ? 'bg-red-50/50' : ''}`}>
                  <td className="py-2.5 text-gray-800">{item.device}</td>
                  <td className={`py-2.5 text-right ${isHigh ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{item.failureCount}</td>
                  <td className={`py-2.5 text-right font-medium ${isHigh ? 'text-red-600' : 'text-gray-600'}`}>{item.failureRate}%</td>
                  <td className="py-2.5 text-right">
                    {item.trend === 'up' && <span className="inline-flex items-center gap-0.5 text-red-500 text-xs"><TrendingUp className="w-3.5 h-3.5" />上升</span>}
                    {item.trend === 'down' && <span className="inline-flex items-center gap-0.5 text-green-600 text-xs"><TrendingDown className="w-3.5 h-3.5" />下降</span>}
                    {item.trend === 'stable' && <span className="text-xs text-gray-400">稳定</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          优化建议
        </h3>
        <ol className="list-decimal list-inside space-y-3">
          {recommendations.map((rec, i) => (
            <li key={i} className="text-gray-700 leading-relaxed pl-1">
              <span className="ml-1">{rec}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { isHeadquarters } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<ReportScope | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getReports(scope === 'all' ? undefined : scope).then(data => {
      setReports(data);
      setLoading(false);
    });
  }, [scope]);

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true);
    const detail = await getReportDetail(id);
    if (detail) {
      setSelectedReport(detail);
    }
    setDetailLoading(false);
  };

  if (selectedReport) {
    return (
      <div className="p-6">
        {detailLoading ? (
          <div className="card p-12 text-center text-gray-400">加载中...</div>
        ) : (
          <ReportDetailView report={selectedReport} onBack={() => setSelectedReport(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">诊断报告</h1>
          <p className="text-gray-500 mt-1">每周自动生成的运营诊断报告，含等候时长、投诉分布、设备故障及优化建议</p>
        </div>
        {isHeadquarters && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            立即生成
          </button>
        )}
      </div>

      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <label className="text-sm text-gray-600">报告范围</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value as ReportScope | 'all')}
            className="input-field w-36 py-1.5 text-sm"
          >
            {scopeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-400">
          共 <span className="font-semibold text-primary-600">{reports.length}</span> 份周报
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-5 h-48 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-16 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无周报数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {reports.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              onView={() => handleViewDetail(report.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
