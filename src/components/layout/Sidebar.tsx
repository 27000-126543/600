import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  CalendarClock,
  FileBarChart,
  Activity,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  warningCount?: number;
  onToggle?: () => void;
}

const menuItems = [
  { path: '/dashboard', label: '运营看板', icon: LayoutDashboard, roles: ['headquarters', 'branch', 'subbranch'] },
  { path: '/warnings', label: '预警中心', icon: AlertTriangle, roles: ['headquarters', 'branch', 'subbranch'], badge: true },
  { path: '/schedule', label: '排班管理', icon: CalendarClock, roles: ['headquarters', 'branch', 'subbranch'] },
  { path: '/reports', label: '诊断报告', icon: FileBarChart, roles: ['headquarters', 'branch', 'subbranch'] },
  { path: '/monitor', label: '实时监控', icon: Activity, roles: ['headquarters', 'branch'] },
];

export default function Sidebar({ collapsed, warningCount = 0, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const visibleItems = menuItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-primary-600 text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-primary-500/30 px-4', collapsed ? 'justify-center' : 'gap-3')}>
        <Landmark className="h-8 w-8 shrink-0 text-gold-500" />
        {!collapsed && (
          <span className="whitespace-nowrap text-lg font-semibold tracking-wide">
            银行运营分析平台
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'sidebar-item relative',
                    isActive && 'active',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {item.badge && warningCount > 0 && (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full bg-warning-high px-1.5 text-xs font-bold text-white',
                        collapsed ? 'absolute -right-1 -top-1 h-4 min-w-4 text-[10px]' : 'ml-auto',
                      )}
                    >
                      {warningCount > 99 ? '99+' : warningCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn('border-t border-primary-500/30 p-2', collapsed ? 'flex justify-center' : '')}>
        <button
          className="sidebar-item w-full justify-center"
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!collapsed && <span>收起菜单</span>}
        </button>
      </div>
    </aside>
  );
}
