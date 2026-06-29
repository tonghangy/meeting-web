export interface JitsiApi {
  addEventListener(event: string, listener: () => void): void;
  dispose(): void;
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
