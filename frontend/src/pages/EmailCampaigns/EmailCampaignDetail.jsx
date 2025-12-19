import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSend, FiCheck, FiX, FiEdit2, FiSave } from 'react-icons/fi';
import api from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function EmailCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedTemplate, setEditedTemplate] = useState('');

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  const cleanSubject = (subject) => {
    if (!subject) return '';
    // Remove trailing "0" on same line or new line, and any trailing whitespace
    return subject
      .replace(/\s+0+\s*$/gm, '') // Remove trailing "0" (including on new lines)
      .replace(/\n\s*0+\s*$/gm, '') // Remove "0" on new line at end
      .replace(/\s+$/gm, '') // Remove trailing whitespace
      .replace(/\n+$/, '') // Remove trailing newlines
      .trim();
  };

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/email-campaigns/${id}`);
      const campaignData = response.data.data.campaign;
      setCampaign(campaignData);
      setEditedSubject(cleanSubject(campaignData.emailSubject || ''));
      setEditedTemplate(campaignData.emailTemplate || '');
    } catch (error) {
      toast.error('Failed to load email campaign');
      navigate('/email-campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const cleanedSubject = cleanSubject(editedSubject);
      await api.put(`/contacts/${id}`, {
        emailSubject: cleanedSubject,
        emailTemplate: editedTemplate,
      });
      toast.success('Email campaign updated successfully');
      setEditing(false);
      fetchCampaign();
    } catch (error) {
      toast.error('Failed to update email campaign');
    }
  };

  const handleMarkAsSent = async () => {
    try {
      await api.post(`/email-campaigns/${id}/mark-sent`);
      toast.success('Email marked as sent');
      fetchCampaign();
    } catch (error) {
      toast.error('Failed to mark email as sent');
    }
  };

  const handleToggleCommunication = async () => {
    try {
      await api.post(`/email-campaigns/${id}/toggle-communication`, {
        started: !campaign.communicationStarted
      });
      toast.success(`Communication ${!campaign.communicationStarted ? 'started' : 'stopped'}`);
      fetchCampaign();
    } catch (error) {
      toast.error('Failed to update communication status');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Email campaign not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/email-campaigns')}
          className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <FiArrowLeft />
          Back to Campaigns
        </button>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Email Campaign Details</h1>
            <div className="flex items-center gap-2">
              {!editing && (
                <>
                  {campaign.status === 'PENDING' && (
                    <button
                      onClick={handleMarkAsSent}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <FiSend />
                      Mark as Sent
                    </button>
                  )}
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiEdit2 />
                    Edit
                  </button>
                </>
              )}
              {editing && (
                <>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditedSubject(cleanSubject(campaign.emailSubject || ''));
                      setEditedTemplate(campaign.emailTemplate || '');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FiX />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <FiSave />
                    Save
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Contact & Account Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 mb-1">Contact</p>
              <p className="font-semibold text-gray-900">
                {campaign.contact?.firstName} {campaign.contact?.lastName}
              </p>
              <p className="text-sm text-gray-600">{campaign.contact?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account</p>
              <p className="font-semibold text-gray-900">{campaign.account?.name || 'No account'}</p>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b">
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                campaign.status === 'SENT' ? 'bg-green-100 text-green-800' :
                campaign.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Priority</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                campaign.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                campaign.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                campaign.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {campaign.priority}
              </span>
            </div>
          </div>

          {/* Communication Status */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Communication Status</p>
                {campaign.communicationStarted ? (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-2 w-fit">
                    <FiCheck />
                    Communication Started
                  </span>
                ) : (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-800">
                    Not Started
                  </span>
                )}
              </div>
              <button
                onClick={handleToggleCommunication}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  campaign.communicationStarted
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {campaign.communicationStarted ? (
                  <>
                    <FiX />
                    Mark as Not Started
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Mark as Started
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Email Subject */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            {editing ? (
              <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{cleanSubject(campaign.emailSubject)}</p>
            )}
          </div>

          {/* Email Template */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Body</label>
            {editing ? (
              <textarea
                value={editedTemplate}
                onChange={(e) => setEditedTemplate(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="whitespace-pre-wrap text-gray-900">{campaign.emailTemplate}</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 pt-6 border-t">
            <div>
              <p className="font-medium mb-1">Sent At</p>
              <p>{campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : 'Not sent yet'}</p>
              {campaign.sentByUser && (
                <p className="text-xs mt-1">by {campaign.sentByUser.firstName} {campaign.sentByUser.lastName}</p>
              )}
            </div>
            <div>
              <p className="font-medium mb-1">Created At</p>
              <p>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

