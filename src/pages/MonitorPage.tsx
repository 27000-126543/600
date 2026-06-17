import { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Activity, Database, Server, BarChart3, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { getMonitorStream } from '@/api';

interface StreamStatus {
  name: string;
  icon: React.ReactNode;
  online: boolean;
  dataCount: number;
  lastUpdate: string;
}

interface CleaningRecord {
  time: string;
  source: string;
  processed: number;
  exceptions: number;
  status: 'success' | 'partial' | 'failed';
}

interface CleaningRule {
  name: string;
  processed: number;
  exceptionRate: number;
}

interface CalculatingMetric {
  name: string;
  computing: boolean;
  value?: number;
  duration?: number;
}

const initialStreams: StreamStatus[] = [
  { name: '排队叫号数据流', icon: <Database className="h-5 w-5" />, online: true, dataCount: 0, lastUpdate: '' },
  { name: '柜员交易数据流', icon: <Server className="h-5 w-5" />, online: true, dataCount: 0, lastUpdate: '' },
  { name: '自助设备数据流', icon: <Activity className="h-5 w-5" />, online: true, dataCount: 0, lastUpdate: '' },
  { name: '客户评价数据流', icon: <BarChart3 className="h-5 w-5" />, online: true, dataCount: 0, lastUpdate: '' },
];

const cleaningRules: CleaningRule[] = [
  { name: '空值检测', processed: 12450, exceptionRate: 2.1 },
  { name: '格式校验', processed: 12450, exceptionRate: 1.8 },
  { name: '重复数据过滤', processed: 12450, exceptionRate: 0.5 },
  { name: '异常值剔除', processed: 12450, exceptionRate: 3.2 },
  { name: '时序对齐', processed: 12450, exceptionRate: 1.1 },
];

const cleaningRecords: CleaningRecord[] = [
  { time: '14:32:05', source: '排队叫号', processed: 156, exceptions: 3, status: 'success' },
  { time: '14:31:58', source: '柜员交易', processed: 203, exceptions: 5, status: 'success' },
  { time: '14:31:50', source: '自助设备', processed: 89, exceptions: 2, status: 'partial' },
  { time: '14:31:42', source: '客户评价', processed: 67, exceptions: 0, status: 'success' },
  { time: '14:31:35', source: '排队叫号', processed: 134, exceptions: 4, status: 'success' },
  { time: '14:31:28', source: '柜员交易', processed: 198, exceptions: 1, status: 'success' },
];

const metricsList: CalculatingMetric[] = [
  { name: '平均等候时长', computing: true, value: undefined, duration: undefined },
  { name: '客户满意度', computing: true, value: undefined, duration: undefined },
  { name: '业务办理效率', computing: false, value: 87.3, duration: 120 },
  { name: '窗口利用率', computing: false, value: 72.8, duration: 85 },
  { name: '投诉率', computing: true, value: undefined, duration: undefined },
  { name: '设备可用率', computing: false, value: 96.5, duration: 200 },
];

const completedResults = [
  { name: '平均等候时长', value: 12.4, unit: '分钟', duration: 150, completedAt: '14:32:01' },
  { name: '客户满意度', value: 4.2, unit: '分', duration: 230, completedAt: '14:31:55' },
  { name: '投诉率', value: 2.1, unit: '%', duration: 180, completedAt: '14:31:48' },
  { name: '网点效率评分', value: 85.7, unit: '分', duration: 310, completedAt: '14:31:40' },
];

function StreamCard({ stream }: { stream: StreamStatus }) {
  return (
    <div className="card p-4 flex flex-col gap-3 relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${stream.online ? 'bg-green-500' : 'bg-red-500'}`} />
        {stream.online && (
          <span className="absolute inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-ping top-0 right-0" />
        )}
      </div>
      <div className="flex items-center gap-2 text-primary-700">
        {stream.icon}
        <span className="text-sm font-medium text-gray-800">{stream.name}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        {stream.online ? (
          <><Wifi className="h-3.5 w-3.5 text-green-500" /><span className="text-green-600 font-medium">在线</span></>
        ) : (
          <><WifiOff className="h-3.5 w-3.5 text-red-500" /><span className="text-red-600 font-medium">离线</span></>
        )}
      </div>
      <div className="text-sm text-gray-500">今日数据量：<span className="font-semibold text-gray-800">{stream.dataCount.toLocaleString()}</span></div>
      <div className="text-xs text-gray-400">最后更新：{stream.lastUpdate}</div>
      {stream.online && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-pulse" />
      )}
    </div>
  );
}

const exceptionBarOption = {
  tooltip: { trigger: 'axis' as const },
  grid: { left: 80, right: 20, top: 10, bottom: 30 },
  xAxis: {
    type: 'value' as const,
    axisLine: { show: false },
    splitLine: { lineStyle: { color: '#f3f4f6' } },
    axisLabel: { color: '#6b7280' },
  },
  yAxis: {
    type: 'category' as const,
    data: ['空值', '格式错误', '重复数据', '异常值', '时序偏移'],
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#374151', fontSize: 11 },
  },
  series: [{
    type: 'bar' as const,
    data: [42, 36, 10, 64, 22],
    barWidth: 14,
    itemStyle: {
      color: {
        type: 'linear' as const,
        x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: '#f59e0b' },
          { offset: 1, color: '#f97316' },
        ],
      },
      borderRadius: [0, 4, 4, 0],
    },
  }],
};

