import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, User, Lock, Eye, EyeOff } from 'lucide-react'
import { login } from '@/api'
import useAuthStore from '@/store/useAuthStore'

const roleMap: Record<string, 'headquarters' | 'branch' | 'subbranch'> = {
  head: 'headquarters',
  city: 'branch',
  branch: 'subbranch',
}

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const authLogin = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await login(username, password)
      if (res.success && res.user) {
        const mappedRole = roleMap[res.user.role] || 'subbranch'
        authLogin(
          {
            id: res.user.id,
            username: res.user.username,
            name: res.user.name,
            role: mappedRole,
            cityId: res.user.role === 'city' ? res.user.scopeId : undefined,
            branchId: res.user.role === 'branch' ? res.user.scopeId : undefined,
          },
          'mock-token',
        )
        navigate('/dashboard', { replace: true })
      } else {
        setError(res.message || '登录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden" style={{ backgroundColor: '#0B2A5A' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 400,
            height: 400,
            top: -100,
            right: -80,
            background: 'radial-gradient(circle, #C9A962 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute rounded-full opacity-10"
          style={{
            width: 300,
            height: 300,
            bottom: -60,
            left: -60,
            background: 'radial-gradient(circle, #C9A962 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute opacity-10"
          style={{
            width: 120,
            height: 120,
            top: '18%',
            left: '12%',
            background: '#C9A962',
            transform: 'rotate(45deg)',
            borderRadius: 8,
          }}
        />
        <div
          className="absolute opacity-10"
          style={{
            width: 80,
            height: 80,
            bottom: '22%',
            right: '15%',
            background: '#C9A962',
            transform: 'rotate(45deg)',
            borderRadius: 6,
          }}
        />
        <div
          className="absolute rounded-full opacity-5"
          style={{
            width: 200,
            height: 200,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, #C9A962 0%, transparent 70%)',
          }}
        />
      </div>

      <div
        className="relative z-10 w-[400px] bg-white rounded-xl shadow-2xl p-8 animate-slide-up"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ backgroundColor: '#0B2A5A' }}>
            <Landmark className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 tracking-wide">
            银行网点运营分析平台
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-500">记住我</span>
          </label>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white font-medium rounded-lg transition-all duration-200 hover:brightness-110 active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#0B2A5A' }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          测试账号：admin / branch / sub
        </p>
      </div>
    </div>
  )
}
