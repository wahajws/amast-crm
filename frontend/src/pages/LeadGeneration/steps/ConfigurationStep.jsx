import { useState, useEffect } from 'react';
import { FiCheck } from 'react-icons/fi';

const COMMON_INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Retail',
  'Manufacturing',
  'Education',
  'Real Estate',
  'Construction',
  'Transportation',
  'Energy',
  'Hospitality',
  'Food & Beverage',
  'Automotive',
  'Telecommunications',
  'Media & Entertainment',
  'Agriculture',
  'Pharmaceuticals',
  'Consulting',
  'Legal Services',
  'Marketing & Advertising',
  'E-commerce',
  'Software',
  'Biotechnology',
  'Aerospace',
  'Logistics',
];

const COMMON_LOCATIONS = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'Malaysia',
  'India',
  'China',
  'Japan',
  'South Korea',
  'Brazil',
  'Mexico',
  'United Arab Emirates',
  'Saudi Arabia',
  'Europe',
  'Asia Pacific',
  'North America',
  'Latin America',
  'Middle East',
  'Africa',
];

export default function ConfigurationStep({ companyProfile, generationOptions, onStepChange, onNext }) {
  const [options, setOptions] = useState({
    numLeads: generationOptions?.numLeads || 100,
    industries: generationOptions?.industries || [],
    locations: generationOptions?.locations || [],
  });
  const [customIndustry, setCustomIndustry] = useState('');
  const [customLocation, setCustomLocation] = useState('');

  useEffect(() => {
    onStepChange({ options });
  }, [options]);

  const toggleIndustry = (industry) => {
    setOptions((prev) => {
      const industries = prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry];
      return { ...prev, industries };
    });
  };

  const toggleLocation = (location) => {
    setOptions((prev) => {
      const locations = prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location];
      return { ...prev, locations };
    });
  };

  const addCustomIndustry = () => {
    if (customIndustry.trim() && !options.industries.includes(customIndustry.trim())) {
      setOptions((prev) => ({
        ...prev,
        industries: [...prev.industries, customIndustry.trim()],
      }));
      setCustomIndustry('');
    }
  };

  const addCustomLocation = () => {
    if (customLocation.trim() && !options.locations.includes(customLocation.trim())) {
      setOptions((prev) => ({
        ...prev,
        locations: [...prev.locations, customLocation.trim()],
      }));
      setCustomLocation('');
    }
  };

  const removeIndustry = (industry) => {
    setOptions((prev) => ({
      ...prev,
      industries: prev.industries.filter((i) => i !== industry),
    }));
  };

  const removeLocation = (location) => {
    setOptions((prev) => ({
      ...prev,
      locations: prev.locations.filter((l) => l !== location),
    }));
  };

  if (!companyProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please complete company analysis first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 2: Configuration</h2>
        <p className="text-gray-600 mt-1">Configure lead generation parameters</p>
      </div>

      <div className="space-y-6">
        {/* Number of Leads */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Leads
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="200"
              step="10"
              value={options.numLeads}
              onChange={(e) => setOptions({ ...options, numLeads: parseInt(e.target.value) })}
              className="flex-1"
            />
            <input
              type="number"
              min="10"
              max="200"
              value={options.numLeads}
              onChange={(e) => {
                const value = Math.min(200, Math.max(10, parseInt(e.target.value) || 100));
                setOptions({ ...options, numLeads: value });
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-center"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Recommended: 50-100 leads for best results. Higher numbers take longer to process.
          </p>
        </div>

        {/* Target Industries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Industries (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select industries to target. Leave empty to search all industries.
          </p>
          
          {/* Selected Industries Tags */}
          {options.industries.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {options.industries.map((industry) => (
                <span
                  key={industry}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                >
                  {industry}
                  <button
                    onClick={() => removeIndustry(industry)}
                    className="hover:text-primary-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Industry Checkboxes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
            {COMMON_INDUSTRIES.map((industry) => (
              <label
                key={industry}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  options.industries.includes(industry)
                    ? 'bg-primary-100 text-primary-900'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.industries.includes(industry)}
                  onChange={() => toggleIndustry(industry)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{industry}</span>
              </label>
            ))}
          </div>

          {/* Custom Industry Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Add custom industry..."
              value={customIndustry}
              onChange={(e) => setCustomIndustry(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomIndustry();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              onClick={addCustomIndustry}
              disabled={!customIndustry.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Target Locations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Locations (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Select locations to target. Leave empty to search globally.
          </p>
          
          {/* Selected Locations Tags */}
          {options.locations.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {options.locations.map((location) => (
                <span
                  key={location}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {location}
                  <button
                    onClick={() => removeLocation(location)}
                    className="hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Location Checkboxes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-3 border border-gray-200 rounded-lg bg-gray-50">
            {COMMON_LOCATIONS.map((location) => (
              <label
                key={location}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  options.locations.includes(location)
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.locations.includes(location)}
                  onChange={() => toggleLocation(location)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{location}</span>
              </label>
            ))}
          </div>

          {/* Custom Location Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              placeholder="Add custom location..."
              value={customLocation}
              onChange={(e) => setCustomLocation(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomLocation();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              onClick={addCustomLocation}
              disabled={!customLocation.trim()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Configuration Summary</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Number of Leads: <span className="font-medium">{options.numLeads}</span></p>
            <p>• Target Industries: <span className="font-medium">
              {options.industries.length > 0 ? options.industries.join(', ') : 'All Industries'}
            </span></p>
            <p>• Target Locations: <span className="font-medium">
              {options.locations.length > 0 ? options.locations.join(', ') : 'Global'}
            </span></p>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onNext}
          disabled={!companyProfile}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Start Lead Generation
        </button>
      </div>
    </div>
  );
}

