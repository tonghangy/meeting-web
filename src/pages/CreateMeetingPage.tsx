import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Meeting, UserSummary } from '../api/types';

export default function CreateMeetingPage() {
  const [searchParams] = useSearchParams();
  const meetingType = (searchParams.get('type') || 'INSTANT').toUpperCase();
  const isScheduled = meetingType === 'SCHEDULED';
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<UserSummary[]>([]);
  const [accessMode, setAccessMode] = useState('INVITE_ONLY');
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<UserSummary[]>('/users/candidates').then(setCandidates).catch(() => setCandidates([]));
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim() || undefined;
    const scheduledStartRaw = fd.get('scheduledStart') as string | null;
    const scheduledEndRaw = fd.get('scheduledEnd') as string | null;

    try {
      const body: Record<string, unknown> = {
        title,
        meetingType,
        accessMode,
        description,
        inviteeUserIds: accessMode === 'INVITE_ONLY' ? inviteeIds : [],
      };
      if (isScheduled && scheduledStartRaw) {
        body.scheduledStart = new Date(scheduledStartRaw).toISOString();
      }
      if (isScheduled && scheduledEndRaw) {
        body.scheduledEnd = new Date(scheduledEndRaw).toISOString();
      }

      const created = await apiFetch<Meeting>('/meetings', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      navigate(`/meeting/${created.id}/detail`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败');
    } finally {
      setLoading(false);
    }
  }

  function toggleInvitee(id: string) {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2>{isScheduled ? '预定会议' : '快速会议'}</h2>
      <p className="user-banner">本次创建的会议<strong>主持人将是你</strong>。</p>
      {error && <p className="hint" style={{ color: '#dc2626' }}>{error}</p>}

      <form onSubmit={onSubmit}>
        <label>会议标题</label>
        <input name="title" required maxLength={128} placeholder="例如：产品评审会" />

        {isScheduled && (
          <>
            <label>开始时间</label>
            <input name="scheduledStart" type="datetime-local" required />
            <label>结束时间（可选）</label>
            <input name="scheduledEnd" type="datetime-local" />
          </>
        )}

        <label>说明（可选）</label>
        <input name="description" maxLength={512} />

        <label>谁能参会</label>
        <select value={accessMode} onChange={(e) => setAccessMode(e.target.value)}>
          <option value="INVITE_ONLY">指定参会人（推荐）</option>
          <option value="ALL_USERS">所有登录用户</option>
        </select>

        {accessMode === 'INVITE_ONLY' && (
          <div id="inviteeBlock">
            <label>选择参会人</label>
            <div className="checkbox-list">
              {candidates.map((u) => (
                <label key={u.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={inviteeIds.includes(u.id)}
                    onChange={() => toggleInvitee(u.id)}
                  />
                  <span>{u.displayName} ({u.username})</span>
                </label>
              ))}
            </div>
            {candidates.length === 0 && (
              <p className="hint">暂无其他用户，请管理员先创建账号。</p>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '创建中…' : '创建'}
          </button>
          <Link className="btn btn-secondary" to="/rooms" style={{ marginLeft: 8 }}>返回</Link>
        </div>
      </form>
    </div>
  );
}
