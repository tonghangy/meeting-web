import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { UserSummary } from '../api/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setUsers(await apiFetch<UserSummary[]>('/admin/users'));
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');
    const fd = new FormData(e.currentTarget);
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: String(fd.get('username') || '').trim(),
          displayName: String(fd.get('displayName') || '').trim(),
          password: String(fd.get('password') || ''),
        }),
      });
      e.currentTarget.reset();
      setMessage('用户创建成功');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    }
  }

  return (
    <>
      <h2>用户管理</h2>
      {message && <p className="hint hint-success">{message}</p>}
      {error && <p className="hint hint-danger">{error}</p>}

      <div className="card">
        <h3>创建用户</h3>
        <form onSubmit={onCreate}>
          <label>用户名</label>
          <input name="username" required />
          <label>显示名</label>
          <input name="displayName" required />
          <label>密码</label>
          <input name="password" type="password" required />
          <button className="btn" type="submit">创建</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>用户名</th><th>显示名</th><th>角色</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td>
                <td>{u.displayName}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
