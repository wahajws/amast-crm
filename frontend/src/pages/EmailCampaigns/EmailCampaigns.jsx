import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiMail, FiEdit2, FiTrash2, FiSearch, FiCheck, FiX, 
  FiSend, FiClock, FiAlertCircle, FiFilter, FiEye, FiSave,
  FiTrendingUp, FiUser, FiBriefcase, FiZap
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SENT: 'bg-green-100 text-green-800',
  OPENED: 'bg-blue-100 text-blue-800',
  REPLIED: 'bg-purple-100 text-purple-800',
  BOUNCED: 'bg-red-100 text-red-800',
  NO_EMAIL: 'bg-gray-200 text-gray-700',
  NOT_CREATED: 'bg-yellow-100 text-yellow-800',
};

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [selectedCampaigns, setSelectedCampaigns] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingContactId, setGeneratingContactId] = useState(null);
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaigns();
    loadCompanyProfiles();
  }, [pagination.page, searchTerm, filters]);

  const loadCompanyProfiles = async () => {
    try {
      const response = await api.get('/lead-generation/profiles');
      setCompanyProfiles(response.data.data?.profiles || response.data.data || []);
    } catch (error) {
      console.error('Failed to load company profiles:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
      if (filters.status && filters.status.trim()) params.status = filters.status.trim();
      if (filters.priority && filters.priority.trim()) params.priority = filters.priority.trim();
      
      const response = await api.get('/email-campaigns', { params });
      const result = response.data.data;
      
      setCampaigns(result.data || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        totalPages: result.totalPages || 0,
      }));
    } catch (error) {
      toast.error('Failed to fetch email campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSent = async (contactId) => {
    try {
      if (!campaigns.find(c => c.id === contactId)?.campaignId) {
        await api.post('/email-campaigns', {
          contactId: contactId,
          accountId: campaigns.find(c => c.id === contactId)?.accountId,
          emailSubject: campaigns.find(c => c.id === contactId)?.emailSubject,
          emailTemplate: campaigns.find(c => c.id === contactId)?.emailTemplate,
          status: 'SENT',
          priority: 'MEDIUM',
        });
      }
      await api.post(`/email-campaigns/${contactId}/mark-sent`);
      toast.success('Email marked as sent');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to mark email as sent');
    }
  };

  const handleToggleCommunication = async (contactId, currentStatus) => {
    try {
      const contact = campaigns.find(c => c.id === contactId);
      if (!contact?.campaignId) {
        await api.post('/email-campaigns', {
          contactId: contactId,
          accountId: contact?.accountId,
          emailSubject: contact?.emailSubject,
          emailTemplate: contact?.emailTemplate,
          status: 'SENT',
          priority: 'MEDIUM',
        });
      }
      await api.post(`/email-campaigns/${contactId}/toggle-communication`, {
        started: !currentStatus
      });
      toast.success(`Communication ${!currentStatus ? 'started' : 'stopped'}`);
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to update communication status');
    }
  };

  const handleBulkMarkAsSent = async () => {
    if (selectedCampaigns.size === 0) {
      toast.error('Please select emails to mark as sent');
      return;
    }

    try {
      await api.post('/email-campaigns/bulk/mark-sent', {
        ids: Array.from(selectedCampaigns)
      });
      toast.success(`${selectedCampaigns.size} emails marked as sent`);
      setSelectedCampaigns(new Set());
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to bulk mark as sent');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email campaign?')) return;

    try {
      await api.delete(`/email-campaigns/${id}`);
      toast.success('Email campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete email campaign');
    }
  };

  const handleView = (campaign) => {
    navigate(`/email-campaigns/${campaign.id}`);
  };

  const handleStartEdit = (campaign, field) => {
    setEditingId(campaign.id);
    setEditingField(field);
    setEditValues({
      emailSubject: cleanSubject(campaign.emailSubject || ''),
      emailTemplate: campaign.emailTemplate || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValues({});
  };

  const handleSaveEdit = async (contactId) => {
    try {
      const cleanedSubject = cleanSubject(editValues.emailSubject);
      
      await api.put(`/contacts/${contactId}`, {
        emailSubject: cleanedSubject,
        emailTemplate: editValues.emailTemplate
      });
      toast.success('Email updated successfully');
      setEditingId(null);
      setEditingField(null);
      setEditValues({});
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update email');
    }
  };

  const cleanSubject = (subject) => {
    if (!subject) return '';
    // Remove trailing "0" on same line or new line, and any trailing whitespace
    return subject
      .replace(/\s+0+\s*$/gm, '') // Remove trailing "0" (including on new lines)
      .replace(/\n\s*0+\s*$/gm, '') // Remove "0" on new line at end
      .replace(/\s+$/gm, '') // Remove trailing whitespace
      .replace(/\n+$/, '') // Remove trailing newlines
      .trim();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleGenerateEmail = (contactId) => {
    setGeneratingContactId(contactId);
    setSelectedProfileId(companyProfiles.length > 0 ? companyProfiles[0].id : '');
    setShowGenerateModal(true);
  };

  const handleConfirmGenerate = async () => {
    if (!generatingContactId) return;
    
    if (companyProfiles.length > 0 && !selectedProfileId) {
      toast.error('Please select a company profile');
      return;
    }

    try {
      setGenerating(true);
      await api.post(`/email-campaigns/${generatingContactId}/generate-email`, {
        companyProfileId: selectedProfileId || null
      });
      toast.success('Email generated successfully');
      setShowGenerateModal(false);
      setGeneratingContactId(null);
      setSelectedProfileId('');
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate email');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && campaigns.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Email Campaigns
          </h1>
          <p className="text-secondary-600 text-base sm:text-lg">Manage and track your email campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/email-dashboard')}
            className="btn btn-secondary flex items-center justify-center space-x-2 shadow-md w-full sm:w-auto"
          >
            <FiTrendingUp className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card border-0 shadow-medium">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by subject, email, or account..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input pl-11 w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center justify-center space-x-2 w-full lg:w-auto`}
          >
            <FiFilter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="input w-full"
                >
                  <option value="">All Statuses</option>
                  <option value="NO_EMAIL">No Email</option>
                  <option value="NOT_CREATED">Not Created</option>
                  <option value="PENDING">Pending</option>
                  <option value="SENT">Sent</option>
                  <option value="OPENED">Opened</option>
                  <option value="REPLIED">Replied</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => {
                    setFilters({ ...filters, priority: e.target.value });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="input w-full"
                >
                  <option value="">All Priorities</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilters({ status: '', priority: '' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="text-sm text-secondary-600 hover:text-secondary-900"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedCampaigns.size > 0 && (
          <div className="mt-4 pt-4 border-t border-secondary-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="text-sm font-medium text-secondary-700">
              {selectedCampaigns.size} email{selectedCampaigns.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkMarkAsSent}
              className="btn btn-success flex items-center space-x-2 w-full sm:w-auto"
            >
              <FiCheck className="w-5 h-5" />
              <span>Mark as Sent ({selectedCampaigns.size})</span>
            </button>
          </div>
        )}
      </div>

      {/* Generate Email Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-900">Generate Email</h2>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGeneratingContactId(null);
                  setSelectedProfileId('');
                }}
                className="text-secondary-500 hover:text-secondary-700 transition-colors"
                disabled={generating}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {companyProfiles.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Company Profile
                  </label>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="input w-full"
                    disabled={generating}
                  >
                    {companyProfiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.companyName} - {profile.industry || 'No industry'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-500 mt-1">
                    Select the company profile to use for generating personalized emails
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No company profiles found. Please create a company profile first in the Lead Generation section.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-secondary-200">
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setGeneratingContactId(null);
                  setSelectedProfileId('');
                }}
                className="btn btn-secondary"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGenerate}
                className="btn btn-primary flex items-center space-x-2"
                disabled={generating || (companyProfiles.length > 0 && !selectedProfileId)}
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FiZap className="w-5 h-5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Content Edit Modal */}
      {editingId && editingField === 'content' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-secondary-900">Edit Email Content</h2>
              <button
                onClick={handleCancelEdit}
                className="text-secondary-500 hover:text-secondary-700 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={editValues.emailSubject}
                  onChange={(e) => setEditValues({ ...editValues, emailSubject: e.target.value })}
                  className="input w-full"
                  placeholder="Email subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Email Body</label>
                <textarea
                  value={editValues.emailTemplate}
                  onChange={(e) => setEditValues({ ...editValues, emailTemplate: e.target.value })}
                  rows={14}
                  className="input w-full resize-none"
                  placeholder="Email content"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-secondary-200">
              <button
                onClick={handleCancelEdit}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(editingId)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <FiSave className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="card overflow-hidden border-0 shadow-medium w-full">
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex flex-col items-center space-y-4">
              <FiMail className="w-16 h-16 text-secondary-300" />
              <p className="text-secondary-500 font-medium text-lg">No email campaigns found</p>
              <p className="text-sm text-secondary-400">Get started by importing contacts with email templates</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto -mx-6">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="table min-w-full">
                    <thead>
                      <tr>
                        <th className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
                              } else {
                                setSelectedCampaigns(new Set());
                              }
                            }}
                            className="rounded border-secondary-300"
                          />
                        </th>
                        <th className="min-w-[200px]">Contact</th>
                        <th className="min-w-[150px]">Account</th>
                        <th className="min-w-[300px]">Subject</th>
                        <th className="min-w-[100px]">Status</th>
                        <th className="min-w-[100px]">Priority</th>
                        <th className="min-w-[150px]">Sent</th>
                        <th className="min-w-[120px]">Communication</th>
                        <th className="min-w-[150px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => {
                        const daysAgo = campaign.emailGeneratedAt ? getDaysAgo(campaign.emailGeneratedAt) : null;
                        const isUrgent = daysAgo && daysAgo > 7 && (campaign.campaignStatus === 'PENDING' || campaign.campaignStatus === 'NOT_CREATED');
                        
                        return (
                          <tr key={campaign.id} className={isUrgent ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-secondary-50'}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedCampaigns.has(campaign.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedCampaigns);
                                  if (e.target.checked) {
                                    newSelected.add(campaign.id);
                                  } else {
                                    newSelected.delete(campaign.id);
                                  }
                                  setSelectedCampaigns(newSelected);
                                }}
                                className="rounded border-secondary-300"
                              />
                            </td>
                            <td>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-primary-500/30 flex-shrink-0">
                                  {(campaign.firstName?.[0] || campaign.email?.[0] || 'C').toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-secondary-900 truncate">
                                    {campaign.firstName} {campaign.lastName}
                                  </p>
                                  <p className="text-sm text-secondary-500 truncate max-w-[180px]" title={campaign.email}>
                                    {campaign.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center space-x-2">
                                <FiBriefcase className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                                <span className="text-secondary-700 truncate max-w-[130px]" title={campaign.account?.name || 'N/A'}>
                                  {campaign.account?.name || <span className="text-secondary-400">N/A</span>}
                                </span>
                              </div>
                            </td>
                            <td>
                              {!campaign.emailSubject || campaign.campaignStatus === 'NO_EMAIL' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-secondary-400 text-sm italic">No email generated</span>
                                  <button
                                    onClick={() => handleGenerateEmail(campaign.id)}
                                    className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-1"
                                    title="Generate Email"
                                  >
                                    <FiZap className="w-3 h-3" />
                                    Generate
                                  </button>
                                </div>
                              ) : editingId === campaign.id && editingField === 'subject' ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editValues.emailSubject}
                                    onChange={(e) => setEditValues({ ...editValues, emailSubject: e.target.value })}
                                    className="flex-1 input text-sm"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(campaign.id)}
                                    className="text-green-600 hover:text-green-700 transition-colors"
                                    title="Save"
                                  >
                                    <FiSave className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-secondary-600 hover:text-secondary-700 transition-colors"
                                    title="Cancel"
                                  >
                                    <FiX className="w-5 h-5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="group">
                                  <p className="text-secondary-900 font-medium truncate max-w-[280px]" title={cleanSubject(campaign.emailSubject)}>
                                    {cleanSubject(campaign.emailSubject)}
                                  </p>
                                  <button
                                    onClick={() => handleStartEdit(campaign, 'subject')}
                                    className="opacity-0 group-hover:opacity-100 text-primary-600 hover:text-primary-700 text-xs mt-1 flex items-center gap-1 transition-opacity"
                                    title="Edit subject"
                                  >
                                    <FiEdit2 className="w-3 h-3" />
                                    Edit
                                  </button>
                                </div>
                              )}
                              {isUrgent && (
                                <div className="text-xs text-yellow-700 flex items-center gap-1 mt-1">
                                  <FiAlertCircle className="w-3 h-3" />
                                  {daysAgo} days old
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[campaign.campaignStatus] || STATUS_COLORS.PENDING}`}>
                                {campaign.campaignStatus === 'NOT_CREATED' ? 'PENDING' : (campaign.campaignStatus === 'NO_EMAIL' ? 'NO EMAIL' : campaign.campaignStatus)}
                              </span>
                            </td>
                            <td>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[campaign.campaignPriority] || PRIORITY_COLORS.MEDIUM}`}>
                                {campaign.campaignPriority}
                              </span>
                            </td>
                            <td>
                              {campaign.sentAt ? (
                                <div className="text-sm">
                                  <div className="text-secondary-900 font-medium">{formatDate(campaign.sentAt)}</div>
                                  {campaign.sentByUser && (
                                    <div className="text-xs text-secondary-500 mt-1">
                                      by {campaign.sentByUser.firstName} {campaign.sentByUser.lastName}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-secondary-400">-</span>
                              )}
                            </td>
                            <td>
                              {campaign.communicationStarted ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  <FiCheck className="w-3 h-3" />
                                  Started
                                </span>
                              ) : (
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Not Started
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="flex items-center gap-2">
                                {campaign.campaignStatus === 'NO_EMAIL' ? (
                                  <button
                                    onClick={() => handleGenerateEmail(campaign.id)}
                                    className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Generate Email"
                                  >
                                    <FiZap className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(campaign, 'content')}
                                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                      title="Edit Email Content"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleView(campaign)}
                                      className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                                      title="View Details"
                                    >
                                      <FiEye className="w-4 h-4" />
                                    </button>
                                    {(campaign.campaignStatus === 'PENDING' || campaign.campaignStatus === 'NOT_CREATED') && (
                                      <button
                                        onClick={() => handleMarkAsSent(campaign.id)}
                                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Mark as Sent"
                                      >
                                        <FiSend className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                                <button
                                  onClick={() => handleToggleCommunication(campaign.id, campaign.communicationStarted)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    campaign.communicationStarted 
                                      ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" 
                                      : "text-green-600 hover:text-green-700 hover:bg-green-50"
                                  }`}
                                  title={campaign.communicationStarted ? "Mark as Not Started" : "Mark as Started"}
                                  disabled={campaign.campaignStatus === 'NO_EMAIL'}
                                >
                                  {campaign.communicationStarted ? <FiX className="w-4 h-4" /> : <FiCheck className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleDelete(campaign.id)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {campaigns.map((campaign) => {
                const daysAgo = campaign.emailGeneratedAt ? getDaysAgo(campaign.emailGeneratedAt) : null;
                const isUrgent = daysAgo && daysAgo > 7 && (campaign.campaignStatus === 'PENDING' || campaign.campaignStatus === 'NOT_CREATED');
                
                return (
                  <div key={campaign.id} className={`card ${isUrgent ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30 flex-shrink-0">
                          {(campaign.firstName?.[0] || campaign.email?.[0] || 'C').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-secondary-900 truncate">
                            {campaign.firstName} {campaign.lastName}
                          </p>
                          <p className="text-sm text-secondary-500 truncate">{campaign.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.has(campaign.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedCampaigns);
                          if (e.target.checked) {
                            newSelected.add(campaign.id);
                          } else {
                            newSelected.delete(campaign.id);
                          }
                          setSelectedCampaigns(newSelected);
                        }}
                        className="rounded border-secondary-300"
                      />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-secondary-500 mb-1">Account</p>
                        <p className="text-sm text-secondary-900">{campaign.account?.name || 'N/A'}</p>
                      </div>

                      <div>
                        <p className="text-xs text-secondary-500 mb-1">Subject</p>
                        {!campaign.emailSubject || campaign.campaignStatus === 'NO_EMAIL' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-secondary-400 text-sm italic">No email generated</span>
                            <button
                              onClick={() => handleGenerateEmail(campaign.id)}
                              className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-1"
                              title="Generate Email"
                            >
                              <FiZap className="w-3 h-3" />
                              Generate
                            </button>
                          </div>
                        ) : editingId === campaign.id && editingField === 'subject' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editValues.emailSubject}
                              onChange={(e) => setEditValues({ ...editValues, emailSubject: e.target.value })}
                              className="flex-1 input text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(campaign.id)}
                              className="text-green-600"
                            >
                              <FiSave className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-secondary-600"
                            >
                              <FiX className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="group">
                            <p className="text-sm text-secondary-900 font-medium">{cleanSubject(campaign.emailSubject)}</p>
                            <button
                              onClick={() => handleStartEdit(campaign, 'subject')}
                              className="opacity-0 group-hover:opacity-100 text-primary-600 text-xs mt-1"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        {isUrgent && (
                          <div className="text-xs text-yellow-700 flex items-center gap-1 mt-1">
                            <FiAlertCircle className="w-3 h-3" />
                            {daysAgo} days old
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[campaign.campaignStatus] || STATUS_COLORS.PENDING}`}>
                          {campaign.campaignStatus === 'NOT_CREATED' ? 'PENDING' : (campaign.campaignStatus === 'NO_EMAIL' ? 'NO EMAIL' : campaign.campaignStatus)}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_COLORS[campaign.campaignPriority] || PRIORITY_COLORS.MEDIUM}`}>
                          {campaign.campaignPriority}
                        </span>
                        {campaign.communicationStarted && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <FiCheck className="w-3 h-3" />
                            Started
                          </span>
                        )}
                      </div>

                      {campaign.sentAt && (
                        <div>
                          <p className="text-xs text-secondary-500 mb-1">Sent</p>
                          <p className="text-sm text-secondary-900">{formatDate(campaign.sentAt)}</p>
                          {campaign.sentByUser && (
                            <p className="text-xs text-secondary-500">by {campaign.sentByUser.firstName} {campaign.sentByUser.lastName}</p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-secondary-200">
                        {campaign.campaignStatus === 'NO_EMAIL' ? (
                          <button
                            onClick={() => handleGenerateEmail(campaign.id)}
                            className="flex-1 btn btn-sm btn-primary flex items-center justify-center space-x-2"
                          >
                            <FiZap className="w-4 h-4" />
                            <span>Generate</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(campaign, 'content')}
                              className="flex-1 btn btn-sm btn-secondary flex items-center justify-center space-x-2"
                            >
                              <FiEdit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleView(campaign)}
                              className="flex-1 btn btn-sm btn-secondary flex items-center justify-center space-x-2"
                            >
                              <FiEye className="w-4 h-4" />
                              <span>View</span>
                            </button>
                            {(campaign.campaignStatus === 'PENDING' || campaign.campaignStatus === 'NOT_CREATED') && (
                              <button
                                onClick={() => handleMarkAsSent(campaign.id)}
                                className="flex-1 btn btn-sm btn-success flex items-center justify-center space-x-2"
                              >
                                <FiSend className="w-4 h-4" />
                                <span>Send</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-secondary-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-secondary-200">
                <div className="text-sm text-secondary-700">
                  Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
