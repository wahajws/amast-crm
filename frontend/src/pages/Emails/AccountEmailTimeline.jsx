import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiCornerUpLeft, FiPaperclip, FiSend, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { emailService, accountService } from '../../services/apiService';
import { formatDateForDisplay } from '../../utils/apiHelpers';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import EmailReply from './EmailReply';

export default function AccountEmailTimeline() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    fetchData();
  }, [accountId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timelineData, accountData] = await Promise.all([
        emailService.getTimeline(accountId),
        accountService.fetchById(accountId)
      ]);
      
      setTimeline(timelineData.timeline || []);
      setAccount(timelineData.account || accountData);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch email timeline');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySent = () => {
    setReplyingTo(null);
    fetchData(); // Refresh timeline
    toast.success('Reply sent successfully');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/emails')}
          className="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 mb-6 transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Emails</span>
        </button>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <FiMail className="w-6 h-6 text-white" />
              </div>
              <span>{account?.name || 'Email Timeline'}</span>
            </h1>
            <p className="text-secondary-600 text-lg">
              Complete email conversation history
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {timeline.length === 0 ? (
        <div className="card border-0 shadow-large text-center py-16">
          <FiMail className="w-20 h-20 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500 font-medium mb-2">No emails found for this account</p>
          <p className="text-sm text-secondary-400">Emails will appear here once synced from Gmail</p>
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
                        {thread.emails[0]?.subject || 'Email Thread'}
                      </h3>
                      <p className="text-sm text-secondary-500 mt-0.5">
                        {thread.emails.length} {thread.emails.length === 1 ? 'email' : 'emails'} in this thread
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Messages */}
              <div className="space-y-6">
                {thread.emails.map((email, emailIndex) => (
                  <div
                    key={email.id}
                    className={`relative pl-8 pb-6 ${
                      emailIndex < thread.emails.length - 1 ? 'border-l-2 border-secondary-200' : ''
                    }`}
                  >
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-0 w-4 h-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full border-4 border-white shadow-md -translate-x-[10px]"></div>

                    {/* Email Card */}
                    <div className="bg-gradient-to-r from-secondary-50/50 to-transparent rounded-xl p-5 border border-secondary-200 hover:shadow-md transition-all duration-200">
                      {/* Email Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/30">
                              {(email.fromName || email.fromEmail || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-secondary-900">
                                {email.fromName || email.fromEmail}
                              </p>
                              <p className="text-sm text-secondary-600">{email.fromEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-secondary-500 mt-2">
                            <FiClock className="w-3 h-3" />
                            <span>{email.receivedAt ? formatDateForDisplay(email.receivedAt) : 'No date'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setReplyingTo(email)}
                          className="btn btn-primary flex items-center space-x-2 shadow-lg shadow-primary-500/20"
                        >
                          <FiCornerUpLeft className="w-4 h-4" />
                          <span>Reply</span>
                        </button>
                      </div>

                      {/* Email Body */}
                      <div className="mt-4">
                        {email.bodyHtml ? (
                          <div
                            className="prose max-w-none text-secondary-700 bg-white rounded-lg p-4 border border-secondary-200"
                            dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
                          />
                        ) : email.bodyText ? (
                          <p className="text-secondary-700 whitespace-pre-wrap bg-white rounded-lg p-4 border border-secondary-200">
                            {email.bodyText}
                          </p>
                        ) : (
                          <p className="text-secondary-400 italic">No content</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {replyingTo && (
        <EmailReply
          email={replyingTo}
          onClose={() => setReplyingTo(null)}
          onSent={handleReplySent}
        />
      )}
    </div>
  );
}

