import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import CreateMeetingPage from './pages/CreateMeetingPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import MeetingEditPage from './pages/MeetingEditPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import PlaybackPage from './pages/PlaybackPage';
import AdminUsersPage from './pages/AdminUsersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/create" element={<CreateMeetingPage />} />
          <Route path="/meeting/:id/detail" element={<MeetingDetailPage />} />
          <Route path="/meeting/:id/edit" element={<MeetingEditPage />} />
          <Route path="/playback" element={<PlaybackPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
        <Route path="/meeting/:id" element={<MeetingRoomPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/rooms" replace />} />
    </Routes>
  );
}
