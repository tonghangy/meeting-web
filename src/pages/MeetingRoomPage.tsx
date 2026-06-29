import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { JitsiTokenResponse, MeetingRoomBootstrap } from '../api/types';
import ChatPanel from '../components/ChatPanel';
import { loadScript, type JitsiApi } from '../lib/jitsi';

export default function MeetingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const meetRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<JitsiApi | null>(null);

  const [bootstrap, setBootstrap] = useState<MeetingRoomBootstrap | null>(null);
  const [status, setStatus] = useState('');
  const [chatOpen, setChatOpen] = useState(() => localStorage.getItem('meeting-chat-open') !== 'false');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    apiFetch<MeetingRoomBootstrap>(`/meetings/${id}/room-bootstrap`)
      .then(setBootstrap)
      .catch((e) => setError(e instanceof Error ? e.message : '无法进入会议'));
  }, [id]);

  useEffect(() => {
    if (!bootstrap || !user || !meetRef.current) return;

    let disposed = false;

    async function start() {
      await loadScript(bootstrap!.externalApiScriptUrl);

      const configOverwrite: Record<string, unknown> = {
        prejoinConfig: {
          enabled: false,
          hideDisplayName: true,
        },
        requireDisplayName: false,
        disableDeepLinking: true,
        startWithAudioMuted: false,
        disableChat: true,
        disableLocalRecording: false,
        hiddenDomain: bootstrap!.recorderDomain,
        fileRecordingsEnabled: true,
        liveStreamingEnabled: false,
        recordingService: { enabled: true, hideStorageWarning: true },
        localRecording: {
          disable: false,
          notifyAllParticipants: false,
          disableSelfRecording: false,
        },
      };

      if (bootstrap!.jitsiJwtEnabled) {
        configOverwrite.disableGrantModerator = true;
      }

      const options: Record<string, unknown> = {
        roomName: bootstrap!.roomName,
        parentNode: meetRef.current,
        userInfo: { displayName: user!.displayName },
        configOverwrite,
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISABLE_VIDEO_BACKGROUND: false,
        },
      };

      if (bootstrap!.jitsiJwtEnabled && id) {
        const tokenRes = await apiFetch<JitsiTokenResponse>(`/meetings/${id}/jitsi-token`);
        if (tokenRes.jwt) {
          options.jwt = tokenRes.jwt;
          (options.configOverwrite as Record<string, unknown>).enableUserRolesBasedOnToken = true;
          setStatus(`JWT 已加载（moderator=${tokenRes.moderator}）`);
        }
      }

      if (disposed) return;

      const api = new window.JitsiMeetExternalAPI(bootstrap!.jitsiDomain, options);
      jitsiRef.current = api;
      api.addEventListener('videoConferenceJoined', () => {
        setStatus((prev) => prev || (
          bootstrap!.isHost
            ? '已入会。主持人请在 Jitsi … 菜单中使用「开始录制」。'
            : '已入会。'
        ));
        window.dispatchEvent(new Event('resize'));
      });
    }

    start().catch((e) => setError(e instanceof Error ? e.message : 'Jitsi 初始化失败'));

    return () => {
      disposed = true;
      jitsiRef.current?.dispose();
      jitsiRef.current = null;
    };
  }, [bootstrap, user, id]);

  useEffect(() => {
    localStorage.setItem('meeting-chat-open', chatOpen ? 'true' : 'false');
    window.dispatchEvent(new Event('resize'));
  }, [chatOpen]);

  async function deleteMeeting() {
    if (!id || !window.confirm('确定删除该会议？')) return;
    await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
    navigate('/rooms');
  }

  if (error) {
    return (
      <div className="container">
        <p className="hint" style={{ color: '#dc2626' }}>{error}</p>
        <Link className="btn btn-secondary" to="/rooms">返回</Link>
      </div>
    );
  }

  if (!bootstrap) {
    return <div className="container"><p className="hint">加载会议…</p></div>;
  }

  return (
    <div className="container container-wide meeting-page">
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>{bootstrap.title}</h2>
        <span className="hint">会议号：{bootstrap.roomName}</span>
        <span className="hint">{bootstrap.isHost ? '你是主持人' : '你是参会者'}</span>
        <Link className="btn btn-secondary" to={`/meeting/${id}/detail`}>会议详情</Link>
        {bootstrap.canEdit && <Link className="btn btn-secondary" to={`/meeting/${id}/edit`}>编辑</Link>}
        {bootstrap.canDelete && (
          <button type="button" className="btn btn-danger" onClick={deleteMeeting}>删除</button>
        )}
        <Link className="btn btn-secondary" to="/rooms">离开</Link>
      </div>

      <div className={`meeting-layout${chatOpen ? '' : ' chat-collapsed'}`}>
        <div className="meeting-main">
          <div id="meet" ref={meetRef} />
        </div>
        <button
          type="button"
          className="chat-collapse-btn"
          title={chatOpen ? '收起会议交流' : '展开会议交流'}
          onClick={() => setChatOpen((v) => !v)}
        >
          {chatOpen ? '◀' : '▶'}
        </button>
        {chatOpen && id && <ChatPanel meetingId={id} />}
      </div>

      {status && <p className="hint">{status}</p>}
      <p className="hint">
        入会前请信任 {bootstrap.jitsiDomain} 的自签证书。文字与文件请用右侧「会议交流」。
      </p>
    </div>
  );
}
