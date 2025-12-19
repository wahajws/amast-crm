import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contactService, accountService } from '../../services/apiService';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function ContactForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    title: '',
    department: '',
    accountId: '',
    mailingStreet: '',
    mailingCity: '',
    mailingState: '',
    mailingPostalCode: '',
    mailingCountry: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchAccounts();
    if (id) {
      fetchContact();
    }
  }, [id]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const result = await accountService.fetchAll({ pageSize: 1000 });
      setAccounts(result.data || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error.message);
      toast.error('Failed to load accounts. You can still create a contact without linking to an account.');
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchContact = async () => {
    try {
      setLoading(true);
      const contact = await contactService.fetchById(id);
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        mobile: contact.mobile || '',
        title: contact.title || '',
        department: contact.department || '',
        accountId: contact.accountId || '',
        mailingStreet: contact.mailingStreet || '',
        mailingCity: contact.mailingCity || '',
        mailingState: contact.mailingState || '',
        mailingPostalCode: contact.mailingPostalCode || '',
        mailingCountry: contact.mailingCountry || '',
        description: contact.description || '',
        status: contact.status || 'ACTIVE',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to fetch contact');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { ...formData };
      if (id) {
        await contactService.update(id, data);
        toast.success('Contact updated successfully');
      } else {
        await contactService.create(data);
        toast.success('Contact created successfully');
      }
      navigate('/contacts');
    } catch (error) {
      toast.error(error.message || 'Failed to save contact');
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
          onClick={() => navigate('/contacts')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {id ? 'Edit Contact' : 'New Contact'}
          </h1>
          <p className="text-gray-600 mt-1">
            {id ? 'Update contact information' : 'Create a new contact'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="input"
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
                  {loadingAccounts ? 'Loading accounts...' : accounts.length === 0 ? 'No accounts available' : 'Select Account (Optional)'}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {accounts.length === 0 && !loadingAccounts && (
                <p className="text-xs text-gray-500 mt-1">
                  No accounts found. <button 
                    type="button"
                    onClick={() => navigate('/accounts/new')}
                    className="text-primary-600 hover:underline"
                  >
                    Create an account first
                  </button> or continue without linking.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="LEAD">Lead</option>
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

        {/* Mailing Address */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Mailing Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input
                type="text"
                value={formData.mailingStreet}
                onChange={(e) => setFormData({ ...formData, mailingStreet: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.mailingCity}
                onChange={(e) => setFormData({ ...formData, mailingCity: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.mailingState}
                onChange={(e) => setFormData({ ...formData, mailingState: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
              <input
                type="text"
                value={formData.mailingPostalCode}
                onChange={(e) => setFormData({ ...formData, mailingPostalCode: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.mailingCountry}
                onChange={(e) => setFormData({ ...formData, mailingCountry: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/contacts')}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Saving...' : id ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}

