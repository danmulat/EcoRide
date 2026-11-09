import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDownUp,
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  Leaf,
  MapPin,
  Menu,
  Navigation,
  PhoneCall,
  Plus,
  Route,
  Search,
  Share2,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Star,
  UsersRound,
  X,
} from 'lucide-react'

type Ride = {
  id: number
  from: string
  to: string
  date: string
  time: string
  duration: string
  price: number
  seats: number
  driver: string
  initials: string
  rating: number
  trips: number
  car: string
  color: string
}

type View = 'find' | 'trips' | 'track' | 'impact' | 'profile'
type DemoProfileId = 'yohanna' | 'lydia'

const demoProfiles: Record<DemoProfileId, { name: string; initials: string; role: 'Driver' | 'Passenger'; color: string; car: string }> = {
  yohanna: { name: 'Yohanna', initials: 'YO', role: 'Driver', color: 'green', car: 'Toyota Vitz' },
  lydia: { name: 'Lydia', initials: 'LY', role: 'Passenger', color: 'peach', car: 'Honda Fit' },
}

const initialRides: Ride[] = [
  { id: 1, from: 'Westlands, Nairobi', to: 'Kilimani, Nairobi', date: 'Today', time: '08:15', duration: '25 min', price: 180, seats: 2, driver: 'Amina Wanjiru', initials: 'AW', rating: 4.9, trips: 38, car: 'Toyota Axio', color: 'lilac' },
  { id: 2, from: 'Kasarani, Nairobi', to: 'Upper Hill, Nairobi', date: 'Today', time: '08:40', duration: '40 min', price: 250, seats: 3, driver: 'Brian Ochieng', initials: 'BO', rating: 4.8, trips: 24, car: 'Mazda CX-5', color: 'blue' },
  { id: 3, from: 'Karen, Nairobi', to: 'Westlands, Nairobi', date: 'Today', time: '09:10', duration: '35 min', price: 300, seats: 1, driver: 'Njeri Kamau', initials: 'NK', rating: 5.0, trips: 16, car: 'Honda Fit', color: 'peach' },
  { id: 4, from: 'Thika, Kiambu', to: 'CBD, Nairobi', date: 'Tomorrow', time: '07:30', duration: '55 min', price: 420, seats: 2, driver: 'David Mwangi', initials: 'DM', rating: 4.9, trips: 52, car: 'Subaru Impreza', color: 'green' },
]

const navItems: { id: View; label: string; icon: typeof Compass }[] = [
  { id: 'find', label: 'Find a ride', icon: Compass },
  { id: 'trips', label: 'My trips', icon: CalendarDays },
  { id: 'track', label: 'Live tracking', icon: Navigation },
  { id: 'impact', label: 'My impact', icon: Leaf },
  { id: 'profile', label: 'Profile', icon: UsersRound },
]

const plates: Record<number, string> = { 1: 'KDA 482M', 2: 'KCY 317B', 3: 'KDE 905H', 4: 'KCT 226K' }
const plateFor = (ride: Ride) => plates[ride.id] ?? 'KDG 118P'
const minutesOf = (duration: string) => Number.parseInt(duration, 10) || 30
const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(':').map(Number)
  const total = ((h || 0) * 60 + (m || 0) + minutes) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

type TrackedTrip = { ride: Ride; isSample: boolean; progress: number; minutesLeft: number; kmLeft: number; plate: string; eta: string }

/** Simulated vehicle progress (0–100) that advances every few seconds and loops. */
function useTripProgress() {
  const [progress, setProgress] = useState(38)
  useEffect(() => {
    const timer = window.setInterval(() => setProgress((current) => (current >= 100 ? 12 : Math.min(100, current + 3))), 3000)
    return () => window.clearInterval(timer)
  }, [])
  return progress
}

/** Point along the quadratic route curve used by the mini maps. */
const routePoint = (t: number, w: number, h: number) => {
  const p0 = { x: w * 0.1, y: h * 0.78 }
  const c = { x: w * 0.45, y: h * -0.15 }
  const p1 = { x: w * 0.9, y: h * 0.3 }
  const u = 1 - t
  return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y, p0, c, p1 }
}

