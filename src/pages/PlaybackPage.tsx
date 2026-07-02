import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, authDownloadUrl } from '../api/client';
import { API_BASE } from '../api/types';
import type { RecordingItem } from '../api/types';

export default function PlaybackPage() {
  const [items, setItems] = useState<RecordingItem[]>([]);
  const [videoError, setVideoError] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch<{ items: RecordingItem[] }>('/recordings/mine').then((r) => setItems(r.items || []));
  }, []);

  return (
    <>
      <p className="hint">
        手机播放请用 Safari / Chrome。F12 网络面板请选「全部」或「Media」，视频请求不在 XHR 里。
      </p>
      {items.map((r) => {
        const streamUrl = authDownloadUrl(r.playUrl || `/recordings/${r.recordingId}/stream`);
        return (
          <div key={r.recordingId} className="card playback-item">
            <h3>{r.title}</h3>
            <p className="hint">房间：{r.roomName} · 时长：{r.durationSec ?? 0} 秒</p>
            <video
              className="playback-video"
              controls
              playsInline
              preload="auto"
              src={streamUrl}
              onError={() => {
                setVideoError((prev) => ({
                  ...prev,
                  [r.recordingId]: `无法加载视频，请确认 API 可达（当前 ${API_BASE}）且已登录`,
                }));
              }}
            />
            {videoError[r.recordingId] && (
              <p className="hint" style={{ color: '#dc2626' }}>{videoError[r.recordingId]}</p>
            )}
          </div>
        );
      })}
      {items.length === 0 && (
        <div className="card">
          <p className="hint">暂无回放。完成 Jibri 录制后刷新本页。</p>
          <Link className="btn btn-secondary" to="/rooms">返回会议</Link>
        </div>
      )}
    </>
  );
}
