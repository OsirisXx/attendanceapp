import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';

const ProtectedRoute = ({ children, role }) => {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const [userRole, setUserRole] = React.useState(null);
  const [isCheckingRole, setIsCheckingRole] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function getUserRole() {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setIsLoading(false);
          return;
        }

        if (data && data.role) {
          setUserRole(data.role);
        }
      }
      setIsCheckingRole(false);
      setIsLoading(false);
    }
    getUserRole();
  }, [session, supabase]);

  if (isLoading || isCheckingRole) {
    return <div>Loading...</div>;
  }

  console.log('Protected Route - Session:', session, 'Role:', userRole);

  if (!session || !userRole) {
    return <Navigate to="/" replace />;
  }

  if (role && role !== userRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
