import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const breadcrumbMap: Record<string, string> = {
  '/dashboard': '运营看板',
  '/warnings': '预警中心',
  '/schedule': '排班管理',
  '/reports': '诊断报告',
  '/monitor': '实时监控',
};

interface HeaderProps {
  onLogout?: () => void;
}

export default function Header({ onLogout }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, roleLabel, logout } = useAuth();

  const segments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((_, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    return { path, label: breadcrumbMap[path] || segments[index] };
  });

  const roleColorMap: Record<string, string> = {
    '总行': 'bg-primary-100 text-primary-700',
    '分行': 'bg-blue-100 text-blue-700',
    '支行': 'bg-green-100 text-green-700',
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0) || '?';

  return (
    <header className="fixed left-0 top-0 z-30 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-400">首页</span>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path} className="flex items-center gap-2">
            <span className="text-gray-300">/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-gray-800">{crumb.label}</span>
            ) : (
              <span
                className="cursor-pointer hover:text-primary-600"
                onClick={() => navigate(crumb.path)}
              >
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-warning-high" />
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">{user?.name}</span>
            <span
              className={cn(
                'mt-0.5 w-fit rounded px-1.5 py-0.5 text-[10px] font-medium',
                roleColorMap[roleLabel] || 'bg-gray-100 text-gray-600',
              )}
            >
              {roleLabel}
            </span>
          </div>
          <button
            className="ml-2 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-warning-high"
            onClick={handleLogout}
            title="退出登录"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
