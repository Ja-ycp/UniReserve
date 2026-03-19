import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import ResourceCatalog from './pages/ResourceCatalog.jsx';
import ReserveItem from './pages/ReserveItem.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import ManageResources from './pages/ManageResources.jsx';
import ManageUsers from './pages/ManageUsers.jsx';
import ManageReservations from './pages/ManageReservations.jsx';
import ManageFines from './pages/ManageFines.jsx';
import ManagePolicies from './pages/ManagePolicies.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import MyReservations from './pages/MyReservations.jsx';
import { useAuth } from './context/AuthContext.jsx';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    return <Navigate to={['developer', 'librarian'].includes(user.role) ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

const DashboardEntry = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (['developer','librarian'].includes(user?.role)) return <Navigate to="/admin" replace />;
  return <DashboardPage />;
};

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<PrivateRoute><ChangePasswordPage/></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardEntry/></PrivateRoute>} />
      <Route path="/admin" element={<RoleRoute roles={['developer','librarian']}><AdminDashboard/></RoleRoute>} />
      <Route path="/resources" element={<PrivateRoute><ResourceCatalog/></PrivateRoute>} />
      <Route path="/resources/:id/reserve" element={<PrivateRoute><ReserveItem/></PrivateRoute>} />
      <Route path="/calendar" element={<PrivateRoute><CalendarPage/></PrivateRoute>} />
      <Route path="/my-reservations" element={<PrivateRoute><MyReservations/></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><NotificationsPage/></PrivateRoute>} />
      <Route path="/manage/resources" element={<RoleRoute roles={['developer','librarian']}><ManageResources/></RoleRoute>} />
      <Route path="/manage/users" element={<RoleRoute roles={['developer','librarian']}><ManageUsers/></RoleRoute>} />
      <Route path="/manage/reservations" element={<RoleRoute roles={['developer','librarian']}><ManageReservations/></RoleRoute>} />
      <Route path="/manage/fines" element={<PrivateRoute><ManageFines/></PrivateRoute>} />
      <Route path="/manage/policies" element={<RoleRoute roles={['developer','librarian']}><ManagePolicies/></RoleRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage/></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
