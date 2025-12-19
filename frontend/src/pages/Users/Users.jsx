import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `/users?page=${pagination.page}&pageSize=${pagination.pageSize}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const response = await api.get(url);
      const data = response.data.data;
      setUsers(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1
      }));
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this user?')) return;

    try {
      await api.post(`/users/${id}/approve`);
      toast.success('User approved successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled

    try {
      await api.post(`/users/${id}/reject`, { reason: reason || null });
      toast.success('User registration rejected');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject user');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'badge-success',
      INACTIVE: 'badge-gray',
      SUSPENDED: 'badge-danger',
      PENDING: 'badge-warning',
    };
    return badges[status] || 'badge-gray';
  };

  const getRoleBadge = (role) => {
    const colors = {
      SUPER_ADMIN: 'badge-danger',
      ADMIN: 'badge-info',
      MANAGER: 'badge-warning',
      USER: 'badge-success',
      VIEWER: 'badge-gray',
    };
    return colors[role] || 'badge-gray';
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage system users</p>
        </div>
        <button
          onClick={() => navigate('/users/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending Approval</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.firstName?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${getRoleBadge(user.role?.name)}`}>
                        {user.role?.displayName || user.role?.name || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        {user.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Approve User"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Reject User"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate(`/users/${user.id}/edit`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        {user.status !== 'PENDING' && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete User"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
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

