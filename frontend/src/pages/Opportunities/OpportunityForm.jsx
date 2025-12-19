import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { opportunityService, accountService, contactService } from '../../services/apiService';
import { formatDateForAPI } from '../../utils/apiHelpers';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function OpportunityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    accountId: '',
    contactId: '',
    stage: 'PROSPECTING',
    probability: 0,
    amount: '',
    expectedCloseDate: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const result = await accountService.fetchAll({ pageSize: 1000 });
      setAccounts(result.data || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error.message);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const result = await contactService.fetchAll({ pageSize: 1000 });
      setContacts(result.data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error.message);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      const opportunity = await opportunityService.fetchById(id);
      setFormData({
        name: opportunity.name || '',
        description: opportunity.description || '',
        accountId: opportunity.accountId || '',
        contactId: opportunity.contactId || '',
        stage: opportunity.stage || 'PROSPECTING',
        probability: opportunity.probability || 0,
        amount: opportunity.amount || '',
        expectedCloseDate: opportunity.expectedCloseDate 
          ? formatDateForAPI(opportunity.expectedCloseDate) 
          : '',
        status: opportunity.status || 'ACTIVE',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to fetch opportunity');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { 
        ...formData,
        expectedCloseDate: formData.expectedCloseDate ? formatDateForAPI(formData.expectedCloseDate) : null,
      };
      if (id) {
        await opportunityService.update(id, data);
        toast.success('Opportunity updated successfully');
      } else {
        await opportunityService.create(data);
        toast.success('Opportunity created successfully');
      }
      navigate('/opportunities');
    } catch (error) {
      toast.error(error.message || 'Failed to save opportunity');
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/opportunities')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Opportunity' : 'New Opportunity'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id ? 'Update opportunity information' : 'Create a new opportunity'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opportunity Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="input"
                disabled={loadingAccounts}
              >
                <option value="">
                  {loadingAccounts ? 'Loading...' : accounts.length === 0 ? 'No accounts available' : 'Select Account (Optional)'}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <select
                value={formData.contactId}
                onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                className="input"
                disabled={loadingContacts}
              >
                <option value="">
                  {loadingContacts ? 'Loading...' : contacts.length === 0 ? 'No contacts available' : 'Select Contact (Optional)'}
                </option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stage *</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="input"
                required
              >
                <option value="PROSPECTING">Prospecting</option>
                <option value="QUALIFICATION">Qualification</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="CLOSED_WON">Closed Won</option>
                <option value="CLOSED_LOST">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Probability (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expected Close Date</label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/opportunities')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : id ? 'Update Opportunity' : 'Create Opportunity'}
          </button>
        </div>
      </form>
    </div>
  );
}

