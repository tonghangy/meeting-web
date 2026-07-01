import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { MeetingDetail, UserSummary } from '../api/types';

export default function MeetingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [accessMode, setAccessMode] = useState('INVITE_ONLY');
  const [candidates, setCandidates] = useState<UserSummary[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  async function load(syncAccessMode = true) {
    if (!id) return;
    const data = await apiFetch<MeetingDetail>(`/meetings/${id}/detail`);
    if (!data.canEdit) {
      throw new Error('仅主持人或管理员可编辑此会议');
    }
    setDetail(data);
    if (syncAccessMode) {
      setAccessMode(data.meeting.accessMode);
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, [id]);

  useEffect(() => {
    if (accessMode !== 'INVITE_ONLY') return;
    apiFetch<UserSummary[]>('/users/candidates')
      .then(setCandidates)
      .catch(() => setCandidates([]));
  }, [accessMode]);

  async function onAccessModeChange(next: string) {
    setAccessMode(next);
    if (next === 'INVITE_ONLY') {
      await load(false);
    }
  }

  async function addInvitee(userId: string) {
    if (!id || addingUserId) return;
    setAddingUserId(userId);
    setError('');
    try {
      await apiFetch(`/meetings/${id}/invitees`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      setMessage('已添加参会人');
      await load(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setAddingUserId(null);
    }
  }

  async function removeInvitee(userId: string) {
    if (!id) return;
    await apiFetch(`/meetings/${id}/invitees/${userId}`, { method: 'DELETE' });
    setMessage('已移除参会人');
    await load(false);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const scheduledStart = fd.get('scheduledStart') as string;
    const scheduledEnd = fd.get('scheduledEnd') as string;

    try {
      await apiFetch(`/meetings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: String(fd.get('title') || '').trim(),
          description: String(fd.get('description') || '').trim() || null,
          accessMode: String(fd.get('accessMode') || ''),
          scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
        }),
      });
      navigate(`/meeting/${id}/detail`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (error && !detail) return (
    <div className="card">
      <p className="hint" style={{ color: '#dc2626' }}>{error}</p>
      <Link className="btn btn-secondary" to={id ? `/meeting/${id}/detail` : '/rooms'}>返回</Link>
    </div>
  );
  if (!detail) return <p className="hint">加载中…</p>;

  const meeting = detail.meeting;
  const invitedIds = new Set(detail.invitees.map((i) => i.userId));

  return (
    <div className="card form-card">
      <h2>编辑会议</h2>
      {message && <p className="hint" style={{ color: '#15803d' }}>{message}</p>}
      {error && <p className="hint" style={{ color: '#dc2626' }}>{error}</p>}

      <form onSubmit={onSubmit}>
        <label>标题</label>
        <input type="text" name="title" defaultValue={meeting.title} required />
        <label>说明</label>
        <textarea name="description" rows={3} defaultValue={meeting.description || ''} />
        <label>谁能参会</label>
        <select
          name="accessMode"
          value={accessMode}
          onChange={(e) => { onAccessModeChange(e.target.value).catch(() => undefined); }}
        >
          <option value="INVITE_ONLY">指定参会人</option>
          <option value="ALL_USERS">所有登录用户</option>
        </select>
        {meeting.meetingType === 'SCHEDULED' && (
          <>
            <label>开始时间</label>
            <input name="scheduledStart" type="datetime-local" />
            <label>结束时间</label>
            <input name="scheduledEnd" type="datetime-local" />
          </>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
          <Link className="btn btn-secondary" to={`/meeting/${id}/detail`} style={{ marginLeft: 8 }}>取消</Link>
        </div>
      </form>

      {accessMode === 'INVITE_ONLY' && (
        <div style={{ marginTop: 32 }}>
          <h3>参会人</h3>
          <p className="hint">以下为已选参会人（含此前指定、后改为「全部」时保留的名单）。</p>
          {detail.invitees.length === 0 ? (
            <p className="hint">暂无参会人，请从下方添加。</p>
          ) : (
            <table>
              <thead>
                <tr><th>用户</th><th>状态</th><th></th></tr>
              </thead>
              <tbody>
                {detail.invitees.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.userName}</td>
                    <td>{inv.status}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => removeInvitee(inv.userId)}
                      >
                        移除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h4 style={{ marginTop: 16 }}>添加参会人</h4>
          <div className="checkbox-list">
            {candidates
              .filter((u) => !invitedIds.has(u.id))
              .map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ margin: 4 }}
                  disabled={addingUserId !== null}
                  onClick={() => addInvitee(u.id)}
                >
                  + {u.displayName}
                </button>
              ))}
          </div>
          {candidates.filter((u) => !invitedIds.has(u.id)).length === 0 && (
            <p className="hint">没有可添加的用户。</p>
          )}
        </div>
      )}
    </div>
  );
}
