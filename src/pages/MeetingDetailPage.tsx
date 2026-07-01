import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  Hash,
  Loader2,
  Radio,
  Send,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import type { Invitee, Meeting, MeetingDetail, UserSummary } from '../api/types';

type MessageTone = 'success' | 'danger' | 'info';

type MetadataItem = {
  label: string;
  value: string;
  icon: JSX.Element;
  href?: string;
};

function getStatusTone(statusText: string): MessageTone {
  if (/取消|删除|失败|结束/.test(statusText)) return 'danger';
  if (/进行|成功|可加入/.test(statusText)) return 'success';
  return 'info';
}

function InlineMessage({ tone, children }: { tone: MessageTone; children: React.ReactNode }) {
  const Icon = tone === 'danger' ? AlertCircle : tone === 'success' ? CheckCircle2 : Clock3;

  return (
    <p className={`inline-message inline-message-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" size={16} />
      {children}
    </p>
  );
}

function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge-${getStatusTone(value)}`}>{value}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Users aria-hidden="true" size={24} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

function PageState({ tone, title, description }: { tone: MessageTone; title: string; description: string }) {
  const Icon = tone === 'danger' ? ShieldAlert : Loader2;

  return (
    <section className={`state-panel state-panel-${tone}`} aria-live="polite">
      <Icon aria-hidden="true" size={28} className={tone === 'info' ? 'state-panel-spinner' : undefined} />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}

function MetadataGrid({ items }: { items: MetadataItem[] }) {
  return (
    <dl className="metadata-grid">
      {items.map((item) => (
        <div className="metadata-item" key={item.label}>
          <dt>
            {item.icon}
            {item.label}
          </dt>
          <dd>
            {item.href ? (
              <a href={item.href} target="_blank" rel="noreferrer">
                {item.value}
                <ExternalLink aria-hidden="true" size={14} />
              </a>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PanelHeader({ title, meta, id }: { title: string; meta?: string; id?: string }) {
  return (
    <div className="panel-header">
      <h3 id={id}>{title}</h3>
      {meta && <span>{meta}</span>}
    </div>
  );
}

function MeetingHero({ detail }: { detail: MeetingDetail }) {
  const meeting = detail.meeting;

  return (
    <section className="meeting-hero" aria-labelledby="meeting-title">
      <div className="meeting-hero-title">
        <span className="meeting-hero-icon" aria-hidden="true">
          <Video size={22} />
        </span>
        <div>
          <p className="eyebrow">会议工作台</p>
          <h1 id="meeting-title">{meeting.title}</h1>
          <div className="meeting-hero-meta">
            <span>
              <Hash aria-hidden="true" size={15} />
              <code>{meeting.roomName}</code>
            </span>
            <span>
              <Users aria-hidden="true" size={15} />
              {meeting.hostUserName}
            </span>
            <span>
              <CalendarClock aria-hidden="true" size={15} />
              {meeting.scheduledStartDisplay}
            </span>
          </div>
        </div>
      </div>
      <div className="meeting-hero-status">
        <StatusBadge value={meeting.statusDisplay} />
        <span>{meeting.canJoinNow ? '可直接入会' : '等待会议开放'}</span>
      </div>
    </section>
  );
}

function ActionPanel({
  meeting,
  detail,
  onDelete,
}: {
  meeting: Meeting;
  detail: MeetingDetail;
  onDelete: () => void;
}) {
  return (
    <section className="workbench-panel action-panel" aria-labelledby="meeting-actions-title">
      <PanelHeader id="meeting-actions-title" title="操作区" meta={meeting.canJoinNow ? 'JOIN READY' : 'STANDBY'} />
      <div className="action-stack">
        {meeting.canJoinNow && (
          <Link className="btn btn-large" to={`/meeting/${meeting.id}`}>
            <Radio aria-hidden="true" size={18} />
            进入会议
          </Link>
        )}
        {detail.canEdit && (
          <Link className="btn btn-secondary btn-large" to={`/meeting/${meeting.id}/edit`}>
            <Edit3 aria-hidden="true" size={18} />
            编辑会议
          </Link>
        )}
        {detail.canDelete && (
          <button type="button" className="btn btn-danger btn-large" onClick={onDelete}>
            <Trash2 aria-hidden="true" size={18} />
            删除会议
          </button>
        )}
        <Link className="btn btn-outline btn-large" to="/rooms">
          <ArrowLeft aria-hidden="true" size={18} />
          返回列表
        </Link>
      </div>
    </section>
  );
}

function MeetingSummaryPanel({ meeting, detail }: { meeting: Meeting; detail: MeetingDetail }) {
  const metadata: MetadataItem[] = [
    { label: '会议号', value: meeting.roomName, icon: <Hash aria-hidden="true" size={16} /> },
    { label: '主持人', value: meeting.hostUserName, icon: <Users aria-hidden="true" size={16} /> },
    { label: '状态', value: meeting.statusDisplay, icon: <Clock3 aria-hidden="true" size={16} /> },
    { label: '开始时间', value: meeting.scheduledStartDisplay, icon: <CalendarClock aria-hidden="true" size={16} /> },
    { label: '入会链接', value: detail.joinLink, href: detail.joinLink, icon: <ExternalLink aria-hidden="true" size={16} /> },
  ];

  return (
    <section className="workbench-panel meeting-core-panel">
      <PanelHeader title="核心信息" meta="ROOM DATA" />
      <MetadataGrid items={metadata} />
    </section>
  );
}

function ParticipantRow({
  invitee,
  onRemind,
  onRemove,
}: {
  invitee: Invitee;
  onRemind: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  const avatarText = invitee.userName.slice(0, 1).toUpperCase();

  return (
    <li className="participant-row">
      <div className="participant-person">
        <span className="participant-avatar" aria-hidden="true">{avatarText}</span>
        <div>
          <strong>{invitee.userName}</strong>
          <span>参会人</span>
        </div>
      </div>
      <div className="participant-status">
        <span className="metadata-label">状态</span>
        <StatusBadge value={invitee.status} />
      </div>
      <div className="participant-reminder">
        <span className="metadata-label">最近提醒</span>
        <span>{invitee.lastRemindedDisplay || '-'}</span>
      </div>
      <div className="participant-actions">
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => onRemind(invitee.userId)}>
          <Send aria-hidden="true" size={14} />
          提醒
        </button>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => onRemove(invitee.userId)}>
          移除
        </button>
      </div>
    </li>
  );
}

function ParticipantSection({
  detail,
  onAdd,
  onRemind,
  onRemove,
}: {
  detail: MeetingDetail;
  onAdd: (userId: string) => void;
  onRemind: (userId: string) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <section className="workbench-panel participants-panel">
      <PanelHeader title="参会人" meta={`${detail.invitees.length} 人`} />
      {detail.invitees.length > 0 ? (
        <ul className="participant-list">
          {detail.invitees.map((invitee) => (
            <ParticipantRow
              key={invitee.id}
              invitee={invitee}
              onRemind={onRemind}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : (
        <EmptyState title="暂无参会人" description="可从下方候选人中添加参会人。" />
      )}
      <CandidateList candidates={detail.inviteCandidates} onAdd={onAdd} />
    </section>
  );
}

function CandidateList({
  candidates,
  onAdd,
}: {
  candidates: UserSummary[];
  onAdd: (userId: string) => void;
}) {
  return (
    <div className="candidate-section">
      <h4>添加参会人</h4>
      {candidates.length > 0 ? (
        <div className="candidate-list">
          {candidates.map((user) => (
            <button
              key={user.id}
              type="button"
              className="participant-chip"
              onClick={() => onAdd(user.id)}
            >
              <UserPlus aria-hidden="true" size={14} />
              {user.displayName}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="暂无候选人" description="当前没有可添加的用户。" />
      )}
    </div>
  );
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    if (!id) return;
    const data = await apiFetch<MeetingDetail>(`/meetings/${id}/detail`);
    setDetail(data);
  }

  useEffect(() => {
    setError('');
    load().catch((e) => setError(e instanceof Error ? e.message : '加载失败'));
  }, [id]);

  async function remind(userId: string) {
    if (!id) return;
    await apiFetch(`/meetings/${id}/invitees/${userId}/remind`, { method: 'POST' });
    setMessage('已记录提醒，请通知该用户入会');
    await load();
  async function runAction(action: () => Promise<void>, successMessage?: string) {
    setError('');
    setMessage('');
    try {
      await action();
      if (successMessage) setMessage(successMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    }
  }

  function addInvitee(userId: string) {
    runAction(async () => {
      if (!id) return;
      await apiFetch(`/meetings/${id}/invitees`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      await load();
    }, '已添加参会人');
  }

  function removeInvitee(userId: string) {
    runAction(async () => {
      if (!id) return;
      await apiFetch(`/meetings/${id}/invitees/${userId}`, { method: 'DELETE' });
      await load();
    });
  }

  function remind(userId: string) {
    runAction(async () => {
      if (!id) return;
      await apiFetch(`/meetings/${id}/invitees/${userId}/remind`, { method: 'POST' });
      await load();
    }, '已记录提醒，请通知该用户入会');
  }

  async function deleteMeeting() {
    if (!id || !window.confirm('确定删除该会议？')) return;
    await runAction(async () => {
      await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
      navigate('/rooms');
    });
  }

  if (error && !detail) {
    return <PageState tone="danger" title="会议详情加载失败" description={error} />;
  }

  if (!detail) {
    return <PageState tone="info" title="正在加载会议详情" description="正在获取会议状态、入会信息和参会人列表。" />;
  }

  const meeting = detail.meeting;
  const canManageInvitees = detail.canManage && meeting.accessMode === 'INVITE_ONLY';

  return (
    <main className="meeting-detail-page">
      <MeetingHero detail={detail} />

      {message && <InlineMessage tone="success">{message}</InlineMessage>}
      {error && <InlineMessage tone="danger">{error}</InlineMessage>}

      <div className="meeting-workbench">
        <div className="meeting-workbench-main">
          <MeetingSummaryPanel meeting={meeting} detail={detail} />
          {canManageInvitees && (
            <ParticipantSection
              detail={detail}
              onAdd={addInvitee}
              onRemind={remind}
              onRemove={removeInvitee}
            />
          )}
        </div>

        <aside className="meeting-side-rail">
          <ActionPanel meeting={meeting} detail={detail} onDelete={deleteMeeting} />
          <section className="workbench-panel signal-panel">
            <PanelHeader title="会议状态" meta="SIGNAL" />
            <div className="signal-grid">
              <div>
                <span>访问方式</span>
                <strong>{meeting.accessMode === 'ALL_USERS' ? '公开会议' : '指定参会人'}</strong>
              </div>
              <div>
                <span>会议类型</span>
                <strong>{meeting.meetingType === 'INSTANT' ? '快速会议' : '预定会议'}</strong>
              </div>
              <div>
                <span>我的身份</span>
                <strong>{meeting.myRoleLabel}</strong>
              </div>
              <div>
                <span>管理权限</span>
                <strong>{detail.canManage ? '可管理' : '仅查看'}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
