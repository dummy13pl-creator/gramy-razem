import { useState, useCallback } from 'react';
import { api } from '../utils/api';

export function useEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getEvents();
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(async (eventData) => {
    const data = await api.createEvent(eventData);
    setEvents((prev) => [...prev, data.event].sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)
    ));
    return data.event;
  }, []);

  const updateEvent = useCallback(async (id, eventData) => {
    const data = await api.updateEvent(id, eventData);
    setEvents((prev) => prev.map((e) => (e.id === id ? data.event : e)));
    return data.event;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await api.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const registerForEvent = useCallback(async (eventId) => {
    const data = await api.register(eventId);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
    return data.event;
  }, []);

  const unregisterFromEvent = useCallback(async (eventId) => {
    const data = await api.unregister(eventId);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
    return data.event;
  }, []);

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    unregisterFromEvent,
  };
}
