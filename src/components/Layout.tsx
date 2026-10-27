import { NavLink, Outlet } from 'react-router';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/tickets', label: 'Tickets', icon: '☰', end: true },
  { to: '/tickets/new', label: 'New ticket', icon: '+', end: true },
];

export function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ✓
          </span>
          <span className="brand-name">OpsDesk</span>
        </div>
        <nav className="nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar-footer">Support &amp; operations desk</p>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
