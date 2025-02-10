import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

function Login() {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { session } = useSessionContext();
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleUserSession = React.useCallback(
    async (currentSession) => {
      try {
        // First check if profile exists
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Real error, not just "no rows found"
          throw error;
        }

        if (!profile) {
          // Create new profile if one doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: currentSession.user.id,
              role: 'student', // Default role
              email: currentSession.user.email
            });

          if (insertError) {
            throw insertError;
          }
          console.log('Redirecting to /student after profile creation');
          navigate('/student');
          return;
        } else {
          console.log('Profile found:', profile);
          navigate(profile.role === 'admin' ? '/admin' : '/student');
        }
      } catch (error) {
        setError('Error in handleUserSession: ' + error.message);
        return navigate('/');
      }
    },
    [navigate]
  );

  React.useEffect(() => {
    if (session?.user) {
      console.log('Initial session detected, handling user session');
      setIsLoading(true);
      handleUserSession(session)
        .finally(() => setIsLoading(false));
    }
  }, [session, handleUserSession]);

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, 'Session:', currentSession);
        if (event === 'SIGNED_IN' && currentSession) {
          console.log('User signed in, handling user session');
          setIsLoading(true);
          setError(null);
          handleUserSession(currentSession).finally(() => setIsLoading(false));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleUserSession]);

  return (
    <div className="login-container">
      <h1>School Attendance System</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div className="auth-container">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
        />
      </div>
    </div>
  );
}

export default Login;
