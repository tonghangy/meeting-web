import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>会议</h2>
        {user && (
          <span className="user-banner">
            当前：{user.displayName} ({user.username})
          </span>
        )}
        <Link className="btn" to="/rooms/create?type=INSTANT">快速会议</Link>
        <Link className="btn btn-secondary" to="/rooms/create?type=SCHEDULED">预定会议</Link>
        <Link className="btn btn-outline" to="/playback">我的回放</Link>
        {user?.admin && <Link className="btn btn-outline" to="/admin/users">用户管理</Link>}
        <button type="button" className="btn btn-outline" onClick={() => logout()}>退出</button>
      </div>
    </>
  );
}
