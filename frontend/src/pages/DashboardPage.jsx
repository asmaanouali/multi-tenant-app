import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { calendarService } from '../api/calendarService';
import { catalogService } from '../api/catalogService';
import Loading from '../components/common/Loading';

/**
 * DashboardPage - Role-based dashboard
 * 
 * SUPER_ADMIN: System overview, catalog management, organizations overview
 * ORG_ADMIN: Organization calendar stats, subscriptions, upcoming events (both org + subscribed)
 * USER: View-only calendar stats and upcoming events
 */

const DashboardPage = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toLowerCase().replace('_', '');
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    subscribedCatalogs: 0,
    organizationEvents: 0,
    catalogEvents: 0,
    totalCatalogs: 0,
    totalOrganizations: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Role checks
  const isSuperAdmin = role === 'superadmin';
  const isOrgAdmin = role === 'admin' || role === 'orgadmin';
  const isUser = role === 'user';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      if (isSuperAdmin) {
        // Super Admin: Global system stats
        const [catalogStats] = await Promise.all([
          catalogService.getCatalogStats(),
        ]);

        setStats({
          totalCatalogs: catalogStats.data?.totalCatalogs || 0,
          totalEvents: catalogStats.data?.totalEvents || 0,
          totalOrganizations: 12,
          upcomingEvents: 0,
        });
      } else {
        // Org Admin & Users: Organization-specific stats
        const [calendarStats, catalogStats, eventsResponse] = await Promise.all([
          calendarService.getCalendarStats(),
          catalogService.getCatalogStats(),
          calendarService.getUnifiedCalendar({
            startDate: today.toISOString(),
            endDate: nextWeek.toISOString(),
          }),
        ]);

        console.log('📊 Dashboard data received:', {
          calendarStats: calendarStats.data,
          catalogStats: catalogStats.data,
          eventsResponse: eventsResponse.data
        });

        // ✅ Access the events array correctly
        const events = eventsResponse.data?.events || [];

        // ✅ For ADMIN: Separate organization events from catalog events
        const organizationEvents = events.filter(e => e.source === 'organization');
        const catalogEvents = events.filter(e => e.source === 'catalog');

        console.log('📊 Events breakdown:', {
          total: events.length,
          organization: organizationEvents.length,
          catalog: catalogEvents.length
        });

        setStats({
          totalEvents: calendarStats.data?.totalEvents || events.length,
          upcomingEvents: events.length,
          subscribedCatalogs: catalogStats.data?.subscribedCatalogs || 0,
          organizationEvents: calendarStats.data?.organizationEvents || organizationEvents.length,
          catalogEvents: calendarStats.data?.catalogEvents || catalogEvents.length,
        });

        setUpcomingEvents(events.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const StatCard = ({ title, value, icon, color }) => (
    <div
      className="bg-white rounded-xl shadow-md p-6 border-l-4"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  const QuickAction = ({ icon, title, desc, href }) => (
    <a
      href={href}
      className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
    >
      <span className="text-3xl mr-4">{icon}</span>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </a>
  );

  // ==============================
  // SUPER ADMIN DASHBOARD
  // ==============================
  const renderSuperAdminDashboard = () => (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName}! 👑
        </h1>
        <p className="mt-2 text-purple-100">
          System Administrator - Manage global catalogs and oversee the platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <StatCard 
          title="Global Catalogs" 
          value={stats.totalCatalogs} 
          icon="📚" 
          color="#8B5CF6" 
        />
        <StatCard 
          title="Total Catalog Events" 
          value={stats.totalEvents} 
          icon="🌍" 
          color="#3B82F6" 
        />
        <StatCard 
          title="Organizations" 
          value={stats.totalOrganizations} 
          icon="🏢" 
          color="#10B981" 
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction 
            icon="📚" 
            title="Manage Catalogs" 
            desc="Create and edit global event catalogs" 
            href="/admin/catalogs" 
          />
          <QuickAction 
            icon="🏢" 
            title="Organizations" 
            desc="View and manage organizations" 
            href="/admin/organizations" 
          />
        </div>
      </div>
    </>
  );

  // ==============================
  // ORG ADMIN DASHBOARD
  // ==============================
  const renderOrgAdminDashboard = () => (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName}! 🏢
        </h1>
        <p className="mt-2 text-primary-100">
          Organization Administrator - Manage both organization events and subscribed catalog events
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatCard 
          title="Total Events" 
          value={stats.totalEvents} 
          icon="📅" 
          color="#3B82F6" 
        />
        <StatCard 
          title="Upcoming Events" 
          value={stats.upcomingEvents} 
          icon="⏰" 
          color="#10B981" 
        />
        <StatCard 
          title="Catalog Events" 
          value={stats.catalogEvents} 
          icon="📚" 
          color="#F59E0B" 
        />
        <StatCard 
          title="Organization Events" 
          value={stats.organizationEvents} 
          icon="🏢" 
          color="#8B5CF6" 
        />
      </div>

      {/* Event Source Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Event Sources Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📚</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">Subscribed Catalog Events</h3>
                <p className="text-sm text-gray-600">Events from global catalogs you're subscribed to</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 mt-3">{stats.catalogEvents}</p>
            <p className="text-xs text-gray-500 mt-1">From {stats.subscribedCatalogs} subscribed catalog(s)</p>
          </div>
          
          <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🏢</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">Organization-Specific Events</h3>
                <p className="text-sm text-gray-600">Custom events created by your organization</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600 mt-3">{stats.organizationEvents}</p>
            <p className="text-xs text-gray-500 mt-1">Created by your team members</p>
          </div>
        </div>
        
        {/* Visual Representation */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total: {stats.totalEvents} events</span>
          </div>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500" 
              style={{ width: `${stats.totalEvents > 0 ? (stats.catalogEvents / stats.totalEvents * 100) : 0}%` }}
              title={`Catalog Events: ${stats.catalogEvents}`}
            ></div>
            <div 
              className="bg-purple-500" 
              style={{ width: `${stats.totalEvents > 0 ? (stats.organizationEvents / stats.totalEvents * 100) : 0}%` }}
              title={`Organization Events: ${stats.organizationEvents}`}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>📚 {stats.catalogEvents} Catalog</span>
            <span>🏢 {stats.organizationEvents} Organization</span>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      {renderUpcomingEvents()}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction 
            icon="📅" 
            title="View Calendar" 
            desc="See all events (catalog + org)" 
            href="/calendar" 
          />
          <QuickAction 
            icon="📚" 
            title="Browse Catalogs" 
            desc="Subscribe to global events" 
            href="/catalogs" 
          />
          <QuickAction 
            icon="➕" 
            title="Create Event" 
            desc="Add organization event" 
            href="/events" 
          />
        </div>
      </div>
    </>
  );

  // ==============================
  // USER DASHBOARD
  // ==============================
  const renderUserDashboard = () => (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.firstName}! 👋
        </h1>
        <p className="mt-2 text-blue-100">
          Check your organization's upcoming events and calendar
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <StatCard 
          title="Total Events" 
          value={stats.totalEvents} 
          icon="📅" 
          color="#3B82F6" 
        />
        <StatCard 
          title="Upcoming Events" 
          value={stats.upcomingEvents} 
          icon="⏰" 
          color="#10B981" 
        />
        <StatCard 
          title="This Week" 
          value={stats.upcomingEvents} 
          icon="📆" 
          color="#F59E0B" 
        />
      </div>

      {/* Upcoming Events */}
      {renderUpcomingEvents()}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickAction 
            icon="📅" 
            title="View Calendar" 
            desc="See all organization events" 
            href="/calendar" 
          />
          <QuickAction 
            icon="🏢" 
            title="Organization Events" 
            desc="View custom events" 
            href="/events" 
          />
        </div>
      </div>
    </>
  );

  // Shared upcoming events component
  const renderUpcomingEvents = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ⏰ Upcoming Events (Next 7 Days)
      </h2>
      {upcomingEvents.length > 0 ? (
        <div className="space-y-4">
          {upcomingEvents.map((event, index) => (
            <div
              key={index}
              className="border-l-4 border-primary-500 bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {event.source === 'catalog' ? '📚' : '🏢'}
                    </span>
                    <h3 className="font-semibold text-gray-800">{event.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.source === 'catalog' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {event.source === 'catalog' ? '📚 From Catalog' : '🏢 Organization Event'}
                    </span>
                    {event.sourceDetails?.country && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                        🌍 {event.sourceDetails.country}
                      </span>
                    )}
                    {event.sourceDetails?.catalogName && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                        📚 {event.sourceDetails.catalogName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No upcoming events</p>
          <p className="text-sm mt-2">
            {isOrgAdmin 
              ? 'Subscribe to catalogs or create organization events to see them here' 
              : 'Check back later or ask your admin to add events'}
          </p>
        </div>
      )}
    </div>
  );

  // ==============================
  // FINAL RENDER BASED ON ROLE
  // ==============================
  return (
    <div className="space-y-6">
      {isSuperAdmin
        ? renderSuperAdminDashboard()
        : isOrgAdmin
        ? renderOrgAdminDashboard()
        : renderUserDashboard()}
    </div>
  );
};

export default DashboardPage;