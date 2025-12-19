import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { accountService } from '../../services/apiService';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function AccountForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: '',
    description: '',
    annualRevenue: '',
    numberOfEmployees: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      const account = await accountService.fetchById(id);
      setFormData({
        name: account.name || '',
        industry: account.industry || '',
        website: account.website || '',
        phone: account.phone || '',
        email: account.email || '',
        billingStreet: account.billingStreet || '',
        billingCity: account.billingCity || '',
        billingState: account.billingState || '',
        billingPostalCode: account.billingPostalCode || '',
        billingCountry: account.billingCountry || '',
        shippingStreet: account.shippingStreet || '',
        shippingCity: account.shippingCity || '',
        shippingState: account.shippingState || '',
        shippingPostalCode: account.shippingPostalCode || '',
        shippingCountry: account.shippingCountry || '',
        description: account.description || '',
        annualRevenue: account.annualRevenue || '',
        numberOfEmployees: account.numberOfEmployees || '',
        status: account.status || 'ACTIVE',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to fetch account');
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
        await accountService.update(id, data);
        toast.success('Account updated successfully');
      } else {
        await accountService.create(data);
        toast.success('Account created successfully');
      }
      navigate('/accounts');
    } catch (error) {
      toast.error(error.message || 'Failed to save account');
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
          onClick={() => navigate('/accounts')}
          className="p-2.5 hover:bg-primary-50 rounded-xl transition-all duration-200 text-secondary-600 hover:text-primary-600"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            {id ? 'Edit Account' : 'New Account'}
          </h1>
          <p className="text-secondary-600 text-lg">
            {id ? 'Update account information' : 'Create a new account'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8 border-0 shadow-large">
        {/* Basic Information */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-secondary-200">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-secondary-900">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                Account Name *
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
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PROSPECT">Prospect</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Annual Revenue</label>
              <input
                type="number"
                value={formData.annualRevenue}
                onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Employees</label>
              <input
                type="number"
                value={formData.numberOfEmployees}
                onChange={(e) => setFormData({ ...formData, numberOfEmployees: e.target.value })}
                className="input"
              />
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

        {/* Billing Address */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input
                type="text"
                value={formData.billingStreet}
                onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={formData.billingCity}
                onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={formData.billingState}
                onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
              <input
                type="text"
                value={formData.billingPostalCode}
                onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.billingCountry}
                onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-secondary-200 bg-gradient-to-r from-transparent to-secondary-50/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
          <button
            type="button"
            onClick={() => navigate('/accounts')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary shadow-lg shadow-primary-500/20"
          >
            {loading ? 'Saving...' : id ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}

