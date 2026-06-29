import { Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';

export default function MainLayout() {
  return (
    <div className="container">
      <AppLayout />
      <Outlet />
    </div>
  );
}
