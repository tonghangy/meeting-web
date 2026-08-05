const MEETING_AUTH_INIT_TYPE = 'MEETING_AUTH_INIT';

export type MeetingAuthParentMessageType =
  | 'MEETING_AUTH_READY'
  | 'MEETING_AUTH_ACCEPTED'
  | 'MEETING_AUTH_REJECTED'
  | 'MEETING_AUTH_EXPIRED'
  | 'MEETING_AUTH_LOGOUT';

export function isEmbeddedMeeting(): boolean {
  return window.parent !== window;
}

export function getMeetingAuthTokenFromEvent(event: MessageEvent): string | null {
  if (!isEmbeddedMeeting() || event.source !== window.parent) {
    return null;
  }

  const message = event.data as {
    type?: unknown;
    version?: unknown;
    payload?: { token?: unknown };
  } | null;

  if (
    !message ||
    message.type !== MEETING_AUTH_INIT_TYPE ||
    Number(message.version) !== 1 ||
    !message.payload ||
    typeof message.payload.token !== 'string' ||
    !message.payload.token.trim()
  ) {
    return null;
  }

  return message.payload.token;
}

export function postMeetingAuthMessage(
  type: MeetingAuthParentMessageType,
  payload: Record<string, unknown> = {}
): void {
  if (!isEmbeddedMeeting()) {
    return;
  }

  window.parent.postMessage(
    {
      type,
      version: 1,
      payload,
    },
    getParentOrigin()
  );
}

function getParentOrigin(): string {
  try {
    return document.referrer ? new URL(document.referrer).origin : '*';
  } catch {
    return '*';
  }
}
