// src/pages/CatalogsPage.jsx (COMPLETE FIX)
import { useState, useEffect } from 'react';
import { catalogService } from '../api/catalogService';
import { tenantService } from '../api/tenantService';
import { useAuth } from '../hooks/useAuth';
import { CATALOG_TYPE_LABELS } from '../utils/constants';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

const CatalogsPage = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [loading, setLoading] = useState(true);
  const [catalogs, setCatalogs] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  const [catalogEvents, setCatalogEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [alert, setAlert] = useState(null);

  // Modal states
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogToEdit, setCatalogToEdit] = useState(null);

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOrgAdmin = role === 'ADMIN';
  const isUser = role === 'USER';

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await catalogService.getAllCatalogs();
      const fetchedCatalogs = res.data || [];

      const catalogsWithCounts = await Promise.all(
        fetchedCatalogs.map(async (c) => {
          try {
            const ev = await catalogService.getCatalogEvents(c.id, { page: 1, limit: 1 });
            const eventCount = ev?.count || ev?.data?.length || 0;
            return { ...c, eventCount };
          } catch (err) {
            return { ...c, eventCount: c.eventCount || 0 };
          }
        })
      );

      setCatalogs(catalogsWithCounts);

      if (isOrgAdmin) {
        await fetchSubscriptions();
      }
    } catch (error) {
      console.error('Failed to load catalogs', error);
      setAlert({ type: 'error', message: 'Failed to load catalogs' });
    } finally {
      setLoading(false);
    }
  }

  const fetchSubscriptions = async () => {
    try {
      if (!user?.tenant?.id) return setSubscriptions([]);
      const res = await tenantService.getTenantSubscriptions(user.tenant.id);
      setSubscriptions(res.data || []);
    } catch (error) {
      console.error('Failed to fetch subscriptions', error);
      setAlert({ type: 'error', message: 'Failed to load subscriptions' });
    }
  };

  const isSubscribed = (catalogId) => subscriptions.some((s) => s.catalogId === catalogId);

  const handleSubscribe = async (catalogId) => {
    try {
      if (!user?.tenant?.id) {
        setAlert({ type: 'error', message: 'Organization not found' });
        return;
      }
      await tenantService.subscribeToCatalog(user.tenant.id, catalogId);
      setAlert({ type: 'success', message: 'Successfully subscribed to catalog' });
      await fetchSubscriptions();
    } catch (error) {
      console.error('Subscribe error', error);
      const errorMessage = error.response?.data?.message || 'Failed to subscribe to catalog';
      setAlert({ type: 'error', message: errorMessage });
    }
  };
const handleSubscribeEvent = async (catalogId, eventId) => {
  try {
    if (!user?.tenant?.id) {
      setAlert({ type: 'error', message: 'Organization not found' });
      return;
    }
    await tenantService.subscribeToEvent(user.tenant.id, catalogId, eventId);
    setAlert({ type: 'success', message: 'Subscribed to event successfully' });
  } catch (error) {
    console.error('Subscribe to event error:', error);
    const msg = error.response?.data?.message || 'Failed to subscribe to event';
    setAlert({ type: 'error', message: msg });
  }
};

