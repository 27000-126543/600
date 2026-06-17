import { useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
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

export default function ApprovalFlow({ currentLevel, status, approvals, onApprove, onReject }: ApprovalFlowProps) {
  const [comment, setComment] = useState('');

  const getApprovalStatus = (level: number) => {
    const record = approvals.find((a) => a.level === level);
    if (!record) return 'pending';
    if (status === 'approved' && level <= 3) return 'approved';
    if (status === 'rejected') return 'rejected';
    return 'pending';
  };

  const canApproveCurrentLevel = () => {
    if (status !== 'pending') return false;
    if (currentLevel > 3) return false;
    return approvals.findIndex(a => a.level === currentLevel) === -1;
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
        const approvalStatus = getApprovalStatus(level);
        const isCurrent = level === currentLevel && status === 'pending';
        const record = approvals.find((a) => a.level === level);

        return (
          <div key={level} className="flex">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
                  approvalStatus === 'approved' && 'border-green-500 bg-green-500 text-white',
                  approvalStatus === 'rejected' && 'border-red-500 bg-red-500 text-white',
                  approvalStatus === 'pending' && isCurrent && 'border-primary-500 bg-primary-50 text-primary-600',
                  approvalStatus === 'pending' && !isCurrent && 'border-gray-300 bg-gray-50 text-gray-400',
                )}
              >
                {approvalStatus === 'approved' ? <Check className="h-5 w-5" /> : approvalStatus === 'rejected' ? <X className="h-5 w-5" /> : level}
              </div>
              {index < 2 && (
                <div
                  className={cn(
                    'h-12 w-0.5',
                    approvalStatus === 'approved' ? 'bg-green-500' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
            <div className="ml-4 flex-1 pb-6">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', isCurrent ? 'text-primary-600' : 'text-gray-700')}>
                  {levelLabels[level]}
                </span>
                {approvalStatus === 'approved' && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">已通过</span>
                )}
                {approvalStatus === 'rejected' && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">已驳回</span>
                )}
                {approvalStatus === 'pending' && isCurrent && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-600">待审批</span>
                )}
                {approvalStatus === 'pending' && !isCurrent && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">待审批</span>
                )}
              </div>
              {record && (
                <div className="mt-1.5 flex flex-col gap-1 text-xs text-gray-500">
                  <span>审批人：{record.approver}</span>
                  {record.comment && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {record.comment}
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
