import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

export default function GenerationProgressStep({ companyProfile, generationOptions, onStepChange, onNext }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (companyProfile && generationOptions) {
      generateLeads();
    }
  }, []);

  const generateLeads = async () => {
    let progressInterval = null;
    let statusInterval = null;
    
    try {
      setProgress(10);
      setStatus('Generating search queries...');

      // Simulate progress - slower to match actual processing time
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 85) {
            return prev + 1; // Slower increment
          }
          return prev;
        });
      }, 2000); // Update every 2 seconds instead of 0.5s

      setStatus('Searching and analyzing companies...');
      
      // Update status messages during processing
      statusInterval = setInterval(() => {
        setStatus((prev) => {
          if (prev.includes('Searching')) {
            return 'Extracting and enriching lead data...';
          } else if (prev.includes('Extracting')) {
            return 'Scoring lead relevance...';
          } else if (prev.includes('Scoring')) {
            return 'Finalizing results...';
          }
          return prev;
        });
      }, 15000); // Update status every 15 seconds
      
      // Set a maximum timeout (10 minutes)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Lead generation timed out after 10 minutes. Please try again with fewer leads.'));
        }, 600000); // 10 minutes
      });
      
      const apiPromise = api.post('/lead-generation/generate', {
        profileId: companyProfile.id,
        options: generationOptions,
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);

      // Clean up intervals
      if (progressInterval) clearInterval(progressInterval);
      if (statusInterval) clearInterval(statusInterval);
      
      setProgress(100);
      setStatus('Complete!');

      const generatedLeads = response.data.data.leads;
      setLeads(generatedLeads);
      onStepChange({ leads: generatedLeads });

      toast.success(`Generated ${generatedLeads.length} leads successfully!`);
      
      // Auto-advance after 2 seconds
      setTimeout(() => {
        onNext();
      }, 2000);
    } catch (error) {
      // Clean up intervals on error
      if (progressInterval) clearInterval(progressInterval);
      if (statusInterval) clearInterval(statusInterval);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate leads';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 3: Generating Leads</h2>
        <p className="text-gray-600 mt-1">This may take a few minutes...</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{status}</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {progress < 100 && (
          <div className="text-center py-8">
            <LoadingSpinner />
            <p className="text-gray-600 mt-4">{status}</p>
          </div>
        )}

        {progress === 100 && leads.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              Successfully generated {leads.length} leads!
            </p>
            <p className="text-green-600 text-sm mt-1">Redirecting to review page...</p>
          </div>
        )}
      </div>
    </div>
  );
}

