import { useState, useEffect, useMemo } from 'react';
import { FileText, ArrowLeft, TrendingUp, TrendingDown, Clock, MapPin, Calendar, Plus } from 'lucide-react';
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

function ReportCard({ report, onView }: { report: Report; onView: () => void }) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="text-base font-semibold text-gray-800 leading-snug flex-1">{report.title}</h3>
        <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${scopeColorMap[report.scope]}`}>
          {scopeLabelMap[report.scope]}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Calendar className="h-3.5 w-3.5" />
        <span>{report.period}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Clock className="h-3.5 w-3.5" />
        <span>{new Date(report.generatedAt).toLocaleString('zh-CN')}</span>
      </div>
      <button
        onClick={onView}
        className="mt-auto self-end text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
      >
        查看详情 →
      </button>
    </div>
  );
}

function ReportDetailView({ report, onBack }: { report: Report; onBack: () => void }) {
  const { waitTimeAnalysis, complaintDistribution, deviceFailureRate, recommendations } = report.content;

  const trendLineOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category' as const,
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
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
      data: [
        waitTimeAnalysis.avgWaitTime + 3,
        waitTimeAnalysis.avgWaitTime + 1,
        waitTimeAnalysis.avgWaitTime - 2,
        waitTimeAnalysis.avgWaitTime + 2,
        waitTimeAnalysis.avgWaitTime - 1,
        waitTimeAnalysis.avgWaitTime,
      ],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#0B2A5A', width: 2 },
      itemStyle: { color: '#0B2A5A' },
      areaStyle: {
        color: {
          type: 'linear' as const,
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(11,42,90,0.15)' },
            { offset: 1, color: 'rgba(11,42,90,0)' },
          ],
        },
      },
    }],
  }), [waitTimeAnalysis.avgWaitTime]);

  const complaintBarOption = useMemo(() => ({
    tooltip: { trigger: 'axis' as const },
    grid: { left: 100, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' },
    },
    yAxis: {
      type: 'category' as const,
      data: complaintDistribution.map(c => c.type),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#374151', fontSize: 12 },
    },
    series: [{
      type: 'bar' as const,
      data: complaintDistribution.map(c => c.count),
      barWidth: 16,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-800">{report.title}</h2>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${scopeColorMap[report.scope]}`}>
          {scopeLabelMap[report.scope]}
        </span>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          等候时长分析
        </h3>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-700">{waitTimeAnalysis.avgWaitTime}</div>
            <div className="text-sm text-gray-500 mt-1">平均等候时长（分钟）</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className={`flex items-center gap-1 text-lg font-semibold ${waitTimeAnalysis.yoyChange <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {waitTimeAnalysis.yoyChange <= 0 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              {Math.abs(waitTimeAnalysis.yoyChange)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">同比变化</div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className={`flex items-center gap-1 text-lg font-semibold ${waitTimeAnalysis.momChange <= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {waitTimeAnalysis.momChange <= 0 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              {Math.abs(waitTimeAnalysis.momChange)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">环比变化</div>
          </div>
        </div>
        <div className="mb-4">
          <span className="text-sm text-gray-600">高峰时段：</span>
          <div className="inline-flex gap-2 mt-1">
            {waitTimeAnalysis.peakHours.map(h => (
              <span key={h} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-sm font-medium">{h}:00</span>
            ))}
          </div>
        </div>
        <ReactECharts option={trendLineOption} style={{ height: 260 }} />
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary-600" />
          投诉分布
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <ReactECharts option={complaintBarOption} style={{ height: 260 }} />
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600 font-medium">类别</th>
                  <th className="text-right py-2 text-gray-600 font-medium">数量</th>
                  <th className="text-right py-2 text-gray-600 font-medium">占比</th>
                </tr>
              </thead>
              <tbody>
                {complaintDistribution.map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">{item.type}</td>
                    <td className="py-2 text-right text-gray-600">{item.count}</td>
                    <td className="py-2 text-right text-gray-600">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          设备故障率
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-gray-600 font-medium">设备类型</th>
              <th className="text-right py-2 text-gray-600 font-medium">故障次数</th>
              <th className="text-right py-2 text-gray-600 font-medium">总数</th>
              <th className="text-right py-2 text-gray-600 font-medium">故障率</th>
            </tr>
          </thead>
          <tbody>
            {deviceFailureRate.map((item, i) => {
              const displayTotal = 100 + Math.floor(Math.random() * 50);
              const displayFailure = Math.round(displayTotal * item.failureRate / 100);
              const isHigh = item.failureRate > 5;
              return (
                <tr key={i} className={`border-b border-gray-50 ${isHigh ? 'bg-red-50' : ''}`}>
                  <td className="py-2 text-gray-800">{item.device}</td>
                  <td className={`py-2 text-right ${isHigh ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{displayFailure}</td>
                  <td className="py-2 text-right text-gray-600">{displayTotal}</td>
                  <td className={`py-2 text-right font-medium ${isHigh ? 'text-red-600' : 'text-gray-600'}`}>
                    {item.failureRate}%
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
        <ol className="list-decimal list-inside space-y-2">
          {recommendations.map((rec, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">{rec}</li>
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
        <ReportDetailView report={selectedReport} onBack={() => setSelectedReport(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">诊断报告</h1>
        {isHeadquarters && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            生成报告
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">报告范围</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value as ReportScope | 'all')}
            className="input-field w-36"
          >
            {scopeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">时间范围</label>
          <input type="date" className="input-field w-40" />
          <span className="text-gray-400">至</span>
          <input type="date" className="input-field w-40" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 h-44 animate-pulse bg-gray-50" />
          ))}
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
