import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Meeting } from '../api/types';

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const scope = searchParams.get('scope') || 'mine';
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [draftScope, setDraftScope] = useState(scope);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMeetings = useCallback(async (kw: string, sc: string) => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (kw) q.set('keyword', kw);
      if (sc) q.set('scope', sc);
      setMeetings(await apiFetch<Meeting[]>(`/meetings?${q.toString()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setDraftKeyword(keyword);
    setDraftScope(scope);
    loadMeetings(keyword, scope);
  }, [keyword, scope, loadMeetings]);

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const kw = draftKeyword.trim();
    const sc = draftScope || 'mine';
    if (kw === keyword && sc === scope) {
      loadMeetings(kw, sc);
    } else {
      setSearchParams({ keyword: kw, scope: sc });
    }
  }

  async function joinByRoom(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await apiFetch<{ redirect: string; message: string }>('/meetings/join', {
        method: 'POST',
        body: JSON.stringify({ roomName: roomName.trim() }),
      });
      if (res.message) setMessage(res.message);
      navigate(res.redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入失败');
    }
  }

  return (
    <>
      {message && <p className="hint" style={{ color: '#15803d' }}>{message}</p>}
      {error && <p className="hint" style={{ color: '#dc2626' }}>{error}</p>}

      <div className="card">
        <h3>输入会议号加入</h3>
        <form className="inline-form" onSubmit={joinByRoom}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="room-xxxxxxxxxxxx"
            required
            style={{ maxWidth: 280 }}
          />
          <button className="btn" type="submit">加入</button>
        </form>
      </div>

      <div className="card">
        <h3>我的会议</h3>
        <form className="search-form" onSubmit={onSearch}>
          <input
            name="keyword"
            value={draftKeyword}
            onChange={(e) => setDraftKeyword(e.target.value)}
            placeholder="标题 / 会议号 / 主持人"
            style={{ maxWidth: 240 }}
          />
          <select
            name="scope"
            value={draftScope}
            onChange={(e) => setDraftScope(e.target.value)}
          >
            <option value="mine">与我相关</option>
            <option value="hosted">我主持的</option>
            <option value="invited">我受邀的</option>
            <option value="open">公开会议</option>
            <option value="all">全部（管理员）</option>
          </select>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '查询中…' : '查询'}
          </button>
          <Link className="btn btn-secondary" to="/rooms" onClick={() => {
            setDraftKeyword('');
            setDraftScope('mine');
          }}>重置</Link>
        </form>

        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>类型</th>
              <th>访问</th>
              <th>主持人</th>
              <th>身份</th>
              <th>会议号</th>
              <th>开始</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((m) => (
              <tr key={m.id}>
                <td>{m.title}</td>
                <td>{m.meetingType === 'INSTANT' ? '快速' : '预定'}</td>
                <td>{m.accessMode === 'ALL_USERS' ? '公开' : '指定参会人'}</td>
                <td>{m.hostUserName}</td>
                <td>{m.myRoleLabel}</td>
                <td><code>{m.roomName}</code></td>
                <td>{m.scheduledStartDisplay}</td>
                <td>{m.statusDisplay}</td>
                <td className="actions-cell">
                  <Link className="btn btn-secondary btn-sm" to={`/meeting/${m.id}/detail`}>详情</Link>
                  {m.host && <Link className="btn btn-secondary btn-sm" to={`/meeting/${m.id}/edit`}>编辑</Link>}
                  {m.canJoinNow && (
                    <Link className="btn btn-sm" to={`/meeting/${m.id}`}>进入</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
