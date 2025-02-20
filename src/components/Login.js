import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Modal from './Modal';
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
  const [isFlipping, setIsFlipping] = React.useState(false);
  const [modal, setModal] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

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
  }, [handleUserSession, supabase.auth, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => {
    return email.endsWith('@liceo.edu.ph');
  };

  const validateSchoolId = (id) => {
    return /^\d{10,11}$/.test(id);
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
        setError('School ID must be 10-11 digits');
        setIsLoading(false);
        return;
      }

      try {
        // First check if email or student ID already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('email, school_id')
          .or(`email.eq.${formData.email},school_id.eq.${formData.schoolId}`)
          .single();
        if (!checkError && existingUser) {
          // User already exists
          if (existingUser.email === formData.email) {
            setModal({
              isOpen: true,
              title: 'Registration Error',
              message: 'This email is already registered. Please try logging in instead.',
              type: 'error'
            });
          } else if (existingUser.school_id === formData.schoolId) {
            setModal({
              isOpen: true,
              title: 'Registration Error',
              message: 'This Student ID is already registered. Please contact support if this is an error.',
              type: 'error'
            });
          }
          return;
        }

        // If no existing user, proceed with registration
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) {
          throw signUpError;
        }

        // Create the user profile after successful registration
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

        if (profileError) {
          throw profileError;
        }

        // Show success modal
        setModal({
          isOpen: true,
          title: 'Registration Almost Complete!',
          message: 'Please check your email to confirm your registration.',
          type: 'success'
        });
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          firstName: '',
          middleName: '',
          lastName: '',
          yearLevel: '',
          schoolId: '',
        });
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

  const handleFormSwitch = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsRegistering(!isRegistering);
      setIsFlipping(false);
    }, 400);
  };

  return (
    <div className="login-page">
      <div className={`login-container ${isFlipping ? 'flipping' : ''}`}>
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
                  placeholder="Middle Name | Middle Initial"
                  value={formData.middleName}
                  onChange={handleInputChange}
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
                  placeholder="School ID (10-11 digits)"
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
          onClick={handleFormSwitch}
          className="btn btn-secondary"
        >
          {isRegistering ? 'Already have an account? Login' : 'Need to register? Sign up'}
        </button>
      </div>
      <Modal
        isOpen={modal.isOpen}
        onClose={() => {
          setModal({ ...modal, isOpen: false });
          window.location.reload();
        }}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
}

export default Login;
