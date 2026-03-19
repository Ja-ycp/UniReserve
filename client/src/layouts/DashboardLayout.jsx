import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import logo from '../assets/logo.gif';

const icon = (path) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
    <path d={path} />
  </svg>
);

const studentLinks = [
  { to: '/dashboard', label: 'Overview', icon: icon('M3 13h8V3H3zm10 8h8V11h-8zm0-18v6h8V3zm-10 18h8v-6H3z') },
  { to: '/resources', label: 'Resources', icon: icon('M4 19.5A2.5 2.5 0 0 1 6.5 17H20') },
  { to: '/my-reservations', label: 'My Reservations', icon: icon('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01') },
  { to: '/calendar', label: 'Calendar', icon: icon('M3 4h18M8 2v4M16 2v4M4 10h16v10H4z') },
  { to: '/notifications', label: 'Notifications', icon: icon('M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0') },
  { to: '/manage/fines', label: 'My Fines', icon: icon('M12 1v22M5 7h14M5 17h14') },
  { to: '/profile', label: 'Profile', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z') }
];

const adminOperations = [
  { to: '/admin', label: 'Admin Dashboard', icon: icon('M3 13h8V3H3zm10 8h8V11h-8zm0-18v6h8V3zm-10 18h8v-6H3z') },
  { to: '/resources', label: 'Browse Catalog', icon: icon('M4 19.5A2.5 2.5 0 0 1 6.5 17H20') },
  { to: '/calendar', label: 'Calendar', icon: icon('M3 4h18M8 2v4M16 2v4M4 10h16v10H4z') },
  { to: '/notifications', label: 'Notifications', icon: icon('M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0') },
  { to: '/profile', label: 'Profile', icon: icon('M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z') }
];

const adminManagement = [
  { to: '/manage/resources', label: 'Manage Resources', icon: icon('M4 6h16M4 12h16M4 18h16') },
  { to: '/manage/reservations', label: 'Manage Reservations', icon: icon('M5 4h14l-2 14H7zM9 4V2h6v2') },
  { to: '/manage/users', label: 'Manage Users', icon: icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m14-11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zm7 11v-2a4 4 0 0 0-3-3.87') },
  { to: '/manage/fines', label: 'Manage Fines', icon: icon('M12 1v22M5 7h14M5 17h14') },
  { to: '/manage/policies', label: 'Policies', icon: icon('M4 3h12l4 4v14H4zM13 3v5h5') }
];

const pageTitles = {
  '/dashboard': 'Student Workspace',
  '/admin': 'Operations Workspace',
  '/resources': 'Resource Catalog',
  '/my-reservations': 'Reservation Tracking',
  '/calendar': 'Reservation Calendar',
  '/notifications': 'Activity Feed',
  '/profile': 'Profile Settings',
  '/manage/resources': 'Inventory Control',
  '/manage/reservations': 'Reservation Operations',
  '/manage/users': 'User Administration',
  '/manage/fines': 'Fine Center',
  '/manage/policies': 'Policy Management'
};

const roleLabel = (role) => {
  if (!role) return 'User';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const SidebarLink = ({ link, active, badge }) => (
  <Link to={link.to} className={`nav-link ${active ? 'active' : ''}`}>
    <span className="nav-icon">{link.icon}</span>
    <span className="nav-label">{link.label}</span>
    {badge > 0 ? <span className="nav-badge">{badge}</span> : null}
  </Link>
);

export default function DashboardLayout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isAdmin = ['developer', 'librarian'].includes(user?.role);
  const currentTitle = pathname.startsWith('/resources/') && pathname.endsWith('/reserve')
    ? 'Reserve Resource'
    : (pageTitles[pathname] || 'UniReserve Workspace');
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const sections = useMemo(() => {
    if (!isAdmin) {
      return [{ title: 'Workspace', links: studentLinks }];
    }

    return [
      { title: 'Workspace', links: adminOperations },
      { title: 'Management', links: adminManagement }
    ];
  }, [isAdmin]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let ignore = false;
    const loadUnread = () => {
      api.get('/notifications')
        .then(({ data }) => {
          if (!ignore) {
            setUnreadCount((data || []).filter((item) => !item.read).length);
          }
        })
        .catch(() => {
          if (!ignore) setUnreadCount(0);
        });
    };

    loadUnread();
    window.addEventListener('notifications-updated', loadUnread);

    return () => {
      ignore = true;
      window.removeEventListener('notifications-updated', loadUnread);
    };
  }, [pathname]);

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <button type="button" className="sidebar-toggle" onClick={() => setMenuOpen((open) => !open)}>
        {menuOpen ? 'Close menu' : 'Open menu'}
      </button>

      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-mark image">
            <img src={logo} alt="SMCC logo" className="logo-img" />
          </div>
          <div className="logo-text">
            <div className="brand">UniReserve</div>
            <div className="sub">Saint Michael College of Caraga</div>
          </div>
        </div>

        <div className="sidebar-blurb">
          <div className="sidebar-kicker">Campus operations</div>
          <p>Reserve smarter, track demand, and keep every library workflow aligned.</p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="nav-group">
            <div className="nav-section-title">{section.title}</div>
            <nav className="nav-section">
              {section.links.map((link) => (
                <SidebarLink
                  key={link.to}
                  link={link}
                  active={pathname === link.to}
                  badge={link.to === '/notifications' ? unreadCount : 0}
                />
              ))}
            </nav>
          </div>
        ))}

        <div className="user-card">
          <div className="avatar">{user?.fullName?.[0] || 'U'}</div>
          <div>
            <div className="user-name">{user?.fullName || 'UniReserve User'}</div>
            <div className="user-meta">{roleLabel(user?.role)}</div>
            {user?.schoolId ? <div className="user-meta">ID: {user.schoolId}</div> : null}
            {!user?.schoolId && user?.employeeId ? <div className="user-meta">ID: {user.employeeId}</div> : null}
          </div>
        </div>

        <button type="button" onClick={logout} className="logout-btn">Log out</button>
      </aside>

      <main className="main-area">
        <div className="shell-topbar">
          <div>
            <div className="shell-topbar-kicker">{todayLabel}</div>
            <div className="shell-topbar-title">{currentTitle}</div>
          </div>
          <div className="shell-topbar-actions">
            <span className="status-pill subtle">{roleLabel(user?.role)}</span>
            <span className="status-pill">{unreadCount} unread notifications</span>
          </div>
        </div>

        <div className="page-stack">{children}</div>
      </main>
    </div>
  );
}
