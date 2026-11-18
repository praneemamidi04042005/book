import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { DashboardPage, FindCarePage, AppointmentsPage, ReportsPage, TrendsPage, SettingsPage, AuthPage } from './pages/PatientPages'
import api from './services/api'

export default function App() {
  const locationRoute = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [city, setCity] = useState(localStorage.getItem('bma_city') || 'Hyderabad')
  const [role, setRole] = useState(localStorage.getItem('bma_role') || 'PATIENT')
  const [sessionUser, setSessionUser] = useState(() => { try { return JSON.parse(localStorage.getItem('bma_user')) || { role: 'PATIENT' } } catch { return { role: 'PATIENT' } } })
  const [appointments, setAppointments] = useState([])
  const [reports, setReports] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [doctors, setDoctors] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRefresh, setCatalogRefresh] = useState(0)
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem('bma_city', city)
  }, [city])
  useEffect(() => {
    if (locationRoute.pathname === '/login') return
    let active = true
    setHospitals([])
    setDoctors([])
    setCatalogError('')
    setCatalogLoading(true)
    const refreshLiveData = () => Promise.allSettled([
      api.get('/hospitals', { params: { city } }).then(({ data }) => data),
      api.get('/doctors', { params: { city } }).then(({ data }) => data),
      api.get('/appointments').then(({ data }) => data),
      api.get('/reports').then(({ data }) => data),
    ]).then(([h, d, a, r]) => {
      if (!active) return
      if (h.status === 'fulfilled' && Array.isArray(h.value)) setHospitals(h.value)
      if (d.status === 'fulfilled' && Array.isArray(d.value)) setDoctors(d.value)
      if (a.status === 'fulfilled' && Array.isArray(a.value)) setAppointments(a.value)
      if (r.status === 'fulfilled' && Array.isArray(r.value)) setReports(r.value)
      const failedCatalogRequest = [h, d].find(request => request.status === 'rejected')
      if (failedCatalogRequest) setCatalogError(failedCatalogRequest.reason?.response?.data?.message || 'Could not load doctors and hospitals. Please try again.')
      setCatalogLoading(false)
    })
    refreshLiveData()
    const refreshTimer = window.setInterval(refreshLiveData, 5000)
    return () => { active = false; window.clearInterval(refreshTimer) }
  }, [locationRoute.pathname, city, catalogRefresh])

  const changeCity = (nextCity) => {
    setCity(nextCity)
    localStorage.setItem('bma_city', nextCity)
    if (localStorage.getItem('bma_token')) {
      api.put('/users/profile', { city: nextCity }).then(({ data }) => {
        setSessionUser(data)
        localStorage.setItem('bma_user', JSON.stringify(data))
      }).catch(() => notify('Location changed on this device, but could not be saved to your account.'))
    }
  }

  const notify = (message) => {
    setToast(message)
    window.clearTimeout(window.__bmaToast)
    window.__bmaToast = window.setTimeout(() => setToast(''), 3200)
  }
  const book = async (details) => {
    try {
      const { data } = await api.post('/appointments/book', details)
      setAppointments(prev => [data, ...prev])
      setCatalogRefresh(value => value + 1)
    } catch (error) {
      notify(error.response?.data?.message || 'The appointment could not be booked. Sign in and try again.')
      if (error.response?.status === 409) setCatalogRefresh(value => value + 1)
      return false
    }
    notify('Your appointment is booked. Details are ready in My appointments.')
    return true
  }
  const cancelAppointment = async (id) => {
    try { await api.post(`/appointments/${id}/cancel`) } catch (error) { notify(error.response?.data?.message || 'The appointment could not be cancelled.'); return }
    setAppointments(prev => prev.map(item => item._id === id ? { ...item, status: 'CANCELLED' } : item))
    notify('Appointment cancelled.')
  }
  const updateAppointmentStatus = async (id, status) => {
    try { await api.patch(`/appointments/${id}/status`, { status }) } catch (error) { notify(error.response?.data?.message || 'Appointment status could not be updated.'); return }
    setAppointments(prev => prev.map(item => item._id === id ? { ...item, status } : item))
    notify(`Appointment marked ${status.toLowerCase()}.`)
  }
  const updateAppointmentNotes = async (id, notes) => {
    try { await api.patch(`/appointments/${id}/notes`, { notes }) } catch (error) { notify(error.response?.data?.message || 'The appointment note could not be saved.'); return }
    setAppointments(prev => prev.map(item => item._id === id ? { ...item, providerNotes: notes } : item))
    notify('Appointment note saved.')
  }
  const updateAvailability = async (doctorId, date, slots) => {
    try { await api.post(`/doctors/${doctorId}/availability`, { date, slots }) } catch (error) { notify(error.response?.data?.message || 'Availability could not be updated.'); return }
    setDoctors(prev => prev.map(doctor => doctor._id === doctorId ? { ...doctor, availability: [...(doctor.availability || []).filter(day => day.date !== date), { date, slots }], slots } : doctor))
    notify('Availability updated.')
  }
  const addDoctor = async (values) => {
    try {
      const { data } = await api.post('/doctors', values)
      setDoctors(prev => [...prev, data]); notify('Doctor added to the hospital team.')
    } catch (error) {
      notify(error.response?.data?.message || 'Doctor could not be added.')
    }
  }
  const addReport = (report) => setReports(prev => [report, ...prev])
  const isAuth = locationRoute.pathname === '/login'

  return <div className={isAuth ? 'auth-frame' : 'app-frame'}>
    {!isAuth && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
    <main className={isAuth ? 'auth-main' : 'main-area'}>
      {!isAuth && <Header onMenu={() => setSidebarOpen(true)} location={city} setLocation={changeCity} role={role} user={sessionUser} />}
      <div className={isAuth ? '' : 'page-container'}>
        <Routes>
          <Route path="/login" element={<AuthPage onLogin={(selectedRole, user) => { setRole(selectedRole); setSessionUser(user); if (user.city) { setCity(user.city); localStorage.setItem('bma_city', user.city) } localStorage.setItem('bma_role', selectedRole); localStorage.setItem('bma_user', JSON.stringify(user)) }} notify={notify} />} />
          <Route path="/" element={<DashboardPage appointments={appointments} reports={reports} doctors={doctors} hospitals={hospitals} role={role} city={city} sessionUser={sessionUser} onUpdateStatus={updateAppointmentStatus} onUpdateNotes={updateAppointmentNotes} onUpdateAvailability={updateAvailability} onAddDoctor={addDoctor} />} />
          <Route path="/find-care" element={<FindCarePage doctors={doctors} hospitals={hospitals} city={city} onBook={book} notify={notify} catalogLoading={catalogLoading} catalogError={catalogError} />} />
          <Route path="/appointments" element={<AppointmentsPage appointments={appointments} onCancel={cancelAppointment} onUpdateStatus={updateAppointmentStatus} onUpdateNotes={updateAppointmentNotes} role={role} />} />
          <Route path="/reports" element={<ReportsPage reports={reports} onAddReport={addReport} notify={notify} role={role} appointments={appointments} doctors={doctors} />} />
          <Route path="/health-trends" element={<TrendsPage reports={reports} />} />
          <Route path="/settings" element={<SettingsPage city={city} setCity={changeCity} notify={notify} sessionUser={sessionUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
    {toast && <div className="toast"><span className="toast-check">✓</span>{toast}</div>}
  </div>
}
