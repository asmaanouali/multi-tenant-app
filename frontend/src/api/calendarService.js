import axios from './axios';

export const calendarService = {
  /**
   * 🗓️ Get unified calendar view (catalog + optional filters)
   */
  getUnifiedCalendar: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.tags && filters.tags.length > 0) params.append('tags', filters.tags.join(','));
    if (filters.search) params.append('search', filters.search);
    if (filters.source) params.append('source', filters.source);
    if (filters.country) params.append('country', filters.country);
    if (filters.type) params.append('type', filters.type);

    const response = await axios.get(`/calendar?${params.toString()}`);
    return response.data;
  },

  /**
   * 📊 Get calendar statistics
   */
  getCalendarStats: async () => {
    const response = await axios.get('/calendar/stats');
    return response.data;
  },

  /**
   * 📅 Get catalog/global events by month
   */
  getEventsByMonth: async (year, month) => {
    const response = await axios.get(`/calendar/month/${year}/${month}`);
    return response.data;
  },

  /**
   * 🏢 Get organization (tenant) events
   */
  getOrganizationEvents: async (tenantId) => {
    if (!tenantId) throw new Error('Missing tenantId for organization events');
    const response = await axios.get(`/tenants/${tenantId}/events`);
    return response.data;
  },

  /**
   * 🏗️ Create an organization (tenant) event
   */
  createOrganizationEvent: async (tenantId, eventData) => {
    if (!tenantId) throw new Error('Missing tenantId for creating event');
    const response = await axios.post(`/tenants/${tenantId}/events`, eventData);
    return response.data;
  },

  /**
   * ✏️ Update an organization (tenant) event
   */
  updateOrganizationEvent: async (tenantId, eventId, eventData) => {
    if (!tenantId || !eventId) throw new Error('Missing tenantId or eventId for updating event');
    const response = await axios.put(`/tenants/${tenantId}/events/${eventId}`, eventData);
    return response.data;
  },

  /**
   * ❌ Delete an organization (tenant) event
   */
  deleteOrganizationEvent: async (tenantId, eventId) => {
    if (!tenantId || !eventId) throw new Error('Missing tenantId or eventId for deleting event');
    const response = await axios.delete(`/tenants/${tenantId}/events/${eventId}`);
    return response.data;
  },
};
