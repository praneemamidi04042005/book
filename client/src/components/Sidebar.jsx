import { Activity, CalendarDays, ClipboardList, Compass, HeartPulse, LayoutDashboard, LogOut, Settings, Stethoscope, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const mainLinks = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/find-care', label: 'Find care', icon: Compass },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays, badge: '2' },
  { to: '/reports', label: 'My reports', icon: ClipboardList },
  { to: '/health-trends', label: 'Health trends', icon: Activity },
]

export default function Sidebar({ open, onClose }) {
  return <>
    {open && <button className="mobile-scrim" aria-label="Close menu" onClick={onClose} />}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><HeartPulse size={22} strokeWidth={2.4} /></div><div><b>BookMy</b><span>Appointment AI</span></div><button className="icon-button sidebar-close" onClick={onClose}><X size={18}/></button></div>
      <div className="workspace-label">YOUR HEALTH</div>
      <nav className="nav-list">
        {mainLinks.map(({ to, label, icon: Icon, badge }) => <NavLink key={to} to={to} end={to === '/'} onClick={onClose} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{label}</span>{badge && <small>{badge}</small>}</NavLink>)}
      </nav>
      <div className="sidebar-card"><div className="sidebar-card-icon"><Stethoscope size={17}/></div><b>Need a specialist?</b><p>Tell us what’s bothering you and we’ll help you find the right care.</p><NavLink to="/find-care" onClick={onClose}>Explore doctors <span>↗</span></NavLink></div>
      <div className="sidebar-bottom"><NavLink to="/settings" className="nav-item" onClick={onClose}><Settings size={18}/><span>Settings</span></NavLink><NavLink to="/login" className="nav-item" onClick={() => { localStorage.removeItem('bma_token'); localStorage.removeItem('bma_role'); localStorage.removeItem('bma_user'); onClose?.() }}><LogOut size={18}/><span>Sign out</span></NavLink><div className="sidebar-footnote"><span className="online-dot"/> Secure health space</div></div>
    </aside>
  </>
}
