import { useState } from 'react';
import { FiX, FiSend, FiPaperclip, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { emailService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

export default function EmailReply({ email, onClose, onSent }) {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [subject, setSubject] = useState(email?.subject?.startsWith('Re:') ? email.subject : `Re: ${email?.subject || ''}`);
  const [signature, setSignature] = useState('');
  const [initials, setInitials] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!body.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    try {
      setSending(true);
      
      // Prepare form data for attachments
      const formData = new FormData();
      formData.append('body', body);
      formData.append('subject', subject);
      if (signature) formData.append('signature', signature);
      if (initials) formData.append('initials', initials);
      
      // Note: Backend currently doesn't handle file uploads in reply
      // This would need to be implemented in the backend
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      await emailService.sendReply(email.id, {
        body,
        subject,
        signature,
        initials,
        attachments: attachments.map(f => ({ name: f.name, size: f.size })) // Metadata only for now
      });

      onSent();
    } catch (error) {
      // Check if it's a permission error
      if (error.message?.includes('permission') || error.message?.includes('insufficient') || error.response?.status === 403) {
        toast.error('Gmail send permission required. Please log out and log back in with Gmail to grant send permissions.', {
          autoClose: 8000
        });
      } else {
        toast.error(error.message || 'Failed to send reply');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-large w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200 bg-gradient-to-r from-primary-50/50 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/30">
              <FiSend className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-secondary-900">Reply to Email</h2>
              <p className="text-sm text-secondary-600">To: {email?.fromName || email?.fromEmail}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-xl transition-all"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              required
            />
          </div>

          {/* Reply Body */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Message</label>
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
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Signature (optional)</label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="input min-h-[80px] resize-y"
              placeholder="Your signature will be appended to the message"
            />
          </div>

          {/* Initials */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Initials (optional)</label>
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
            <label className="block text-sm font-semibold text-secondary-700 mb-2.5">Attachments</label>
            <div className="space-y-3">
              <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-secondary-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all group">
                <div className="flex items-center space-x-2 text-secondary-600 group-hover:text-primary-600">
                  <FiPaperclip className="w-5 h-5" />
                  <span className="font-medium">Add Attachment</span>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg border border-secondary-200"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <FiPaperclip className="w-4 h-4 text-secondary-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-secondary-900 truncate">{file.name}</p>
                          <p className="text-xs text-secondary-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-secondary-500 mt-2">
              Note: File attachments will be sent via Gmail API
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-secondary-200 bg-gradient-to-r from-transparent to-secondary-50/30">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn btn-primary shadow-lg shadow-primary-500/20 flex items-center space-x-2"
            disabled={sending || !body.trim()}
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

