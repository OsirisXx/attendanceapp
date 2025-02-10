import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';

const ProtectedRoute = ({ children, role }) => {
  const { session, isLoading } = useSessionContext();
  const supabase = useSupabaseClient();
  const [userRole, setUserRole] = React.useState(null);
  const [isCheckingRole, setIsCheckingRole] = React.useState(true);

  React.useEffect(() => {
    async function getUserRole() {
      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .throwOnError()
          .single();

        if (data) {
          setUserRole(data.role);
        }
        setIsCheckingRole(false);
      }
      setIsCheckingRole(false);
    }
    getUserRole();
  }, [session, supabase]);

  if (isLoading || isCheckingRole) {
    return <div>Loading...</div>;
  }

  console.log('Protected Route - Session:', session, 'Role:', userRole);

  if (!session) return <Navigate to="/" replace />;
  if (!userRole) return <div>Loading role...</div>;

  if (role && role !== userRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
