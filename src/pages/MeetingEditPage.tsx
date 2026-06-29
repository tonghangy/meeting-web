import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Meeting } from '../api/types';

export default function MeetingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiFetch<Meeting>(`/meetings/${id}`)
      .then(setMeeting)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, [id]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
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
    }
  }

  if (!meeting && !error) return <p className="hint">加载中…</p>;
  if (!meeting) return <p className="hint" style={{ color: '#dc2626' }}>{error}</p>;

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h2>编辑会议</h2>
      {error && <p className="hint" style={{ color: '#dc2626' }}>{error}</p>}
      <form onSubmit={onSubmit}>
        <label>标题</label>
        <input name="title" defaultValue={meeting.title} required />
        <label>说明</label>
        <input name="description" defaultValue={meeting.description || ''} />
        <label>访问范围</label>
        <select name="accessMode" defaultValue={meeting.accessMode}>
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
        <button className="btn" type="submit">保存</button>
        <Link className="btn btn-secondary" to={`/meeting/${id}/detail`} style={{ marginLeft: 8 }}>取消</Link>
      </form>
    </div>
  );
}
