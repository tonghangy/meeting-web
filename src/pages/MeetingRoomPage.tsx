import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { JitsiTokenResponse, MeetingRoomBootstrap } from '../api/types';
import ChatPanel from '../components/ChatPanel';
import ModeratorUnmutePanel from '../components/ModeratorUnmutePanel';
import Toast, { type ToastKind } from '../components/Toast';
import {
  createJitsiApi,
  invokeStopRecording,
  mapRecordingError,
  loadScript,
  parseRecordingStatus,
  resolveJitsiModerator,
  isModeratorRole,
  type JitsiApi,
  type JitsiRecordingMode,
} from '../lib/jitsi';

export default function MeetingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const meetRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<JitsiApi | null>(null);
  const localJitsiIdRef = useRef<string | null>(null);
  const leavingRef = useRef(false);
  const recordingActiveRef = useRef(false);
  const recordingModeRef = useRef<JitsiRecordingMode>('file');
  const [jitsiReady, setJitsiReady] = useState(false);
  const [jitsiApi, setJitsiApi] = useState<JitsiApi | null>(null);
  const [localJitsiId, setLocalJitsiId] = useState<string | null>(null);
  const [jitsiIsModerator, setJitsiIsModerator] = useState<boolean | null>(null);
  const [jitsiRealModerator, setJitsiRealModerator] = useState<boolean | null>(null);

  const [bootstrap, setBootstrap] = useState<MeetingRoomBootstrap | null>(null);
  const [status, setStatus] = useState('');
  const [chatOpen, setChatOpen] = useState(() => localStorage.getItem('meeting-chat-open') !== 'false');
  const [recordingActive, setRecordingActive] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const [error, setError] = useState('');

  function showToast(message: string, kind: ToastKind = 'success') {
    setToast({ message, kind });
  }

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
        enableClosePage: false,
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
        disableRemoteMute: false,
        participantsPane: {
          enabled: true,
          hideMuteAllButton: false,
        },
        remoteVideoMenu: {
          disabled: false,
        },
        defaultLanguage: 'zhCN',
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

      const api = createJitsiApi(bootstrap!.jitsiDomain, options);
      jitsiRef.current = api;
      setJitsiApi(api);
      api.addEventListener('videoConferenceJoined', (payload: unknown) => {
        const p = payload as { id?: string; role?: string };
        if (p.id) {
          localJitsiIdRef.current = p.id;
          setLocalJitsiId(p.id);
        }
        setJitsiIsModerator(resolveJitsiModerator(p.role, bootstrap!.isHost));
        setJitsiRealModerator(isModeratorRole(p.role));
        setJitsiReady(true);
        if (bootstrap!.isHost && !isModeratorRole(p.role)) {
          setStatus('已入会。此房间可能仍有未结束的录制进程，您当前不是 Jitsi 主持人，底部不会出现「停止录制」。请见下方说明。');
        } else {
          setStatus((prev) => prev || (
            bootstrap!.isHost
              ? '已入会。主持人可使用下方「请求开麦」，或在 Jitsi 工具栏中录制。'
              : '已入会。若主持人请求开麦，请在 Jitsi 弹窗中点「解除静音」。'
          ));
        }
        window.dispatchEvent(new Event('resize'));
      });
      api.addEventListener('participantRoleChanged', (payload: unknown) => {
        const p = payload as { id?: string; role?: string };
        if (p.id && p.id === localJitsiIdRef.current) {
          setJitsiRealModerator(isModeratorRole(p.role));
          setJitsiIsModerator(resolveJitsiModerator(p.role, bootstrap!.isHost));
        }
      });
      api.addEventListener('recordingStatusChanged', (payload: unknown) => {
        const { active, mode } = parseRecordingStatus(payload);
        recordingActiveRef.current = active;
        recordingModeRef.current = mode;
        setRecordingActive(active);
        const p = payload as { error?: string };
        if (p.error) {
          showToast(mapRecordingError(p.error), 'error');
        }
      });
      api.addEventListener('readyToClose', () => {
        if (leavingRef.current) return;
        leavingRef.current = true;
        api.dispose();
        jitsiRef.current = null;
        navigate('/rooms');
      });
    }

    start().catch((e) => setError(e instanceof Error ? e.message : 'Jitsi 初始化失败'));

    return () => {
      disposed = true;
      if (!leavingRef.current && jitsiRef.current) {
        try {
          invokeStopRecording(jitsiRef.current, recordingModeRef.current);
        } catch {
          // 页面卸载时尽量停止 orphan 录制
        }
      }
      if (!leavingRef.current) {
        jitsiRef.current?.dispose();
      }
      jitsiRef.current = null;
      setJitsiApi(null);
      setLocalJitsiId(null);
      setJitsiIsModerator(null);
      setJitsiRealModerator(null);
      localJitsiIdRef.current = null;
      setJitsiReady(false);
      recordingActiveRef.current = false;
      recordingModeRef.current = 'file';
      setRecordingActive(false);
    };
  }, [bootstrap, user, id, navigate]);

  useEffect(() => {
    localStorage.setItem('meeting-chat-open', chatOpen ? 'true' : 'false');
    window.dispatchEvent(new Event('resize'));
  }, [chatOpen]);

  function waitRecordingStopped(api: JitsiApi, timeoutMs: number): Promise<boolean> {
    if (!recordingActiveRef.current) return Promise.resolve(true);

    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        api.removeEventListener('recordingStatusChanged', onChange);
        window.clearTimeout(timer);
        resolve(ok);
      };
      const onChange = (payload: unknown) => {
        const { active } = parseRecordingStatus(payload);
        if (!active) finish(true);
      };
      api.addEventListener('recordingStatusChanged', onChange);
      const timer = window.setTimeout(() => finish(!recordingActiveRef.current), timeoutMs);
    });
  }

  async function stopFileRecording(api: JitsiApi): Promise<boolean> {
    try {
      invokeStopRecording(api, recordingModeRef.current);
      return waitRecordingStopped(api, 8000);
    } catch {
      return false;
    }
  }

  function stopRecordingNow() {
    const api = jitsiRef.current;
    if (!api) {
      showToast('会议尚未就绪', 'error');
      return;
    }
    if (jitsiRealModerator === false) {
      showToast(
        '此房间录制未正常结束，Jibri 仍占用房间，您不是 Jitsi 主持人，无法停止。请在服务器执行 recover-jibri-busy.sh 后刷新重进。',
        'error',
      );
      return;
    }

    showToast('正在停止录制…', 'success');
    void (async () => {
      try {
        invokeStopRecording(api, recordingModeRef.current);
        const stopped = await waitRecordingStopped(api, 8000);
        if (stopped) {
          showToast('录制已停止', 'success');
          return;
        }
        showToast(
          '未能确认录制已停止。请在 Jitsi 会议窗口工具栏点「停止录制」，或联系管理员在服务器执行 recover-jibri-busy.sh',
          'error',
        );
        try {
          api.executeCommand('toggleParticipantsPane');
        } catch {
          // 尽力打开 Jitsi 侧栏，便于用户找到原生停止按钮
        }
      } catch {
        showToast('停止录制失败，请使用 Jitsi 工具栏中的停止录制', 'error');
      }
    })();
  }

  async function leaveMeeting() {
    if (leavingRef.current) return;
    const api = jitsiRef.current;
    if (api && jitsiReady) {
      if (recordingActiveRef.current) {
        const ok = window.confirm('当前正在录制，离开将自动停止录制。确定离开吗？');
        if (!ok) return;
      }
      if (jitsiRealModerator !== false) {
        await stopFileRecording(api);
      }
      api.executeCommand('hangup');
      return;
    }
    leavingRef.current = true;
    navigate('/rooms');
  }

  async function deleteMeeting() {
    if (!id || !window.confirm('确定删除该会议？')) return;
    await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
    navigate('/rooms');
  }

  if (error) {
    return (
      <div className="container">
        <p className="hint hint-danger">{error}</p>
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
        <h2 className="toolbar-title">{bootstrap.title}</h2>
        <span className="hint">会议号：{bootstrap.roomName}</span>
        <span className="hint">{bootstrap.isHost ? '你是主持人' : '你是参会者'}</span>
        <Link className="btn btn-secondary" to={`/meeting/${id}/detail`}>会议详情</Link>
        {bootstrap.canEdit && <Link className="btn btn-secondary" to={`/meeting/${id}/edit`}>编辑</Link>}
        {bootstrap.canDelete && (
          <button type="button" className="btn btn-danger" onClick={deleteMeeting}>删除</button>
        )}
        {bootstrap.isHost && jitsiReady && jitsiRealModerator !== false && (
          <button type="button" className="btn btn-danger" onClick={stopRecordingNow}>
            {recordingActive ? '停止录制' : '尝试停止录制'}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={() => void leaveMeeting()}>离开</button>
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
          {chatOpen ? '▶' : '◀'}
        </button>
        {chatOpen && id && <ChatPanel meetingId={id} />}
      </div>

      {bootstrap.isHost && jitsiReady && jitsiRealModerator === false && (
        <div className="card recording-blocked-panel">
          <h3 className="recording-blocked-title">此会议无法显示「停止录制」</h3>
          <p className="hint hint-danger">
            别的会议能显示，是因为进的是<strong>空房间</strong>，你是第一个参会者，Jitsi 会给你主持人权限。
          </p>
          <p className="hint hint-danger">
            这场会议<strong>上次开始录制后没有停止就离开了</strong>，录制机器人（Jibri）仍占着房间。
            你再次进入时已是第二个参会者，Jitsi 不再认你为主持人，所以底部工具栏不会出现「停止录制」，点我们的按钮也停不掉。
          </p>
          <p className="hint">
            请在 Jitsi 服务器上执行（SSH 登录后）：
          </p>
          <pre className="recording-blocked-cmd">sudo bash recover-jibri-busy.sh</pre>
          <p className="hint">执行完成后<strong>刷新本页</strong>，确保你是第一个进空房间的人，再开始/停止录制。</p>
          <p className="hint">
            长期建议：在 meeting-server 的 application.yml 开启 <code>jitsi.jwt-enabled: true</code>（需 Jitsi 配好 JWT），
            这样应用主持人进任何房间都有 Jitsi 主持权限，不受进会顺序影响。
          </p>
        </div>
      )}

      {bootstrap.isHost && jitsiReady && jitsiRealModerator !== false && recordingActive && (
        <div className="card recording-active-panel">
          <p className="hint hint-danger recording-active-text">
            正在录制。请点上方「停止录制」，或 Jitsi 底部工具栏的录制按钮，离开前务必停止。
          </p>
          <button type="button" className="btn btn-danger" onClick={stopRecordingNow}>停止录制</button>
        </div>
      )}

      {bootstrap.isHost && jitsiReady && user && id && (
        <ModeratorUnmutePanel
          api={jitsiApi}
          localParticipantId={localJitsiId}
          isJitsiModerator={jitsiIsModerator}
          isAppHost
        />
      )}

      {status && <p className="hint">{status}</p>}
      {toast && (
        <Toast message={toast.message} kind={toast.kind} onClose={() => setToast(null)} />
      )}
      <p className="hint">
        入会前请信任 {bootstrap.jitsiDomain} 的自签证书。文字与文件请用右侧「会议交流」。
      </p>
    </div>
  );
}