const handleUnsubscribeEvent = async (catalogId, eventId) => {
  try {
    if (!user?.tenant?.id) return;
    await tenantService.unsubscribeFromEvent(user.tenant.id, catalogId, eventId);
    setAlert({ type: 'success', message: 'Unsubscribed from event successfully' });
  } catch (error) {
    console.error('Unsubscribe from event error:', error);
    const msg = error.response?.data?.message || 'Failed to unsubscribe from event';
    setAlert({ type: 'error', message: msg });
  }
};

  const handleUnsubscribe = async (catalogId) => {
    try {
      if (!user?.tenant?.id) return;
      const subscription = subscriptions.find((s) => s.catalogId === catalogId);
      if (!subscription) return;
      await tenantService.unsubscribeFromCatalog(user.tenant.id, subscription.id);
      setAlert({ type: 'success', message: 'Successfully unsubscribed from catalog' });
      await fetchSubscriptions();
    } catch (error) {
      console.error('Unsubscribe error', error);
      const errorMessage = error.response?.data?.message || 'Failed to unsubscribe from catalog';
      setAlert({ type: 'error', message: errorMessage });
    }
  };

  const handleViewEvents = async (catalog) => {
    setSelectedCatalog(catalog);
    setLoadingEvents(true);
    try {
      const res = await catalogService.getCatalogEvents(catalog.id);
      const data = res.data || [];
      setCatalogEvents(data);
    } catch (error) {
      console.error('Get catalog events error', error);
      const errorMessage = error.response?.data?.message || 'Failed to load catalog events';
      setAlert({ type: 'error', message: errorMessage });
      setCatalogEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleOpenCreateCatalog = () => {
    setCatalogToEdit(null);
    setShowCatalogModal(true);
  };

  const handleOpenEditCatalog = (catalog) => {
    setCatalogToEdit(catalog);
    setShowCatalogModal(true);
  };

  const handleSaveCatalog = async (payload) => {
    try {
      setShowCatalogModal(false);
      setLoading(true);
      
      if (catalogToEdit) {
        await catalogService.updateCatalog(catalogToEdit.id, payload);
        setAlert({ type: 'success', message: 'Catalog updated successfully' });
      } else {
        await catalogService.createCatalog(payload);
        setAlert({ type: 'success', message: 'Catalog created successfully' });
      }
      
      await loadAll();
    } catch (error) {
      console.error('Save catalog error', error);
      const errorMessage = error.response?.data?.message || 'Failed to save catalog';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeleteCatalog = (catalogId) => {
    setConfirmPayload({ type: 'catalog', id: catalogId });
    setShowConfirm(true);
  };

  const handleOpenCreateEvent = (catalog) => {
    setEventToEdit(null);
    setSelectedCatalog(catalog);
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (catalog, event) => {
    setEventToEdit(event);
    setSelectedCatalog(catalog);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (payload) => {
    try {
      setShowEventModal(false);
      setLoadingEvents(true);
      
      if (eventToEdit) {
        // UPDATE event - backend expects: PUT /api/catalogs/events/:id
        await catalogService.updateCatalogEvent(selectedCatalog.id, eventToEdit.id, payload);
        setAlert({ type: 'success', message: 'Event updated successfully' });
      } else {
        // CREATE event - backend expects: POST /api/catalogs/:catalogId/events
        await catalogService.createCatalogEvent(selectedCatalog.id, payload);
        setAlert({ type: 'success', message: 'Event created successfully' });
      }
      
      await handleViewEvents(selectedCatalog);
      await loadAll();
    } catch (error) {
      console.error('Save event error', error);
      const errorMessage = error.response?.data?.message || 'Failed to save event';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleConfirmDeleteEvent = (catalogId, eventId) => {
    setConfirmPayload({ type: 'event', id: eventId, catalogId });
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setShowConfirm(false);
      if (!confirmPayload) return;

      if (confirmPayload.type === 'catalog') {
        setLoading(true);
        // Backend expects: DELETE /api/catalogs/:id
        await catalogService.deleteCatalog(confirmPayload.id);
        setAlert({ type: 'success', message: 'Catalog deleted successfully' });
        await loadAll();
      } else if (confirmPayload.type === 'event') {
        setLoadingEvents(true);
        // Backend expects: DELETE /api/catalogs/events/:id
        await catalogService.deleteCatalogEvent(confirmPayload.catalogId, confirmPayload.id);
        setAlert({ type: 'success', message: 'Event deleted successfully' });
        
        if (selectedCatalog && selectedCatalog.id === confirmPayload.catalogId) {
          await handleViewEvents(selectedCatalog);
        }
        await loadAll();
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete';
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setConfirmPayload(null);
      setLoading(false);
      setLoadingEvents(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Catalogs</h1>
          <p className="text-gray-600">
            {isSuperAdmin
              ? 'Manage global event catalogs and their events'
              : isOrgAdmin
              ? 'Browse and subscribe to global event catalogs for your organization'
              : 'Browse available event catalogs'}
          </p>
        </div>

        
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Catalogs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalogs.map((catalog) => {
          const subscribed = isSubscribed(catalog.id);
          
          return (
            <div
              key={catalog.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{catalog.name}</h3>
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full font-medium">
                    {CATALOG_TYPE_LABELS[catalog.type] || catalog.type}
                  </span>
                </div>
                <span className="text-3xl">📚</span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {catalog.description || 'No description available'}
              </p>

              {catalog.country && (
                <p className="text-sm text-gray-500 mb-2">🌍 {catalog.country}</p>
              )}

              <p className="text-sm text-gray-500 mb-4">📅 {catalog.eventCount ?? 0} events</p>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => handleViewEvents(catalog)}>
                  👁️ View Events
                </Button>

                

                {isSuperAdmin && (
                  <>
                    {!(user?.role === 'SUPER_ADMIN' && ['WORLD_SPECIAL_DAYS', 'NATIONAL_HOLIDAYS', 'REGIONAL_HOLIDAYS'].includes(catalog.type)) && (
  <Button variant="secondary" onClick={() => handleEditCatalog(catalog)}>
    Edit
  </Button>
)}
                    {!['WORLD_SPECIAL_DAYS', 'NATIONAL_HOLIDAYS', 'REGIONAL_HOLIDAYS'].includes(catalog.type) && (
  <Button variant="danger" onClick={() => handleConfirmDeleteCatalog(catalog.id)}>
    🗑️ Delete
  </Button>
)}
                    <Button variant="primary" onClick={() => handleOpenCreateEvent(catalog)}>
                      ➕ Add Event
                    </Button>
                  </>
                )}
              </div>

              {isOrgAdmin && subscribed && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    ✓ Subscribed
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {catalogs.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <p className="text-gray-500 text-lg mb-2">No catalogs available</p>
          {isSuperAdmin && (
            <p className="text-gray-400 text-sm">Create your first catalog to get started</p>
          )}
        </div>
      )}

      {/* View Catalog Events Modal */}
      {selectedCatalog && (
        <Modal onClose={() => setSelectedCatalog(null)}>
          <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedCatalog.name}</h2>
              <p className="text-gray-600 mt-1">
                {catalogEvents.length} {catalogEvents.length === 1 ? 'event' : 'events'}
              </p>
            </div>
            <div className="flex gap-2 items-center">
              {isSuperAdmin && (
                <Button variant="primary" onClick={() => handleOpenCreateEvent(selectedCatalog)}>
                  ➕ Add Event
                </Button>
              )}
              <button
                onClick={() => setSelectedCatalog(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6">
            {loadingEvents ? (
              <Loading />
            ) : catalogEvents.length > 0 ? (
              <div className="space-y-4">
                {catalogEvents.map((event) => (
                  <div
                    key={event.id || event._id}
                    className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{event.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 {new Date(event.startDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                        )}
                        {event.country && (
                          <p className="text-xs text-gray-500 mt-2">🌍 {event.country}</p>
                        )}
                        {event.tags && event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
{isOrgAdmin && (
  <div className="flex flex-col gap-2">
    <Button
      variant="primary"
      onClick={() => handleSubscribeEvent(selectedCatalog.id, event.id)}
    >
      ✅ Subscribe
    </Button>
  </div>
)}

                      {isSuperAdmin && (
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleOpenEditEvent(selectedCatalog, event)}
                          >
                            ✏️ Edit
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleConfirmDeleteEvent(selectedCatalog.id, event.id)}
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-300 text-5xl mb-3">📅</div>
                <p className="text-gray-500">No events in this catalog</p>
                {isSuperAdmin && (
                  <p className="text-gray-400 text-sm mt-1">Add your first event to get started</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {showCatalogModal && (
        <Modal onClose={() => setShowCatalogModal(false)}>
          <CatalogForm
            initial={catalogToEdit}
            onCancel={() => setShowCatalogModal(false)}
            onSubmit={handleSaveCatalog}
          />
        </Modal>
      )}

      {showEventModal && (
        <Modal onClose={() => setShowEventModal(false)}>
          <EventForm
            initial={eventToEdit}
            onCancel={() => setShowEventModal(false)}
            onSubmit={handleSaveEvent}
            catalog={selectedCatalog}
          />
        </Modal>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={
            confirmPayload?.type === 'catalog'
              ? 'Are you sure you want to delete this catalog? This will also delete all events within it. This action cannot be undone.'
              : 'Are you sure you want to delete this event? This action cannot be undone.'
          }
          onCancel={() => {
            setShowConfirm(false);
            setConfirmPayload(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default CatalogsPage;

/* ===== MODAL COMPONENTS ===== */

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-auto animate-slideUp">
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onCancel, onConfirm }) {
  return (
    <Modal onClose={onCancel}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CatalogForm({ initial = null, onCancel, onSubmit }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [type, setType] = useState(initial?.type || 'WORLD_SPECIAL_DAYS');
  const [country, setCountry] = useState(initial?.country || '');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      type,
      country: country.trim()
    });
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">
        {initial ? 'Edit Catalog' : 'Create New Catalog'}
      </h3>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catalog Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., World Special Days"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="4"
            placeholder="Describe this catalog..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="WORLD_SPECIAL_DAYS">World Special Days</option>
              <option value="NATIONAL_HOLIDAYS">National Holidays</option>
              <option value="REGIONAL_HOLIDAYS">Regional Holidays</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country/Region
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Algeria, France"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
      </div>
    </div>
  );
}

function EventForm({ initial = null, onCancel, onSubmit, catalog }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [startDate, setStartDate] = useState(formatDateInput(initial?.startDate || ''));
  const [endDate, setEndDate] = useState(formatDateInput(initial?.endDate || initial?.startDate || ''));
  const [country, setCountry] = useState(initial?.country || '');
  const [tags, setTags] = useState((initial?.tags && initial.tags.join(', ')) || '');

  const handleSubmit = () => {
    if (!title.trim() || !startDate) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : new Date(startDate).toISOString(),
      country: country.trim(),
      tags: tags
        ? tags.split(',').map((t) => t.trim()).filter(Boolean)
        : []
    });
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        {initial ? 'Edit Event' : 'Create New Event'}
      </h3>
      <p className="text-gray-600 mb-6">
        {catalog?.name && `In catalog: ${catalog.name}`}
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., International Women's Day"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="4"
            placeholder="Describe this event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country/Region
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Algeria, France (optional)"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags/Industries
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="e.g., Culture, Education, Technology (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!title.trim() || !startDate}>
          {initial ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </div>
  );
}

function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}