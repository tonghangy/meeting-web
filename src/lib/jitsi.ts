export interface JitsiParticipantInfo {
  participantId: string;
  displayName: string;
  formattedDisplayName?: string;
}

export interface JitsiRoleChangedEvent {
  id: string;
  role: string;
}

export interface JitsiConferenceJoinedEvent {
  id?: string;
  roomName?: string;
  displayName?: string;
}

export type JitsiRecordingMode = 'file' | 'local' | 'stream';

export interface JitsiRecordingStatusEvent {
  on?: boolean;
  status?: string;
  mode?: string;
  error?: string;
  transcription?: boolean;
}

export interface JitsiApi {
  addEventListener(event: string, listener: (...args: unknown[]) => void): void;
  removeEventListener(event: string, listener: (...args: unknown[]) => void): void;
  dispose(): void;
  executeCommand(command: string, ...args: unknown[]): void;
  getParticipantsInfo(): JitsiParticipantInfo[] | Promise<JitsiParticipantInfo[]>;
  isModerationOn?(mediaType: 'audio' | 'video'): Promise<boolean>;
  isAVModerationSupported?(): Promise<boolean>;
  stopRecording?(mode: JitsiRecordingMode, transcription?: boolean): void;
}

export function parseRecordingStatus(payload: unknown): { active: boolean; mode: JitsiRecordingMode } {
  const p = payload as JitsiRecordingStatusEvent;
  const active = p.on === true || p.status === 'on';
  const mode = p.mode === 'local' || p.mode === 'stream' ? p.mode : 'file';
  return { active, mode };
}

/** Jitsi iframe 的 role 字段不可靠；仅用于开麦等可宽松判断的场景。 */
export function resolveJitsiModerator(role: string | undefined, isAppHost: boolean): boolean {
  if (isModeratorRole(role)) return true;
  if (isAppHost) return true;
  return false;
}

/** 录制/工具栏等必须由 Jitsi 协议层认可的主持人权限。 */
export function isModeratorRole(role: string | undefined): boolean {
  return role === 'moderator' || role === 'owner';
}

export function mapRecordingError(error: string | undefined): string {
  switch (error) {
    case 'resource-constraint':
      return '所有录制设备忙碌或不可用（Jibri 可能卡在 BUSY）。请在服务器执行 recover-jibri-busy.sh，并配置录播超时。';
    case 'unexpected-request':
      return '录制请求被拒绝，请确认您是 Jitsi 主持人且 Jibri 服务正常。';
    case 'service-unavailable':
      return '录制服务未就绪，请检查 Jibri 是否在线（IDLE + HEALTHY）。';
    default:
      return error ? `录制异常：${error}` : '录制异常';
  }
}

export function invokeStopRecording(api: JitsiApi, mode: JitsiRecordingMode = 'file') {
  if (typeof api.stopRecording === 'function') {
    api.stopRecording(mode, false);
    return;
  }
  api.executeCommand('stopRecording', mode, false);
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

let inflight: Promise<void> | null = null;
let readySrc: string | null = null;

function isApiReady(): boolean {
  return typeof window.JitsiMeetExternalAPI === 'function';
}

function waitForApi(timeoutMs = 15000): Promise<void> {
  if (isApiReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (isApiReady()) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('JitsiMeetExternalAPI 未就绪（脚本可能未加载完成）'));
        return;
      }
      window.setTimeout(check, 50);
    };
    check();
  });
}

/** 动态加载 Jitsi external_api.js，并等待全局构造函数可用 */
export function loadScript(src: string): Promise<void> {
  if (readySrc === src && isApiReady()) {
    return Promise.resolve();
  }

  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    let script = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.src = src;
      script.async = true;
      await new Promise<void>((resolve, reject) => {
        script!.onload = () => resolve();
        script!.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script!);
      });
    }

    await waitForApi();
    script.setAttribute('data-jitsi-loaded', 'true');
    readySrc = src;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function createJitsiApi(domain: string, options: Record<string, unknown>): JitsiApi {
  const Api = window.JitsiMeetExternalAPI;
  if (typeof Api !== 'function') {
    throw new Error('JitsiMeetExternalAPI is not a constructor');
  }
  return new Api(domain, options);
}
