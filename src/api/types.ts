export const TOKEN_KEY = 'meetingAuthToken';

/** VITE_API_BASE=站点根，如 http://host:8099；未设则用同源 /app/api */
// const API_ORIGIN = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
// export const API_BASE = API_ORIGIN ? `${API_ORIGIN}/app/api` : '/app/api';

export const API_BASE = 'https://43.143.218.217/app/api';
export interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  admin: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  roomName: string;
  hostUserName: string;
  meetingType: string;
  accessMode: string;
  status: string;
  statusDisplay: string;
  scheduledStartDisplay: string;
  myRoleLabel: string;
  host: boolean;
  canJoinNow: boolean;
  canEdit: boolean;
  description?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface MeetingDetail {
  meeting: Meeting;
  invitees: Invitee[];
  inviteCandidates: UserSummary[];
  canManage: boolean;
  canEdit: boolean;
  canDelete: boolean;
  joinLink: string;
}

export interface Invitee {
  id: string;
  userId: string;
  userName: string;
  status: string;
  lastRemindedDisplay?: string;
}

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface MeetingRoomBootstrap {
  meetingId: string;
  title: string;
  roomName: string;
  isHost: boolean;
  canEdit: boolean;
  canDelete: boolean;
  jitsiDomain: string;
  recorderDomain: string;
  externalApiScriptUrl: string;
  jitsiJwtEnabled: boolean;
}

export interface JitsiTokenResponse {
  enabled: boolean;
  jwt: string | null;
  roomName: string;
  domain: string;
  moderator: boolean;
}

export interface ChatMessage {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
  file?: {
    originalName: string;
    sizeBytes: number;
    downloadUrl: string;
  };
}

export interface RecordingItem {
  recordingId: string;
  title: string;
  roomName: string;
  durationSec: number;
  playUrl: string;
}

export interface ApiError {
  message?: string;
  error?: string;
}
