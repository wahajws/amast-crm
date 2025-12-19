import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { reminderService } from '../../services/apiService';
import { accountService, contactService } from '../../services/apiService';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave, FiX, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function ReminderForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    accountId: searchParams.get('accountId') || '',
    contactId: searchParams.get('contactId') || '',
    dueDate: '',
    dueTime: '',
    priority: 'MEDIUM',
    status: 'PENDING',
  });

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
    if (id) {
      fetchReminder();
    }
  }, [id]);

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const result = await accountService.fetchAll({ pageSize: 1000 });
      setAccounts(result.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
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
      console.error('Error fetching contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchReminder = async () => {
    try {
      setLoading(true);
      const reminder = await reminderService.fetchById(id);
      
      // Parse due date and time
      let dueDate = '';
      let dueTime = '';
      if (reminder.dueDate) {
        const date = new Date(reminder.dueDate);
        dueDate = date.toISOString().split('T')[0];
        dueTime = date.toTimeString().slice(0, 5); // HH:mm format
      }

      setFormData({
        title: reminder.title || '',
        description: reminder.description || '',
        accountId: reminder.accountId || '',
        contactId: reminder.contactId || '',
        dueDate,
        dueTime,
        priority: reminder.priority || 'MEDIUM',
        status: reminder.status || 'PENDING',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to fetch reminder');
      navigate('/reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Must have either accountId or contactId, but not both
    if (!formData.accountId && !formData.contactId) {
      toast.error('Please select either an Account or a Contact');
      return;
    }
    
    if (formData.accountId && formData.contactId) {
      toast.error('Reminder can only be linked to either an Account or a Contact, not both');
      return;
    }

    if (!formData.dueDate || !formData.dueTime) {
      toast.error('Please select both date and time for the reminder');
      return;
    }

    setLoading(true);

    try {
      // Combine date and time into ISO string
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString();

      const data = {
        title: formData.title,
        description: formData.description,
        accountId: formData.accountId || null,
        contactId: formData.contactId || null,
        dueDate: dueDateTime,
        priority: formData.priority,
        status: formData.status,
      };

      if (id) {
        await reminderService.update(id, data);
        toast.success('Reminder updated successfully');
      } else {
        await reminderService.create(data);
        toast.success('Reminder created successfully');
      }
      navigate('/reminders');
    } catch (error) {
      toast.error(error.message || 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId) => {
    setFormData({
      ...formData,
      accountId: accountId || '',
      contactId: accountId ? '' : formData.contactId, // Clear contact if account is selected
    });
  };

  const handleContactChange = (contactId) => {
    setFormData({
      ...formData,
      contactId: contactId || '',
      accountId: contactId ? '' : formData.accountId, // Clear account if contact is selected
    });
  };

  if (loading && id) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/reminders')}
          className="p-2.5 hover:bg-secondary-100 rounded-xl transition-all duration-200 group"
        >
          <FiArrowLeft className="w-5 h-5 text-secondary-600 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            {id ? 'Edit Reminder' : 'New Reminder'}
          </h1>
          <p className="text-secondary-600 text-lg mt-1">
            {id ? 'Update reminder information' : 'Create a new reminder'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-medium space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-bold text-secondary-900 mb-5">Reminder Details</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                placeholder="Enter reminder title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[120px] resize-y"
                placeholder="Enter reminder description (optional)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                  Due Date *
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="input pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                  Due Time *
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    className="input pl-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                  Priority *
                </label>
                <div className="relative">
                  <FiAlertCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input pl-11"
                    required
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Link to Account or Contact */}
        <div>
          <h2 className="text-xl font-bold text-secondary-900 mb-5">Link to Account or Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                Account
              </label>
              <select
                value={formData.accountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="input"
                disabled={!!formData.contactId}
              >
                <option value="">Select an account (optional)</option>
                {loadingAccounts ? (
                  <option disabled>Loading accounts...</option>
                ) : (
                  accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))
                )}
              </select>
              {formData.contactId && (
                <p className="text-xs text-secondary-500 mt-1">
                  Clear contact selection to link to an account
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                Contact
              </label>
              <select
                value={formData.contactId}
                onChange={(e) => handleContactChange(e.target.value)}
                className="input"
                disabled={!!formData.accountId}
              >
                <option value="">Select a contact (optional)</option>
                {loadingContacts ? (
                  <option disabled>Loading contacts...</option>
                ) : (
                  contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                      {contact.account && ` (${contact.account.name})`}
                    </option>
                  ))
                )}
              </select>
              {formData.accountId && (
                <p className="text-xs text-secondary-500 mt-1">
                  Clear account selection to link to a contact
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-secondary-600 mt-4">
            <strong>Note:</strong> A reminder must be linked to either an Account or a Contact, but not both.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/reminders')}
            className="btn btn-secondary"
          >
            <FiX className="w-5 h-5" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <FiSave className="w-5 h-5" />
                <span>{id ? 'Update Reminder' : 'Create Reminder'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}





