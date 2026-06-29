import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { MeetingDetail } from '../api/types';

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    if (!id) return;
    const data = await apiFetch<MeetingDetail>(`/meetings/${id}/detail`);
    setDetail(data);
  }

  useEffect(() => {
    load().catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, [id]);

  async function addInvitee(userId: string) {
    if (!id) return;
    await apiFetch(`/meetings/${id}/invitees`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    await load();
    setMessage('已添加参会人');
  }

  async function removeInvitee(userId: string) {
    if (!id) return;
    await apiFetch(`/meetings/${id}/invitees/${userId}`, { method: 'DELETE' });
    await load();
  }

  async function remind(userId: string) {
    if (!id) return;
    await apiFetch(`/meetings/${id}/invitees/${userId}/remind`, { method: 'POST' });
    setMessage('已记录提醒，请通知该用户入会');
    await load();
  }

  async function deleteMeeting() {
    if (!id || !window.confirm('确定删除该会议？')) return;
    await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
    navigate('/rooms');
  }

  if (error) return <p className="hint" style={{ color: '#dc2626' }}>{error}</p>;
  if (!detail) return <p className="hint">加载中…</p>;

  const m = detail.meeting;

  return (
    <div className="card">
      <h2>{m.title}</h2>
      {message && <p className="hint" style={{ color: '#15803d' }}>{message}</p>}

      <table className="info-table">
        <tbody>
          <tr><th>会议号</th><td><code>{m.roomName}</code></td></tr>
          <tr><th>主持人</th><td>{m.hostUserName}</td></tr>
          <tr><th>状态</th><td>{m.statusDisplay}</td></tr>
          <tr><th>开始</th><td>{m.scheduledStartDisplay}</td></tr>
          <tr><th>入会链接</th><td>
            <a href={detail.joinLink} target="_blank" rel="noreferrer">{detail.joinLink}</a>
            <p className="hint" style={{ marginTop: 8 }}>
              分享此链接给他人；需先登录本系统。也可在首页输入会议号 <code>{m.roomName}</code> 加入。
            </p>
          </td></tr>
        </tbody>
      </table>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {m.canJoinNow && <Link className="btn" to={`/meeting/${m.id}`}>进入会议</Link>}
        {detail.canEdit && <Link className="btn btn-secondary" to={`/meeting/${m.id}/edit`}>编辑</Link>}
        {detail.canDelete && (
          <button type="button" className="btn btn-danger" onClick={deleteMeeting}>删除</button>
        )}
        <Link className="btn btn-secondary" to="/rooms">返回列表</Link>
      </div>

      {detail.canManage && m.accessMode === 'INVITE_ONLY' && (
        <div style={{ marginTop: 24 }}>
          <h3>参会人</h3>
          <table>
            <thead>
              <tr><th>用户</th><th>状态</th><th>最近提醒</th><th></th></tr>
            </thead>
            <tbody>
              {detail.invitees.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.userName}</td>
                  <td>{inv.status}</td>
                  <td>{inv.lastRemindedDisplay || '-'}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => remind(inv.userId)}>提醒</button>
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => removeInvitee(inv.userId)}>移除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 style={{ marginTop: 16 }}>添加参会人</h4>
          <div className="checkbox-list">
            {detail.inviteCandidates.map((u) => (
              <button
                key={u.id}
                type="button"
                className="btn btn-sm btn-outline"
                style={{ margin: 4 }}
                onClick={() => addInvitee(u.id)}
              >
                + {u.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
