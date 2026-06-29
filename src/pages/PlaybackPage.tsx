import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, authStreamUrl } from '../api/client';
import type { RecordingItem } from '../api/types';

export default function PlaybackPage() {
  const [items, setItems] = useState<RecordingItem[]>([]);

  useEffect(() => {
    apiFetch<{ items: RecordingItem[] }>('/recordings/mine').then((r) => setItems(r.items || []));
  }, []);

  return (
    <>
      <p className="hint">手机播放请用 Safari / Chrome；微信内置浏览器可能无法播放自签 HTTPS 视频。</p>
      {items.map((r) => (
        <div key={r.recordingId} className="card playback-item">
          <h3>{r.title}</h3>
          <p className="hint">房间：{r.roomName} · 时长：{r.durationSec ?? 0} 秒</p>
          <video
            className="playback-video"
            controls
            playsInline
            preload="metadata"
            src={authStreamUrl(`/recordings/${r.recordingId}/stream`)}
          />
        </div>
      ))}
      {items.length === 0 && (
        <div className="card">
          <p className="hint">暂无回放。完成 Jibri 录制后刷新本页。</p>
          <Link className="btn btn-secondary" to="/rooms">返回会议</Link>
        </div>
      )}
    </>
  );
}
