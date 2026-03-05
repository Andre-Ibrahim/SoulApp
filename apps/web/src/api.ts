const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  medicareNumber: string | null;
  role: 'admin' | 'user';
};

export type EventAvailability = {
  id: string;
  status: 'available' | 'maybe' | 'unavailable';
  user: { id: string; email: string; firstName: string; lastName: string } | null;
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
  maybeLimit: number;
  createdBy: { id: string; email: string; firstName: string; lastName: string } | null;
  availability: EventAvailability[];
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Request failed');
  }
  return res.json();
}

export function login(email: string, password: string) {
  return request<{ accessToken: string; user: User }>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  userSignupSecret: string,
  adminSignupSecret?: string,
) {
  return request<{ accessToken: string; user: User }>(`/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      userSignupSecret,
      adminSignupSecret,
    }),
  });
}

export function updateMe(token: string, payload: Partial<Pick<User, 'firstName' | 'lastName' | 'medicareNumber'>>) {
  return request<User>(`/users/me`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function fetchEvents(token: string) {
  return request<EventItem[]>(`/events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createEvent(
  token: string,
  payload: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    maybeLimit?: number;
  },
) {
  return request<EventItem>(`/events`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export function setAvailability(token: string, eventId: string, status: string) {
  return request<{ id: string; status: string; enforced: boolean }>(
    `/events/${eventId}/availability`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    },
  );
}
