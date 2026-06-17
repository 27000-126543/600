import { useState } from 'react';
import { Check, X, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WarningApproval } from '@/api/mock';

interface ApprovalFlowProps {
  currentLevel: number;
  status: string;
  approvals: WarningApproval[];
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
}

const levelLabels = ['', '支行行长', '分行管理员', '总行管理员'];

type NodeStatus = 'approved' | 'rejected' | 'pending_active' | 'pending_idle';

export default function ApprovalFlow({ currentLevel, status, approvals, onApprove, onReject }: ApprovalFlowProps) {
  const [comment, setComment] = useState('');

  const getRejectLevel = (): number | null => {
    const rej = approvals.find(a => a.action === 'reject');
    return rej ? rej.level : null;
  };

  const getApprovalStatus = (level: number): NodeStatus => {
    const record = approvals.find(a => a.level === level);
    const rejectLevel = getRejectLevel();

    if (record) {
      return record.action === 'reject' ? 'rejected' : 'approved';
    }

    if (rejectLevel !== null) {
      return 'pending_idle';
    }

    if (status === 'approved' || status === 'completed') {
      return 'approved';
    }

    if (status === 'pending' && level === currentLevel) {
      return 'pending_active';
    }

    return 'pending_idle';
  };

  const getConnectorColor = (level: number) => {
    const s = getApprovalStatus(level);
    if (s === 'approved') return 'bg-green-500';
    if (s === 'rejected') return 'bg-red-400';
    return 'bg-gray-200';
  };

  const canApproveCurrentLevel = () => {
    if (status !== 'pending') return false;
    if (currentLevel > 3) return false;
    if (getRejectLevel() !== null) return false;
    const hasRecord = approvals.some(a => a.level === currentLevel);
    return !hasRecord;
  };

  const handleApprove = () => {
    onApprove?.(comment);
    setComment('');
  };

  const handleReject = () => {
    onReject?.(comment);
    setComment('');
  };

  return (
    <div className="space-y-0">
      {[1, 2, 3].map((level, index) => {
        const nodeStatus = getApprovalStatus(level);
        const record = approvals.find(a => a.level === level);

        const circleClass = cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
          nodeStatus === 'approved' && 'border-green-500 bg-green-500 text-white',
          nodeStatus === 'rejected' && 'border-red-500 bg-red-500 text-white',
          nodeStatus === 'pending_active' && 'border-primary-500 bg-primary-50 text-primary-600',
          nodeStatus === 'pending_idle' && 'border-gray-300 bg-gray-50 text-gray-400',
        );

        return (
          <div key={level} className="flex">
            <div className="flex flex-col items-center">
              <div className={circleClass}>
                {nodeStatus === 'approved' ? <Check className="h-5 w-5" /> :
                 nodeStatus === 'rejected' ? <X className="h-5 w-5" /> : level}
              </div>
              {index < 2 && (
                <div className={cn('h-12 w-0.5', getConnectorColor(level))} />
              )}
            </div>
            <div className="ml-4 flex-1 pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-sm font-medium',
                  nodeStatus === 'pending_active' ? 'text-primary-600' : 'text-gray-700',
                )}>
                  {levelLabels[level]}
                </span>
                {nodeStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <ThumbsUp className="h-3 w-3" />已通过
                  </span>
                )}
                {nodeStatus === 'rejected' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    <ThumbsDown className="h-3 w-3" />已驳回
                  </span>
                )}
                {nodeStatus === 'pending_active' && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-600">待审批</span>
                )}
                {nodeStatus === 'pending_idle' && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">待审批</span>
                )}
              </div>
              {record && (
                <div className="mt-1.5 flex flex-col gap-1 text-xs text-gray-500">
                  <span>审批人：{record.approver}</span>
                  <span className="inline-flex items-center gap-1.5">
                    处理结果：
                    {record.action === 'approve' ? (
                      <span className="inline-flex items-center gap-0.5 text-green-600 font-medium">
                        <ThumbsUp className="h-3 w-3" />通过
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-red-600 font-medium">
                        <ThumbsDown className="h-3 w-3" />驳回
                      </span>
                    )}
                  </span>
                  {record.comment && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      <span className={cn(
                        record.action === 'reject' ? 'text-red-600 font-medium' : 'text-gray-600',
                      )}>
                        {record.comment}
                      </span>
                    </span>
                  )}
                  <span>{new Date(record.approvedAt).toLocaleString('zh-CN')}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {canApproveCurrentLevel() && (
        <div className="mt-2 border-t border-gray-100 pt-4">
          <textarea
            className="input-field mb-3 min-h-[80px] resize-none text-sm"
            placeholder="请输入审批意见..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-3">
            <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={handleApprove}>
              <Check className="h-4 w-4" />
              通过
            </button>
            <button className="btn-danger flex items-center gap-1.5 text-sm" onClick={handleReject}>
              <X className="h-4 w-4" />
              驳回
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
