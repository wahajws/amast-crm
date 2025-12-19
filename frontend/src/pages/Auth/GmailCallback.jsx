import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

export default function GmailCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (error) {
      // Handle error
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token && refreshToken) {
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Get user info
      api.get('/auth/me')
        .then((response) => {
          updateUser(response.data.data);
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          navigate('/login?error=authentication_failed');
        });
    } else {
      navigate('/login?error=missing_tokens');
    }
  }, [searchParams, navigate, updateUser]);

  return <LoadingSpinner />;
}







