import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiFetch, authDownloadUrl } from '../api/client';
import type { ChatMessage } from '../api/types';

interface Props {
  meetingId: string;
}

export default function ChatPanel({ meetingId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const knownIds = useRef(new Set<string>());
  const boxRef = useRef<HTMLDivElement>(null);

  function append(list: ChatMessage[]) {
    const next: ChatMessage[] = [];
    for (const m of list) {
      if (!m?.id || knownIds.current.has(m.id)) continue;
      knownIds.current.add(m.id);
      next.push(m);
    }
    if (next.length) {
      setMessages((prev) => [...prev, ...next]);
    }
  }

  useEffect(() => {
    let active = true;
    async function poll() {
      while (active) {
        try {
          const items = await apiFetch<ChatMessage[]>(`/meetings/${meetingId}/messages?limit=100`);
          append(items);
        } catch {
          /* ignore poll errors */
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
    poll();
    return () => {
      active = false;
    };
  }, [meetingId]);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    setSending(true);
    try {
      const form = new FormData();
      if (text.trim()) form.append('content', text.trim());
      if (file) form.append('file', file);
      const msg = await apiFetch<ChatMessage>(`/meetings/${meetingId}/messages`, {
        method: 'POST',
        body: form,
      });
      append([msg]);
      setText('');
      setFile(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '发送失败');
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="chat-panel card">
      <h3 className="chat-panel-title">会议交流</h3>
      <div ref={boxRef} className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className="chat-message">
            <div className="chat-meta">
              <strong>{m.userName}</strong>
              <span className="hint"> {formatTime(m.createdAt)}</span>
            </div>
            <div className="chat-content">
              {m.content}
              {m.file && (
                <div className="chat-file">
                  <a href={authDownloadUrl(m.file.downloadUrl)} target="_blank" rel="noreferrer">{m.file.originalName}</a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <textarea
          rows={2}
          maxLength={2000}
          placeholder="输入文字消息…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="chat-form-actions">
          <label className="btn btn-outline btn-sm chat-file-label">
            附件
            <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <span className="hint chat-file-name">{file?.name || ''}</span>
          <button type="submit" className="btn btn-sm" disabled={sending}>发送</button>
        </div>
      </form>
    </aside>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
