import { useState } from 'react';
import { FiX, FiSend, FiPaperclip, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { emailService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

export default function ReplyModal({ email, account, onClose, onSent }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState(email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`);
  const [signature, setSignature] = useState('');
  const [initials, setInitials] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setSending(true);
      await emailService.sendReply(email.id, {
        body,
        subject,
        signature: signature.trim() || undefined,
        initials: initials.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      onSent();
    } catch (error) {
      toast.error(error.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-large w-full max-w-3xl max-h-[90vh] flex flex-col animate-slide-down">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30">
              <FiSend className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">Reply to Email</h2>
              <p className="text-sm text-secondary-500 mt-0.5">
                {email.fromName || email.fromEmail} • {account?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-xl transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              placeholder="Email subject"
            />
          </div>

          {/* To */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
              To
            </label>
            <div className="input bg-secondary-50 text-secondary-600">
              {email.fromEmail}
            </div>
          </div>

          {/* Reply Body */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="input min-h-[200px] resize-y"
              placeholder="Type your reply here..."
              required
            />
          </div>

          {/* Signature */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
              Signature (Optional)
            </label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Your signature will be added at the end of the message"
            />
          </div>

          {/* Initials */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
              Initials (Optional)
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value)}
              className="input"
              placeholder="e.g., JD"
              maxLength={10}
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">
              Attachments
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all group">
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center space-x-2 text-secondary-600 group-hover:text-primary-600">
                  <FiPaperclip className="w-5 h-5" />
                  <span className="font-medium">Add Attachments</span>
                </div>
              </label>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary-50 rounded-xl border border-secondary-200"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FiPaperclip className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                        <span className="text-sm text-secondary-700 truncate">{file.name}</span>
                        <span className="text-xs text-secondary-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200 bg-gradient-to-r from-transparent to-secondary-50/30">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !body.trim()}
            className="btn btn-primary shadow-lg shadow-primary-500/20 flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FiSend className="w-4 h-4" />
                <span>Send Reply</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

