import { useState, useEffect } from 'react';
import { tenantService } from '../api/tenantService';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/dateHelpers';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

/**
 * EventsPage - Manage organization-specific events
 * 
 * SUPER_ADMIN: No access (they manage catalog events, not org events)
 * ORG_ADMIN: Full CRUD on organization-specific events
 * USER: Read-only view (should probably redirect to calendar)
 */

const EventsPage = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase().replace('_', '');
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    tags: '',
  });

  // Role checks
  const isSuperAdmin = role === 'superadmin';
  const isOrgAdmin = role === 'admin' || role === 'orgadmin';
  const isUser = role === 'user';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      if (user?.tenant?.id) {
        const response = await tenantService.getOrganizationEvents(user.tenant.id);
        setEvents(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setAlert({ type: 'error', message: 'Failed to load events' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOrgAdmin) {
      setAlert({ type: 'error', message: 'You do not have permission to modify events' });
      return;
    }
    
    try {
      if (!user?.tenant?.id) {
        setAlert({ type: 'error', message: 'No organization found' });
        return;
      }

      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      };

      if (editingEvent) {
        await tenantService.updateOrganizationEvent(
          user.tenant.id,
          editingEvent.id,
          eventData
        );
        setAlert({ type: 'success', message: 'Event updated successfully!' });
      } else {
        await tenantService.createOrganizationEvent(user.tenant.id, eventData);
        setAlert({ type: 'success', message: 'Event created successfully!' });
      }

      setShowModal(false);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
      setAlert({ type: 'error', message: 'Failed to save event' });
    }
  };

  const handleEdit = (event) => {
    if (!isOrgAdmin) {
      setAlert({ type: 'error', message: 'You do not have permission to edit events' });
      return;
    }
    
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date.split('T')[0],
      tags: event.tags ? event.tags.join(', ') : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (eventId) => {
    if (!isOrgAdmin) {
      setAlert({ type: 'error', message: 'You do not have permission to delete events' });
      return;
    }

    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      if (!user?.tenant?.id) return;

      await tenantService.deleteOrganizationEvent(user.tenant.id, eventId);
      setAlert({ type: 'success', message: 'Event deleted successfully!' });
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setAlert({ type: 'error', message: 'Failed to delete event' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      tags: '',
    });
    setEditingEvent(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Super Admin should not access this page
  if (isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            Super Admins manage catalog events, not organization-specific events.
          </p>
          <Button onClick={() => window.location.href = '/admin/catalogs'} variant="primary">
            Go to Catalogs
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🏢 Organization Events
            </h1>
            <p className="text-gray-600">
              {isOrgAdmin 
                ? 'Manage your organization\'s custom events' 
                : 'View your organization\'s custom events'}
            </p>
          </div>
          {isOrgAdmin && (
            <Button onClick={() => setShowModal(true)} variant="primary">
              + Create Event
            </Button>
          )}
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Info Banner for Regular Users */}
      {isUser && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-800">View Only</h3>
              <p className="text-sm text-blue-600 mt-1">
                You can view organization events here. Only organization admins can create or modify events.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          All Events ({events.length})
        </h2>

        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🏢</span>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {event.title}
                      </h3>
                    </div>

                    <p className="text-sm text-gray-600 font-medium mb-2">
                      📅 {formatDate(event.date, 'EEEE, MMMM dd, yyyy')}
                    </p>

                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {event.description}
                      </p>
                    )}

                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {event.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Only Org Admin can edit/delete */}
                  {isOrgAdmin && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(event)}
                        className="text-sm"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDelete(event.id)}
                        className="text-sm"
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
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No organization events yet</p>
            <p className="text-sm mt-2">
              {isOrgAdmin 
                ? 'Create your first event to get started' 
                : 'Your organization admin can create events'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Event Modal - Only for Org Admin */}
      {showModal && isOrgAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingEvent ? '✏️ Edit Event' : '➕ Create New Event'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Event Title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter event description"
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <Input
                label="Event Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Tags"
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Enter tags separated by commas"
              />

              <div className="flex gap-4 pt-4">
                <Button type="submit" variant="primary" fullWidth>
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;