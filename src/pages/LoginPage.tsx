import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/rooms" replace />;
  }

  const from = (location.state as { from?: string } | null)?.from || '/rooms';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card login-card">
        <h2>会议系统登录</h2>
        <p className="hint">演示账号：admin / admin123</p>
        <form onSubmit={onSubmit}>
          <label>用户名</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <label>密码</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
          {error && <p className="hint hint-danger">{error}</p>}
        </form>
      </div>
    </div>
  );
}
