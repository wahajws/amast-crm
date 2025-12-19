import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { opportunityService } from '../../services/apiService';
import { getStatusBadgeClass, createPaginationState, updatePaginationFromResponse, formatCurrency, formatDateForDisplay } from '../../utils/apiHelpers';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState(createPaginationState());
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpportunities();
  }, [pagination.page, searchTerm]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (searchTerm) params.search = searchTerm;
      
      const result = await opportunityService.fetchAll(params);
      setOpportunities(result.data);
      setPagination(prev => updatePaginationFromResponse(prev, { data: { data: result } }));
    } catch (error) {
      toast.error(error.message || 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      await opportunityService.delete(id);
      toast.success('Opportunity deleted successfully');
      fetchOpportunities();
    } catch (error) {
      toast.error(error.message || 'Failed to delete opportunity');
    }
  };

  const getStageBadge = (stage) => {
    const badges = {
      PROSPECTING: 'badge-gray',
      QUALIFICATION: 'badge-blue',
      PROPOSAL: 'badge-purple',
      NEGOTIATION: 'badge-yellow',
      CLOSED_WON: 'badge-success',
      CLOSED_LOST: 'badge-danger',
    };
    return badges[stage] || 'badge-gray';
  };

  if (loading && opportunities.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-gray-600 mt-1">Manage sales opportunities</p>
        </div>
        <button
          onClick={() => navigate('/opportunities/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Opportunity</span>
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
              if (e.key === 'Enter') fetchOpportunities();
            }}
            placeholder="Search opportunities..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Opportunity Name</th>
                <th>Account</th>
                <th>Contact</th>
                <th>Stage</th>
                <th>Amount</th>
                <th>Probability</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No opportunities found
                  </td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white">
                          <FiTrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{opportunity.name}</p>
                          {opportunity.expectedCloseDate && (
                            <p className="text-sm text-gray-500">
                              Close: {formatDateForDisplay(opportunity.expectedCloseDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{opportunity.account?.name || 'N/A'}</td>
                    <td>
                      {opportunity.contact 
                        ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
                        : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${getStageBadge(opportunity.stage)}`}>
                        {opportunity.stage?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {opportunity.amount ? formatCurrency(opportunity.amount) : 'N/A'}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full" 
                            style={{ width: `${opportunity.probability || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{opportunity.probability || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(opportunity.status)}`}>
                        {opportunity.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/opportunities/${opportunity.id}/edit`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(opportunity.id)}
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

