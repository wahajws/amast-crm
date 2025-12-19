import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FiMail, FiSend, FiClock, FiCheck, FiAlertCircle, 
  FiTrendingUp, FiUsers, FiArrowRight, FiEye
} from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function EmailDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, recommendationsRes] = await Promise.all([
        api.get('/email-campaigns/analytics'),
        api.get('/email-campaigns/urgent?limit=10')
      ]);
      
      setAnalytics(analyticsRes.data.data.analytics);
      setRecommendations(recommendationsRes.data.data.recommendations || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSent = async (contactId) => {
    try {
      // Check if campaign exists, if not create it
      const contact = recommendations.find(c => c.id === contactId);
      if (!contact?.campaignId) {
        await api.post('/email-campaigns', {
          contactId: contactId,
          accountId: contact?.accountId,
          emailSubject: contact?.emailSubject,
          emailTemplate: contact?.emailTemplate,
          status: 'SENT',
          priority: 'MEDIUM',
        });
      } else {
        await api.post(`/email-campaigns/${contactId}/mark-sent`);
      }
      toast.success('Email marked as sent');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to mark email as sent');
    }
  };

  const getTotalEmails = () => analytics?.total || 0;
  const getSentCount = () => analytics?.sent || 0;
  const getPendingCount = () => analytics?.pending || 0;
  const getCommunicationStarted = () => analytics?.communicationStarted || 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Dashboard</h1>
            <p className="text-gray-600">Track and manage your email campaigns</p>
          </div>
          <button
            onClick={() => navigate('/email-campaigns')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            View All Campaigns
            <FiArrowRight />
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Emails</p>
                <p className="text-3xl font-bold text-gray-900">{getTotalEmails()}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <FiMail className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Sent</p>
                <p className="text-3xl font-bold text-green-600">{getSentCount()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getTotalEmails() > 0 ? Math.round((getSentCount() / getTotalEmails()) * 100) : 0}% of total
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <FiSend className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{getPendingCount()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getTotalEmails() > 0 ? Math.round((getPendingCount() / getTotalEmails()) * 100) : 0}% of total
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <FiClock className="text-2xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Communication Started</p>
                <p className="text-3xl font-bold text-purple-600">{getCommunicationStarted()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getTotalEmails() > 0 ? Math.round((getCommunicationStarted() / getTotalEmails()) * 100) : 0}% of total
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <FiCheck className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Urgent Pending</p>
            <p className="text-2xl font-bold text-red-600">{analytics?.urgentPending || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Older than 7 days</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Email Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Status</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Sent</span>
                  <span className="text-sm text-gray-600">
                    {getSentCount()} ({getTotalEmails() > 0 ? Math.round((getSentCount() / getTotalEmails()) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${getTotalEmails() > 0 ? (getSentCount() / getTotalEmails()) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                  <span className="text-sm text-gray-600">
                    {getPendingCount()} ({getTotalEmails() > 0 ? Math.round((getPendingCount() / getTotalEmails()) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{ width: `${getTotalEmails() > 0 ? (getPendingCount() / getTotalEmails()) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Performance */}
        {analytics?.byUser && analytics.byUser.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emails Sent by User</h3>
            <div className="space-y-3">
              {analytics.byUser.map((user) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 rounded-full p-2">
                      <FiUsers className="text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{user.sentCount}</p>
                    <p className="text-xs text-gray-500">emails sent</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Urgent Recommendations */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiAlertCircle className="text-red-600" />
              Urgent Recommendations
            </h3>
            <span className="text-sm text-gray-600">
              {recommendations.length} emails need attention
            </span>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No urgent emails at this time</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((contact) => {
                const daysAgo = contact.emailGeneratedAt 
                  ? Math.floor((new Date() - new Date(contact.emailGeneratedAt)) / (1000 * 60 * 60 * 24))
                  : 0;
                
                return (
                  <div key={contact.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {daysAgo > 0 && (
                            <span className="text-xs text-yellow-700">
                              {daysAgo} days old
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-gray-900 mb-1">{contact.emailSubject}</p>
                        <p className="text-sm text-gray-600">
                          {contact.firstName} {contact.lastName} ({contact.email})
                        </p>
                        {contact.account?.name && (
                          <p className="text-sm text-gray-500">Account: {contact.account.name}</p>
                        )}
                        {!contact.communicationStarted && (
                          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                            <FiAlertCircle />
                            Communication not started
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleMarkAsSent(contact.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                          <FiSend />
                          Mark as Sent
                        </button>
                        <button
                          onClick={() => navigate(`/email-campaigns/${contact.id}`)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                        >
                          <FiEye />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

