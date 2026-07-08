import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { UserSummary } from '../api/types';
import Toast, { type ToastKind } from '../components/Toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    setToast({ message, kind });
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  async function load() {
    setUsers(await apiFetch<UserSummary[]>('/admin/users'));
  }

  useEffect(() => {
    load().catch((e) => showToast(e instanceof Error ? e.message : '加载失败', 'error'));
  }, [showToast]);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    closeToast();
    const fd = new FormData(form);
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: String(fd.get('username') || '').trim(),
          displayName: String(fd.get('displayName') || '').trim(),
          password: String(fd.get('password') || ''),
        }),
      });
      form.reset();
      showToast('用户创建成功', 'success');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '创建失败', 'error');
    }
  }

  return (
    <>
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={closeToast} />
      )}

      <h2>用户管理</h2>

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
