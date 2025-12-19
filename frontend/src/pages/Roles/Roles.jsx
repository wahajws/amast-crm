import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiPlus, FiEdit, FiTrash2, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    try {
      await api.delete(`/roles/${id}`);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <button
          onClick={() => navigate('/roles/new')}
          className="btn btn-primary flex items-center space-x-2"
        >
          <FiPlus className="w-5 h-5" />
          <span>Add Role</span>
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FiShield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No roles found</p>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FiShield className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.displayName || role.name}</h3>
                    <p className="text-sm text-gray-500">{role.name}</p>
                  </div>
                </div>
                {role.isSystemRole && (
                  <span className="badge badge-info text-xs">System</span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {role.description || 'No description'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {role.permissions?.length || 0} permissions
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/roles/${role.id}/edit`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <FiEdit className="w-4 h-4" />
                  </button>
                  {!role.isSystemRole && (
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}







