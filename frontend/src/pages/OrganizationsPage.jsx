import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Loading from '../components/common/Loading';
import Button from '../components/common/Button';

const API_URL = '/api';

/**
 * OrganizationsPage - Super Admin page to manage all organizations (tenants)
 * 
 * Backend endpoints used:
 * - GET /api/tenants - Get all organizations
 * - GET /api/tenants/:id - Get organization details
 * - POST /api/tenants - Create new organization
 * - PUT /api/tenants/:id - Update organization
 * - DELETE /api/tenants/:id - Delete organization
 * - GET /api/tenants/:id/stats - Get organization statistics
 */

const OrganizationsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    industry: '',
    country: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Extract unique industries and countries for filters
  const industries = [...new Set(organizations.map(o => o.industry).filter(Boolean))];
  const countries = [...new Set(organizations.map(o => o.country).filter(Boolean))];

  useEffect(() => {
    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    // Apply filters
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterIndustry !== 'all') {
      filtered = filtered.filter(org => org.industry === filterIndustry);
    }

    if (filterCountry !== 'all') {
      filtered = filtered.filter(org => org.country === filterCountry);
    }

    setFilteredOrgs(filtered);
  }, [searchTerm, filterIndustry, filterCountry, organizations]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setOrganizations(result.data);
        setFilteredOrgs(result.data);
      } else {
        console.error('Failed to fetch organizations:', result.message);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      alert('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, org = null) => {
    setModalMode(mode);
    setSelectedOrg(org);
    setFormErrors({});
    
    if (mode === 'edit' && org) {
      setFormData({
        name: org.name || '',
        slug: org.slug || '',
        industry: org.industry || '',
        country: org.country || ''
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        industry: '',
        country: ''
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrg(null);
    setFormData({
      name: '',
      slug: '',
      industry: '',
      country: ''
    });
    setFormErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Organization name is required';
    }
    
    if (modalMode === 'create' && !formData.slug.trim()) {
      errors.slug = 'Slug is required';
    }
    
    if (modalMode === 'create' && formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (modalMode === 'create') {
        const response = await fetch('/api/tenants', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (result.success) {
          alert('Organization created successfully!');
          handleCloseModal();
          fetchOrganizations();
        } else {
          alert(result.message || 'Failed to create organization');
        }
      } else {
        // For edit, don't send slug (it cannot be changed)
        const { slug, ...updateData } = formData;
        
        const response = await fetch(`/api/tenants/${selectedOrg.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        const result = await response.json();
        
        if (result.success) {
          alert('Organization updated successfully!');
          handleCloseModal();
          fetchOrganizations();
        } else {
          alert(result.message || 'Failed to update organization');
        }
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('An error occurred while saving the organization');
    }
  };

  const handleDelete = async (orgId, orgName) => {
    if (!window.confirm(`Are you sure you want to delete "${orgName}"?\n\nThis will also delete:\n- All users in this organization\n- All subscriptions\n- All organization events\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tenants/${orgId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Organization deleted successfully!\n\nDeleted:\n- ${result.data.deletedUsersCount} users\n- ${result.data.deletedSubscriptionsCount} subscriptions\n- ${result.data.deletedEventsCount} events`);
        fetchOrganizations();
      } else {
        alert(result.message || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('An error occurred while deleting the organization');
    }
  };

  const handleViewDetails = (orgId) => {
    window.location.href = `/admin/organizations/${orgId}`;
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">This page is only accessible to Super Admins.</p>
          <Button onClick={() => window.location.href = '/dashboard'} variant="primary">
            Go to Dashboard
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
              🏢 Organizations Management
            </h1>
            <p className="text-gray-600">
              Manage all organizations (tenants) in the system
            </p>
          </div>
          <Button onClick={() => handleOpenModal('create')} variant="primary">
            + New Organization
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-6 shadow-md">
          <p className="text-sm text-blue-600 font-medium mb-1">Total Organizations</p>
          <p className="text-3xl font-bold text-blue-800">{organizations.length}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-6 shadow-md">
          <p className="text-sm text-green-600 font-medium mb-1">Total Users</p>
          <p className="text-3xl font-bold text-green-800">
            {organizations.reduce((sum, o) => sum + (o._count?.users || 0), 0)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-6 shadow-md">
          <p className="text-sm text-purple-600 font-medium mb-1">Total Subscriptions</p>
          <p className="text-3xl font-bold text-purple-800">
            {organizations.reduce((sum, o) => sum + (o._count?.subscriptions || 0), 0)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-xl p-6 shadow-md">
          <p className="text-sm text-orange-600 font-medium mb-1">Organization Events</p>
          <p className="text-3xl font-bold text-orange-800">
            {organizations.reduce((sum, o) => sum + (o._count?.organizationEvents || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Search & Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, slug, industry, or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || filterIndustry !== 'all' || filterCountry !== 'all') && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <p className="text-sm text-blue-800">
              <strong>Showing:</strong> {filteredOrgs.length} of {organizations.length} organizations
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterIndustry('all');
                setFilterCountry('all');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrgs.length > 0 ? (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-xs text-gray-500">
                          Created: {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {org.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.industry ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {org.industry}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not set</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {org.country ? `🌍 ${org.country}` : <span className="text-gray-400">Not set</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-600">
                        <div>👥 {org._count?.users || 0} users</div>
                        <div>📚 {org._count?.subscriptions || 0} subscriptions</div>
                        <div>📅 {org._count?.organizationEvents || 0} events</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        
                        <button
                          onClick={() => handleOpenModal('edit', org)}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(org.id, org.name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-lg">No organizations found</p>
                    <p className="text-sm mt-2">
                      {searchTerm || filterIndustry !== 'all' || filterCountry !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Click "New Organization" to create one'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {modalMode === 'create' ? '➕ New Organization' : '✏️ Edit Organization'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter organization name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug {modalMode === 'create' && '*'}
                    {modalMode === 'edit' && (
                      <span className="text-xs text-gray-500 ml-2">(cannot be changed)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    disabled={modalMode === 'edit'}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${
                      modalMode === 'edit' ? 'bg-gray-100 cursor-not-allowed' : ''
                    } ${formErrors.slug ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="organization-slug"
                  />
                  {formErrors.slug && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.slug}</p>
                  )}
                  {modalMode === 'create' && (
                    <p className="mt-1 text-xs text-gray-500">
                      Use lowercase letters, numbers, and hyphens only (e.g., tech-corp)
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., Technology, Finance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="e.g., USA, UK, France"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button 
                    onClick={handleSubmit}
                    variant="primary" 
                    className="flex-1"
                  >
                    {modalMode === 'create' ? '✓ Create Organization' : '✓ Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCloseModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;