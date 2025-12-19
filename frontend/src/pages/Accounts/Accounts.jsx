import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../../services/apiService';
import { getStatusBadgeClass, createPaginationState, updatePaginationFromResponse } from '../../utils/apiHelpers';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const navigate = useNavigate();

  useEffect(() => {
    fetchAccounts();
  }, [pagination.page, searchTerm]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      
      const result = await accountService.fetchAll(params);
      setAccounts(result.data);
      setPagination(prev => updatePaginationFromResponse(prev, { data: { data: result } }));
    } catch (error) {
      toast.error(error.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    try {
      await accountService.delete(id);
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  if (loading && accounts.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Accounts
          </h1>
          <p className="text-secondary-600 text-lg">Manage company accounts</p>
        </div>
        <button
          onClick={() => navigate('/accounts/new')}
          className="btn btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-medium">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-secondary-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') fetchAccounts();
            }}
            placeholder="Search accounts..."
            className="input pl-11"
          />
        </div>
      </div>

      {/* Accounts Table - Responsive */}
      <div className="card overflow-hidden border-0 shadow-medium w-full">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="table min-w-full">
                <thead>
                  <tr>
                    <th className="min-w-[200px]">Account Name</th>
                    <th className="min-w-[150px]">Industry</th>
                    <th className="min-w-[200px]">Email</th>
                    <th className="min-w-[120px]">Phone</th>
                    <th className="min-w-[100px]">Status</th>
                    <th className="min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-16">
                        <div className="flex flex-col items-center space-y-3">
                          <FiBriefcase className="w-16 h-16 text-secondary-300" />
                          <p className="text-secondary-500 font-medium">No accounts found</p>
                          <p className="text-sm text-secondary-400">Get started by creating your first account</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    accounts.map((account) => (
                      <tr key={account.id}>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/30 flex-shrink-0">
                              <FiBriefcase className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-secondary-900 truncate">{account.name}</p>
                              {account.website && (
                                <p className="text-sm text-secondary-500 mt-0.5 truncate">{account.website}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary-700 font-medium">
                          <div className="truncate max-w-[150px]" title={account.industry || 'N/A'}>
                            {account.industry || <span className="text-secondary-400">N/A</span>}
                          </div>
                        </td>
                        <td className="text-secondary-700">
                          <div className="truncate max-w-[200px]" title={account.email || 'N/A'}>
                            {account.email || <span className="text-secondary-400">N/A</span>}
                          </div>
                        </td>
                        <td className="text-secondary-700">
                          <div className="truncate max-w-[120px]" title={account.phone || 'N/A'}>
                            {account.phone || <span className="text-secondary-400">N/A</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(account.status)}`}>
                            {account.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/accounts/${account.id}/edit`)}
                              className="p-2.5 text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-3">
          {accounts.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center space-y-3">
                <FiBriefcase className="w-16 h-16 text-secondary-300" />
                <p className="text-secondary-500 font-medium">No accounts found</p>
                <p className="text-sm text-secondary-400">Get started by creating your first account</p>
              </div>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 border border-secondary-200 rounded-xl hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent hover:border-primary-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-500/30 flex-shrink-0">
                      <FiBriefcase className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-secondary-900 truncate">{account.name}</p>
                      {account.website && (
                        <p className="text-sm text-secondary-500 truncate mt-0.5">{account.website}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => navigate(`/accounts/${account.id}/edit`)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition"
                      title="Edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-secondary-500">Industry:</span>
                    <p className="text-secondary-900 font-medium">{account.industry || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Status:</span>
                    <span className={`badge ${getStatusBadgeClass(account.status)} ml-2`}>
                      {account.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary-500">Email:</span>
                    <p className="text-secondary-900 font-medium truncate">{account.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-secondary-500">Phone:</span>
                    <p className="text-secondary-900 font-medium">{account.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-secondary-200 bg-gradient-to-r from-secondary-50/50 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
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
    </div>
  );
}

