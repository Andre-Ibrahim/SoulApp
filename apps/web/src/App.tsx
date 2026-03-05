import React, { useMemo, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { createEvent, fetchEvents, setAvailability, updateMe } from './api';
import type { EventItem } from './api';

function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}

function Shell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : '';
  const navClass = (path: string) =>
    location.pathname === path ? 'btn-primary' : 'nav-chip';
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-ink/10 bg-white/70 px-6 py-5 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
              <h1 className="font-display text-4xl text-ink">Soul App</h1>
          </div>
          {user && (
            <div className="flex flex-wrap items-center gap-3">
              <Link className={navClass('/')} to="/">
                Home
              </Link>
              {user.role === 'admin' && (
                <Link className={navClass('/admin/events/new')} to="/admin/events/new">
                  New event
                </Link>
              )}
              <Link className={navClass('/profile')} to="/profile">
                Profile
              </Link>
              <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/80 px-4 py-2">
                <span className="text-sm text-ink/70">
                  {displayName || user.email}
                </span>
                <span className="badge bg-sun/30 text-ink">{user.role}</span>
              </div>
              <button className="btn-outline" onClick={logout}>
                Log out
              </button>
            </div>
          )}
          </div>
        </header>
        {user ? (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin/events/new" element={<AdminEventPage />} />
          </Routes>
        ) : (
          <AuthPanel />
        )}
      </div>
    </div>
  );
}

function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(
          email,
          password,
          firstName,
          lastName,
          adminSecret || undefined,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="card p-8">
        <h2 className="font-display text-3xl">Welcome back</h2>
        <p className="mt-2 text-ink/70">
          Log in to see upcoming events and let the team know when you can make it.
        </p>
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Email
            <input
              className="rounded-xl border border-ink/20 bg-white px-4 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Password
            <input
              className="rounded-xl border border-ink/20 bg-white px-4 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </label>
          {mode === 'register' && (
            <>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                First name
                <input
                  className="rounded-xl border border-ink/20 bg-white px-4 py-2"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Last name
                <input
                  className="rounded-xl border border-ink/20 bg-white px-4 py-2"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                Admin signup secret (optional)
                <input
                  className="rounded-xl border border-ink/20 bg-white px-4 py-2"
                  type="password"
                  value={adminSecret}
                  onChange={(event) => setAdminSecret(event.target.value)}
                />
              </label>
            </>
          )}
          {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Working...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
        </form>
      </section>
      <aside className="card flex flex-col justify-between gap-6 p-8">
        <div>
          <h3 className="font-display text-2xl">New here?</h3>
          <p className="mt-2 text-ink/70">
            Create your account and start replying to the team schedule.
          </p>
        </div>
        <button
          className="btn-outline w-full"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Switch to register' : 'Switch to login'}
        </button>
      </aside>
    </div>
  );
}

function Dashboard() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchEvents(token);
        if (active) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load events');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  const handleRefresh = () => setRefreshKey((v) => v + 1);
  const handleStatusChanged = (eventId: string, status: 'available' | 'maybe' | 'unavailable') => {
    if (!user) return;
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        const existing = event.availability.find((item) => item.user?.id === user.id);
        if (existing) {
          return {
            ...event,
            availability: event.availability.map((item) =>
              item.user?.id === user.id ? { ...item, status } : item,
            ),
          };
        }
        return {
          ...event,
          availability: [
            ...event.availability,
            {
              id: `local-${eventId}-${user.id}`,
              status,
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
              },
            },
          ],
        };
      }),
    );
  };

  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-title">Upcoming events</h2>
            <p className="text-ink/70">Timezone: America/Montreal</p>
          </div>
          <button className="btn-outline" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
        {loading && <p className="mt-6 text-ink/70">Loading events...</p>}
        {error && <p className="mt-6 text-red-700">{error}</p>}
        {!loading && events.length === 0 && (
          <p className="mt-6 text-ink/70">No events yet.</p>
        )}
        <div className="mt-6 grid gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onStatusChanged={handleStatusChanged}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="grid gap-6">
      <ProfileCard />
    </div>
  );
}

function AdminEventPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <section className="card p-6">
        <h2 className="section-title">Admin only</h2>
        <p className="mt-2 text-ink/70">You do not have access to this page.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      <AdminCreateEvent onCreated={() => undefined} />
    </div>
  );
}

function ProfileCard() {
  const { token, user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [medicareNumber, setMedicareNumber] = useState(user?.medicareNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!user || !token) return null;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateMe(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        medicareNumber: medicareNumber.trim(),
      });
      updateUser(updated);
      setMessage('Profile updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card p-6">
      <h2 className="section-title">Your profile</h2>
      <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={handleSave}>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          First name
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Last name
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Medicare number
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            value={medicareNumber}
            onChange={(event) => setMedicareNumber(event.target.value)}
          />
        </label>
        <div className="md:col-span-3 flex items-center gap-3">
          <button className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          {message && <span className="text-sm text-ink/70">{message}</span>}
        </div>
      </form>
    </section>
  );
}

