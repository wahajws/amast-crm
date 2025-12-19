import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FiUsers, FiShield, FiBriefcase, FiUser, FiBell, FiFileText } from 'react-icons/fi';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalContacts: 0,
    totalReminders: 0,
    upcomingReminders: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch accounts count
      const accountsRes = await api.get('/accounts?pageSize=1');
      const totalAccounts = accountsRes.data.data.pagination?.total || 0;

      // Fetch contacts count
      const contactsRes = await api.get('/contacts?pageSize=1');
      const totalContacts = contactsRes.data.data.pagination?.total || 0;

      // Fetch reminders count
      const remindersRes = await api.get('/reminders?pageSize=1');
      const totalReminders = remindersRes.data.data.pagination?.total || 0;

      // Fetch upcoming reminders
      const upcomingRes = await api.get('/reminders/upcoming?limit=5');
      const upcomingReminders = upcomingRes.data.data || [];

      setStats({
        totalAccounts,
        totalContacts,
        totalReminders,
        upcomingReminders,
        recentActivity: []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    {
      name: 'Accounts',
      value: stats.totalAccounts,
      icon: FiBriefcase,
      color: 'bg-blue-500',
      href: '/accounts',
    },
    {
      name: 'Contacts',
      value: stats.totalContacts,
      icon: FiUser,
      color: 'bg-green-500',
      href: '/contacts',
    },
    {
      name: 'Reminders',
      value: stats.totalReminders,
      icon: FiBell,
      color: 'bg-orange-500',
      href: '/reminders',
    },
    {
      name: 'Upcoming',
      value: stats.upcomingReminders.length,
      icon: FiFileText,
      color: 'bg-purple-500',
      href: '/reminders?status=PENDING',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-secondary-600 text-lg">Welcome to your CRM system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="card cursor-pointer group hover:shadow-large transition-all duration-300 hover:-translate-y-1"
              onClick={() => stat.href && navigate(stat.href)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-secondary-600 uppercase tracking-wide">{stat.name}</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center space-x-2">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <span>Recent Activity</span>
          </h2>
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-primary-50/50 transition-colors group">
                  <div className="w-2.5 h-2.5 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mt-1.5 group-hover:scale-125 transition-transform"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900">{activity.description}</p>
                    <p className="text-xs text-secondary-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-secondary-400 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center space-x-2">
            <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
            <span>Upcoming Reminders</span>
          </h2>
          <div className="space-y-3">
            {stats.upcomingReminders.length > 0 ? (
              stats.upcomingReminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="p-4 bg-gradient-to-r from-amber-50/50 to-orange-50/30 rounded-xl border-l-4 border-amber-500 hover:shadow-md transition-all duration-200 group"
                >
                  <p className="font-semibold text-secondary-900 group-hover:text-amber-700 transition-colors">{reminder.title}</p>
                  <p className="text-sm text-secondary-600 mt-1.5 font-medium">
                    {new Date(reminder.dueDate).toLocaleString()}
                  </p>
                  {reminder.contact && (
                    <p className="text-xs text-secondary-500 mt-2 flex items-center space-x-1">
                      <FiUser className="w-3 h-3" />
                      <span>Contact: {reminder.contact.firstName} {reminder.contact.lastName}</span>
                    </p>
                  )}
                  {reminder.account && (
                    <p className="text-xs text-secondary-500 mt-1 flex items-center space-x-1">
                      <FiBriefcase className="w-3 h-3" />
                      <span>Account: {reminder.account.name}</span>
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-secondary-400 text-sm">No upcoming reminders</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

