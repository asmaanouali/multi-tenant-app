import { useState, useEffect } from 'react';
import { calendarService } from '../api/calendarService';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const CalendarPage = () => {
  const { user } = useAuth();
  const role = user?.role;
  const tenantId = user?.tenantId;
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('monthly');
  
  // Enhanced filters
  const [filters, setFilters] = useState({
    source: 'all',
    search: '',
    country: 'all',
    region: 'all',
    tags: [],
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    countries: [],
    regions: [],
    tags: []
  });

  // Event creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    tags: [],
    isRecurring: false,
    recurrenceRule: ''
  });

  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isOrgAdmin = role === 'ADMIN';
  const isUser = role === 'USER';

  useEffect(() => {
    console.log('📅 CalendarPage mounted:', { role, tenantId, viewMode });
    fetchEvents();
  }, [currentDate, viewMode]);

  useEffect(() => {
    // Extract unique countries, regions, and tags from events
    const countries = [...new Set(events.filter(e => e.sourceDetails?.country).map(e => e.sourceDetails.country))];
    const regions = [...new Set(events.filter(e => e.sourceDetails?.region).map(e => e.sourceDetails.region))];
    const tags = [...new Set(events.flatMap(e => e.tags || []))];
    
    setFilterOptions({
      countries: countries.sort(),
      regions: regions.sort(),
      tags: tags.sort()
    });
  }, [events]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let fetchedEvents = [];

      console.log('📅 Fetching events...', { role, tenantId, viewMode });

      // For ADMIN and USER roles (not SUPER_ADMIN)
      if ((isOrgAdmin || isUser) && tenantId) {
        if (viewMode === 'monthly') {
          // Fetch events for the current month ONLY
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth() + 1;
          
          console.log('📅 Monthly view - fetching for:', { year, month });
          
          const response = await calendarService.getEventsByMonth(year, month);
          console.log('📅 API Response:', response);
          
          fetchedEvents = response.data?.events || [];
          
          // Filter events by month on frontend as well (double check)
          const startOfMonth = new Date(year, month - 1, 1);
          const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
          
          fetchedEvents = fetchedEvents.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate >= startOfMonth && eventDate <= endOfMonth;
          });
          
          console.log('📅 Filtered events for month:', fetchedEvents.length);
        } else {
          // List mode - fetch with date range
          const startDate = filters.dateRange.start || new Date(currentDate.getFullYear(), 0, 1).toISOString();
          const endDate = filters.dateRange.end || new Date(currentDate.getFullYear(), 11, 31).toISOString();
          
          console.log('📋 List view - fetching for:', { startDate, endDate });
          
          const response = await calendarService.getUnifiedCalendar({
            startDate,
            endDate,
          });
          
          fetchedEvents = response.data?.events || [];
          console.log('📋 Fetched events:', fetchedEvents);
        }
        
        console.log('✅ Total events fetched:', fetchedEvents.length);
        console.log('📊 Events by source:', {
          catalog: fetchedEvents.filter(e => e.source === 'catalog').length,
          organization: fetchedEvents.filter(e => e.source === 'organization').length
        });
      } else if (!tenantId) {
        console.warn('⚠️ User does not belong to an organization');
      }

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('❌ Failed to fetch events:', error);
      console.error('Error details:', error.response?.data);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleApplyFilters = () => {
    // For list view, refetch with filters
    if (viewMode === 'list') {
      fetchEventsWithFilters();
    }
  };

  const fetchEventsWithFilters = async () => {
    try {
      setLoading(true);
      
      const params = {
        startDate: filters.dateRange.start || new Date(currentDate.getFullYear(), 0, 1).toISOString(),
        endDate: filters.dateRange.end || new Date(currentDate.getFullYear(), 11, 31).toISOString(),
      };

      // Add filters to params
      if (filters.search) params.search = filters.search;
      if (filters.country !== 'all') params.country = filters.country;
      if (filters.region !== 'all') params.region = filters.region;
      if (filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (isOrgAdmin && filters.source !== 'all') params.source = filters.source;

      console.log('🔎 Fetching with filters:', params);

      const response = await calendarService.getUnifiedCalendar(params);
      const fetchedEvents = response.data?.events || [];
      
      setEvents(fetchedEvents);
      console.log('✅ Filtered events:', fetchedEvents.length);
    } catch (error) {
      console.error('❌ Failed to fetch filtered events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      source: 'all',
      search: '',
      country: 'all',
      region: 'all',
      tags: [],
      dateRange: { start: '', end: '' }
    });
    // Refetch without filters
    fetchEvents();
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    if (!tenantId) {
      alert('You must belong to an organization to create events');
      return;
    }

    try {
      setCreateLoading(true);
      
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        startDate: new Date(newEvent.startDate).toISOString(),
        endDate: new Date(newEvent.endDate).toISOString(),
        tags: newEvent.tags.length > 0 ? newEvent.tags : [],
        isRecurring: newEvent.isRecurring,
        recurrenceRule: newEvent.recurrenceRule || null
      };

      const response = await fetch(`/api/tenants/${tenantId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eventData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Event created successfully!');
        
        const eventDate = new Date(newEvent.startDate);
        setCurrentDate(eventDate);
        
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          tags: [],
          isRecurring: false,
          recurrenceRule: ''
        });
        
        setTimeout(() => {
          fetchEvents();
        }, 500);
      } else {
        alert(result.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Create event error:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEventInputChange = (field, value) => {
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsInput = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setNewEvent(prev => ({
      ...prev,
      tags
    }));
  };

  // Apply frontend filters (for monthly view since backend returns all events for the month)
  const filteredEvents = events.filter(event => {
    // Source filter (ADMIN only - can filter between catalog and organization)
    if (isOrgAdmin && filters.source !== 'all' && event.source !== filters.source) {
      return false;
    }
    
    // Search filter (applies to both ADMIN and USER)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTitle = event.title?.toLowerCase().includes(searchLower);
      const matchesDesc = event.description?.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesDesc) return false;
    }
    
    // Country filter (applies to both ADMIN and USER)
    if (filters.country !== 'all') {
      const eventCountry = event.sourceDetails?.country;
      if (!eventCountry || eventCountry !== filters.country) return false;
    }
    
    // Region filter (applies to both ADMIN and USER)
    if (filters.region !== 'all') {
      const eventRegion = event.sourceDetails?.region;
      if (!eventRegion || eventRegion !== filters.region) return false;
    }
    
    // Tags filter (applies to both ADMIN and USER)
    if (filters.tags.length > 0) {
      const eventTags = event.tags || [];
      const hasMatchingTag = filters.tags.some(tag => eventTags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    // Date range filter (only in list view, applies to both ADMIN and USER)
    if (viewMode === 'list') {
      const eventDate = new Date(event.startDate);
      
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (eventDate < startDate) return false;
      }
      
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (eventDate > endDate) return false;
      }
    }
    
    return true;
  });

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            Super Admins manage global catalogs, not organization calendars.
          </p>
          <Button onClick={() => window.location.href = '/admin/catalogs'} variant="primary">
            Go to Catalogs
          </Button>
        </div>
      </div>
    );
  }

  if (loading && events.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📅 Organization Calendar
            </h1>
            <p className="text-gray-600">
              {isOrgAdmin 
                ? 'View subscribed catalog events and organization-specific events'
                : 'View your organization\'s calendar'}
            </p>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-md transition ${
                viewMode === 'monthly'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📅 Monthly
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
        
        {/* Calendar Navigation (Monthly View) */}
        {viewMode === 'monthly' && (
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={handlePreviousMonth} variant="outline">
              ← Previous
            </Button>
            <h2 className="text-xl font-semibold text-gray-700 min-w-[200px] text-center">
              {getMonthName()}
            </h2>
            <Button onClick={handleNextMonth} variant="outline">
              Next →
            </Button>
            <Button onClick={handleToday} variant="secondary">
              Today
            </Button>
          </div>
        )}

        {/* Date Range Picker (List View) */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="self-end">
              <Button onClick={handleApplyFilters} variant="primary">
                Apply Range
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action for Org Admin */}
      {isOrgAdmin && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary-800">Manage Your Events</h3>
            <p className="text-sm text-primary-600">
              Add organization-specific events or subscribe to more catalogs
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowCreateModal(true)} variant="primary">
              + Create Event
            </Button>
            <Button onClick={() => window.location.href = '/catalogs'} variant="secondary">
              Browse Catalogs
            </Button>
          </div>
        </div>
      )}

      {/* Filters Section - Both ADMIN and USER */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Filter Events</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Source Filter - ADMIN ONLY */}
          {isOrgAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 Event Source
              </label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Sources</option>
                <option value="catalog">📚 Catalog Events</option>
                <option value="organization">🏢 Organization Events</option>
              </select>
            </div>
          )}

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔎 Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search events..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🌍 Country
            </label>
            <select
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Countries</option>
              {filterOptions.countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🗺️ Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Regions</option>
              {filterOptions.regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        {filterOptions.tags.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    filters.tags.includes(tag)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Actions */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredEvents.length !== events.length && (
              <span>Showing {filteredEvents.length} of {events.length} events</span>
            )}
          </div>
          <div className="flex gap-2">
            {viewMode === 'list' && (
              <Button onClick={handleApplyFilters} variant="primary" className="text-sm">
                🔍 Apply Filters
              </Button>
            )}
            <Button onClick={handleClearFilters} variant="outline" className="text-sm">
              🗑️ Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Events ({filteredEvents.length})
          </h2>
          {viewMode === 'monthly' && (
            <span className="text-sm text-gray-600">
              Showing events for {getMonthName()}
            </span>
          )}
        </div>
        
        {loading ? (
          <Loading />
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id || index}
                className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {event.source === 'catalog' ? '📚' : '🏢'}
                      </span>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            event.source === 'catalog' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {event.source === 'catalog' ? '📚 From Catalog' : '🏢 Organization Event'}
                          </span>
                          {event.sourceDetails?.catalogName && (
                            <span className="text-xs text-gray-500">
                              • {event.sourceDetails.catalogName}
                            </span>
                          )}
                          {event.sourceDetails?.country && (
                            <span className="text-xs text-gray-500">
                              • 🌍 {event.sourceDetails.country}
                            </span>
                          )}
                          {event.sourceDetails?.region && (
                            <span className="text-xs text-gray-500">
                              • 🗺️ {event.sourceDetails.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 font-medium mb-2">
                      📅 {formatEventDate(event.startDate)}
                    </p>
                    
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2">{event.description}</p>
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

                  {isOrgAdmin && event.source === 'organization' && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = `/events?edit=${event.id}`}
                        className="text-sm"
                      >
                        ✏️ Edit
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No events found</p>
            <p className="text-sm mt-2">
              {filters.search || filters.source !== 'all' || filters.country !== 'all' || filters.region !== 'all' || filters.tags.length > 0 || filters.dateRange.start || filters.dateRange.end
                ? 'Try adjusting your filters'
                : viewMode === 'monthly'
                ? `No events scheduled for ${getMonthName()}`
                : isOrgAdmin
                ? 'Subscribe to catalogs or create organization events'
                : 'Check back later for upcoming events'}
            </p>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create Organization Event</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => handleEventInputChange('title', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => handleEventInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.startDate}
                    onChange={(e) => handleEventInputChange('startDate', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.endDate}
                    onChange={(e) => handleEventInputChange('endDate', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newEvent.tags.join(', ')}
                  onChange={(e) => handleTagsInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., meeting, training, holiday"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newEvent.isRecurring}
                  onChange={(e) => handleEventInputChange('isRecurring', e.target.checked)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  Recurring Event
                </label>
              </div>

              {newEvent.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence Rule (iCal format)
                  </label>
                  <input
                    type="text"
                    value={newEvent.recurrenceRule}
                    onChange={(e) => handleEventInputChange('recurrenceRule', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createLoading}
                  className="flex-1"
                >
                  {createLoading ? 'Creating...' : 'Create Event'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
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

export default CalendarPage;