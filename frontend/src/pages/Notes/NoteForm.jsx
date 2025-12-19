import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { noteService } from '../../services/apiService';
import { accountService, contactService } from '../../services/apiService';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave, FiX, FiCalendar, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function NoteForm() {
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
    content: '',
    accountId: searchParams.get('accountId') || '',
    contactId: searchParams.get('contactId') || '',
    reminderDate: '',
    reminderTime: '',
    hasReminder: false,
  });

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
    if (id) {
      fetchNote();
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

  const fetchNote = async () => {
    try {
      setLoading(true);
      const note = await noteService.fetchById(id);
      
      // Parse reminder date and time
      let reminderDate = '';
      let reminderTime = '';
      let hasReminder = false;
      if (note.reminderDate) {
        const date = new Date(note.reminderDate);
        reminderDate = date.toISOString().split('T')[0];
        reminderTime = date.toTimeString().slice(0, 5); // HH:mm format
        hasReminder = true;
      }

      setFormData({
        title: note.title || '',
        content: note.content || '',
        accountId: note.accountId || '',
        contactId: note.contactId || '',
        reminderDate,
        reminderTime,
        hasReminder,
      });
    } catch (error) {
      toast.error(error.message || 'Failed to fetch note');
      navigate('/notes');
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
      toast.error('Note can only be linked to either an Account or a Contact, not both');
      return;
    }

    setLoading(true);

    try {
      // Build reminder date if reminder is enabled
      let reminderDate = null;
      if (formData.hasReminder && formData.reminderDate && formData.reminderTime) {
        reminderDate = new Date(`${formData.reminderDate}T${formData.reminderTime}`).toISOString();
      }

      const data = {
        title: formData.title,
        content: formData.content,
        accountId: formData.accountId || null,
        contactId: formData.contactId || null,
        reminderDate: reminderDate,
        reminderStatus: reminderDate ? 'PENDING' : null,
      };

      if (id) {
        await noteService.update(id, data);
        toast.success('Note updated successfully');
      } else {
        await noteService.create(data);
        toast.success('Note created successfully');
      }
      navigate('/notes');
    } catch (error) {
      toast.error(error.message || 'Failed to save note');
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
          onClick={() => navigate('/notes')}
          className="p-2.5 hover:bg-secondary-100 rounded-xl transition-all duration-200 group"
        >
          <FiArrowLeft className="w-5 h-5 text-secondary-600 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            {id ? 'Edit Note' : 'New Note'}
          </h1>
          <p className="text-secondary-600 text-lg mt-1">
            {id ? 'Update note information' : 'Create a new note'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card border-0 shadow-medium space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-bold text-secondary-900 mb-5">Note Details</h2>
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
                placeholder="Enter note title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input min-h-[200px] resize-y"
                placeholder="Enter note content..."
                required
              />
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
            <strong>Note:</strong> A note must be linked to either an Account or a Contact, but not both.
          </p>
        </div>

        {/* Reminder Section */}
        <div>
          <h2 className="text-xl font-bold text-secondary-900 mb-5">Set Reminder (Optional)</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="hasReminder"
                checked={formData.hasReminder}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    hasReminder: e.target.checked,
                    reminderDate: e.target.checked ? formData.reminderDate : '',
                    reminderTime: e.target.checked ? formData.reminderTime : '',
                  });
                }}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              <label htmlFor="hasReminder" className="text-sm font-semibold text-secondary-700 cursor-pointer">
                Set a reminder for this note
              </label>
            </div>

            {formData.hasReminder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                    Reminder Date *
                  </label>
                  <div className="relative">
                    <FiCalendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                    <input
                      type="date"
                      value={formData.reminderDate}
                      onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                      className="input pl-11"
                      required={formData.hasReminder}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
                    Reminder Time *
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                    <input
                      type="time"
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="input pl-11"
                      required={formData.hasReminder}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-secondary-200">
          <button
            type="button"
            onClick={() => navigate('/notes')}
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
                <span>{id ? 'Update Note' : 'Create Note'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

