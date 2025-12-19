import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { toast } from 'react-toastify';
import { FiSearch, FiEdit2, FiSave, FiFolder, FiClock, FiCheck } from 'react-icons/fi';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

export default function CompanyAnalysisStep({ companyProfile, onStepChange, onNext }) {
  const [url, setUrl] = useState(companyProfile?.companyUrl || '');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(companyProfile);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showSavedProfiles, setShowSavedProfiles] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast.error('Please enter a company URL');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/lead-generation/analyze', { url });
      const newProfile = response.data.data.profile;
      setProfile(newProfile);
      setEditedProfile(newProfile);
      onStepChange({ profile: newProfile });
      // Reload saved profiles to include the new one
      loadSavedProfiles();
      toast.success('Company analyzed and saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load saved profiles on mount
    loadSavedProfiles();
  }, []);

  const loadSavedProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const response = await api.get('/lead-generation/profiles');
      setSavedProfiles(response.data.data.profiles || []);
    } catch (error) {
      console.error('Error loading saved profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleLoadProfile = (savedProfile) => {
    setProfile(savedProfile);
    setEditedProfile(savedProfile);
    setUrl(savedProfile.companyUrl || '');
    setShowSavedProfiles(false);
    onStepChange({ profile: savedProfile });
    toast.success('Profile loaded successfully!');
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const response = await api.put(`/lead-generation/profiles/${profile.id}`, editedProfile);
      const updated = response.data.data.profile;
      setProfile(updated);
      setEditedProfile(updated);
      setEditing(false);
      onStepChange({ profile: updated });
      // Reload saved profiles list
      loadSavedProfiles();
      toast.success('Profile saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 1: Company Analysis</h2>
        <p className="text-gray-600 mt-1">Enter your company URL to analyze products and services, or load a saved profile</p>
      </div>

      {/* Saved Profiles Section */}
      {savedProfiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <FiFolder className="text-blue-600" />
              <h3 className="font-semibold text-blue-900">Saved Profiles ({savedProfiles.length})</h3>
            </div>
            <button
              onClick={() => setShowSavedProfiles(!showSavedProfiles)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showSavedProfiles ? 'Hide' : 'Show'} Saved Profiles
            </button>
          </div>
          
          {showSavedProfiles && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedProfiles.map((savedProfile) => (
                <div
                  key={savedProfile.id}
                  className={`flex items-center justify-between p-3 bg-white rounded-lg border cursor-pointer transition-all ${
                    profile?.id === savedProfile.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => handleLoadProfile(savedProfile)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{savedProfile.companyName || 'Unnamed Company'}</p>
                      {profile?.id === savedProfile.id && (
                        <FiCheck className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{savedProfile.companyUrl}</p>
                    {savedProfile.industry && (
                      <p className="text-xs text-gray-500 mt-1">Industry: {savedProfile.industry}</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <FiClock />
                    {new Date(savedProfile.updatedAt || savedProfile.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* URL Input */}
      <div className="flex gap-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiSearch />
          Analyze
        </button>
      </div>

      {/* Profile Display */}
      {profile && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
            {!editing ? (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditedProfile({ ...profile });
                }}
                className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg flex items-center gap-2"
              >
                <FiEdit2 />
                Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <FiSave />
                Save
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile.companyName || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{profile.companyName || 'N/A'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              {editing ? (
                <input
                  type="text"
                  value={editedProfile.industry || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{profile.industry || 'N/A'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              {editing ? (
                <textarea
                  value={editedProfile.description || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{profile.description || 'N/A'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Products & Services</label>
              {editing ? (
                <textarea
                  value={editedProfile.productsServices || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, productsServices: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900 whitespace-pre-wrap">{profile.productsServices || 'N/A'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Market</label>
              {editing ? (
                <textarea
                  value={editedProfile.targetMarket || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, targetMarket: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              ) : (
                <p className="text-gray-900">{profile.targetMarket || 'N/A'}</p>
              )}
            </div>
          </div>

          {profile && !editing && (
            <div className="pt-4">
              <button
                onClick={onNext}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Continue to Configuration
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

