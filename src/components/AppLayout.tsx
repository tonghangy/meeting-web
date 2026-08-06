import { CalendarClock, PlayCircle, Radio, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';

export default function AppLayout() {
  const { user } = useAuth();

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-brand-mark" aria-hidden="true">
          <Video size={20} />
        </span>
        <div>
          <h2>会议</h2>
          {user && (
            <span className="user-banner">
              当前：{user.displayName} ({user.username})
            </span>
          )}
        </div>
      </div>
      <nav className="toolbar-actions" aria-label="主导航">
        <Link className="btn" to="/rooms/create?type=INSTANT">
          <Radio aria-hidden="true" size={16} />
          快速会议
        </Link>
        <Link className="btn btn-secondary" to="/rooms/create?type=SCHEDULED">
          <CalendarClock aria-hidden="true" size={16} />
          预定会议
        </Link>
        <Link className="btn btn-outline" to="/playback">
          <PlayCircle aria-hidden="true" size={16} />
          我的回放
        </Link>
      </nav>
      <ThemeSwitcher />
    </header>
  );
}
