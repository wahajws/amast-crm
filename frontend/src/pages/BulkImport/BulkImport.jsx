import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiFile, FiCheck, FiX, FiMail, FiEdit2 } from 'react-icons/fi';
import api from '../../services/api';
import API_ENDPOINTS from '../../config/apiEndpoints';

export default function BulkImport() {
  const [file, setFile] = useState(null);
  const [companyProfiles, setCompanyProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [previewContacts, setPreviewContacts] = useState([]);

  useEffect(() => {
    loadCompanyProfiles();
  }, []);

  const loadCompanyProfiles = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.BULK_IMPORT.PROFILES);
      setCompanyProfiles(response.data.data.profiles || []);
      if (response.data.data.profiles && response.data.data.profiles.length > 0) {
        setSelectedProfileId(response.data.data.profiles[0].id);
      }
    } catch (error) {
      toast.error('Failed to load company profiles');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setResults(null);
      setPreviewContacts([]);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error('Please select an Excel file');
      return;
    }

    if (!selectedProfileId) {
      toast.error('Please select a company profile');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyProfileId', selectedProfileId);

      const response = await api.post(API_ENDPOINTS.BULK_IMPORT.PROCESS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 600000, // 10 minutes timeout
      });

      const result = response.data.data;
      setResults(result);
      setPreviewContacts(result.contacts || []);
      
      toast.success(
        `Import completed! ${result.processed} contacts processed, ${result.errors.length} errors`
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process bulk import');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditEmail = (contactId, field, value) => {
    setPreviewContacts(prev => 
      prev.map(contact => 
        contact.id === contactId 
          ? { ...contact, [field]: value }
          : contact
      )
    );
  };

  const handleSaveChanges = async () => {
    try {
      // Update contacts with edited emails
      for (const contact of previewContacts) {
        if (contact.id) {
          await api.put(`/contacts/${contact.id}`, {
            emailTemplate: contact.emailTemplate,
            emailSubject: contact.emailSubject,
          });
        }
      }
      toast.success('Changes saved successfully!');
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Import</h1>
        <p className="text-gray-600 mb-6">
          Upload an Excel file to import customers, enrich their data, and generate personalized emails
        </p>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload Excel File</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Profile
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              disabled={processing}
            >
              <option value="">Select a company profile...</option>
              {companyProfiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.companyName} - {profile.industry || 'No industry'}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Select the company profile to use for generating personalized emails
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excel File
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={processing}
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FiFile className="text-2xl text-primary-600" />
                      <span className="text-gray-700">{file.name}</span>
                    </div>
                  ) : (
                    <div>
                      <FiUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload Excel file</p>
                      <p className="text-sm text-gray-500 mt-1">.xlsx or .xls (max 10MB)</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              The file should contain customer data with email addresses. The system will automatically extract company information from email domains.
            </p>
          </div>

          <button
            onClick={handleProcess}
            disabled={!file || !selectedProfileId || processing}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <FiUpload />
                Process Import
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{results.processed}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{results.contacts.length}</div>
                <div className="text-sm text-gray-600">Contacts Created</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Errors:</h3>
                <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      Row {error.rowNumber}: {error.email} - {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Contacts with Emails */}
        {previewContacts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Generated Emails ({previewContacts.length})
              </h2>
              <button
                onClick={handleSaveChanges}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <FiCheck />
                Save All Changes
              </button>
            </div>

            <div className="space-y-4">
              {previewContacts.map((contact) => (
                <div key={contact.id || contact.email} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                      {contact.account?.name && (
                        <p className="text-sm text-gray-500">Company: {contact.account.name}</p>
                      )}
                    </div>
                    <FiMail className="text-primary-600 text-xl" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={contact.emailSubject || ''}
                        onChange={(e) => handleEditEmail(contact.id, 'emailSubject', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Body
                      </label>
                      <textarea
                        value={contact.emailTemplate || ''}
                        onChange={(e) => handleEditEmail(contact.id, 'emailTemplate', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

