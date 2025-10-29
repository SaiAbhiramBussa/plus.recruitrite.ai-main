// components/AuthGuard.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import routes from '../routes';

const AuthGuard = (WrappedComponent: any) => {

  const WrappedComponentWithAuth = (props: any) => {
    const router = useRouter();
    const [routeState, setRouteState]: any = useState()
    const getUserData = () => {
      if (typeof window === "undefined") return null;
      let user = localStorage.getItem("user");
  
      if(!user) {
          const cookie = `; ${document.cookie}`;
          const parts: string[] = cookie.split(`; userdata=`);
          let user: string = "";
          if (parts.length === 2) {
            const part = parts[1]; 
            user = part || "";
          }
          localStorage.setItem("user", user);
      }
      return user;
    };
    const user = getUserData();
    const isAuthenticated = typeof window !== 'undefined' && !!user;
    const userRole = typeof window !== 'undefined' && !!user && JSON.parse( user  || '{}').role;

    useEffect(() => {
      if (!isAuthenticated && !userRole) {
        router.push('/signin'); // Redirect to login page if not authenticated
      }
      else{
        const route = routes.find((r: any) => r.path === router.pathname);
        if (route && route.allowedRoles && !route.allowedRoles.includes(userRole)) {
          if(userRole === 'admin')
            router.push('/admin/jobs');
          else if(userRole === 'job_seeker')
            router.push('/candidates/dashboard');
          else if(userRole === 'employer' || userRole === 'hiring_manager')
            router.push('/dashboard');
        }
        setRouteState(route)

      }
    }, [isAuthenticated]);

    return (isAuthenticated && routeState && routeState?.allowedRoles && routeState?.allowedRoles.includes(userRole)) ? <WrappedComponent {...props} /> : null;
  };

  return WrappedComponentWithAuth;
};

export default AuthGuard;