function EventCard({
  event,
  onStatusChanged,
}: {
  event: EventItem;
  onStatusChanged: (eventId: string, status: 'available' | 'maybe' | 'unavailable') => void;
}) {
  const { token, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(() => {
    const summary = { available: 0, maybe: 0, unavailable: 0 };
    event.availability.forEach((item) => {
      summary[item.status] += 1;
    });
    return summary;
  }, [event.availability]);

  const myStatus = event.availability.find((item) => item.user?.id === user?.id)?.status;
  const [search, setSearch] = useState('');
  const nameFor = (entry: EventItem['availability'][number]) => {
    if (!entry.user) return 'Unknown';
    const fullName = `${entry.user.firstName} ${entry.user.lastName}`.trim();
    return fullName || entry.user.email;
  };
  const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ').trim();
  const isTypoMatch = (value: string, query: string) => {
    if (!query) return true;
    const a = normalize(value);
    const b = normalize(query);
    if (!a || !b) return false;
    if (a.includes(b)) return true;
    // Small typo tolerance: allow edit distance <= 1
    const maxEdits = 1;
    if (Math.abs(a.length - b.length) > maxEdits) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i += 1;
        j += 1;
      } else {
        edits += 1;
        if (edits > maxEdits) return false;
        if (a.length > b.length) {
          i += 1;
        } else if (a.length < b.length) {
          j += 1;
        } else {
          i += 1;
          j += 1;
        }
      }
    }
    return true;
  };
  const filtered = event.availability.filter((item) =>
    isTypoMatch(nameFor(item), search),
  );
  const availableList = filtered.filter((item) => item.status === 'available');
  const maybeList = filtered.filter((item) => item.status === 'maybe');
  const unavailableList = filtered.filter((item) => item.status === 'unavailable');

  const handleStatus = async (status: 'available' | 'maybe' | 'unavailable') => {
    if (!token) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await setAvailability(token, event.id, status);
      const finalStatus = (res.status || status) as 'available' | 'maybe' | 'unavailable';
      onStatusChanged(event.id, finalStatus);
      if (res.enforced && status === 'maybe') {
        setMessage('Maybe slots are full. Marked as unavailable.');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to update');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-white/80 p-6 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-2xl">{event.title}</h3>
          <p className="text-sm text-ink/70">{event.description || 'No description'}</p>
          <p className="mt-2 text-sm text-ink/80">
            {new Date(event.startDate).toLocaleString()} — {new Date(event.endDate).toLocaleString()}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-ink/50">
            Maybe limit: {event.maybeLimit}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-teal/20">Available {counts.available}</span>
          <span className="badge bg-sun/30">Maybe {counts.maybe}</span>
          <span className="badge bg-ink/10">Unavailable {counts.unavailable}</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className={myStatus === 'available' ? 'btn-primary' : 'btn-outline'}
          type="button"
          disabled={busy}
          onClick={() => handleStatus('available')}
        >
          I am available
        </button>
        <button
          className={myStatus === 'maybe' ? 'btn-primary' : 'btn-outline'}
          type="button"
          disabled={busy}
          onClick={() => handleStatus('maybe')}
        >
          Maybe
        </button>
        <button
          className={myStatus === 'unavailable' ? 'btn-primary' : 'btn-outline'}
          type="button"
          disabled={busy}
          onClick={() => handleStatus('unavailable')}
        >
          Unavailable
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-ink/70">{message}</p>}
      <div className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/50">
            Team availability
          </h4>
          <input
            className="w-full rounded-full border border-ink/20 bg-white px-4 py-2 text-sm sm:w-64"
            placeholder="Search names..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="mt-3 grid gap-3">
          <details className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Available ({availableList.length})
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {availableList.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-white px-3 py-2">
                  <p className="text-sm font-semibold">{nameFor(item)}</p>
                  <p className="text-xs text-ink/60">available</p>
                </div>
              ))}
              {availableList.length === 0 && (
                <p className="text-sm text-ink/60">No matches.</p>
              )}
            </div>
          </details>
          <details className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Maybe ({maybeList.length})
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {maybeList.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-white px-3 py-2">
                  <p className="text-sm font-semibold">{nameFor(item)}</p>
                  <p className="text-xs text-ink/60">maybe</p>
                </div>
              ))}
              {maybeList.length === 0 && (
                <p className="text-sm text-ink/60">No matches.</p>
              )}
            </div>
          </details>
          <details className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-ink">
              Unavailable ({unavailableList.length})
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {unavailableList.map((item) => (
                <div key={item.id} className="rounded-xl border border-ink/10 bg-white px-3 py-2">
                  <p className="text-sm font-semibold">{nameFor(item)}</p>
                  <p className="text-xs text-ink/60">unavailable</p>
                </div>
              ))}
              {unavailableList.length === 0 && (
                <p className="text-sm text-ink/60">No matches.</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function AdminCreateEvent({ onCreated }: { onCreated: () => void }) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maybeLimit, setMaybeLimit] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setError('Please enter valid start and end dates.');
        return;
      }
      await createEvent(token, {
        title: title.trim(),
        description: description.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        maybeLimit,
      });
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setMaybeLimit(2);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create event');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card p-6">
      <h2 className="section-title">Post a new event</h2>
      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Title
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Maybe limit
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            type="number"
            min={0}
            value={maybeLimit}
            onChange={(event) => setMaybeLimit(Number(event.target.value))}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold md:col-span-2">
          Description
          <textarea
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          Start date/time (MTL)
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            type="datetime-local"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-semibold">
          End date/time (MTL)
          <input
            className="rounded-xl border border-ink/20 bg-white px-4 py-2"
            type="datetime-local"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            required
          />
        </label>
        {error && <p className="text-sm text-red-700 md:col-span-2">{error}</p>}
        <div className="md:col-span-2">
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Saving...' : 'Publish event'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default App;
