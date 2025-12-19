import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalService } from '../../services/apiService';
import { getStatusBadgeClass, createPaginationState, updatePaginationFromResponse, formatCurrency, formatDateForDisplay } from '../../utils/apiHelpers';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFileText } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const navigate = useNavigate();

  useEffect(() => {
    fetchProposals();
  }, [pagination.page, searchTerm]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      
      const result = await proposalService.fetchAll(params);
      setProposals(result.data);
      setPagination(prev => updatePaginationFromResponse(prev, { data: { data: result } }));
    } catch (error) {
      toast.error(error.message || 'Failed to fetch proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this proposal?')) return;

    try {
      await proposalService.delete(id);
      toast.success('Proposal deleted successfully');
      fetchProposals();
    } catch (error) {
      toast.error(error.message || 'Failed to delete proposal');
    }
  };

  if (loading && proposals.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">Manage sales proposals</p>
        </div>
        <button
          onClick={() => navigate('/proposals/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Proposal</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') fetchProposals();
            }}
            placeholder="Search proposals..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Proposals Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Proposal Title</th>
                <th>Opportunity</th>
                <th>Account</th>
                <th>Contact</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No proposals found
                  </td>
                </tr>
              ) : (
                proposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                          <FiFileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{proposal.title}</p>
                          {proposal.proposalNumber && (
                            <p className="text-sm text-gray-500">#{proposal.proposalNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{proposal.opportunity?.name || 'N/A'}</td>
                    <td>{proposal.account?.name || 'N/A'}</td>
                    <td>
                      {proposal.contact 
                        ? `${proposal.contact.firstName} ${proposal.contact.lastName}`
                        : 'N/A'}
                    </td>
                    <td>
                      {proposal.amount 
                        ? formatCurrency(proposal.amount, proposal.currency) 
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td>
                      {proposal.validUntil ? formatDateForDisplay(proposal.validUntil) : 'N/A'}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-outline disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="btn btn-outline disabled:opacity-50"
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

