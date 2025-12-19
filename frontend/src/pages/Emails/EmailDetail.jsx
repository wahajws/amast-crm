import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiUser, FiBriefcase, FiLink, FiTrash2, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { emailService, contactService, accountService } from '../../services/apiService';
import { formatDateForDisplay } from '../../utils/apiHelpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [linking, setLinking] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    fetchEmail();
    fetchContacts();
    fetchAccounts();
  }, [id]);

  const fetchEmail = async () => {
    try {
      setLoading(true);
      const data = await emailService.fetchById(id);
      setEmail(data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch email');
      navigate('/emails');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const result = await contactService.fetchAll({ page: 1, pageSize: 100 });
      // Handle both response formats: { data: [...] } or direct array
      const contactsList = result.data || result || [];
      setContacts(Array.isArray(contactsList) ? contactsList : []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      toast.error('Failed to load contacts');
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const result = await accountService.fetchAll({ page: 1, pageSize: 100 });
      // Handle both response formats: { data: [...] } or direct array
      const accountsList = result.data || result || [];
      setAccounts(Array.isArray(accountsList) ? accountsList : []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleToggleStar = async () => {
    try {
      await emailService.update(id, { isStarred: !email.isStarred });
      await fetchEmail();
      toast.success('Email updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update email');
    }
  };

  const handleLink = async (contactId, accountId) => {
    if (!contactId && !accountId) {
      return; // Don't do anything if both are empty
    }

    try {
      setLinking(true);
      // Convert to integers if they're strings
      const linkData = {};
      if (contactId) linkData.contactId = parseInt(contactId, 10);
      if (accountId) linkData.accountId = parseInt(accountId, 10);
      
      await emailService.link(id, linkData);
      await fetchEmail();
      toast.success('Email linked successfully');
    } catch (error) {
      console.error('Link error:', error);
      toast.error(error.message || 'Failed to link email');
    } finally {
      setLinking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return;
    }
    try {
      await emailService.delete(id);
      toast.success('Email deleted');
      navigate('/emails');
    } catch (error) {
      toast.error(error.message || 'Failed to delete email');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!email) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <p className="text-gray-600">Email not found</p>
          <Link to="/emails" className="btn btn-primary mt-4">
            Back to Emails
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="mb-6">
        <button
          onClick={() => navigate('/emails')}
          className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Emails</span>
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            {email.subject || '(No Subject)'}
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleStar}
              className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-110 ${
                email.isStarred 
                  ? 'text-amber-500 bg-amber-50' 
                  : 'text-secondary-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <FiStar className={`w-5 h-5 ${email.isStarred ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleDelete}
              className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <FiTrash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card border-0 shadow-large">
            <div className="border-b border-secondary-200 pb-5 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30">
                    <FiMail className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-secondary-900 text-lg">Email Details</span>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">From</label>
                <p className="text-secondary-900 font-semibold mt-1.5">{email.fromName || email.fromEmail}</p>
                <p className="text-sm text-secondary-600 mt-0.5">{email.fromEmail}</p>
              </div>
              {email.receivedAt && (
                <div>
                  <label className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">Date</label>
                  <p className="text-secondary-900 font-medium mt-1.5">{formatDateForDisplay(email.receivedAt)}</p>
                </div>
              )}
              {email.bodyHtml ? (
                <div>
                  <label className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">Message</label>
                  <div
                    className="prose max-w-none mt-3 p-4 bg-secondary-50 rounded-xl border border-secondary-200"
                    dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                  />
                </div>
              ) : email.bodyText ? (
                <div>
                  <label className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">Message</label>
                  <p className="text-secondary-900 whitespace-pre-wrap mt-3 p-4 bg-secondary-50 rounded-xl border border-secondary-200">{email.bodyText}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-secondary-400">No message content</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account List */}
          {email.account && (
            <div className="card border-0 shadow-large">
              <h3 className="text-lg font-bold text-secondary-900 mb-6 flex items-center space-x-2">
                <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
                <span>View Timeline</span>
              </h3>
              <Link
                to={`/emails/account/${email.account.id}`}
                className="flex items-center space-x-3 p-4 bg-gradient-to-r from-primary-50 to-transparent rounded-xl border border-primary-200 text-primary-700 hover:text-primary-800 hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:scale-110 transition-transform">
                  <FiBriefcase className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{email.account.name}</p>
                  <p className="text-sm text-primary-600">View all emails for this account</p>
                </div>
              </Link>
            </div>
          )}

          {/* Link to Contact/Account */}
          <div className="card border-0 shadow-large">
            <h3 className="text-lg font-bold text-secondary-900 mb-6 flex items-center space-x-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
              <span>Link Email</span>
            </h3>
            {email.contact || email.account ? (
              <div className="space-y-3">
                {email.contact && (
                  <Link
                    to={`/contacts/${email.contact.id}`}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary-50 to-transparent rounded-xl border border-primary-200 text-primary-700 hover:text-primary-800 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:scale-110 transition-transform">
                      <FiUser className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold">{email.contact.firstName} {email.contact.lastName}</span>
                  </Link>
                )}
                {email.account && (
                  <Link
                    to={`/accounts/${email.account.id}`}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-primary-50 to-transparent rounded-xl border border-primary-200 text-primary-700 hover:text-primary-800 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:scale-110 transition-transform">
                      <FiBriefcase className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold">{email.account.name}</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Link to Contact</label>
                  <select
                    className="input w-full"
                    value={email.contactId || ''}
                    onChange={(e) => {
                      const contactId = e.target.value ? parseInt(e.target.value, 10) : null;
                      handleLink(contactId, email.accountId || null);
                    }}
                    disabled={linking || loadingContacts}
                  >
                    <option value="">
                      {loadingContacts ? 'Loading contacts...' : contacts.length === 0 ? 'No contacts available' : 'Select contact...'}
                    </option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} {contact.email ? `(${contact.email})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Link to Account</label>
                  <select
                    className="input w-full"
                    value={email.accountId || ''}
                    onChange={(e) => {
                      const accountId = e.target.value ? parseInt(e.target.value, 10) : null;
                      handleLink(email.contactId || null, accountId);
                    }}
                    disabled={linking || loadingAccounts}
                  >
                    <option value="">
                      {loadingAccounts ? 'Loading accounts...' : accounts.length === 0 ? 'No accounts available' : 'Select account...'}
                    </option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

