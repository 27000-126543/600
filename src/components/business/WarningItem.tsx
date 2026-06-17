import { Clock, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

interface WarningItemProps {
  warning: {
    id: string;
    branchName: string;
    type: string;
    level: string;
    description: string;
    triggeredAt: number;
    status: string;
    currentLevel: number;
  };
  onClick?: (id: string) => void;
}

const levelColorMap: Record<string, string> = {
  high: 'bg-warning-high',
  medium: 'bg-warning-medium',
  low: 'bg-warning-low',
};

const levelLabelMap: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
};

const levelBadgeMap: Record<string, string> = {
  high: 'bg-red-100 text-warning-high',
  medium: 'bg-orange-100 text-warning-medium',
  low: 'bg-yellow-100 text-yellow-700',
};

const statusLabelMap: Record<string, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成',
};

const statusBadgeMap: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-success-500',
  rejected: 'bg-red-100 text-warning-high',
  completed: 'bg-blue-100 text-blue-600',
};

const approvalLevelLabels = ['', '支行', '分行', '总行'];

export default function WarningItem({ warning, onClick }: WarningItemProps) {
  return (
    <div
      className={cn(
        'card group relative flex cursor-pointer overflow-hidden p-0 transition-all hover:shadow-md',
      )}
      onClick={() => onClick?.(warning.id)}
    >
      <div className={cn('w-1.5 shrink-0', levelColorMap[warning.level] || 'bg-gray-300')} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{warning.branchName}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', levelBadgeMap[warning.level])}>
              {levelLabelMap[warning.level]}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500" />
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-600">{warning.type}</span>
          <span className="text-gray-300">|</span>
          <span>审批级别：{approvalLevelLabels[warning.currentLevel]}</span>
        </div>

        <p className="line-clamp-2 text-sm text-gray-600">{warning.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{dayjs(warning.triggeredAt).format('YYYY-MM-DD HH:mm')}</span>
          </div>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusBadgeMap[warning.status])}>
            {statusLabelMap[warning.status] || warning.status}
          </span>
        </div>
      </div>
    </div>
  );
}
