import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Calendar, CalendarCheck2, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, FileCheck2, FileText, Filter, Heart, HeartPulse, MapPin, MessageCircle, Search, ShieldCheck, Sparkles, Star, Stethoscope, Upload, UserRound, Users, X } from 'lucide-react'
import Modal from '../components/Modal'
import api from '../services/api'

const dayLabel = (value) => new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const hyderabadToday = () => {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function SectionHead({ label, title, action, to }) {
  return <div className="section-head"><div><div className="eyebrow">{label}</div><h2>{title}</h2></div>{action && <Link className="text-link" to={to}>{action}<ArrowRight size={15}/></Link>}</div>
}

function reportTrendData(reports) {
  const byDate = new Map()
  reports.forEach(report => (report.extractedParameters || []).forEach(parameter => {
    if (!['hba1c', 'hemoglobin'].includes(parameter.name.toLowerCase())) return
    const date = report.uploadDate
    if (!date) return
    const point = byDate.get(date) || { date: dayLabel(date).replace(/, \d{4}$/, '') }
    point[parameter.name.toLowerCase() === 'hba1c' ? 'HbA1c' : 'Hemoglobin'] = Number(parameter.value)
    byDate.set(date, point)
  }))
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, point]) => point)
}

export function DashboardPage({ appointments, reports, doctors, hospitals, role, city, sessionUser, onUpdateStatus, onUpdateNotes, onUpdateAvailability, onAddDoctor }) {
  const nextAppointment = appointments.find(a => a.status !== 'CANCELLED' && a.status !== 'COMPLETED')
  const completedReports = reports.filter(r => r.processingStatus === 'COMPLETED')
  const latestReport = [...completedReports].sort((a, b) => (b.uploadDate || '').localeCompare(a.uploadDate || ''))[0]
  const trendData = reportTrendData(reports)
  const isPatient = role === 'PATIENT'
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const firstName = sessionUser?.name?.trim().split(/\s+/)[0] || 'there'
  return <div className="page fade-in">
    <div className="welcome-row"><div><div className="eyebrow">{todayLabel} <span className="live-dot"/></div><h1>{isPatient ? `Welcome, ${firstName}` : role === 'DOCTOR' ? 'Welcome, Doctor' : 'Welcome, Admin'} <span className="wave">✳</span></h1><p className="welcome-sub">{isPatient ? 'A little clarity can make a big difference in your health journey.' : 'Here’s a snapshot of your care activity today.'}</p></div><Link to="/find-care" className="btn btn-primary"><CalendarCheck2 size={17}/> Book an appointment</Link></div>
    {role !== 'PATIENT' ? <ProviderDashboard appointments={appointments} reports={reports} doctors={doctors} role={role} sessionUser={sessionUser} onUpdateStatus={onUpdateStatus} onUpdateNotes={onUpdateNotes} onUpdateAvailability={onUpdateAvailability} onAddDoctor={onAddDoctor}/> : <>
      <div className="hero-grid">
        <section className="next-card">
          <div className="next-card-top"><div className="next-kicker"><span className="pulse-dot"/> YOUR NEXT VISIT</div>{nextAppointment && <span className="confirmed-tag"><Check size={12}/>{nextAppointment.status === 'CONFIRMED' ? 'Confirmed' : 'Booked'}</span>}</div>
          {nextAppointment ? <><div className="visit-date"><div className="date-block"><b>{new Date(`${nextAppointment.date}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit' })}</b><span>{new Date(`${nextAppointment.date}T12:00:00`).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span></div><div><h2>{nextAppointment.doctor}</h2><p>{nextAppointment.specialization}</p></div></div><div className="visit-meta"><span><Clock size={15}/>{nextAppointment.startTime}</span><span><MapPin size={15}/>{nextAppointment.hospital}</span></div><Link to="/appointments" className="visit-footer">View appointment details <ArrowRight size={16}/></Link></> : <div className="empty-next"><p>No upcoming visits yet.</p><Link to="/find-care">Find a doctor <ArrowRight size={15}/></Link></div>}
          <div className="decor-orbit orbit-one"/><div className="decor-orbit orbit-two"/><div className="decor-cross">✳</div>
        </section>
        <section className="insight-card"><div className="insight-heading"><div className="insight-icon"><Sparkles size={18}/></div><span>YOUR CARE INSIGHT</span><span className="info-mark">i</span></div><div className="insight-content"><div className="insight-label">{latestReport ? 'Based on your recent report' : 'Your records'}</div><h2>{latestReport ? <>Review your<br/><em>{latestReport.reportType}.</em></> : <>Your health records<br/><em>will appear here.</em></>}</h2><p>{latestReport?.recommendedSpecialist ? `Your report suggests a conversation with a ${latestReport.recommendedSpecialist}.` : latestReport ? 'Review your report with a healthcare professional.' : 'Upload a report to see information based on your own records.'}</p>{latestReport?.recommendedSpecialist && <div className="insight-specialist"><div className="mini-doctor">{latestReport.recommendedSpecialist.split(/\s+/).map(word => word[0]).join('').slice(0, 2)}</div><span><small>FROM YOUR RECENT REPORT</small><b>{latestReport.recommendedSpecialist}</b></span><Link to="/find-care" aria-label={`Find a ${latestReport.recommendedSpecialist}`}><ArrowRight size={16}/></Link></div>}</div><div className="insight-orb"/></section>
      </div>
      <div className="quick-stats"><StatCard icon={CalendarCheck2} tint="tint-mint" label="Appointments" value={appointments.filter(a => a.status !== 'CANCELLED').length.toString().padStart(2, '0')} sub="Upcoming & past"/><StatCard icon={FileCheck2} tint="tint-blue" label="Health reports" value={completedReports.length.toString().padStart(2, '0')} sub="Reports analyzed"/><StatCard icon={HeartPulse} tint="tint-peach" label={`Doctors in ${city}`} value={doctors.length.toString().padStart(2, '0')} sub={city}/><StatCard icon={Activity} tint="tint-lilac" label={`Hospitals in ${city}`} value={hospitals.length.toString().padStart(2, '0')} sub={city}/></div>
      <div className="content-grid dashboard-content">
        <section className="panel trend-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR WELLNESS</div><h2>Health trends</h2></div><Link to="/health-trends" className="icon-button subtle-arrow"><ArrowRight size={17}/></Link></div><div className="chart-key"><span className="key-dot key-teal"/> HbA1c <span className="key-dot key-coral"/> Hemoglobin</div><div className="chart-wrap">{trendData.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9efed"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#95a29f', fontSize: 11 }}/><YAxis tickLine={false} axisLine={false} tick={{ fill: '#95a29f', fontSize: 10 }}/><Tooltip contentStyle={{ border: '1px solid #e7efed', borderRadius: 12, boxShadow: '0 8px 24px #193c3512' }}/><Line type="monotone" dataKey="HbA1c" stroke="#138a7e" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}/><Line type="monotone" dataKey="Hemoglobin" stroke="#efa688" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}/></LineChart></ResponsiveContainer> : <div className="empty-state"><h3>No report trends yet</h3><p>Values from your uploaded reports will appear here.</p></div>}</div><div className="chart-note"><span className="note-icon"><Activity size={15}/></span><span><b>Recorded report values.</b> Only values extracted from your reports appear here.</span></div></section>
        <section className="panel reports-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR RECORDS</div><h2>Recent reports</h2></div><Link to="/reports" className="panel-view-link">View all <ArrowRight size={14}/></Link></div><div className="report-list">{reports.slice(0, 3).map((report, i) => <div className="report-row" key={report._id}><div className={`file-icon file-${i % 3}`}><FileText size={18}/></div><div className="report-main"><b>{report.reportType}</b><span>{dayLabel(report.uploadDate)} · {report.extractedParameters?.length || 0} values</span></div><span className={`report-status ${report.processingStatus === 'COMPLETED' ? 'status-done' : ''}`}><i/>{report.processingStatus === 'COMPLETED' ? 'Ready' : 'Processing'}</span></div>)}</div><Link to="/reports" className="upload-inline"><span><Upload size={17}/></span><b>Upload a new report</b><ArrowRight size={16}/></Link></section>
      </div>
      {doctors.length > 0 && <section className="specialists-section"><SectionHead label="A LITTLE HELP GOES A LONG WAY" title="Care that fits your needs" action="Explore all doctors" to="/find-care"/><div className="specialist-cards">{doctors.slice(0, 3).map((doctor, i) => <DoctorCard key={doctor._id} doctor={doctor} compact tint={['mint', 'peach', 'blue'][i]} />)}</div></section>}
      <div className="safety-footer"><ShieldCheck size={15}/> Your health information is private and secure <span>·</span> AI insights are informational and do not replace medical advice.</div>
    </>}
  </div>
}

function StatCard({ icon: Icon, tint, label, value, suffix, sub }) { return <div className="stat-card"><div className={`stat-icon ${tint}`}><Icon size={18}/></div><span className="stat-label">{label}</span><div className="stat-value">{value}<small>{suffix}</small></div><div className="stat-sub">{sub}</div></div> }

function ProviderDashboard({ appointments, reports, doctors, role, sessionUser, onUpdateStatus, onUpdateNotes, onUpdateAvailability, onAddDoctor }) {
  const isDoctor = role === 'DOCTOR'
  return <><div className="provider-banner"><div className="provider-banner-icon">{isDoctor ? <Stethoscope size={24}/> : <HeartPulse size={24}/>}</div><div><b>{isDoctor ? 'Your practice at a glance' : 'Your hospital at a glance'}</b><span>{isDoctor ? 'Stay on top of your visits and patient care.' : 'Manage doctors, appointments and patient reports.'}</span></div><Link to="/appointments" className="btn btn-white">{isDoctor ? 'View schedule' : 'Manage appointments'} <ArrowRight size={15}/></Link></div><div className="quick-stats"><StatCard icon={CalendarCheck2} tint="tint-mint" label="Today's appointments" value="08" sub="2 awaiting confirmation"/><StatCard icon={Users} tint="tint-blue" label="Upcoming visits" value={appointments.length.toString().padStart(2, '0')} sub="Next 7 days"/><StatCard icon={FileCheck2} tint="tint-peach" label="Reports to review" value={reports.length.toString().padStart(2, '0')} sub="Patient records"/><StatCard icon={Activity} tint="tint-lilac" label={isDoctor ? 'Profile views' : 'Active doctors'} value={isDoctor ? '126' : '10'} sub="This month"/></div><AppointmentsPage appointments={appointments} provider onUpdateStatus={onUpdateStatus} onUpdateNotes={onUpdateNotes} role={role}/><div className="provider-actions"><Link to="/reports" className="btn btn-secondary"><Upload size={15}/> {isDoctor ? 'Upload a patient report' : 'Upload a hospital report'}</Link><Link to="/find-care" className="btn btn-light"><Users size={15}/> {isDoctor ? 'View my profile' : 'Manage doctors & departments'}</Link></div><AvailabilityPanel doctors={doctors} role={role} sessionUser={sessionUser} onSave={onUpdateAvailability}/>{role === 'HOSPITAL_ADMIN' && <DoctorManager doctors={doctors} hospitalId={sessionUser?.hospitalId} onAddDoctor={onAddDoctor}/>}<div className="safety-footer"><ShieldCheck size={15}/> Patient report access is limited to authorized care relationships.</div></>}

export function FindCarePage({ doctors, hospitals, city, onBook, notify, catalogLoading, catalogError }) {
  const [query, setQuery] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [specialist, setSpecialist] = useState('All specialties')
  const [booking, setBooking] = useState(null)
  const [result, setResult] = useState(null)
  const cityHospitals = hospitals.filter(h => h.city?.toLowerCase() === city.toLowerCase())
  const cityDoctors = doctors.filter(d => {
    const hospital = hospitals.find(h => String(h._id) === String(d.hospitalId))
    const doctorCity = d.city || hospital?.city
    return doctorCity?.toLowerCase() === city.toLowerCase()
  })
  const specs = ['All specialties', ...new Set(cityDoctors.map(d => d.specialization))]
  const recommend = (text) => {
    setQuery(text)
    const lower = text.toLowerCase()
    let found = ['General Physician']
    if (/chest|heart|palpitation|blood pressure/.test(lower)) found = ['Cardiologist']
    else if (/sugar|diabet|glucose|hba1c/.test(lower)) found = ['Endocrinologist', 'Diabetologist']
    else if (/kidney|creatinine/.test(lower)) found = ['Nephrologist']
    else if (/liver|stomach|digest|abdomen/.test(lower)) found = ['Gastroenterologist']
    else if (/skin|rash|itch/.test(lower)) found = ['Dermatologist']
    else if (/eye|vision/.test(lower)) found = ['Ophthalmologist']
    else if (/bone|joint|knee|back pain/.test(lower)) found = ['Orthopedist']
    else if (/headache|nerve|dizz|seizure/.test(lower)) found = ['Neurologist']
    setResult({ matches: found, text })
    setSpecialist(found[0])
  }
  const filtered = cityDoctors.filter(d => (specialist === 'All specialties' || d.specialization === specialist || (specialist === 'Endocrinologist' && d.specialization === 'Diabetologist')) && `${d.name} ${d.specialization} ${d.hospital}`.toLowerCase().includes(doctorSearch.toLowerCase()))
  const noLocationCatalog = !catalogLoading && !catalogError && !cityDoctors.length && !cityHospitals.length
  const showingSampleCatalog = cityDoctors.some(doctor => doctor.isSampleData) || cityHospitals.some(hospital => hospital.isSampleData)
  return <div className="page fade-in"><div className="page-title-row"><div><div className="eyebrow">CARE, CLOSER TO YOU</div><h1>Find the right care</h1><p>Discover doctors and hospitals around {city}.</p></div><span className="btn btn-secondary"><MapPin size={16}/>{city}<ChevronDown size={15}/></span></div>
    {!catalogLoading && !catalogError && showingSampleCatalog && <div className="medical-disclaimer">These Hyderabad hospital and doctor profiles are starter sample data. Replace them with verified provider records before using them for real patient bookings.</div>}
    {catalogLoading && <div className="empty-state" role="status"><h3>Loading care near {city}…</h3><p>Checking current doctors and hospitals.</p></div>}
    {catalogError && <div className="empty-state" role="alert"><h3>Care listings are unavailable</h3><p>{catalogError}</p></div>}
    {noLocationCatalog && <div className="empty-state" role="status"><h3>No available doctors or hospitals are present at your location ({city}).</h3><p>Choose another location from the menu above to see available care.</p></div>}
    <section className="symptom-card"><div className="symptom-top"><div className="symptom-spark"><Sparkles size={18}/></div><div><div className="eyebrow">PERSONALIZED FOR YOU</div><h2>Not sure where to start?</h2><p>Share what’s on your mind. We’ll suggest a specialist to consider.</p></div></div><form className="symptom-form" onSubmit={e => { e.preventDefault(); if (query.trim()) recommend(query) }}><MessageCircle size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. I’ve had a persistent headache..."/><button className="btn btn-primary" type="submit"><Sparkles size={15}/> Get suggestion</button></form>{result && <div className="recommendation-box"><div className="rec-check"><Check size={16}/></div><div><b>Consider speaking with a {result.matches.join(' or ')}</b><span>Based on what you shared. This is an informational specialist recommendation, not a medical diagnosis.</span></div><button className="icon-button" onClick={() => setResult(null)}><X size={16}/></button></div>}<div className="suggestion-row"><span>Try:</span>{['Skin concern', 'Joint pain', 'High blood sugar'].map(s => <button onClick={() => recommend(s)} key={s}>{s}</button>)}</div></section>
    <div className="care-search-row"><div><div className="eyebrow">SPECIALISTS NEAR YOU</div><h2>Doctors in {city}</h2></div><div className="care-filters"><label className="select-filter"><Filter size={15}/><select value={specialist} onChange={e => setSpecialist(e.target.value)}>{specs.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14}/></label><label className="search-filter"><Search size={16}/><input value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)} placeholder="Search doctors"/></label></div></div>
    {!catalogLoading && !catalogError && !noLocationCatalog && <div className="doctor-results">{filtered.length ? filtered.map((doctor, i) => <DoctorCard key={doctor._id} doctor={doctor} tint={doctor.tint || ['mint', 'peach', 'blue'][i % 3]} onBook={() => setBooking(doctor)}/>) : <div className="empty-state"><h3>{cityDoctors.length ? 'No doctors match these filters' : `No doctors are available in ${city}.`}</h3><p>Change location or adjust your search to see other care options.</p></div>}</div>}
    {!catalogLoading && !catalogError && !noLocationCatalog && <><div className="nearby-head"><div><div className="eyebrow">CARE IN YOUR NEIGHBORHOOD</div><h2>Hospitals in {city}</h2></div></div>{cityHospitals.length ? <div className="hospital-grid">{cityHospitals.map(h => <div className="hospital-card" key={h._id}><div className={`hospital-art ${h.color || 'mint'}`}><div className="hospital-symbol"><HeartPulse size={24}/></div><span>{h.openSlots ?? 0} slots today</span></div><div className="hospital-info"><div className="hospital-name-row"><b>{h.name}</b>{!h.isSampleData && <span className="rating"><Star size={13} fill="currentColor"/> {h.rating || '4.8'}</span>}</div><span className="hospital-location"><MapPin size={14}/>{h.area}, {h.city}</span><div className="dept-chips">{(h.departments || []).slice(0, 3).map(dep => <span key={dep}>{dep}</span>)}</div><button className="hospital-action" onClick={() => { setSpecialist('All specialties'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>View doctors <ArrowRight size={15}/></button></div></div>)}</div> : <div className="empty-state"><h3>No hospitals are available in {city}.</h3><p>Choose another location to see nearby care.</p></div>}</>}
    {booking && <BookingModal doctor={booking} hospitals={hospitals} onClose={() => setBooking(null)} onConfirm={onBook} />}
    <p className="medical-disclaimer">Specialist suggestions are informational only and do not establish a diagnosis. For urgent symptoms, contact local emergency services.</p>
  </div>
}

function DoctorCard({ doctor, compact = false, tint = 'mint', onBook }) {
  return <article className={`doctor-card ${compact ? 'doctor-compact' : ''}`}><div className="doctor-card-top"><div className={`doctor-avatar ${tint}`}>{doctor.initials || doctor.name?.split(' ').slice(-2).map(x => x[0]).join('')}</div><button className="icon-button favorite" aria-label="Save doctor"><Heart size={17}/></button></div><div className="doctor-name-line"><h3>{doctor.name}</h3>{doctor.verified && <span className="doctor-verified"><CheckCircle2 size={14}/></span>}</div><div className="doctor-specialty">{doctor.specialization}</div><div className="doctor-rating">{!doctor.isSampleData && <><Star size={14} fill="currentColor"/> <b>{doctor.rating || '4.8'}</b><span>·</span></>}{doctor.experience || '8 years'} experience</div><div className="doctor-hospital"><MapPin size={14}/><span>{doctor.hospital || 'Aarogya Multispeciality'}</span></div><div className="doctor-card-bottom"><span className="doctor-fee"><b>₹{doctor.fee || 600}</b><small> / visit</small></span>{onBook ? <button onClick={onBook} className="btn btn-primary btn-sm">Book visit</button> : <Link to="/find-care" className="btn btn-light btn-sm">View profile <ArrowRight size={14}/></Link>}</div></article>
}

function BookingModal({ doctor, hospitals, onClose, onConfirm }) {
  const today = hyderabadToday()
  const [date, setDate] = useState(today)
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookedSlots, setBookedSlots] = useState([])
  const [time, setTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [slotsError, setSlotsError] = useState('')
  const [refreshSlots, setRefreshSlots] = useState(0)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const hospital = hospitals.find(h => h._id === doctor.hospitalId)
  useEffect(() => {
    let active = true
    const loadAvailability = () => api.get(`/doctors/${doctor._id}/availability`, { params: { date } }).then(({ data }) => {
      if (!active) return
      const current = data.find(day => day.date === date)?.slots || []
      const booked = data.find(day => day.date === date)?.bookedSlots || []
      setAvailableSlots(current)
      setBookedSlots(booked)
      setTime(previous => current.includes(previous) ? previous : current[0] || '')
      setSlotsError('')
      setLoadingSlots(false)
    }).catch(() => {
      if (!active) return
      setAvailableSlots([])
      setBookedSlots([])
      setTime('')
      setSlotsError('Could not check the live availability for this doctor.')
      setLoadingSlots(false)
    })
    setLoadingSlots(true)
    setSlotsError('')
    loadAvailability()
    const refreshTimer = window.setInterval(loadAvailability, 5000)
    return () => { active = false; window.clearInterval(refreshTimer) }
  }, [doctor._id, date, refreshSlots])
  const slots = availableSlots
  const submit = async (e) => { e.preventDefault(); setSaving(true); const saved = await onConfirm({ doctorId: doctor._id, hospitalId: doctor.hospitalId, date, startTime: time, reason }); setSaving(false); if (saved) onClose(); else setRefreshSlots(value => value + 1) }
  return <Modal title="Book your visit" eyebrow="APPOINTMENT BOOKING" onClose={onClose} wide><form onSubmit={submit} className="booking-form"><div className="booking-provider"><div className={`doctor-avatar ${doctor.tint || 'mint'}`}>{doctor.initials}</div><div><b>{doctor.name}</b><span>{doctor.specialization} · {hospital?.name || doctor.hospital}</span></div><span className="booking-fee">₹{doctor.fee || 600}</span></div><label className="form-label">Choose a date<input type="date" required min={today} value={date} onChange={e => setDate(e.target.value)}/></label><div className="form-label">Available times{loadingSlots ? <span className="empty-slot-hint">Checking live availability…</span> : slotsError ? <span className="empty-slot-hint">{slotsError} <button type="button" className="text-link" onClick={() => setRefreshSlots(value => value + 1)}>Retry</button></span> : slots.length || bookedSlots.length ? <div className="slot-grid">{slots.map(s => <button type="button" key={s} className={`time-slot ${time === s ? 'selected' : ''}`} onClick={() => setTime(s)}>{s}</button>)}{bookedSlots.map(s => <button type="button" key={s} className="time-slot booked" disabled aria-label={`${s} is already booked with ${doctor.name}`}>{s}<small>Booked</small></button>)}</div> : <span className="empty-slot-hint">No available times for this date. Choose another date.</span>}</div><label className="form-label">What would you like the doctor to know? <span className="optional">Optional</span><textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly share the reason for your visit" rows="2" maxLength="240"/></label><div className="booking-safety"><ShieldCheck size={15}/> Your appointment details are private and securely stored.</div><button className="btn btn-primary btn-full" disabled={saving || loadingSlots || !time}>{saving ? 'Confirming…' : 'Confirm appointment'} <ArrowRight size={16}/></button></form></Modal>
}

export function AppointmentsPage({ appointments, onCancel, onUpdateStatus, onUpdateNotes, role = 'PATIENT', provider = false }) {
  const [filter, setFilter] = useState('All visits')
  const [confirmCancel, setConfirmCancel] = useState(null)
  const [noteAppointment, setNoteAppointment] = useState(null)
  const [noteText, setNoteText] = useState('')
  const filtered = appointments.filter(a => filter === 'All visits' || (filter === 'Upcoming' && !['CANCELLED', 'COMPLETED'].includes(a.status)) || (filter === 'Past' && ['CANCELLED', 'COMPLETED'].includes(a.status)))
  return <div className={`page fade-in ${provider ? 'embedded-page' : ''}`}>{!provider && <div className="page-title-row"><div><div className="eyebrow">YOUR CARE, IN ONE PLACE</div><h1>My appointments</h1><p>Stay organized with your upcoming and past visits.</p></div><Link to="/find-care" className="btn btn-primary"><Calendar size={17}/> Book a visit</Link></div>}{!provider && <div className="tabs-row">{['All visits', 'Upcoming', 'Past'].map(f => <button key={f} className={`tab-button ${filter === f ? 'tab-active' : ''}`} onClick={() => setFilter(f)}>{f}{f === 'Upcoming' && <span>{appointments.filter(a => !['CANCELLED', 'COMPLETED'].includes(a.status)).length}</span>}</button>)}</div>}
    {filtered.length ? <div className="appointment-list">{filtered.map(a => <article className="appointment-card" key={a._id}><div className="appointment-calendar"><span>{new Date(`${a.date}T12:00:00`).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span><b>{new Date(`${a.date}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit' })}</b><small>{new Date(`${a.date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}</small></div><div className="appointment-info"><span className="appointment-specialty">{a.specialization || 'Consultation'}</span><h3>{a.doctor || a.doctorName || 'Care provider'}</h3><span>{a.hospital || 'Hospital visit'}</span>{provider && <small className="appointment-reason">Patient: {a.patientName || 'Authorized patient'} · {a.patientId || ''}</small>}<p><Clock size={14}/>{a.startTime || a.time} <span>·</span> {dayLabel(a.date)}</p>{a.reason && <small className="appointment-reason">Reason: {a.reason}</small>}</div><div className="appointment-right"><span className={`appointment-status ${a.status?.toLowerCase()}`}>{a.status}</span>{provider && ['BOOKED', 'CONFIRMED'].includes(a.status) && <button className="btn btn-light btn-sm" onClick={() => onUpdateStatus?.(a._id, a.status === 'BOOKED' ? 'CONFIRMED' : 'COMPLETED')}>{a.status === 'BOOKED' ? 'Confirm visit' : 'Mark complete'}</button>}{provider && <button className="btn btn-light btn-sm" onClick={() => { setNoteAppointment(a); setNoteText(a.providerNotes || '') }}>{a.providerNotes ? 'Edit note' : 'Add note'}</button>}{!provider && !['CANCELLED', 'COMPLETED'].includes(a.status) && <button className="btn btn-light btn-sm" onClick={() => setConfirmCancel(a)}>Cancel visit</button>}</div></article>)}</div> : <div className="empty-state"><div className="empty-state-icon"><CalendarCheck2 size={24}/></div><h3>No visits found</h3><p>Your appointments will appear here once booked.</p><Link to="/find-care" className="btn btn-primary">Find a doctor</Link></div>}
    {confirmCancel && <Modal title="Cancel this appointment?" eyebrow="APPOINTMENT UPDATE" onClose={() => setConfirmCancel(null)}><p className="modal-copy">Your visit with <b>{confirmCancel.doctor || 'your doctor'}</b> on {dayLabel(confirmCancel.date)} at {confirmCancel.startTime || confirmCancel.time} will be cancelled.</p><div className="modal-actions"><button className="btn btn-light" onClick={() => setConfirmCancel(null)}>Keep appointment</button><button className="btn btn-danger" onClick={() => { onCancel(confirmCancel._id); setConfirmCancel(null) }}>Cancel visit</button></div></Modal>}
    {noteAppointment && <Modal title="Appointment note" eyebrow="PROVIDER NOTE" onClose={() => setNoteAppointment(null)}><p className="modal-copy">Add a note for the care team about {noteAppointment.patientName || 'this patient'}’s visit.</p><label className="form-label"><textarea rows="5" maxLength="1000" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Write a brief visit note…"/></label><div className="modal-actions"><button className="btn btn-light" onClick={() => setNoteAppointment(null)}>Close</button><button className="btn btn-primary" onClick={() => { onUpdateNotes?.(noteAppointment._id, noteText); setNoteAppointment(null) }}>Save note</button></div></Modal>}
  </div>
}

export function ReportsPage({ reports, onAddReport, notify, role = 'PATIENT', appointments = [], doctors = [] }) {
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [drag, setDrag] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState('')
  const [telugu, setTelugu] = useState(null)
  const [translating, setTranslating] = useState(false)
  const providerPatients = [...new Map(appointments.filter(a => a.patientId).map(a => [String(a.patientId), { id: String(a.patientId), name: a.patientName || 'Patient' }])).values()]
  const isProvider = role !== 'PATIENT'
  const handleFile = async (file) => {
    if (!file) return
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) { notify('Please choose a PDF, JPG, JPEG or PNG file.'); return }
    if (file.size > 10 * 1024 * 1024) { notify('Files must be smaller than 10 MB.'); return }
    const patientId = isProvider ? selectedPatient || providerPatients[0]?.id : ''
    if (isProvider && !patientId) { notify('A patient with an appointment is required before upload.'); return }
    setUploading(true)
    try {
      const body = new FormData(); body.append('report', file)
      if (isProvider) body.append('patientId', patientId)
      const { data } = await api.post('/reports/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      onAddReport(data); notify('Report uploaded. Analysis is being prepared.')
    } catch (error) {
      if (localStorage.getItem('bma_token')) { notify(error.response?.data?.message || 'The report could not be uploaded.'); return }
      const mock = { _id: `upload-${Date.now()}`, reportType: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '), uploadDate: new Date().toISOString().slice(0, 10), processingStatus: 'COMPLETED', summary: 'Your file was added to this local demo. Connect the backend to run OCR and review extracted values.', recommendedSpecialist: 'General Physician', extractedParameters: [] }
      onAddReport(mock); notify('Report added in demo mode. Connect the backend for OCR analysis.')
    } finally { setUploading(false) }
  }
  const translateToTelugu = async () => {
    if (!selected?.extractedText) { notify('Telugu explanations need a stored report and an OpenAI API key.'); return }
    setTranslating(true)
    try {
      const { data } = await api.post('/ai/analyze-report', { reportType: selected.reportType, extractedText: selected.extractedText, language: 'Telugu' })
      setTelugu(data)
    } catch (error) { notify(error.response?.data?.message || 'Telugu explanation is unavailable. Check the OpenAI configuration.') }
    finally { setTranslating(false) }
  }
  return <div className="page fade-in"><div className="page-title-row"><div><div className="eyebrow">{isProvider ? 'AUTHORIZED PATIENT RECORDS' : 'YOUR HEALTH RECORDS'}</div><h1>Medical reports</h1><p>{isProvider ? 'Upload and review reports for patients in your care.' : 'One secure place for your test results and health documents.'}</p></div><div className="report-upload-actions">{isProvider && <label className="form-label provider-patient-select">Patient<select value={selectedPatient || providerPatients[0]?.id || ''} onChange={e => setSelectedPatient(e.target.value)} required><option value="">Select patient</option>{providerPatients.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label>}<label className="btn btn-primary upload-cta"><Upload size={17}/> Upload report<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFile(e.target.files?.[0])}/></label></div></div>
    <label className={`upload-dropzone ${drag ? 'drag-active' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]) }}><div className="upload-drop-icon">{uploading ? <div className="spinner"/> : <Upload size={21}/>}</div><b>{uploading ? 'Uploading your report…' : 'Drop a report here, or browse'}</b><span>PDF, JPG, JPEG or PNG · Up to 10 MB</span><input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFile(e.target.files?.[0])}/></label>
    <div className="report-page-heading"><div><div className="eyebrow">YOUR LIBRARY</div><h2>All reports <span>{reports.length.toString().padStart(2, '0')}</span></h2></div><button className="filter-date" onClick={() => notify('Showing all reports')}><Calendar size={15}/> All dates <ChevronDown size={14}/></button></div>
    <div className="reports-table"><div className="table-header"><span>REPORT</span><span>UPLOADED</span><span>KEY VALUES</span><span>ANALYSIS</span><span/></div>{[...reports].sort((a, b) => String(b.uploadDate).localeCompare(String(a.uploadDate))).map((r, i) => <button key={r._id} className="table-report-row" onClick={() => { setSelected(r); setTelugu(null) }}><span className="table-report-name"><span className={`file-icon file-${i % 3}`}><FileText size={17}/></span><span><b>{r.reportType}</b><small>PDF document · {typeof r.fileSize === 'number' ? `${(r.fileSize / 1048576).toFixed(1)} MB` : r.fileSize || '1.2 MB'}</small></span></span><span className="table-date">{dayLabel(r.uploadDate)}</span><span className="table-values">{r.extractedParameters?.length || 0} extracted</span><span><span className={`report-status ${r.processingStatus === 'COMPLETED' ? 'status-done' : ''}`}><i/>{r.processingStatus === 'COMPLETED' ? 'Analyzed' : 'Processing'}</span></span><span><ChevronRight size={17}/></span></button>)}</div>
    <div className="report-privacy"><ShieldCheck size={17}/><span><b>Your records stay yours.</b> Reports are only visible to you and care providers you authorize.</span><Link to="/settings">Privacy settings <ArrowRight size={14}/></Link></div>
    {selected && <Modal title={selected.reportType} eyebrow={`UPLOADED ${dayLabel(selected.uploadDate).toUpperCase()}`} onClose={() => { setSelected(null); setTelugu(null) }} wide><div className="analysis-summary"><span className="analysis-spark"><Sparkles size={18}/></span><div><b>Plain-language summary</b><p>{selected.summary || 'This report is ready for review. Please discuss the results with a licensed healthcare professional.'}</p></div></div><button className="language-action" onClick={translateToTelugu} disabled={translating}>{translating ? 'Preparing Telugu…' : 'తెలుగులో వివరణ చూడండి'}</button>{telugu && <div className="telugu-summary"><b>తెలుగులో సారాంశం</b><p>{telugu.summary}</p><span>{telugu.explanation}</span></div>}<div className="analysis-section-title">Extracted values <span>Informational only</span></div>{selected.extractedParameters?.length ? <div className="parameter-table">{selected.extractedParameters.map((p, i) => <div className="parameter-row" key={i}><b>{p.name}</b><span>{p.value} {p.unit}</span><span className={`parameter-status ${p.status?.toLowerCase()}`}>{p.status === 'NORMAL' ? 'Within shown range' : p.status === 'LOW' ? 'Below shown range' : p.status === 'HIGH' ? 'Above shown range' : 'Review'}</span></div>)}</div> : <div className="parameter-empty">No values were extracted from this file. A clinician can still review the original document.</div>}<div className="analysis-specialist"><Stethoscope size={17}/><span>Specialist to consider</span><b>{selected.recommendedSpecialist || 'General Physician'}</b></div>{role === 'PATIENT' && doctors.some(d => d.userId) && <ShareReport doctors={doctors.filter(d => d.userId)} report={selected} notify={notify}/>}<div className="disclaimer-box"><ShieldCheck size={16}/> Ranges and summaries are informational, may vary by lab and personal context, and are not a diagnosis. Your doctor is the best person to interpret these findings.</div><Link to="/find-care" className="btn btn-primary btn-full" onClick={() => setSelected(null)}>Find a specialist <ArrowRight size={16}/></Link></Modal>}
  </div>
}

function ShareReport({ doctors, report, notify }) {
  const [doctorId, setDoctorId] = useState(doctors[0]?.userId || '')
  const [sharing, setSharing] = useState(false)
  const share = async () => {
    if (!doctorId) return
    setSharing(true)
    try {
      const { data } = await api.post(`/reports/${report._id}/share`, { userId: doctorId })
      notify(data.message || 'Report shared with your care provider.')
    } catch (error) { notify(error.response?.data?.message || 'Sign in to manage report sharing.') }
    finally { setSharing(false) }
  }
  return <div className="share-report"><ShieldCheck size={15}/><label>Share with a care provider<select value={doctorId} onChange={e => setDoctorId(e.target.value)}>{doctors.map(d => <option key={d.userId} value={d.userId}>{d.name} · {d.specialization}</option>)}</select></label><button className="btn btn-light btn-sm" disabled={sharing} onClick={share}>{sharing ? 'Sharing…' : 'Share report'}</button></div>
}

function AvailabilityPanel({ doctors, role, sessionUser, onSave }) {
  const manageable = role === 'DOCTOR'
    ? doctors.filter(doctor => String(doctor._id) === String(sessionUser?.doctorId))
    : doctors.filter(doctor => String(doctor.hospitalId) === String(sessionUser?.hospitalId))
  const [doctorId, setDoctorId] = useState('')
  const doctor = manageable.find(item => String(item._id) === String(doctorId)) || manageable[0]
  const today = hyderabadToday()
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState([])
  const [newTime, setNewTime] = useState('')
  const existing = doctor?.availability?.find(day => day.date === date)?.slots || []
  useEffect(() => { setSlots(existing) }, [doctor?._id, date])
  const slotChoices = [...new Set([...existing, ...slots])].sort()
  const addTime = () => {
    if (!newTime) return
    const [rawHour, minute] = newTime.split(':').map(Number)
    const hour = rawHour % 12 || 12
    const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${rawHour >= 12 ? 'PM' : 'AM'}`
    setSlots(prev => [...new Set([...prev, label])].sort())
    setNewTime('')
  }
  if (!manageable.length) return <div className="empty-provider-panel"><Stethoscope size={18}/><span>No linked doctor profile is available for this account.</span></div>
  return <section className="panel availability-panel"><div className="panel-heading"><div><div className="eyebrow">SCHEDULE MANAGEMENT</div><h2>Doctor availability</h2></div><span className="availability-lock"><ShieldCheck size={14}/> Slot changes are checked at booking</span></div><div className="availability-controls"><label className="form-label">Doctor{role === 'HOSPITAL_ADMIN' && <select value={doctor?._id || ''} onChange={e => { setDoctorId(e.target.value); setSlots([]) }}>{manageable.map(item => <option key={item._id} value={item._id}>{item.name} · {item.specialization}</option>)}</select>}{role === 'DOCTOR' && <input value={`${doctor.name} · ${doctor.specialization}`} readOnly/>}</label><label className="form-label">Date<input type="date" value={date} onChange={e => { setDate(e.target.value); setSlots([]) }}/></label></div><div className="availability-slot-list">{slotChoices.map(slot => <label key={slot} className="availability-slot"><input type="checkbox" checked={slots.includes(slot)} onChange={e => setSlots(prev => e.target.checked ? [...new Set([...prev, slot])] : prev.filter(value => value !== slot))}/>{slot}</label>)}{!slotChoices.length && <span className="empty-slot-hint">No slots yet. Add a time below.</span>}</div><div className="availability-footer"><label className="add-time"><input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}/><button className="btn btn-light btn-sm" type="button" onClick={addTime}>Add time</button></label><button className="btn btn-primary btn-sm" onClick={() => onSave(doctor._id, date, slots)}>Save availability</button></div></section>
}

function DoctorManager({ doctors, hospitalId, onAddDoctor }) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('General Physician')
  const [experienceYears, setExperienceYears] = useState('')
  const [consultationFee, setConsultationFee] = useState('')
  const team = doctors.filter(doctor => String(doctor.hospitalId) === String(hospitalId))
  const submit = event => { event.preventDefault(); onAddDoctor({ name: name.trim(), specialization, hospitalId, experienceYears: Number(experienceYears || 0), consultationFee: Number(consultationFee || 0) }); setName(''); setExperienceYears(''); setConsultationFee('') }
  return <section className="panel doctor-manager"><div className="panel-heading"><div><div className="eyebrow">HOSPITAL DIRECTORY</div><h2>Doctors & departments</h2></div><button className="btn btn-light btn-sm" onClick={() => setExpanded(!expanded)}>{expanded ? 'Close' : 'Add a doctor'}</button></div><div className="provider-doctor-list">{team.map(doctor => <div key={doctor._id}><span className="doctor-avatar mint">{doctor.initials || 'DR'}</span><span><b>{doctor.name}</b><small>{doctor.specialization} · {doctor.experience || `${doctor.experienceYears || 0} years`}</small></span><span className="provider-fee">₹{doctor.fee || doctor.consultationFee || 0}</span></div>)}</div>{expanded && <form className="doctor-add-form" onSubmit={submit}><label className="form-label">Doctor name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Full Name"/></label><label className="form-label">Specialty<select value={specialization} onChange={e => setSpecialization(e.target.value)}>{['General Physician', 'Cardiologist', 'Endocrinologist', 'Diabetologist', 'Dermatologist', 'Neurologist', 'Nephrologist', 'Orthopedist', 'Gastroenterologist', 'Ophthalmologist'].map(spec => <option key={spec}>{spec}</option>)}</select></label><label className="form-label">Experience (years)<input type="number" min="0" max="60" value={experienceYears} onChange={e => setExperienceYears(e.target.value)}/></label><label className="form-label">Visit fee (₹)<input type="number" min="0" max="100000" value={consultationFee} onChange={e => setConsultationFee(e.target.value)}/></label><button className="btn btn-primary btn-sm" disabled={!hospitalId}>Add doctor to hospital</button></form>}</section>
}

export function TrendsPage({ reports }) {
  const [metric, setMetric] = useState('HbA1c')
  const metricData = useMemo(() => {
    const found = reports.flatMap(r => (r.extractedParameters || []).filter(p => p.name.toLowerCase().includes(metric.toLowerCase())).map(p => ({ date: new Date(`${r.uploadDate}T12:00:00`).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), uploadDate: r.uploadDate, value: Number(p.value), unit: p.unit }))).sort((a, b) => a.uploadDate.localeCompare(b.uploadDate))
    if (found.length) return found
    return []
  }, [reports, metric])
  const first = metricData[0]?.value; const last = metricData.at(-1)?.value
  const metricTileValue = (name) => {
    const term = name === 'Blood glucose' ? 'glucose' : name.toLowerCase()
    const matches = reports.flatMap(report => (report.extractedParameters || []).filter(p => p.name.toLowerCase().includes(term)).map(p => ({ date: report.uploadDate, value: p.value, unit: p.unit }))).sort((a, b) => a.date.localeCompare(b.date))
    return matches.length ? `${matches.at(-1).value} ${matches.at(-1).unit}` : 'No records yet'
  }
  const comparisonText = metricData.length > 1
    ? `The recorded value changed from ${first} to ${last} across the selected reports.`
    : metricData.length === 1 ? 'Only one recorded value is available, so there is not yet a comparison.' : 'Upload reports with this parameter to see recorded values over time.'
  return <div className="page fade-in">
    <div className="page-title-row"><div><div className="eyebrow">A CLEARER PICTURE OVER TIME</div><h1>Your health trends</h1><p>See how values in your reports change over time.</p></div><Link to="/reports" className="btn btn-secondary"><FileText size={16}/> View reports</Link></div>
    <section className="panel big-trend-panel">
      <div className="trend-toolbar"><div><div className="eyebrow">REPORTED VALUES</div><h2>{metric} <span className="metric-unit">{metricData.at(-1)?.unit}</span></h2></div><label className="select-filter"><Activity size={15}/><select value={metric} onChange={e => setMetric(e.target.value)}><option>HbA1c</option><option>Hemoglobin</option><option>Creatinine</option><option>Glucose</option></select><ChevronDown size={14}/></label></div>
      <div className="trend-big-value">{last ?? '—'} <small>{metricData.at(-1)?.unit}</small><span className="trend-change">{metricData.length > 1 ? `Recorded ${first === last ? 'at a similar level' : last > first ? 'higher' : 'lower'} than first selected report` : metricData.length === 1 ? 'One report recorded' : 'No values recorded yet'}</span></div>
      <div className="big-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={metricData} margin={{ top: 18, right: 12, left: -20, bottom: 0 }}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#168b7e" stopOpacity={0.18}/><stop offset="100%" stopColor="#168b7e" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="4 5" vertical={false} stroke="#e9efed"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#95a29f', fontSize: 11 }}/><YAxis domain={metricData.length ? ['dataMin - 0.3', 'dataMax + 0.3'] : [0, 1]} tickLine={false} axisLine={false} tick={{ fill: '#95a29f', fontSize: 10 }}/><Tooltip contentStyle={{ border: '1px solid #e7efed', borderRadius: 12 }}/><Area type="monotone" dataKey="value" stroke="#168b7e" strokeWidth={2.5} fill="url(#trendFill)" activeDot={{ r: 5, strokeWidth: 3, fill: '#fff' }}/></AreaChart></ResponsiveContainer></div>
      <div className="trend-neutral-note"><Activity size={16}/><span>{comparisonText} This comparison does not indicate a diagnosis or disease progression.</span></div>
    </section>
    <div className="trend-tiles">{['Blood glucose', 'HbA1c', 'Hemoglobin', 'Cholesterol', 'Blood pressure', 'Creatinine'].map((name, i) => <button key={name} className={`trend-tile ${metric === (name === 'Blood glucose' ? 'Glucose' : name) ? 'selected' : ''}`} onClick={() => setMetric(name === 'Blood glucose' ? 'Glucose' : name)}><span className={`metric-tile-icon metric-${i}`}><Activity size={16}/></span><b>{name}</b><span>{metricTileValue(name)}</span><ChevronRight size={15}/></button>)}</div>
    <p className="medical-disclaimer">Values and comparisons are presented as recorded in uploaded reports. Reference intervals vary by laboratory and individual factors. Discuss results with your healthcare professional.</p>
  </div>
}

export function SettingsPage({ city, setCity, notify, sessionUser }) {
  const initials = sessionUser?.name?.split(/\s+/).slice(0, 2).map(word => word[0]).join('') || 'U'
  return <div className="page fade-in"><div className="page-title-row"><div><div className="eyebrow">YOUR ACCOUNT</div><h1>Settings</h1><p>Manage your profile, location and privacy preferences.</p></div></div><div className="settings-grid"><section className="panel settings-panel"><div className="settings-heading"><div className="settings-avatar">{initials}</div><div><h2>{sessionUser?.name || 'Your account'}</h2><span>{sessionUser?.role === 'PATIENT' ? 'Patient account' : sessionUser?.role === 'DOCTOR' ? 'Doctor account' : sessionUser?.role === 'HOSPITAL_ADMIN' ? 'Hospital admin account' : 'Account'}</span></div><button className="btn btn-light btn-sm" onClick={() => notify('Profile editing is available in the connected API.')}>Edit profile</button></div><div className="settings-line"><div><b>Home location</b><span>Used to find nearby doctors and hospitals</span></div><label className="select-filter"><MapPin size={15}/><select value={city} onChange={e => setCity(e.target.value)}>{['Hyderabad', 'Secunderabad', 'Bengaluru', 'Chennai', 'Visakhapatnam'].map(x => <option key={x}>{x}</option>)}</select><ChevronDown size={14}/></label></div><div className="settings-line"><div><b>Report sharing</b><span>Care providers need your permission to view reports</span></div><span className="privacy-on"><ShieldCheck size={15}/> Permission required</span></div><div className="settings-line"><div><b>Language preference</b><span>Report explanations and care guidance</span></div><select className="native-select"><option>English</option><option>తెలుగు (Telugu)</option></select></div></section><section className="settings-safety"><ShieldCheck size={20}/><b>Your data deserves care.</b><p>Medical reports are sensitive. Only share them with a doctor or hospital when you choose to.</p><Link to="/reports">Review my reports <ArrowRight size={15}/></Link></section></div></div>
}

export function AuthPage({ onLogin, notify }) {
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [role, setRole] = useState('PATIENT')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault(); setBusy(true)
    try {
      const path = isRegister ? '/auth/register' : '/auth/login'
      const { data } = await api.post(path, { name, email, password, role })
      localStorage.setItem('bma_token', data.token); localStorage.setItem('bma_role', data.user.role); localStorage.setItem('bma_user', JSON.stringify(data.user)); onLogin(data.user.role, data.user); navigate('/'); notify(`Welcome${data.user.name ? ', ' + data.user.name.split(' ')[0] : ''}.`)
    } catch (error) { notify(error.response?.data?.message || 'Unable to reach the account service. Check the API connection and try again.'); }
    finally { setBusy(false) }
  }
  return <div className="auth-page">
    <div className="auth-top"><Link to="/" className="brand auth-brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><b>BookMy</b><span>Appointment AI</span></div></Link><span>Already have an account? <button onClick={() => setIsRegister(false)}>Sign in</button></span></div>
    <div className="auth-content">
      <div className="auth-form-side">
        <div className="eyebrow">A CALMER WAY TO MANAGE YOUR HEALTH</div>
        <h1>{isRegister ? 'Start with a little clarity.' : 'Welcome back.'}</h1>
        <p>{isRegister ? 'Create your secure account and bring your care together.' : 'Sign in to continue your health journey.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && <label className="form-label">Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name"/></label>}
          <label className="form-label">Email address<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/></label>
          <label className="form-label">Password<input type="password" required minLength="8" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
          {!isRegister && <label className="form-label">I’m signing in as<select value={role} onChange={e => setRole(e.target.value)}><option value="PATIENT">Patient</option><option value="DOCTOR">Doctor</option><option value="HOSPITAL_ADMIN">Hospital admin</option></select></label>}
          <button className="btn btn-primary btn-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16}/></button>
        </form>
        <div className="auth-toggle">{isRegister ? 'Already registered?' : 'New to BookMyAppointment?'} <button onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Sign in' : 'Create an account'}</button></div>
        <p className="auth-safe"><ShieldCheck size={14}/> Your health information is protected.</p>
      </div>
      <div className="auth-visual"><div className="auth-visual-label"><span className="pulse-dot"/> CARE THAT FEELS A LITTLE CLOSER</div><div className="auth-quote"><span>“</span><h2>Understand your health.<br/><em>Find your next step.</em></h2><p>Clear information can help you feel more prepared for a conversation with your doctor.</p></div><div className="auth-feature-card"><div className="feature-mini-icon"><Sparkles size={16}/></div><div><b>Thoughtful, not diagnostic</b><span>AI insights to support care conversations</span></div><CheckCircle2 size={17}/></div><div className="auth-art-circle circle-a"/><div className="auth-art-circle circle-b"/><div className="auth-art-cross">✳</div></div>
    </div>
    <div className="auth-disclaimer">BookMyAppointment AI provides informational support and does not provide a medical diagnosis.</div>
  </div>
}
