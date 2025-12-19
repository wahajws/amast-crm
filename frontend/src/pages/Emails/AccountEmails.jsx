import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiBriefcase, FiClock, FiSend, FiPaperclip } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { emailService, accountService } from '../../services/apiService';
import { formatDateForDisplay } from '../../utils/apiHelpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ReplyModal from './ReplyModal';

export default function AccountEmails() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch account details
      const accountData = await accountService.fetchById(accountId);
      setAccount(accountData);

      // Fetch email timeline
      const timelineData = await emailService.getTimeline(accountId);
      setTimeline(timelineData.timeline || []);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch emails');
      navigate('/accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (email) => {
    setSelectedEmail(email);
    setShowReplyModal(true);
  };

  const handleReplySent = () => {
    setShowReplyModal(false);
    setSelectedEmail(null);
    fetchData(); // Refresh timeline
    toast.success('Reply sent successfully');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!account) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="card border-0 shadow-large text-center py-16">
          <p className="text-secondary-600">Account not found</p>
          <button onClick={() => navigate('/accounts')} className="btn btn-primary mt-4">
            Back to Accounts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/accounts')}
          className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Accounts</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
              <FiBriefcase className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
                {account.name}
              </h1>
              <p className="text-secondary-600 text-lg mt-1">Email Timeline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Timeline */}
      {timeline.length === 0 ? (
        <div className="card border-0 shadow-large text-center py-16">
          <FiMail className="w-20 h-20 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-600 font-medium mb-2">No emails found for this account</p>
          <p className="text-sm text-secondary-400">
            Emails will appear here once they are synced and matched to this account.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {timeline.map((thread, threadIndex) => (
            <div key={thread.threadId} className="card border-0 shadow-large">
              {/* Thread Header */}
              <div className="border-b border-secondary-200 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30">
                      <FiMail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary-900">
                        {thread.emails[0]?.subject || '(No Subject)'}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-0.5">
                        {thread.emails.length} {thread.emails.length === 1 ? 'email' : 'emails'} in thread
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-secondary-500 flex items-center space-x-1">
                    <FiClock className="w-4 h-4" />
                    <span>{formatDateForDisplay(thread.latestDate)}</span>
                  </div>
                </div>
              </div>

              {/* Email Messages in Thread */}
              <div className="space-y-6">
                {thread.emails.map((email, emailIndex) => (
                  <div
                    key={email.id}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                      emailIndex === thread.emails.length - 1
                        ? 'border-primary-200 bg-gradient-to-r from-primary-50/50 to-transparent'
                        : 'border-secondary-200 bg-white'
                    }`}
                  >
                    {/* Email Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            {(email.fromName || email.fromEmail || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-secondary-900">
                              {email.fromName || email.fromEmail}
                            </p>
                            <p className="text-sm text-secondary-500">{email.fromEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-secondary-500 ml-13">
                          <span className="flex items-center space-x-1">
                            <FiClock className="w-4 h-4" />
                            <span>{formatDateForDisplay(email.receivedAt || email.sentAt)}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReply(email)}
                        className="btn btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20"
                      >
                        <FiSend className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Email Body */}
                    <div className="mt-4">
                      {email.bodyHtml ? (
                        <div
                          className="prose max-w-none p-4 bg-secondary-50 rounded-xl border border-secondary-200"
                          dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                        />
                      ) : email.bodyText ? (
                        <div className="p-4 bg-secondary-50 rounded-xl border border-secondary-200 whitespace-pre-wrap text-secondary-900">
                          {email.bodyText}
                        </div>
                      ) : (
                        <p className="text-secondary-400 italic">No content</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedEmail && (
        <ReplyModal
          email={selectedEmail}
          account={account}
          onClose={() => {
            setShowReplyModal(false);
            setSelectedEmail(null);
          }}
          onSent={handleReplySent}
        />
      )}
    </div>
  );
}

