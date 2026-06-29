import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Meeting } from '../api/types';
import {
  type DatePreset,
  rangeForPreset,
  resolveDateRange,
} from '../lib/dateRange';

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') || '';
  const scope = searchParams.get('scope') || 'mine';
  const datePreset = (searchParams.get('datePreset') || 'month') as DatePreset;
  const { startFrom, startTo } = resolveDateRange(
    datePreset,
    searchParams.get('startFrom'),
    searchParams.get('startTo'),
  );

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [draftScope, setDraftScope] = useState(scope);
  const [draftDatePreset, setDraftDatePreset] = useState<DatePreset>(datePreset);
  const [draftStartFrom, setDraftStartFrom] = useState(startFrom);
  const [draftStartTo, setDraftStartTo] = useState(startTo);
  const [roomName, setRoomName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMeetings = useCallback(async (
    kw: string,
    sc: string,
    from: string,
    to: string,
  ) => {
    setLoading(true);
    setSearchError('');
    try {
      const q = new URLSearchParams();
      if (kw) q.set('keyword', kw);
      if (sc) q.set('scope', sc);
      q.set('startFrom', from);
      q.set('startTo', to);
      setMeetings(await apiFetch<Meeting[]>(`/meetings?${q.toString()}`));
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchParams.get('datePreset') && !searchParams.get('startFrom')) {
      const range = rangeForPreset('month');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('datePreset', 'month');
        next.set('startFrom', range.startFrom);
        next.set('startTo', range.startTo);
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setDraftKeyword(keyword);
    setDraftScope(scope);
    setDraftDatePreset(datePreset);
    setDraftStartFrom(startFrom);
    setDraftStartTo(startTo);
    loadMeetings(keyword, scope, startFrom, startTo);
  }, [keyword, scope, datePreset, startFrom, startTo, loadMeetings]);

  function onDatePresetChange(next: DatePreset) {
    setDraftDatePreset(next);
    setSearchError('');
    if (next !== 'custom') {
      const range = rangeForPreset(next);
      setDraftStartFrom(range.startFrom);
      setDraftStartTo(range.startTo);
    }
  }

  function onSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchError('');
    const kw = draftKeyword.trim();
    const sc = draftScope || 'mine';
    let from = draftStartFrom;
    let to = draftStartTo;

    if (draftDatePreset !== 'custom') {
      ({ startFrom: from, startTo: to } = rangeForPreset(draftDatePreset));
    } else if (!from || !to) {
      setSearchError('请选择开始和结束日期');
      return;
    } else if (from > to) {
      setSearchError('开始日期不能晚于结束日期');
      return;
    }

    const sameQuery = kw === keyword
      && sc === scope
      && draftDatePreset === datePreset
      && from === startFrom
      && to === startTo;

    if (sameQuery) {
      loadMeetings(kw, sc, from, to);
    } else {
      const params: Record<string, string> = {
        scope: sc,
        datePreset: draftDatePreset,
        startFrom: from,
        startTo: to,
      };
      if (kw) params.keyword = kw;
      setSearchParams(params);
    }
  }

  async function joinByRoom(e: FormEvent) {
    e.preventDefault();
    setJoinError('');
    setMessage('');
    try {
      const res = await apiFetch<{ redirect: string; message: string }>('/meetings/join', {
        method: 'POST',
        body: JSON.stringify({ roomName: roomName.trim() }),
      });
      if (res.message) setMessage(res.message);
      navigate(res.redirect);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : '加入失败');
    }
  }

  return (
    <>
      {message && <p className="hint" style={{ color: '#15803d' }}>{message}</p>}

      <div className="card">
        <h3>输入会议号加入</h3>
        {joinError && <p className="hint" style={{ color: '#dc2626' }}>{joinError}</p>}
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
            type="text"
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
          <select
            name="datePreset"
            value={draftDatePreset}
            onChange={(e) => onDatePresetChange(e.target.value as DatePreset)}
            title="按开始时间筛选"
          >
            <option value="week">近一周</option>
            <option value="month">近一个月</option>
            <option value="year">近一年</option>
            <option value="custom">自定义</option>
          </select>
          {draftDatePreset === 'custom' && (
            <>
              <input
                type="date"
                name="startFrom"
                value={draftStartFrom}
                onChange={(e) => { setDraftStartFrom(e.target.value); setSearchError(''); }}
                title="开始日期"
              />
              <span className="hint" style={{ margin: 0 }}>至</span>
              <input
                type="date"
                name="startTo"
                value={draftStartTo}
                onChange={(e) => { setDraftStartTo(e.target.value); setSearchError(''); }}
                title="结束日期"
              />
            </>
          )}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? '查询中…' : '查询'}
          </button>
          <Link className="btn btn-secondary" to="/rooms" onClick={() => {
            setDraftKeyword('');
            setDraftScope('mine');
            setDraftDatePreset('month');
            setSearchError('');
            const range = rangeForPreset('month');
            setDraftStartFrom(range.startFrom);
            setDraftStartTo(range.startTo);
          }}>重置</Link>
        </form>
        {searchError && (
          <p className="hint" style={{ color: '#dc2626', margin: '8px 0 0' }}>{searchError}</p>
        )}
        <p className="hint" style={{ marginTop: searchError ? 4 : 0 }}>
          开始时间：{startFrom} 至 {startTo}
        </p>

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
            {meetings.length === 0 && !loading && (
              <tr>
                <td colSpan={9} className="hint">当前条件下暂无会议</td>
              </tr>
            )}
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
                  {m.canEdit && (
                    <Link className="btn btn-secondary btn-sm" to={`/meeting/${m.id}/edit`}>编辑</Link>
                  )}
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
