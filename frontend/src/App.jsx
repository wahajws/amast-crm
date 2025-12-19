import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/UI/LoadingSpinner';
import Layout from './components/Layout/Layout';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import GmailCallback from './pages/Auth/GmailCallback';

// Main pages
import Dashboard from './pages/Dashboard/Dashboard';
import Accounts from './pages/Accounts/Accounts';
import AccountForm from './pages/Accounts/AccountForm';
import Contacts from './pages/Contacts/Contacts';
import ContactForm from './pages/Contacts/ContactForm';
import Notes from './pages/Notes/Notes';
import NoteForm from './pages/Notes/NoteForm';
import Reminders from './pages/Reminders/Reminders';
import ReminderForm from './pages/Reminders/ReminderForm';
import Opportunities from './pages/Opportunities/Opportunities';
import OpportunityForm from './pages/Opportunities/OpportunityForm';
import Proposals from './pages/Proposals/Proposals';
import ProposalForm from './pages/Proposals/ProposalForm';
import Emails from './pages/Emails/Emails';
import EmailDetail from './pages/Emails/EmailDetail';
import AccountEmails from './pages/Emails/AccountEmails';
import AccountEmailTimeline from './pages/Emails/AccountEmailTimeline';
import GmailIntegration from './pages/Gmail/GmailIntegration';
import LeadGeneration from './pages/LeadGeneration/LeadGeneration';
import BulkImport from './pages/BulkImport/BulkImport';
import EmailCampaigns from './pages/EmailCampaigns/EmailCampaigns';
import EmailCampaignDetail from './pages/EmailCampaigns/EmailCampaignDetail';
import EmailDashboard from './pages/EmailDashboard/EmailDashboard';
import Profile from './pages/Profile/Profile';
import Users from './pages/Users/Users';
import UserForm from './pages/Users/UserForm';
import Roles from './pages/Roles/Roles';
import RoleForm from './pages/Roles/RoleForm';

// Private Route Component
function PrivateRoute({ children }) {
  const auth = useAuth();
  
  if (!auth) {
    return <LoadingSpinner />;
  }

  const { user, loading } = auth;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const auth = useAuth();
  
  if (!auth) {
    return <LoadingSpinner />;
  }

  const { user, loading } = auth;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// App Routes Component
function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path="/auth/gmail/callback" element={<GmailCallback />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Accounts */}
        <Route path="accounts" element={<Accounts />} />
        <Route path="accounts/new" element={<AccountForm />} />
        <Route path="accounts/:id/edit" element={<AccountForm />} />
        <Route path="accounts/:id/emails" element={<AccountEmails />} />
        <Route path="accounts/:id/emails/timeline" element={<AccountEmailTimeline />} />
        
        {/* Contacts */}
        <Route path="contacts" element={<Contacts />} />
        <Route path="contacts/new" element={<ContactForm />} />
        <Route path="contacts/:id/edit" element={<ContactForm />} />
        
        {/* Notes */}
        <Route path="notes" element={<Notes />} />
        <Route path="notes/new" element={<NoteForm />} />
        <Route path="notes/:id/edit" element={<NoteForm />} />
        
        {/* Reminders */}
        <Route path="reminders" element={<Reminders />} />
        <Route path="reminders/new" element={<ReminderForm />} />
        <Route path="reminders/:id/edit" element={<ReminderForm />} />
        
        {/* Opportunities */}
        <Route path="opportunities" element={<Opportunities />} />
        <Route path="opportunities/new" element={<OpportunityForm />} />
        <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
        
        {/* Proposals */}
        <Route path="proposals" element={<Proposals />} />
        <Route path="proposals/new" element={<ProposalForm />} />
        <Route path="proposals/:id/edit" element={<ProposalForm />} />
        
        {/* Emails */}
        <Route path="emails" element={<Emails />} />
        <Route path="emails/:id" element={<EmailDetail />} />
        
        {/* Gmail Integration */}
        <Route path="gmail" element={<GmailIntegration />} />
        
        {/* Lead Generation */}
        <Route path="lead-generation" element={<LeadGeneration />} />
        
        {/* Bulk Import */}
        <Route path="bulk-import" element={<BulkImport />} />
        
        {/* Email Campaigns */}
        <Route path="email-campaigns" element={<EmailCampaigns />} />
        <Route path="email-campaigns/:id" element={<EmailCampaignDetail />} />
        <Route path="email-dashboard" element={<EmailDashboard />} />
        
        {/* Profile */}
        <Route path="profile" element={<Profile />} />
        
        {/* Admin Routes */}
        <Route path="users" element={<Users />} />
        <Route path="users/new" element={<UserForm />} />
        <Route path="users/:id/edit" element={<UserForm />} />
        <Route path="roles" element={<Roles />} />
        <Route path="roles/new" element={<RoleForm />} />
        <Route path="roles/:id/edit" element={<RoleForm />} />
        
        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