const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`
const formatRideDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
  ? new Date(`${date}T00:00:00`).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
  : date

function App() {
  const [view, setView] = useState<View>('find')
  const [activeProfileId, setActiveProfileId] = useState<DemoProfileId>('lydia')
  const [rides, setRides] = useState(initialRides)
  const [origin, setOrigin] = useState('Nairobi')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [searched, setSearched] = useState(false)
  const [bookedIds, setBookedIds] = useState<number[]>([])
  const [acceptedRideIds, setAcceptedRideIds] = useState<number[]>([])
  const [modal, setModal] = useState<'offer' | 'rate' | null>(null)
  const [rating, setRating] = useState(0)
  const [ratedProfiles, setRatedProfiles] = useState<Record<DemoProfileId, boolean>>({ yohanna: false, lydia: false })
  const [toast, setToast] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const activeProfile = demoProfiles[activeProfileId]
  const nextProfileId: DemoProfileId = activeProfileId === 'lydia' ? 'yohanna' : 'lydia'
  const rated = ratedProfiles[activeProfileId]
  const ratingTarget = activeProfile.role === 'Driver' ? 'passenger' : 'driver'
  const ratingProfile = demoProfiles[activeProfileId === 'lydia' ? 'yohanna' : 'lydia']
  const progress = useTripProgress()

  const trackedTrip: TrackedTrip = useMemo(() => {
    const bookedRides = rides.filter((ride) => bookedIds.includes(ride.id))
    const ownRide = activeProfile.role === 'Driver' ? rides.find((ride) => ride.driver === activeProfile.name) : undefined
    const ride = ownRide ?? bookedRides.find((r) => acceptedRideIds.includes(r.id)) ?? bookedRides[0] ?? rides.find((r) => r.id === 1) ?? initialRides[0]
    const isSample = !ownRide && bookedRides.length === 0
    const total = minutesOf(ride.duration)
    const minutesLeft = Math.max(0, Math.round(total * (1 - progress / 100)))
    const kmLeft = Math.max(0, Math.round(total * 0.42 * (1 - progress / 100) * 10) / 10)
    return { ride, isSample, progress, minutesLeft, kmLeft, plate: plateFor(ride), eta: addMinutes(ride.time, total) }
  }, [acceptedRideIds, activeProfile, bookedIds, progress, rides])

  const shareTrip = async () => {
    const link = `${window.location.origin}${import.meta.env.BASE_URL}#track-${trackedTrip.ride.id}`
    try { await navigator.clipboard.writeText(link) } catch { /* clipboard may be unavailable */ }
    showToast('Live trip link copied, share it with someone you trust')
  }
  const triggerSos = () => showToast('SOS sent: trusted contacts alerted with your live location (demo)')

  const filteredRides = useMemo(() => {
    if (!searched) return rides
    const fromQuery = origin.trim().toLowerCase()
    const toQuery = destination.trim().toLowerCase()
    const selectedDay = date ? new Date(`${date}T00:00:00`) : null
    const selectedDayLabel = selectedDay
      ? selectedDay.toDateString() === new Date().toDateString()
        ? 'Today'
        : selectedDay.toDateString() === new Date(Date.now() + 86400000).toDateString()
          ? 'Tomorrow'
          : ''
      : ''
    return rides.filter((ride) => {
      const matchesFrom = !fromQuery || ride.from.toLowerCase().includes(fromQuery) || fromQuery === 'kenya'
      const matchesTo = !toQuery || ride.to.toLowerCase().includes(toQuery)
      const matchesDate = !selectedDay || ride.date === selectedDayLabel || ride.date === date
      return matchesFrom && matchesTo && matchesDate
    })
  }, [date, destination, origin, rides, searched])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3000)
  }

  const switchDemoProfile = () => {
    setActiveProfileId(nextProfileId)
    if (nextProfileId === 'lydia' && acceptedRideIds.length > 0) {
      showToast('Yohanna accepted your seat request')
    } else {
      showToast(`Switched to ${demoProfiles[nextProfileId].name} · ${demoProfiles[nextProfileId].role}`)
    }
  }

  const bookRide = (ride: Ride) => {
    if (bookedIds.includes(ride.id) || ride.seats < 1) return
    setBookedIds((current) => [...current, ride.id])
    setRides((current) => current.map((currentRide) => currentRide.id === ride.id ? { ...currentRide, seats: currentRide.seats - 1 } : currentRide))
    showToast(`Seat request sent to ${ride.driver.split(' ')[0]}`)
  }

  const acceptRideRequest = (rideId: number) => {
    setAcceptedRideIds((current) => current.includes(rideId) ? current : [...current, rideId])
    showToast('You accepted Lydia’s seat request')
  }

  const submitOffer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const newRide: Ride = {
      id: Date.now(),
      from: String(form.get('from')),
      to: String(form.get('to')),
      date: String(form.get('date')) || 'Tomorrow',
      time: String(form.get('time')) || '08:00',
      duration: '45 min',
      price: Number(form.get('price')) || 250,
      seats: Number(form.get('seats')) || 1,
      driver: activeProfile.name,
      initials: activeProfile.initials,
      rating: 4.9,
      trips: 12,
      car: String(form.get('car')) || activeProfile.car,
      color: activeProfile.color,
    }
    setRides((current) => [newRide, ...current])
    setModal(null)
    setView('find')
    setSearched(false)
    showToast('Your ride is now listed')
  }

  const submitRating = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating === 0) return
    setRatedProfiles((current) => ({ ...current, [activeProfileId]: true }))
    setModal(null)
    showToast(`Thanks for rating your ${ratingTarget}`)
  }

  const pageTitle = {
    find: 'Find your next ride',
    trips: 'Your trips',
    track: 'Live trip tracking',
    impact: 'Your impact',
    profile: 'Your profile',
  }[view]

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#home" onClick={() => setView('find')} aria-label="EcoRide home">
          <img className="brand-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={34} height={34} />
          <span>eco<span>ride</span></span>
        </a>
        <div className="sidebar-label">MENU</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? 'nav-active' : ''}`} onClick={() => { setView(id); setMobileNavOpen(false) }}>
              <Icon size={18} strokeWidth={1.9} />
              <span>{label}</span>
              {id === 'trips' && bookedIds.length > 0 && <span className="nav-count">{bookedIds.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /><span>Help centre</span><ArrowRight size={14} /></div>
          <button className="sidebar-profile profile-switch" onClick={switchDemoProfile} aria-label={`Switch to ${demoProfiles[nextProfileId].name}, ${demoProfiles[nextProfileId].role}`}>
            <div className={`avatar avatar-${activeProfile.color}`}>{activeProfile.initials}</div>
            <div className="sidebar-profile-copy"><strong>{activeProfile.name}</strong><span>{activeProfile.role} demo · switch</span></div>
            <ArrowLeftRight size={16} />
          </button>
          <div className="sidebar-footnote">MADE FOR THE WAY WE MOVE <span>·</span> KENYA</div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
          <div className="location-label"><MapPin size={15} /><span>Nairobi, Kenya</span><ChevronDown size={14} /></div>
          <div className="topbar-right">
            <span className="topbar-date">Tuesday, 20 October</span>
            <button className="icon-button topbar-help" aria-label="Help"><CircleHelp size={18} /></button>
            <button className="topbar-user" onClick={switchDemoProfile} aria-label={`Switch to ${demoProfiles[nextProfileId].name}, ${demoProfiles[nextProfileId].role}`} title={`Switch to ${demoProfiles[nextProfileId].name}`}><span className={`avatar avatar-${activeProfile.color}`}>{activeProfile.initials}</span><span className="topbar-profile-copy"><strong>{activeProfile.name}</strong><small>{activeProfile.role}</small></span><ArrowLeftRight size={14} /></button>
          </div>
        </header>

        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow">TUESDAY, 20 OCTOBER 2026 <span className="eyebrow-dot" /></div>
              <h1>{view === 'find' ? <>Good morning, {activeProfile.name}<span className="title-period">.</span></> : pageTitle}</h1>
              <p>{view === 'find' ? 'A better way to get there starts here.' : view === 'trips' ? 'All the places you’re going, in one place.' : view === 'track' ? 'Know where your ride is, every step of the way.' : view === 'impact' ? 'Every shared seat adds up to a lighter journey.' : 'A little about the person behind the wheel.'}</p>
            </div>
            {activeProfile.role === 'Driver' && <button className="button button-dark heading-action" onClick={() => setModal('offer')}><Plus size={17} /> Offer a ride</button>}
          </div>

          {view === 'find' && (
            <div className="dashboard-grid">
              <section className="primary-column">
                <SearchPanel origin={origin} destination={destination} date={date} onOrigin={setOrigin} onDestination={setDestination} onDate={setDate} onSearch={() => { setSearched(true); window.setTimeout(() => document.getElementById('ride-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }} onSwap={() => { setOrigin(destination); setDestination(origin) }} />
                <section className="rides-section" id="ride-results">
                  <div className="section-heading">
                    <div><div className="section-kicker">GOOD RIDES, CLOSE BY</div><h2>{searched ? 'Matching rides' : 'Rides around you'} <span className="result-count">{filteredRides.length}</span></h2></div>
                    <button className="filter-button" onClick={() => { setOrigin(''); setDestination(''); setDate(''); setSearched(false) }}><SlidersHorizontal size={15} /> <span>{searched ? 'Clear search' : 'All rides'}</span></button>
                  </div>
                  {filteredRides.length > 0 ? <div className="ride-list">{filteredRides.map((ride) => <RideCard key={ride.id} ride={ride} isBooked={bookedIds.includes(ride.id)} canRequest={activeProfile.role === 'Passenger'} onBook={() => bookRide(ride)} onSwitchProfile={switchDemoProfile} />)}</div> : <div className="empty-state"><span className="empty-icon"><Search size={21} /></span><h3>No rides on this route just yet</h3><p>Try a nearby area or clear your search to see all available rides.</p><button className="text-button" onClick={() => { setOrigin(''); setDestination(''); setDate(''); setSearched(false) }}>Show all rides <ArrowRight size={15} /></button></div>}
                </section>
              </section>
              <aside className="right-column">
                <ImpactCard onOpen={() => setView('impact')} />
                <TrackingCard trip={trackedTrip} isDriver={activeProfile.role === 'Driver'} onOpen={() => setView('track')} onShare={shareTrip} onSos={triggerSos} />
                <div className="road-card">
                  <img src="https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=85" alt="A car ready for the road" />
                  <div className="road-card-overlay" />
                  <div className="road-card-copy"><span className="road-tag"><Sparkles size={12} /> THE ECO WAY</span><h3>Good company.<br />Lighter journeys.</h3><span className="road-caption">One shared ride makes a difference.</span></div>
                </div>
                <div className="safety-note"><span className="safety-icon"><ShieldCheck size={17} /></span><p><strong>Ride with confidence</strong><br />Every member is verified, and every ride is rated.</p><BadgeCheck size={16} className="safety-check" /></div>
              </aside>
            </div>
          )}

          {view === 'trips' && <TripsView rides={rides} bookedIds={bookedIds} acceptedRideIds={acceptedRideIds} profile={activeProfile} rated={rated} onAccept={acceptRideRequest} onRate={() => { setRating(0); setModal('rate') }} />}
          {view === 'track' && <TrackingView trip={trackedTrip} isDriver={activeProfile.role === 'Driver'} onShare={shareTrip} onSos={triggerSos} onFind={() => setView('find')} />}
          {view === 'impact' && <ImpactView onFind={() => setView('find')} />}
          {view === 'profile' && <ProfileView profile={activeProfile} onTrips={() => setView('trips')} />}
        </div>
      </main>

      {modal === 'offer' && <Modal title="Offer a ride" subtitle={`Share your route, ${activeProfile.name}. Make the journey go further.`} onClose={() => setModal(null)}><OfferForm onSubmit={submitOffer} defaultCar={activeProfile.car} /></Modal>}
      {modal === 'rate' && <Modal title="How was your ride?" subtitle="Your feedback helps everyone travel with more confidence." onClose={() => setModal(null)}><form className="rating-form" onSubmit={submitRating}><div className="rating-person"><div className={`avatar avatar-${ratingProfile.color}`}>{ratingProfile.initials}</div><div><strong>{ratingProfile.name}</strong><span>Your {ratingTarget} · Sunday, 09:20</span></div></div><div className="star-picker" role="radiogroup" aria-label="Your rating">{[1, 2, 3, 4, 5].map((number) => <button key={number} type="button" className={number <= rating ? 'star-selected' : ''} onClick={() => setRating(number)} aria-label={`${number} star${number === 1 ? '' : 's'}`} aria-checked={rating === number} role="radio"><Star size={31} fill={number <= rating ? 'currentColor' : 'none'} /></button>)}</div><label className="field-label">A few words about the ride <textarea name="feedback" placeholder="What made the ride great? (optional)" rows={3} /></label><button className="button button-dark modal-submit" type="submit" disabled={rating === 0}>Share rating <ArrowRight size={16} /></button></form></Modal>}
      {toast && <div className="toast" role="status"><span className="toast-check"><Check size={15} /></span>{toast}</div>}
    </div>
  )
}

function SearchPanel({ origin, destination, date, onOrigin, onDestination, onDate, onSearch, onSwap }: { origin: string; destination: string; date: string; onOrigin: (value: string) => void; onDestination: (value: string) => void; onDate: (value: string) => void; onSearch: () => void; onSwap: () => void }) {
  return <div className="search-panel"><div className="search-panel-top"><div><span className="search-icon"><Compass size={17} /></span><div><h2>Where are you headed?</h2><p>Find a seat on a ride that’s already going your way.</p></div></div><span className="search-count"><span /> LIVE RIDES</span></div><div className="search-fields"><label className="search-field"><span>FROM</span><div className="field-control"><span className="field-dot dot-origin" /><input value={origin} onChange={(event) => onOrigin(event.target.value)} aria-label="From" placeholder="Your pickup point" /></div></label><button className="swap-button" onClick={onSwap} aria-label="Swap pickup and destination"><ArrowDownUp size={15} /></button><label className="search-field"><span>TO</span><div className="field-control"><MapPin size={16} className="destination-pin" /><input value={destination} onChange={(event) => onDestination(event.target.value)} aria-label="To" placeholder="Where to?" /></div></label><label className="search-field date-field"><span>WHEN</span><div className="field-control"><CalendarDays size={16} className="date-icon" /><input type="date" value={date} onChange={(event) => onDate(event.target.value)} aria-label="Travel date" /></div></label><button className="button button-green search-submit" onClick={onSearch}><Search size={17} /> Search rides</button></div><div className="search-footer"><span>POPULAR AROUND NAIROBI</span><button onClick={() => { onOrigin('Westlands'); onDestination('Kilimani'); onSearch() }}>Westlands <ArrowRight size={12} /> Kilimani</button><button onClick={() => { onOrigin('Karen'); onDestination('Westlands'); onSearch() }}>Karen <ArrowRight size={12} /> Westlands</button><button onClick={() => { onOrigin('Thika'); onDestination('CBD'); onSearch() }}>Thika <ArrowRight size={12} /> CBD</button></div></div>
}

function RideCard({ ride, isBooked, canRequest, onBook, onSwitchProfile }: { ride: Ride; isBooked: boolean; canRequest: boolean; onBook: () => void; onSwitchProfile: () => void }) {
  return (
    <article className="ride-card">
      <div className="ride-time"><strong>{ride.time}</strong><span>{formatRideDate(ride.date)}</span></div>
      <div className="ride-route">
        <div className="route-line"><span className="route-origin" /><span className="route-connector" /><span className="route-destination" /></div>
        <div className="route-stops"><div><strong>{ride.from}</strong><span>Pickup point</span></div><div><strong>{ride.to}</strong><span>Drop-off point</span></div></div>
      </div>
      <div className="ride-meta"><span><Clock3 size={13} /> {ride.duration}</span><span><CarFront size={14} /> {ride.car}</span><span><Leaf size={13} /> ~1.8 kg CO₂ saved</span></div>
      <div className="ride-footer">
        <div className="driver-info"><div className={`avatar avatar-${ride.color}`}>{ride.initials}</div><div className="driver-copy"><strong>{ride.driver} <BadgeCheck size={13} /></strong><span><Star size={12} fill="currentColor" /> {ride.rating.toFixed(1)} <i /> {ride.trips} rides</span></div></div>
        <div className="ride-price"><strong>{formatKES(ride.price)}</strong><span>per seat · {ride.seats} left</span></div>
        {canRequest
          ? <button className={`button ride-book ${isBooked ? 'booked-button' : ''}`} onClick={onBook} disabled={isBooked || ride.seats === 0}>{isBooked ? <><Check size={15} /> Requested</> : ride.seats === 0 ? 'Full' : <>Request seat <ArrowRight size={15} /></>}</button>
          : <button className="button ride-book" onClick={onSwitchProfile}><ArrowLeftRight size={14} /> Switch to Lydia</button>}
      </div>
    </article>
  )
}

function ImpactCard({ onOpen }: { onOpen: () => void }) {
  return <section className="impact-card"><div className="impact-card-top"><span className="impact-leaf"><Leaf size={17} /></span><span>YOUR SHARED IMPACT</span><button onClick={onOpen} aria-label="View impact details"><ArrowRight size={16} /></button></div><div className="impact-total">12.4 <span>kg</span></div><p>CO₂ avoided by sharing your rides</p><div className="impact-meter"><span /></div><div className="impact-card-bottom"><span><span className="meter-dot" /> 6 rides shared</span><span>THIS MONTH</span></div><div className="impact-divider" /><div className="impact-equivalent"><span className="tree-mark">✳</span><span>That’s like growing <strong>1 tree</strong> for a month</span></div></section>
}

const placeName = (place: string) => place.split(',')[0]

function RouteMap({ progress, width, height, from, to, large = false }: { progress: number; width: number; height: number; from: string; to: string; large?: boolean }) {
  const t = Math.min(1, Math.max(0, progress / 100))
  const car = routePoint(t, width, height)
  const { p0, c, p1 } = car
  const path = `M ${p0.x} ${p0.y} Q ${c.x} ${c.y} ${p1.x} ${p1.y}`
  // Travelled part of the curve, split at t with de Casteljau.
  const q0 = { x: p0.x + (c.x - p0.x) * t, y: p0.y + (c.y - p0.y) * t }
  const done = `M ${p0.x} ${p0.y} Q ${q0.x} ${q0.y} ${car.x} ${car.y}`
  return (
    <svg className={`track-map ${large ? 'track-map-large' : ''}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Vehicle ${Math.round(progress)}% of the way from ${placeName(from)} to ${placeName(to)}`}>
      <g className="track-streets">
        <path d={`M 0 ${height * 0.55} L ${width} ${height * 0.42}`} />
        <path d={`M ${width * 0.3} 0 L ${width * 0.36} ${height}`} />
        <path d={`M ${width * 0.68} 0 L ${width * 0.62} ${height}`} />
      </g>
      <path className="track-route" d={path} />
      <path className="track-route-done" d={done} />
      <circle className="track-origin" cx={p0.x} cy={p0.y} r={large ? 7 : 5} />
      <g className="track-destination" transform={`translate(${p1.x} ${p1.y})`}>
        <path d="M0 0 C -7 -9 -7 -16 0 -16 C 7 -16 7 -9 0 0 Z" transform={large ? 'scale(1.4)' : undefined} />
      </g>
      <g className="track-car" style={{ transform: `translate(${car.x}px, ${car.y}px)` }}>
        <circle className="track-car-pulse" r={large ? 16 : 11} />
        <circle className="track-car-dot" r={large ? 8 : 6} />
      </g>
      {large && <><text className="track-label" x={p0.x} y={p0.y + 22} textAnchor="start">{placeName(from)}</text><text className="track-label" x={p1.x} y={p1.y + 22} textAnchor="end">{placeName(to)}</text></>}
    </svg>
  )
}

function TrackingCard({ trip, isDriver, onOpen, onShare, onSos }: { trip: TrackedTrip; isDriver: boolean; onOpen: () => void; onShare: () => void; onSos: () => void }) {
  const { ride } = trip
  return (
    <section className="impact-card tracking-card" aria-label="Live trip tracking">
      <div className="impact-card-top"><span className="impact-leaf"><Navigation size={15} /></span><span>LIVE TRIP TRACKING</span><span className="live-pill"><span className="live-dot" /> {trip.isSample ? 'SAMPLE' : 'LIVE'}</span><button onClick={onOpen} aria-label="Open live tracking"><ArrowRight size={16} /></button></div>
      <RouteMap progress={trip.progress} width={240} height={92} from={ride.from} to={ride.to} />
      <div className="track-heading"><span>Heading to</span><strong>{ride.to}</strong></div>
      <div className="track-eta"><div className="impact-total">{trip.minutesLeft} <span>min</span></div><div className="track-eta-side"><span>{trip.kmLeft} km left</span><span>Arrives ~{trip.eta}</span></div></div>
      <div className="impact-meter"><span style={{ width: `${trip.progress}%` }} /></div>
      <div className="impact-card-bottom"><span><span className="meter-dot" /> {placeName(ride.from)} → {placeName(ride.to)}</span><span>{Math.round(trip.progress)}% THERE</span></div>
      <div className="impact-divider" />
      <div className="track-vehicle"><CarFront size={14} /><span><strong>{ride.car}</strong> · {trip.plate} · {isDriver ? 'shared with your passengers' : ride.driver}</span><BadgeCheck size={14} className="track-verified" /></div>
      <div className="track-actions"><button onClick={onShare}><Share2 size={13} /> Share trip</button><button className="track-sos" onClick={onSos}><Siren size={13} /> SOS</button></div>
    </section>
  )
}

function TrackingView({ trip, isDriver, onShare, onSos, onFind }: { trip: TrackedTrip; isDriver: boolean; onShare: () => void; onSos: () => void; onFind: () => void }) {
  const { ride } = trip
  const [deviationAlerts, setDeviationAlerts] = useState(true)
  const arrived = trip.progress >= 100
  const steps = [
    { label: 'Picked up', detail: `${placeName(ride.from)} · ${ride.time}`, state: 'done' },
    { label: arrived ? 'Route completed' : 'On the way', detail: arrived ? 'Stayed on the expected route' : `${trip.kmLeft} km to go · on expected route`, state: arrived ? 'done' : 'current' },
    { label: arrived ? 'Arrived' : 'Arriving', detail: `${placeName(ride.to)} · ~${trip.eta}`, state: arrived ? 'done' : 'next' },
  ]
  return (
    <div className="impact-page tracking-page">
      <section className="impact-hero tracking-hero">
        <div className="impact-hero-copy">
          <div className="section-kicker">{trip.isSample ? 'SAMPLE TRIP · REQUEST A SEAT TO TRACK YOURS' : isDriver ? 'YOUR VEHICLE · SHARED WITH PASSENGERS' : 'YOUR RIDE · LIVE'}</div>
          <h2>Heading to<br />{ride.to}</h2>
          <p>{isDriver ? 'Passengers and their trusted contacts can follow this trip in real time.' : 'Follow your ride in real time and share it with people you trust, so someone always knows where you are.'}</p>
          <div className="tracking-hero-actions"><button className="button button-light" onClick={onShare}><Share2 size={15} /> Share live trip</button><button className="button track-sos-large" onClick={onSos}><Siren size={15} /> SOS</button></div>
        </div>
        <div className="impact-hero-stat tracking-hero-stat">
          <RouteMap progress={trip.progress} width={320} height={140} from={ride.from} to={ride.to} large />
          <div className="hero-stat-divider" />
          <div className="impact-hero-details"><div><strong>{trip.minutesLeft} min</strong><span>time left</span></div><div><strong>{trip.kmLeft} km</strong><span>distance left</span></div><div><strong>~{trip.eta}</strong><span>arrival</span></div></div>
        </div>
      </section>
      <div className="impact-lower">
        <section className="impact-breakdown">
          <div className="section-heading"><div><div className="section-kicker">WHERE THE VEHICLE IS</div><h2>Trip timeline</h2></div><span className="trip-status"><span /> {Math.round(trip.progress)}% COMPLETE</span></div>
          <ol className="timeline">{steps.map((step) => <li key={step.label} className={`timeline-${step.state}`}><span className="timeline-marker">{step.state === 'done' ? <Check size={12} /> : step.state === 'current' ? <Navigation size={11} /> : <MapPin size={11} />}</span><div><strong>{step.label}</strong><span>{step.detail}</span></div></li>)}</ol>
          <div className="track-driver-row"><div className={`avatar avatar-${ride.color}`}>{ride.initials}</div><div><strong>{ride.driver} <BadgeCheck size={13} /></strong><span><Star size={11} fill="currentColor" /> {ride.rating.toFixed(1)} · {ride.car} · <b>{trip.plate}</b></span></div><span className="request-pill request-accepted"><span /> VERIFIED</span></div>
          <p className="track-note">Check that the plate and driver match before you get in. The location is simulated in this demo.</p>
        </section>
        <aside className="equivalency-card safety-tools">
          <span className="equivalency-icon"><ShieldCheck size={19} /></span>
          <div className="section-kicker">SAFETY TOOLS</div>
          <h3>Travel with peace of mind</h3>
          <ul className="safety-list">
            <li><Share2 size={15} /><div><strong>Share live trip</strong><span>Send a live link to friends or family</span></div><button onClick={onShare}>Share</button></li>
            <li><UsersRound size={15} /><div><strong>Trusted contacts</strong><span>2 contacts get your SOS alerts</span></div></li>
            <li><Route size={15} /><div><strong>Route deviation alerts</strong><span>Get notified if the car leaves the expected route</span></div><button role="switch" aria-checked={deviationAlerts} className={`toggle ${deviationAlerts ? 'toggle-on' : ''}`} onClick={() => setDeviationAlerts((on) => !on)} aria-label="Route deviation alerts"><i /></button></li>
            <li><PhoneCall size={15} /><div><strong>Emergency services</strong><span>Kenya: 999 or 112</span></div><a href="tel:112">Call</a></li>
          </ul>
          <button className="button track-sos-block" onClick={onSos}><Siren size={16} /> Send SOS alert</button>
          <button className="text-button" onClick={onFind}>Find another ride <ArrowRight size={14} /></button>
        </aside>
      </div>
    </div>
  )
}

function TripsView({ rides, bookedIds, acceptedRideIds, profile, rated, onAccept, onRate }: { rides: Ride[]; bookedIds: number[]; acceptedRideIds: number[]; profile: typeof demoProfiles[DemoProfileId]; rated: boolean; onAccept: (rideId: number) => void; onRate: () => void }) {
  const isDriver = profile.role === 'Driver'
  const upcoming = isDriver ? rides.filter((ride) => ride.driver === profile.name) : rides.filter((ride) => bookedIds.includes(ride.id))
  return (
    <div className="subpage-grid">
      <section className="trips-main">
        <div className="section-heading">
          <div><div className="section-kicker">YOUR JOURNEYS</div><h2>{isDriver ? 'Your offered rides' : 'Upcoming rides'} <span className="result-count">{upcoming.length}</span></h2></div>
          <span className="trip-status"><span /> {isDriver ? 'YOUR LISTINGS' : 'SEAT REQUESTS'}</span>
        </div>
        {upcoming.length ? <div className="ride-list">{upcoming.map((ride) => (
          <div className="trip-card" key={ride.id}>
            <div className="trip-date-block"><strong>{ride.time}</strong><span>{formatRideDate(ride.date)}</span></div>
            <div className="trip-route-copy"><span>{ride.from}</span><ArrowRight size={15} /><strong>{ride.to}</strong></div>
            {isDriver ? <>
              <div className="trip-driver"><div className={`avatar avatar-${ride.color}`}>{ride.initials}</div><div><strong>{ride.driver}</strong><span>{formatKES(ride.price)} · {ride.seats} seats available</span></div></div>
              {bookedIds.includes(ride.id)
                ? <div className="driver-request"><div className="avatar avatar-peach">LY</div><span className="requester-copy"><strong>Lydia</strong><small>Seat request</small></span>{acceptedRideIds.includes(ride.id) ? <span className="request-pill request-accepted"><span /> ACCEPTED</span> : <button className="accept-button" onClick={() => onAccept(ride.id)}><Check size={13} /> Accept</button>}</div>
                : <span className="request-pill"><span /> LISTED</span>}
            </> : <>
              <div className="trip-driver"><div className={`avatar avatar-${ride.color}`}>{ride.initials}</div><div><strong>{ride.driver}</strong><span>{formatKES(ride.price)} · seat requested</span></div></div>
              <span className={`request-pill ${acceptedRideIds.includes(ride.id) ? 'request-accepted' : ''}`}><span /> {acceptedRideIds.includes(ride.id) ? 'ACCEPTED' : 'REQUEST SENT'}</span>
            </>}
          </div>
        ))}</div> : <div className="empty-state trips-empty"><span className="empty-icon"><CalendarDays size={21} /></span><h3>{isDriver ? 'No rides offered yet' : 'Your next journey starts here'}</h3><p>{isDriver ? 'Offer a ride to share your route with passengers.' : 'When you request a seat, your upcoming trips will show up here.'}</p></div>}
        <div className="section-heading completed-heading"><div><div className="section-kicker">THE ROAD ALREADY TRAVELLED</div><h2>Past rides <span className="result-count">1</span></h2></div></div>
        <div className="past-trip"><div className="past-date"><span>18</span><small>OCT</small></div><div className="past-copy"><strong>Westlands <ArrowRight size={14} /> Kilimani</strong><span>Sunday · 09:20 · with {isDriver ? demoProfiles.lydia.name : demoProfiles.yohanna.name}</span></div><button className="rate-button" onClick={onRate} disabled={rated}>{rated ? <><Check size={14} /> Rated</> : <><Star size={14} /> Rate {isDriver ? 'passenger' : 'driver'}</>}</button></div>
      </section>
      <aside className="trips-aside"><div className="aside-note"><span className="aside-note-icon"><ShieldCheck size={18} /></span><h3>Your safety, shared</h3><p>Only verified members can book or offer a ride. Keep conversations on EcoRide and meet in a public place.</p><span className="note-link">OUR COMMUNITY GUIDELINES <ArrowRight size={13} /></span></div><div className="aside-stat"><span className="aside-stat-icon"><Leaf size={17} /></span><div><strong>12.4 kg</strong><span>CO₂ saved so far</span></div></div></aside>
    </div>
  )
}

function ImpactView({ onFind }: { onFind: () => void }) {
  return <div className="impact-page"><section className="impact-hero"><div className="impact-hero-copy"><div className="section-kicker">SMALL SHARES. REAL CHANGE.</div><h2>Your miles are<br />making a difference.</h2><p>When you share a ride, you leave a little less behind. Here’s what your journeys add up to.</p><button className="button button-light" onClick={onFind}>Find your next ride <ArrowRight size={16} /></button></div><div className="impact-hero-stat"><div className="impact-hero-number">12.4<span>kg</span></div><span>ESTIMATED CO₂ AVOIDED</span><div className="hero-stat-divider" /><div className="impact-hero-details"><div><strong>6</strong><span>rides shared</span></div><div><strong>84</strong><span>km shared</span></div><div><strong>4</strong><span>new connections</span></div></div></div></section><div className="impact-lower"><section className="impact-breakdown"><div className="section-heading"><div><div className="section-kicker">YOUR JOURNEY, IN NUMBERS</div><h2>Impact breakdown</h2></div><span className="period-select">This month <ChevronDown size={14} /></span></div><div className="impact-chart"><div className="chart-y-labels"><span>15 kg</span><span>10 kg</span><span>5 kg</span><span>0 kg</span></div><div className="chart-area"><div className="chart-grid"><i /><i /><i /><i /></div><div className="chart-columns">{[{ day: 'M', height: 35 }, { day: 'T', height: 50 }, { day: 'W', height: 42 }, { day: 'T', height: 73 }, { day: 'F', height: 58 }, { day: 'S', height: 90 }, { day: 'S', height: 67 }].map((bar, index) => <div className="chart-column" key={index}><span className="chart-bar" style={{ height: `${bar.height}%` }} /><small>{bar.day}</small></div>)}</div></div></div><div className="chart-caption"><span><i /> CO₂ avoided this week</span><strong>+3.2 kg <small>vs last week</small></strong></div></section><aside className="equivalency-card"><span className="equivalency-icon"><Sparkles size={19} /></span><div className="section-kicker">A DIFFERENT WAY TO SEE IT</div><h3>12.4 kg of CO₂ is about...</h3><div className="equivalency-visual"><div className="tree-illustration"><span>✳</span><i /><b /></div><div><strong>1 tree</strong><span>growing for a month</span></div></div><p>We estimate savings based on an average solo car trip. Actual emissions vary by vehicle and route.</p></aside></div></div>
}

function ProfileView({ profile, onTrips }: { profile: typeof demoProfiles[DemoProfileId]; onTrips: () => void }) {
  return <div className="profile-page"><section className="profile-banner"><div className={`profile-avatar-large avatar-${profile.color}`}>{profile.initials}</div><div className="profile-heading-copy"><span className="verified-label"><BadgeCheck size={14} /> VERIFIED {profile.role.toUpperCase()}</span><h2>{profile.name}</h2><p>Nairobi, Kenya <span>·</span> Member since August 2026</p></div><button className="button profile-edit" onClick={() => window.alert('Profile editing will be available when EcoRide accounts are connected.')}>Edit profile</button></section><div className="profile-stats"><div><strong>{profile.role === 'Driver' ? '1' : '6'}</strong><span>{profile.role === 'Driver' ? 'rides offered' : 'rides shared'}</span></div><div><strong>4.9 <Star size={15} fill="currentColor" /></strong><span>your rating</span></div><div><strong>12.4 kg</strong><span>CO₂ avoided</span></div><div><strong>100%</strong><span>response rate</span></div></div><div className="profile-content"><section><div className="section-heading"><div><div className="section-kicker">YOUR INTRODUCTION</div><h2>A little about you</h2></div></div><div className="bio-panel"><p>{profile.role === 'Driver' ? 'Usually heading across Nairobi on a weekday morning. Happy to share a good playlist and an easy ride.' : 'Getting around Nairobi and always glad to make the commute a little greener.'}</p><div className="bio-tags"><span><MapPin size={13} /> Nairobi</span><span><CarFront size={13} /> {profile.car}</span><span><ShieldCheck size={13} /> Phone verified</span></div></div></section><section><div className="section-heading"><div><div className="section-kicker">TRUST GOES BOTH WAYS</div><h2>Recent reviews</h2></div><button className="text-button" onClick={onTrips}>View trips <ArrowRight size={14} /></button></div><div className="review-panel"><div className="review-top"><div className="avatar avatar-blue">JO</div><div><strong>James Otieno</strong><span>{profile.role === 'Driver' ? 'Passenger' : 'Driver'} · 12 October</span></div><span className="review-stars"><Star size={12} fill="currentColor" /> 5.0</span></div><p>“On time, easy to coordinate with, and a really smooth ride into town.”</p></div></section></div></div>
}

function OfferForm({ onSubmit, defaultCar }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; defaultCar: string }) {
  return <form className="offer-form" onSubmit={onSubmit}><div className="offer-route-fields"><label className="field-label">Pickup point<input name="from" placeholder="e.g. Westlands, Nairobi" required /></label><label className="field-label">Drop-off point<input name="to" placeholder="e.g. Upper Hill, Nairobi" required /></label></div><div className="offer-route-fields"><label className="field-label">Date<input name="date" type="date" /></label><label className="field-label">Departure time<input name="time" type="time" defaultValue="08:00" /></label></div><div className="offer-route-fields"><label className="field-label">Contribution per seat (KES)<input name="price" type="number" min="0" placeholder="250" /></label><label className="field-label">Available seats<select name="seats" defaultValue="2"><option value="1">1 seat</option><option value="2">2 seats</option><option value="3">3 seats</option><option value="4">4 seats</option></select></label></div><label className="field-label">Vehicle<input name="car" placeholder="e.g. Toyota Vitz" defaultValue={defaultCar} /></label><div className="form-note"><ShieldCheck size={16} /><span>Only your general route is shown publicly. Share exact pickup details after a request.</span></div><button type="submit" className="button button-green modal-submit">Publish ride <ArrowRight size={16} /></button></form>
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>{children}</section></div>
}

export default App