function DataFlowAnimation() {
  return (
    <div className="card p-4 overflow-hidden">
      <div className="text-sm font-medium text-gray-600 mb-3">实时数据流</div>
      <div className="relative h-12">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0B2A5A" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#0B2A5A" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0B2A5A" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3].map(i => (
            <g key={i}>
              <line
                x1="0" y1={12 + i * 8} x2="100%" y2={12 + i * 8}
                stroke="url(#flowGrad)" strokeWidth="1.5"
              />
              <circle r="3" fill="#0B2A5A" opacity="0.7">
                <animateMotion
                  dur={`${2 + i * 0.5}s`}
                  repeatCount="indefinite"
                  path={`M0,${12 + i * 8} L${typeof window !== 'undefined' ? 1200 : 1200},${12 + i * 8}`}
                />
              </circle>
              <circle r="2" fill="#3b82f6" opacity="0.5">
                <animateMotion
                  dur={`${1.5 + i * 0.3}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                  path={`M0,${12 + i * 8} L${typeof window !== 'undefined' ? 1200 : 1200},${12 + i * 8}`}
                />
              </circle>
            </g>
          ))}
        </svg>
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
        <span>数据源</span>
        <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" />传输中</span>
        <span>指标引擎</span>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  const [streams, setStreams] = useState<StreamStatus[]>(initialStreams);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [computingMetrics, setComputingMetrics] = useState<CalculatingMetric[]>(metricsList);

  const refreshData = useCallback(async () => {
    const streamData = await getMonitorStream();
    setStreams(prev => prev.map(s => ({
      ...s,
      online: streamData.online,
      dataCount: s.dataCount + Math.floor(Math.random() * 50 + 10),
      lastUpdate: new Date(streamData.lastUpdate).toLocaleTimeString('zh-CN'),
    })));
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setComputingMetrics(prev => prev.map(m => {
        if (m.computing) {
          const shouldComplete = Math.random() > 0.6;
          if (shouldComplete) {
            return { ...m, computing: false, value: Math.round((50 + Math.random() * 50) * 10) / 10, duration: Math.floor(80 + Math.random() * 250) };
          }
          return m;
        }
        return { ...m, computing: true, value: undefined, duration: undefined };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">实时监控</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          数据更新时间：{lastRefresh.toLocaleTimeString('zh-CN')}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {streams.map((stream, i) => (
          <StreamCard key={i} stream={stream} />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 flex flex-col gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">数据清洗状态</h3>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">清洗规则</div>
              <div className="grid grid-cols-5 gap-3">
                {cleaningRules.map((rule, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-800">{rule.name}</div>
                    <div className="text-xs text-gray-500 mt-1">处理 {rule.processed.toLocaleString()} 条</div>
                    <div className={`text-xs font-medium mt-1 ${rule.exceptionRate > 3 ? 'text-red-500' : rule.exceptionRate > 1.5 ? 'text-amber-500' : 'text-green-500'}`}>
                      异常率 {rule.exceptionRate}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600 font-medium">时间</th>
                  <th className="text-left py-2 text-gray-600 font-medium">数据源</th>
                  <th className="text-right py-2 text-gray-600 font-medium">处理数</th>
                  <th className="text-right py-2 text-gray-600 font-medium">异常数</th>
                  <th className="text-center py-2 text-gray-600 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {cleaningRecords.map((rec, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">{rec.time}</td>
                    <td className="py-2 text-gray-800">{rec.source}</td>
                    <td className="py-2 text-right text-gray-600">{rec.processed}</td>
                    <td className="py-2 text-right text-gray-600">{rec.exceptions}</td>
                    <td className="py-2 text-center">
                      <span className={`status-badge ${rec.status === 'success' ? 'status-normal' : rec.status === 'partial' ? 'status-warning' : 'status-critical'}`}>
                        {rec.status === 'success' ? '完成' : rec.status === 'partial' ? '部分异常' : '失败'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-600 mb-2">异常数据统计</div>
              <ReactECharts option={exceptionBarOption} style={{ height: 200 }} />
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">指标计算引擎</h3>
            <div className="flex flex-col gap-3 mb-4">
              {computingMetrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-800">{metric.name}</span>
                  {metric.computing ? (
                    <span className="flex items-center gap-1.5 text-sm text-primary-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      计算中
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="font-semibold text-gray-800">{metric.value}</span>
                      {metric.duration && <span className="text-gray-400 text-xs">({metric.duration}ms)</span>}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">最近完成的计算结果</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-600 font-medium">指标</th>
                  <th className="text-right py-2 text-gray-600 font-medium">结果</th>
                  <th className="text-right py-2 text-gray-600 font-medium">耗时</th>
                </tr>
              </thead>
              <tbody>
                {completedResults.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 text-gray-800">{r.name}</td>
                    <td className="py-2 text-right font-medium text-gray-800">{r.value}{r.unit}</td>
                    <td className="py-2 text-right text-gray-500">{r.duration}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DataFlowAnimation />
    </div>
  );
}
