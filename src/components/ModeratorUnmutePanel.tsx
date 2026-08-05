import { useEffect, useMemo, useState } from 'react';
import type { JitsiApi, JitsiParticipantInfo } from '../lib/jitsi';

interface ModeratorUnmutePanelProps {
  api: JitsiApi | null;
  localParticipantId: string | null;
  isJitsiModerator: boolean | null;
  isAppHost: boolean;
}

export default function ModeratorUnmutePanel({
  api,
  localParticipantId,
  isJitsiModerator,
  isAppHost,
}: ModeratorUnmutePanelProps) {
  const [participants, setParticipants] = useState<JitsiParticipantInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!api) {
      setParticipants([]);
      return;
    }

    let active = true;
    const refreshParticipants = () => {
      void Promise.resolve(api.getParticipantsInfo())
        .then((items) => {
          if (!active) return;
          setParticipants(items.filter((item) => item.participantId !== localParticipantId));
        })
        .catch(() => {
          if (active) setParticipants([]);
        });
    };

    refreshParticipants();
    api.addEventListener('participantJoined', refreshParticipants);
    api.addEventListener('participantLeft', refreshParticipants);

    return () => {
      active = false;
      api.removeEventListener('participantJoined', refreshParticipants);
      api.removeEventListener('participantLeft', refreshParticipants);
    };
  }, [api, localParticipantId]);

  const participantIds = useMemo(
    () => new Set(participants.map((participant) => participant.participantId)),
    [participants],
  );
  const selectedCount = [...selectedIds].filter((id) => participantIds.has(id)).length;
  const allSelected = participants.length > 0 && selectedCount === participants.length;
  const canAskToUnmute = Boolean(api && isAppHost && isJitsiModerator !== false);

  function toggleParticipant(participantId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(participantId)) {
        next.delete(participantId);
      } else {
        next.add(participantId);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(participants.map((item) => item.participantId)));
  }

  function askToUnmute(participantIdsToAsk: string[]) {
    if (!api || !canAskToUnmute) return;
    for (const participantId of participantIdsToAsk) {
      api.executeCommand('askToUnmute', participantId);
    }
  }

  return (
    <section className="card moderator-unmute-panel" aria-labelledby="moderator-unmute-title">
      <h3 id="moderator-unmute-title" className="moderator-unmute-title">主持人开麦管理</h3>
      <p className="hint">
        “请求开麦”会向参会者发送解除静音提示，由参会者本人确认后生效。
      </p>

      {isJitsiModerator === false && (
        <p className="hint hint-danger">当前没有 Jitsi 主持人权限，暂时无法请求参会者开麦。</p>
      )}

      {participants.length === 0 ? (
        <p className="hint">暂无其他参会者。</p>
      ) : (
        <>
          <div className="moderator-unmute-toolbar">
            <label className="moderator-unmute-select-all">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              全选
            </label>
            <button
              type="button"
              className="btn btn-sm"
              disabled={!canAskToUnmute || selectedCount === 0}
              onClick={() => askToUnmute([...selectedIds].filter((id) => participantIds.has(id)))}
            >
              请求选中人员开麦（{selectedCount}）
            </button>
          </div>

          <ul className="moderator-unmute-list">
            {participants.map((participant) => (
              <li key={participant.participantId} className="moderator-unmute-item">
                <label className="moderator-unmute-check">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(participant.participantId)}
                    onChange={() => toggleParticipant(participant.participantId)}
                  />
                </label>
                <span className="moderator-unmute-name">
                  {participant.formattedDisplayName || participant.displayName || '参会者'}
                </span>
                <div className="moderator-unmute-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    disabled={!canAskToUnmute}
                    onClick={() => askToUnmute([participant.participantId])}
                  >
                    请求开麦
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
