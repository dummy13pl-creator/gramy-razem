const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new ApiError('Sesja wygasła', 401);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || 'Wystąpił błąd', res.status);
  }

  return data;
}

export const api = {
  // Autoryzacja
  login: (name, password) =>
    request('/auth/login', { method: 'POST', body: { name, password } }),

  signup: (name, password, inviteCode) =>
    request('/auth/register', { method: 'POST', body: { name, password, inviteCode } }),

  getProfile: () =>
    request('/auth/me'),

  // Wydarzenia
  getEvents: () =>
    request('/events'),

  getEvent: (id) =>
    request(`/events/${id}`),

  createEvent: (data) =>
    request('/events', { method: 'POST', body: data }),

  updateEvent: (id, data) =>
    request(`/events/${id}`, { method: 'PUT', body: data }),

  deleteEvent: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),

  // Zapisy na wydarzenia
  register: (eventId) =>
    request(`/events/${eventId}/register`, { method: 'POST' }),

  unregister: (eventId) =>
    request(`/events/${eventId}/register`, { method: 'DELETE' }),

  // Panel administracyjny
  getUsers: () =>
    request('/admin/users'),

  deleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),

  changeUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),

  getInviteCodes: () =>
    request('/admin/invite-codes'),

  generateInviteCodes: (count = 1) =>
    request('/admin/invite-codes', { method: 'POST', body: { count } }),

  deleteInviteCode: (id) =>
    request(`/admin/invite-codes/${id}`, { method: 'DELETE' }),

  // Czat
  getChatMessages: () =>
    request('/chat'),

  sendChatMessage: (content) =>
    request('/chat', { method: 'POST', body: { content } }),

  getChatStatus: () =>
    request('/chat/status'),

  markChatSeen: (lastSeenId) =>
    request('/chat/status', { method: 'POST', body: { lastSeenId } }),

  // Ankiety
  getPolls: () =>
    request('/polls'),

  createPoll: (question, options) =>
    request('/polls', { method: 'POST', body: { question, options } }),

  deletePoll: (id) =>
    request(`/polls/${id}`, { method: 'DELETE' }),

  votePoll: (pollId, optionId) =>
    request(`/polls/${pollId}/vote`, { method: 'POST', body: { optionId } }),

  unvotePoll: (pollId) =>
    request(`/polls/${pollId}/vote`, { method: 'DELETE' }),
};

export { ApiError };
