import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { proposalService, opportunityService, accountService, contactService } from '../../services/apiService';
import { formatDateForAPI } from '../../utils/apiHelpers';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function ProposalForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    opportunityId: '',
    accountId: '',
    contactId: '',
    proposalNumber: '',
    amount: '',
    currency: 'USD',
    validUntil: '',
    status: 'DRAFT',
  });

  useEffect(() => {
    fetchOpportunities();
    fetchAccounts();
    fetchContacts();
    if (id) {
      fetchProposal();
    }
  }, [id]);

  const fetchOpportunities = async () => {
    try {
      setLoadingOpportunities(true);
      const result = await opportunityService.fetchAll({ pageSize: 1000 });
      setOpportunities(result.data || []);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error.message);
      setOpportunities([]);
    } finally {
      setLoadingOpportunities(false);
    }
  };

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

  const fetchProposal = async () => {
    try {
      setLoading(true);
      const proposal = await proposalService.fetchById(id);
      setFormData({
        title: proposal.title || '',
        description: proposal.description || '',
        opportunityId: proposal.opportunityId || '',
        accountId: proposal.accountId || '',
        contactId: proposal.contactId || '',
        proposalNumber: proposal.proposalNumber || '',
        amount: proposal.amount || '',
        currency: proposal.currency || 'USD',
        validUntil: proposal.validUntil 
          ? formatDateForAPI(proposal.validUntil) 
          : '',
        status: proposal.status || 'DRAFT',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to fetch proposal');
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
        validUntil: formData.validUntil ? formatDateForAPI(formData.validUntil) : null,
      };
      if (id) {
        await proposalService.update(id, data);
        toast.success('Proposal updated successfully');
      } else {
        await proposalService.create(data);
        toast.success('Proposal created successfully');
      }
      navigate('/proposals');
    } catch (error) {
      toast.error(error.message || 'Failed to save proposal');
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
          onClick={() => navigate('/proposals')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Proposal' : 'New Proposal'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id ? 'Update proposal information' : 'Create a new proposal'}
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
                Proposal Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opportunity <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <select
                value={formData.opportunityId}
                onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
                className="input"
                disabled={loadingOpportunities}
              >
                <option value="">
                  {loadingOpportunities ? 'Loading...' : opportunities.length === 0 ? 'No opportunities available' : 'Select Opportunity (Optional)'}
                </option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.name}
                  </option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Number</label>
              <input
                type="text"
                value={formData.proposalNumber}
                onChange={(e) => setFormData({ ...formData, proposalNumber: e.target.value })}
                className="input"
                placeholder="e.g., PRO-2024-001"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="input"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="PKR">PKR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
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
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
                <option value="REVIEWED">Reviewed</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ACCEPTED">Accepted</option>
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
            onClick={() => navigate('/proposals')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : id ? 'Update Proposal' : 'Create Proposal'}
          </button>
        </div>
      </form>
    </div>
  );
}

