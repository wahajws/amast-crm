import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiSearch, FiFilter, FiEye, FiTrash2, FiStar, FiBriefcase, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { emailService, accountService } from '../../services/apiService';
import { formatDateForDisplay } from '../../utils/apiHelpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Emails() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, unlinked, starred
  const [view, setView] = useState('emails'); // 'emails' or 'accounts'

  useEffect(() => {
    fetchEmails();
    fetchAccounts();
  }, [page, filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        pageSize,
        search: search || undefined,
        unlinked: filter === 'unlinked' ? 'true' : undefined
      };
      const data = await emailService.fetchAll(params);
      setEmails(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch emails');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmails();
  };

  const handleToggleStar = async (emailId, currentStatus) => {
    try {
      await emailService.update(emailId, { isStarred: !currentStatus });
      await fetchEmails();
      toast.success('Email updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update email');
    }
  };

  const handleDelete = async (emailId) => {
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return;
    }
    try {
      await emailService.delete(emailId);
      await fetchEmails();
      toast.success('Email deleted');
    } catch (error) {
      toast.error(error.message || 'Failed to delete email');
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const accountsList = await accountService.getWithEmailCounts();
      setAccounts(accountsList || []);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && emails.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Emails
          </h1>
          <p className="text-secondary-600 text-lg">View and manage your synced emails</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('emails')}
            className={`btn ${view === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Emails
          </button>
          <button
            onClick={() => setView('accounts')}
            className={`btn ${view === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
          >
            By Account
          </button>
        </div>
      </div>

      {/* Accounts View */}
      {view === 'accounts' && (
        <div className="card border-0 shadow-medium">
          {loadingAccounts ? (
            <div className="text-center py-12">
              <LoadingSpinner />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-16">
              <FiBriefcase className="w-20 h-20 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-500 font-medium mb-2">No accounts with emails found</p>
              <p className="text-sm text-secondary-400">Create accounts and sync emails to see them organized here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => navigate(`/emails/account/${account.id}`)}
                  className="flex items-center justify-between p-5 border border-secondary-200 rounded-xl hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent hover:border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/30 group-hover:scale-110 transition-transform flex-shrink-0">
                      <FiBriefcase className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary-900 truncate">{account.name}</p>
                      <p className="text-sm text-secondary-600 mt-0.5">
                        {account.emailCount || 0} {account.emailCount === 1 ? 'email' : 'emails'} found
                      </p>
                    </div>
                  </div>
                  <FiChevronRight className="w-5 h-5 text-secondary-400 group-hover:text-primary-600 transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emails List View */}
      {view === 'emails' && (
        <>
          {/* Search and Filters */}
          <div className="card border-0 shadow-medium">
            <form onSubmit={handleSearch} className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search emails..."
                  className="input pl-11 w-full"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="input"
              >
                <option value="all">All Emails</option>
                <option value="unlinked">Unlinked Emails</option>
                <option value="starred">Starred</option>
              </select>
              <button type="submit" className="btn btn-primary shadow-lg shadow-primary-500/20">
                Search
              </button>
            </form>
          </div>

          {/* Emails List */}
          <div className="card border-0 shadow-medium">
            {emails.length === 0 ? (
              <div className="text-center py-16">
                <FiMail className="w-20 h-20 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600 font-medium mb-2">No emails found.</p>
                <p className="text-sm text-secondary-400">
                  Sync your emails from Gmail Integration page.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="flex items-center justify-between p-5 border border-secondary-200 rounded-xl hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent hover:border-primary-200 hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => navigate(`/emails/${email.id}`)}
                    >
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(email.id, email.isStarred);
                          }}
                          className="flex-shrink-0 text-amber-500 hover:text-amber-600 transition-transform hover:scale-110"
                        >
                          <FiStar className={`w-5 h-5 ${email.isStarred ? 'fill-current text-amber-500' : 'text-secondary-300'}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-secondary-900 truncate">
                              {email.fromName || email.fromEmail}
                            </span>
                            {!email.isRead && (
                              <span className="w-2.5 h-2.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full ring-2 ring-primary-100"></span>
                            )}
                          </div>
                          <div className="text-sm text-secondary-700 truncate mt-1 font-medium">{email.subject || '(No Subject)'}</div>
                          <div className="text-xs text-secondary-500 mt-1.5">
                            {email.receivedAt ? formatDateForDisplay(email.receivedAt) : 'No date'}
                            {email.contact && ` • Linked to ${email.contact.firstName} ${email.contact.lastName}`}
                            {email.account && ` • Linked to ${email.account.name}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/emails/${email.id}`);
                          }}
                          className="p-2.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110"
                          title="View Email"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(email.id);
                          }}
                          className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                          title="Delete Email"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-secondary-200 bg-gradient-to-r from-secondary-50/50 to-transparent -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl">
                    <div className="text-sm font-medium text-secondary-700">
                      Showing <span className="font-semibold text-secondary-900">{(page - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-semibold text-secondary-900">{Math.min(page * pageSize, total)}</span> of{' '}
                      <span className="font-semibold text-secondary-900">{total}</span> emails
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

