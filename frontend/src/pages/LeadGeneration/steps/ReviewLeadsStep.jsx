import { useState } from 'react';
import { api } from '../../../services/api';
import { toast } from 'react-toastify';
import { FiDownload, FiUpload, FiCheckSquare, FiSquare } from 'react-icons/fi';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

export default function ReviewLeadsStep({ generatedLeads, onStepChange }) {
  const [leads, setLeads] = useState(generatedLeads || []);
  const [selectedLeads, setSelectedLeads] = useState(new Set());
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('relevanceScore');
  const [importing, setImporting] = useState(false);

  const formatLocation = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      const parts = [];
      if (location.address) parts.push(String(location.address));
      if (location.city) parts.push(String(location.city));
      if (location.state) parts.push(String(location.state));
      if (location.country) parts.push(String(location.country));
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    return 'N/A';
  };

  const safeRender = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return 'N/A';
      }
    }
    return String(value);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleSelectLead = (index) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((_, i) => i)));
    }
  };

  const handleExport = () => {
    const selected = Array.from(selectedLeads).map(i => filteredLeads[i]);
    const csv = [
      ['Name', 'Industry', 'Website', 'Email', 'Phone', 'Location', 'Score'].join(','),
      ...selected.map(lead => [
        `"${lead.name || ''}"`,
        `"${lead.industry || ''}"`,
        `"${lead.website || ''}"`,
        `"${lead.contactEmail || ''}"`,
        `"${lead.phone || ''}"`,
        `"${formatLocation(lead.location)}"`,
        lead.relevanceScore || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Leads exported successfully!');
  };

  const handleImport = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Please select leads to import');
      return;
    }

    setImporting(true);
    try {
      const selected = Array.from(selectedLeads).map(i => filteredLeads[i]);
      const response = await api.post('/lead-generation/import', { leads: selected });
      
      const result = response.data.data;
      toast.success(
        `Imported ${result.accounts.length} accounts and ${result.contacts.length} contacts successfully!`
      );
      
      // Remove imported leads from list
      const remaining = leads.filter((_, i) => !selectedLeads.has(i));
      setLeads(remaining);
      setSelectedLeads(new Set());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import leads');
    } finally {
      setImporting(false);
    }
  };

  const filteredLeads = leads
    .filter(lead => {
      if (!filter) return true;
      const searchTerm = filter.toLowerCase();
      return (
        lead.name?.toLowerCase().includes(searchTerm) ||
        lead.industry?.toLowerCase().includes(searchTerm) ||
        lead.description?.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'relevanceScore') {
        return (b.relevanceScore || 0) - (a.relevanceScore || 0);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });

  if (leads.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No leads to review. Please generate leads first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 4: Review & Import Leads</h2>
        <p className="text-gray-600 mt-1">Review generated leads and import them to your CRM</p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search leads..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        >
          <option value="relevanceScore">Sort by Relevance</option>
          <option value="name">Sort by Name</option>
        </select>
        <button
          onClick={handleExport}
          disabled={selectedLeads.size === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiDownload />
          Export CSV
        </button>
        <button
          onClick={handleImport}
          disabled={selectedLeads.size === 0 || importing}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {importing ? <LoadingSpinner /> : <FiUpload />}
          Import Selected ({selectedLeads.size})
        </button>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th>Company</th>
              <th>Industry</th>
              <th>Location</th>
              <th>Contact</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-600">
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(index)}
                      onChange={() => handleSelectLead(index)}
                      className="rounded"
                    />
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{safeRender(lead.name)}</p>
                      {lead.website && (
                        <a
                          href={typeof lead.website === 'string' ? lead.website : String(lead.website || '')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline"
                        >
                          {safeRender(lead.website)}
                        </a>
                      )}
                    </div>
                  </td>
                  <td>{safeRender(lead.industry)}</td>
                  <td>{formatLocation(lead.location)}</td>
                  <td>
                    <div className="text-sm">
                      {lead.contactEmail && <p>{safeRender(lead.contactEmail)}</p>}
                      {lead.phone && <p className="text-gray-600">{safeRender(lead.phone)}</p>}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(
                        lead.relevanceScore || 0
                      )}`}
                    >
                      {lead.relevanceScore || 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

