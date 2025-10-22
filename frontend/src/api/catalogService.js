// src/api/catalogService.js - COMPLETE VERSION
import axios from './axios';

export const catalogService = {
  // ===== CATALOG CRUD =====
  
  /**
   * Get all catalogs
   * GET /api/catalogs
   */
  getAllCatalogs: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`/catalogs?${params.toString()}`);
    return response.data;
  },

  /**
   * Get catalog by ID
   * GET /api/catalogs/:id
   */
  getCatalogById: async (id) => {
    const response = await axios.get(`/catalogs/${id}`);
    return response.data;
  },

  /**
   * Get catalog statistics
   * GET /api/catalogs/stats
   */
  getCatalogStats: async () => {
    const response = await axios.get('/catalogs/stats');
    return response.data;
  },

  /**
   * Create catalog (Super Admin only)
   * POST /api/catalogs
   */
  createCatalog: async (catalogData) => {
    const response = await axios.post('/catalogs', catalogData);
    return response.data;
  },

  /**
   * Update catalog (Super Admin only)
   * PUT /api/catalogs/:id
   */
  updateCatalog: async (catalogId, catalogData) => {
    const response = await axios.put(`/catalogs/${catalogId}`, catalogData);
    return response.data;
  },

  /**
   * Delete catalog (Super Admin only)
   * DELETE /api/catalogs/:id
   */
  deleteCatalog: async (catalogId) => {
    const response = await axios.delete(`/catalogs/${catalogId}`);
    return response.data;
  },

  // ===== CATALOG EVENTS CRUD =====

  /**
   * Get catalog events
   * GET /api/catalogs/:catalogId/events
   */
  getCatalogEvents: async (catalogId, filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`/catalogs/${catalogId}/events?${params.toString()}`);
    return response.data;
  },

  /**
   * Get event by ID
   * GET /api/catalogs/events/:id
   */
  getCatalogEventById: async (eventId) => {
    const response = await axios.get(`/catalogs/events/${eventId}`);
    return response.data;
  },

  /**
   * Create catalog event (Super Admin only)
   * POST /api/catalogs/:catalogId/events
   */
  createCatalogEvent: async (catalogId, eventData) => {
    const response = await axios.post(`/catalogs/${catalogId}/events`, eventData);
    return response.data;
  },

  /**
   * Update catalog event (Super Admin only)
   * PUT /api/catalogs/events/:id
   */
  updateCatalogEvent: async (catalogId, eventId, eventData) => {
    const response = await axios.put(`/catalogs/events/${eventId}`, eventData);
    return response.data;
  },

  /**
   * Delete catalog event (Super Admin only)
   * DELETE /api/catalogs/events/:id
   */
  deleteCatalogEvent: async (catalogId, eventId) => {
    const response = await axios.delete(`/catalogs/events/${eventId}`);
    return response.data;
  },

  /**
   * Bulk create catalog events (Super Admin only)
   * POST /api/catalogs/:catalogId/events/bulk
   */
  bulkCreateCatalogEvents: async (catalogId, events) => {
    const response = await axios.post(`/catalogs/${catalogId}/events/bulk`, { events });
    return response.data;
  },
};