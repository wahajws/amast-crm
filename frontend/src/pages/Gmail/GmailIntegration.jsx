import { useState, useEffect } from 'react';
import { FiMail, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { gmailService } from '../../services/apiService';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function GmailIntegration() {
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingEmails, setSyncingEmails] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const data = await gmailService.getLabels();
      setLabels(data);
      setGmailConnected(true);
    } catch (error) {
      const errorMessage = error.message || 'Failed to fetch Gmail labels';
      if (errorMessage.includes('Gmail account not connected')) {
        setGmailConnected(false);
        // Don't show toast here, let the UI handle it
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLabels = async () => {
    try {
      setSyncing(true);
      // Auto-enable user labels for smart CRM (default behavior)
      const data = await gmailService.syncLabels();
      setLabels(data);
      const userLabelsCount = data.filter(l => l.type === 'user' && l.isSyncing).length;
      if (userLabelsCount > 0) {
        toast.success(`Labels synced! ${userLabelsCount} customer labels auto-enabled for smart CRM.`);
      } else {
        toast.success('Labels synced successfully');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to sync labels');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleSync = async (labelId, currentStatus) => {
    try {
      await gmailService.updateSyncSettings({
        labelIds: [labelId],
        isSyncing: !currentStatus
      });
      await fetchLabels();
      toast.success('Sync settings updated');
    } catch (error) {
      toast.error(error.message || 'Failed to update sync settings');
    }
  };

  const handleSyncEmails = async () => {
    try {
      setSyncingEmails(true);
      await gmailService.syncEmails({});
      toast.success('Email sync started. This may take a few minutes.');
    } catch (error) {
      toast.error(error.message || 'Failed to sync emails');
    } finally {
      setSyncingEmails(false);
    }
  };

  const [gmailConnected, setGmailConnected] = useState(true);

  useEffect(() => {
    // Check if Gmail is connected on mount
    fetchLabels().catch(() => {
      setGmailConnected(false);
    });
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!gmailConnected && labels.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card border-0 shadow-large text-center py-16">
          <FiMail className="w-20 h-20 text-secondary-300 mx-auto mb-6" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent mb-3">
            Gmail Not Connected
          </h2>
          <p className="text-secondary-600 mb-8 max-w-md mx-auto">
            Your Gmail account is not connected. Please log out and log in again using "Continue with Gmail" to connect your account.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn btn-primary shadow-lg shadow-primary-500/20"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <FiMail className="w-6 h-6 text-white" />
            </div>
            <span>Gmail Integration</span>
          </h1>
          <p className="text-secondary-600 text-lg">Manage your Gmail labels and email sync settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleSyncLabels}
            disabled={syncing}
            className="btn btn-secondary flex items-center space-x-2 shadow-md"
          >
            <FiRefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync Labels</span>
          </button>
          <button
            onClick={handleSyncEmails}
            disabled={syncingEmails}
            className="btn btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20"
          >
            <FiRefreshCw className={`w-5 h-5 ${syncingEmails ? 'animate-spin' : ''}`} />
            <span>Sync Emails</span>
          </button>
        </div>
      </div>

      <div className="card border-0 shadow-large">
        <div className="mb-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-secondary-200">
            <div className="w-1 h-6 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-secondary-900">Gmail Labels</h2>
          </div>
          <p className="text-sm text-secondary-600 mt-4">
            Select which Gmail labels you want to sync emails from. Only emails from selected labels will be imported.
          </p>
        </div>

        {labels.length === 0 ? (
          <div className="text-center py-16">
            <FiMail className="w-20 h-20 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-500 font-medium">No labels found. Click "Sync Labels" to fetch your Gmail labels.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between p-5 border border-secondary-200 rounded-xl hover:bg-gradient-to-r hover:from-primary-50/50 hover:to-transparent hover:border-primary-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30 group-hover:scale-110 transition-transform">
                    <FiMail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-secondary-900">{label.name}</div>
                    <div className="text-sm text-secondary-500 mt-0.5">
                      {label.type === 'system' ? 'System Label' : 'User Label'}
                    </div>
                  </div>
                </div>
                <label className="flex items-center cursor-pointer group/checkbox">
                  <input
                    type="checkbox"
                    checked={label.isSyncing || false}
                    onChange={() => handleToggleSync(label.id, label.isSyncing)}
                    className="w-5 h-5 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer transition-all"
                  />
                  <span className="ml-3 text-sm font-medium text-secondary-700">
                    {label.isSyncing ? 'Syncing' : 'Not Syncing'}
                  </span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

