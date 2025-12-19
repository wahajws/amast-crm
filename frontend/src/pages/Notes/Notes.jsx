import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteService } from '../../services/apiService';
import { accountService, contactService } from '../../services/apiService';
import { createPaginationState, updatePaginationFromResponse } from '../../utils/apiHelpers';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFileText, FiBriefcase, FiUser, FiX, FiCheck, FiClock, FiBell } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const [filterAccountId, setFilterAccountId] = useState('');
  const [filterContactId, setFilterContactId] = useState('');
  const [filterHasReminder, setFilterHasReminder] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
    fetchContacts();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [pagination.page, searchTerm, filterAccountId, filterContactId, filterHasReminder]);

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

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      if (filterAccountId) params.accountId = filterAccountId;
      if (filterContactId) params.contactId = filterContactId;
      if (filterHasReminder) params.hasReminder = 'true';
      
      const result = await noteService.fetchAll(params);
      setNotes(result.data);
      setPagination(prev => updatePaginationFromResponse(prev, { data: { data: result } }));
    } catch (error) {
      toast.error(error.message || 'Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await noteService.delete(id);
      toast.success('Note deleted successfully');
      fetchNotes();
    } catch (error) {
      toast.error(error.message || 'Failed to delete note');
    }
  };

  const handleMarkReminderComplete = async (id) => {
    try {
      await noteService.markReminderComplete(id);
      toast.success('Reminder marked as complete');
      fetchNotes();
    } catch (error) {
      toast.error(error.message || 'Failed to mark reminder as complete');
    }
  };

  const clearFilters = () => {
    setFilterAccountId('');
    setFilterContactId('');
    setFilterHasReminder(false);
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = filterAccountId || filterContactId || filterHasReminder || searchTerm;

  if (loading && notes.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Notes
          </h1>
          <p className="text-secondary-600 text-lg">View and manage notes</p>
        </div>
        <button
          onClick={() => navigate('/notes/new')}
          className="btn btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20 w-full sm:w-auto"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-medium space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchNotes();
              }}
              placeholder="Search notes..."
              className="input pl-11"
            />
          </div>

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

          {/* Reminder Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="filterHasReminder"
              checked={filterHasReminder}
              onChange={(e) => {
                setFilterHasReminder(e.target.checked);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 focus:ring-2"
            />
            <label htmlFor="filterHasReminder" className="text-sm font-medium text-secondary-700 cursor-pointer flex items-center space-x-1">
              <FiBell className="w-4 h-4" />
              <span>With Reminders</span>
            </label>
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

      {/* Notes List */}
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="card border-0 shadow-medium text-center py-16">
            <FiFileText className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500 font-medium text-lg">No notes found</p>
            <p className="text-sm text-secondary-400 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by creating your first note'}
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="card border-0 shadow-medium hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/30">
                      <FiFileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 text-lg">{note.title}</h3>
                      <p className="text-sm text-secondary-500 mt-0.5">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-secondary-700 mb-4 whitespace-pre-wrap">{note.content}</p>

                  {/* Linked Account/Contact */}
                  <div className="flex flex-wrap items-center gap-3">
                    {note.account && (
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-primary-50 rounded-lg border border-primary-200">
                        <FiBriefcase className="w-4 h-4 text-primary-600" />
                        <span className="text-sm font-medium text-primary-700">
                          Account: {note.account.name}
                        </span>
                      </div>
                    )}
                    {note.contact && (
                      <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                        <FiUser className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Contact: {note.contact.firstName} {note.contact.lastName}
                        </span>
                      </div>
                    )}
                    {note.creator && (
                      <span className="text-xs text-secondary-500">
                        Created by {note.creator.firstName} {note.creator.lastName}
                      </span>
                    )}
                  </div>

                  {/* Reminder Section */}
                  {note.reminderDate && (
                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                            note.reminderStatus === 'COMPLETED'
                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                              : new Date(note.reminderDate) < new Date()
                              ? 'bg-gradient-to-br from-red-500 to-red-600'
                              : 'bg-gradient-to-br from-orange-500 to-orange-600'
                          }`}>
                            <FiBell className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-secondary-900">Reminder</span>
                              {note.reminderStatus === 'COMPLETED' && (
                                <span className="badge bg-green-100 text-green-800 border-green-200">
                                  Completed
                                </span>
                              )}
                              {note.reminderStatus === 'PENDING' && new Date(note.reminderDate) < new Date() && (
                                <span className="badge bg-red-100 text-red-800 border-red-200">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1 mt-0.5">
                              <FiClock className="w-3 h-3 text-secondary-400" />
                              <span className="text-sm text-secondary-600">
                                {new Date(note.reminderDate).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {note.reminderStatus === 'PENDING' && (
                          <button
                            onClick={() => handleMarkReminderComplete(note.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Mark Reminder as Complete"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => navigate(`/notes/${note.id}/edit`)}
                    className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110"
                    title="Edit"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
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
