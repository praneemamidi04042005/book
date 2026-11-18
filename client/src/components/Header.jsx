import { Bell, ChevronDown, MapPin, Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Header({ onMenu, location, setLocation, role = 'PATIENT', user }) {
  const navigate = useNavigate()
  const [notice, setNotice] = useState(false)
  return <header className="topbar">
    <button className="icon-button mobile-menu" aria-label="Open menu" onClick={onMenu}><Menu size={21}/></button>
    <div className="crumb"><span>My health</span><b>/</b><strong>Overview</strong></div>
    <div className="top-actions">
      <label className="location-pill"><MapPin size={16}/><select value={location} onChange={e => setLocation(e.target.value)} aria-label="Choose location"><option>Hyderabad</option><option>Secunderabad</option><option>Bengaluru</option><option>Chennai</option><option>Visakhapatnam</option></select><ChevronDown size={14}/></label>
      <button className="icon-button search-top" aria-label="Search"><Search size={19}/></button>
      <div className="notice-wrap"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice(!notice)}><Bell size={19}/><i/></button>{notice && <div className="notification-pop"><b>You’re all caught up</b><span>Your care updates will appear here.</span></div>}</div>
      <div className="top-divider"/>
      <button className="profile-chip" onClick={() => navigate('/settings')}><span className="avatar avatar-small">{(user?.name || 'Guest').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('')}</span><span className="profile-name"><b>{user?.name || 'Guest'}</b><small>{role === 'HOSPITAL_ADMIN' ? 'Hospital admin' : role[0] + role.slice(1).toLowerCase()}</small></span><ChevronDown size={15}/></button>
    </div>
  </header>
}
