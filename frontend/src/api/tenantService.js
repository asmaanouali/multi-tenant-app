// src/api/tenantService.js (FIXED - Complete File)
import axios from './axios';

export const tenantService = {
  // Get all tenants
  getAllTenants: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`/tenants?${params.toString()}`);
    return response.data;
  },

  // Get tenant by ID
  getTenantById: async (id) => {
    const response = await axios.get(`/tenants/${id}`);
    return response.data;
  },

  // Get tenant statistics
  getTenantStats: async (id) => {
    const response = await axios.get(`/tenants/${id}/stats`);
    return response.data;
  },

  // Get tenant subscriptions
  getTenantSubscriptions: async (tenantId) => {
    const response = await axios.get(`/tenants/${tenantId}/subscriptions`);
    return response.data;
  },

  // Get available catalogs for subscription
  getAvailableCatalogs: async (tenantId) => {
    const response = await axios.get(`/tenants/${tenantId}/subscriptions/available`);
    return response.data;
  },

  // Subscribe to catalog
  subscribeToCatalog: async (tenantId, catalogId) => {
    const response = await axios.post(`/tenants/${tenantId}/subscriptions`, { catalogId });
    return response.data;
  },

  // Unsubscribe from catalog
  unsubscribeFromCatalog: async (tenantId, subscriptionId) => {
    const response = await axios.delete(`/tenants/${tenantId}/subscriptions/${subscriptionId}`);
    return response.data;
  },

  // Get organization events
  getOrganizationEvents: async (tenantId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`/tenants/${tenantId}/events?${params.toString()}`);
    return response.data;
  },

  // Create organization event
  createOrganizationEvent: async (tenantId, eventData) => {
    const response = await axios.post(`/tenants/${tenantId}/events`, eventData);
    return response.data;
  },

  // Update organization event
  updateOrganizationEvent: async (tenantId, eventId, eventData) => {
    const response = await axios.put(`/tenants/${tenantId}/events/${eventId}`, eventData);
    return response.data;
  },

  // Delete organization event
  deleteOrganizationEvent: async (tenantId, eventId) => {
    const response = await axios.delete(`/tenants/${tenantId}/events/${eventId}`);
    return response.data;
  },

  // ✅ FIXED: Subscribe to a single event within a catalog
  subscribeToEvent: async (tenantId, catalogId, eventId) => {
    const response = await axios.post(
      `/tenants/${tenantId}/catalogs/${catalogId}/events/${eventId}/subscribe`
    );
    return response.data;
  },

  // ✅ FIXED: Unsubscribe from a single event within a catalog
  unsubscribeFromEvent: async (tenantId, catalogId, eventId) => {
    const response = await axios.delete(
      `/tenants/${tenantId}/catalogs/${catalogId}/events/${eventId}/unsubscribe`
    );
    return response.data;
  },
};