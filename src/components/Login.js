import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';

function Login() {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { session } = useSessionContext();
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    yearLevel: '',
    schoolId: '',
  });
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
    [navigate, supabase]
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
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setIsLoading(false);
          localStorage.clear();
          sessionStorage.clear();
          navigate('/');
          return;
        } else if (event === 'SIGNED_IN' && currentSession) {
          setError(null);
          try {
            await handleUserSession(currentSession);
          } catch (err) {
            setError(err.error_description || err.message);
          } finally {
            setIsLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [handleUserSession, supabase.auth]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    return email.endsWith('@liceo.edu.ph');
  };

  const validateSchoolId = (id) => {
    return /^\d{11}$/.test(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isRegistering) {
      if (!validateEmail(formData.email)) {
        setError('Please use a valid Liceo de Cagayan University email');
        setIsLoading(false);
        return;
      }

      if (!validateSchoolId(formData.schoolId)) {
        setError('School ID must be 11 digits');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;

        // Create profile with additional information
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: formData.email,
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            year_level: formData.yearLevel,
            school_id: formData.schoolId,
            role: 'student'
          });

        if (profileError) throw profileError;

      } catch (error) {
        setError(error.error_description || error.message);
      }
    } else {
      try {
        console.log('Attempting to sign in with:', formData.email);
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        console.log('Sign in response:', signInError ? 'Error' : 'Success');
        if (signInError) {
          console.error('SignIn Error:', signInError);
          throw signInError;
        }
        console.log('Sign in successful:', data);
      } catch (error) {
        console.error('Login error:', error);
        setError(error.error_description || error.message);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">CIT Attendance System</h1>
        {isLoading && <p className="loading-spinner">Loading...</p>}
        {session?.user && <p>Logged in as: {session.user.email}</p>}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="Email (@liceo.edu.ph)"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              className="form-control"
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          {isRegistering && (
            <>
              <div className="form-group">
                <input
                  className="form-control"
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  className="form-control"
                  type="text"
                  name="middleName"
                  placeholder="Middle Name"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  className="form-control"
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <select
                  className="form-control"
                  name="yearLevel"
                  value={formData.yearLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Year Level</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  className="form-control"
                  type="text"
                  name="schoolId"
                  placeholder="School ID (11 digits)"
                  value={formData.schoolId}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </>
          )}
          
          <button type="submit" className="btn btn-primary">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        
        <button 
          onClick={() => setIsRegistering(!isRegistering)}
          className="btn btn-secondary"
        >
          {isRegistering ? 'Already have an account? Login' : 'Need to register? Sign up'}
        </button>
      </div>
    </div>
  );
}

export default Login;
