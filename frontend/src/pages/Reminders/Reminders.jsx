import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reminderService } from '../../services/apiService';
import { accountService, contactService } from '../../services/apiService';
import { createPaginationState, updatePaginationFromResponse } from '../../utils/apiHelpers';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiCheck, FiClock, FiAlertCircle, FiBriefcase, FiUser, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [pagination, setPagination] = useState(createPaginationState());
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterContactId, setFilterContactId] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [pagination.page, filter, filterAccountId, filterContactId, filterPriority]);

  const fetchAccounts = async () => {
    try {
      const result = await accountService.fetchAll({ pageSize: 1000 });
      setAccounts(result.data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const result = await contactService.fetchAll({ pageSize: 1000 });
      setContacts(result.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (filter !== 'all') {
        params.status = filter.toUpperCase();
      }
      if (filterAccountId) params.accountId = filterAccountId;
      if (filterContactId) params.contactId = filterContactId;
      if (filterPriority) params.priority = filterPriority;
      
      const result = await reminderService.fetchAll(params);
      setReminders(result.data);
      setPagination(prev => updatePaginationFromResponse(prev, { data: { data: result } }));
    } catch (error) {
      toast.error(error.message || 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await reminderService.markComplete(id);
      toast.success('Reminder marked as complete');
      fetchReminders();
    } catch (error) {
      toast.error(error.message || 'Failed to update reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      await reminderService.delete(id);
      toast.success('Reminder deleted successfully');
      fetchReminders();
    } catch (error) {
      toast.error(error.message || 'Failed to delete reminder');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      URGENT: 'bg-red-100 text-red-800 border-red-200',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
      MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      LOW: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'URGENT') {
      return <FiAlertCircle className="w-4 h-4" />;
    }
    return null;
  };

  const clearFilters = () => {
    setFilterAccountId('');
    setFilterContactId('');
    setFilterPriority('');
    setFilter('all');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filterAccountId || filterContactId || filterPriority || filter !== 'all';

  if (loading && reminders.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Reminders
          </h1>
          <p className="text-secondary-600 text-lg">Manage your reminders</p>
        </div>
        <button
          onClick={() => navigate('/reminders/new')}
          className="btn btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20 w-full sm:w-auto"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Reminder</span>
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setFilter('all');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All
        </button>
        <button
          onClick={() => {
            setFilter('pending');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Pending
        </button>
        <button
          onClick={() => {
            setFilter('completed');
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Completed
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="card border-0 shadow-medium space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Account Filter */}
          <div className="md:w-64">
            <select
              value={filterAccountId}
              onChange={(e) => {
                setFilterAccountId(e.target.value);
                setFilterContactId(''); // Clear contact filter when account is selected
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Filter */}
          <div className="md:w-64">
            <select
              value={filterContactId}
              onChange={(e) => {
                setFilterContactId(e.target.value);
                setFilterAccountId(''); // Clear account filter when contact is selected
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              <option value="">All Contacts</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="md:w-64">
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <FiX className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <div className="card border-0 shadow-medium text-center py-16">
            <FiClock className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500 font-medium text-lg">No reminders found</p>
            <p className="text-sm text-secondary-400 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating your first reminder'}
            </p>
          </div>
        ) : (
          reminders.map((reminder) => {
            const isOverdue = reminder.status === 'PENDING' && new Date(reminder.dueDate) < new Date();
            const isCompleted = reminder.status === 'COMPLETED';
            
            return (
              <div
                key={reminder.id}
                className={`card border-0 shadow-medium hover:shadow-xl transition-all duration-200 ${
                  isCompleted ? 'opacity-75' : ''
                } ${
                  isOverdue ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                        isCompleted 
                          ? 'bg-gradient-to-br from-secondary-400 to-secondary-500' 
                          : isOverdue
                          ? 'bg-gradient-to-br from-red-500 to-red-600'
                          : 'bg-gradient-to-br from-primary-500 to-primary-600'
                      }`}>
                        <FiClock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-secondary-900 text-lg">{reminder.title}</h3>
                          <span className={`badge ${getPriorityColor(reminder.priority)} border flex items-center space-x-1`}>
                            {getPriorityIcon(reminder.priority)}
                            <span>{reminder.priority}</span>
                          </span>
                          {isOverdue && (
                            <span className="badge bg-red-100 text-red-800 border-red-200">
                              Overdue
                            </span>
                          )}
                          {isCompleted && (
                            <span className="badge bg-green-100 text-green-800 border-green-200">
                              Completed
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <FiClock className="w-4 h-4 text-secondary-400" />
                          <span className="text-sm text-secondary-600">
                            {new Date(reminder.dueDate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {reminder.description && (
                      <p className="text-secondary-700 mb-4 whitespace-pre-wrap">{reminder.description}</p>
                    )}

                    {/* Linked Account/Contact */}
                    <div className="flex flex-wrap items-center gap-3">
                      {reminder.account && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary-50 rounded-lg border border-primary-200">
                          <FiBriefcase className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-medium text-primary-700">
                            Account: {reminder.account.name}
                          </span>
                        </div>
                      )}
                      {reminder.contact && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                          <FiUser className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            Contact: {reminder.contact.firstName} {reminder.contact.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {reminder.status === 'PENDING' && (
                      <button
                        onClick={() => handleMarkComplete(reminder.id)}
                        className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Mark as Complete"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/reminders/${reminder.id}/edit`)}
                      className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder.id)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-secondary-200 bg-gradient-to-r from-secondary-50/50 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
          <p className="text-sm font-medium text-secondary-700 text-center sm:text-left">
            Showing <span className="font-semibold text-secondary-900">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to{' '}
            <span className="font-semibold text-secondary-900">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
            <span className="font-semibold text-secondary-900">{pagination.total}</span> results
          </p>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
