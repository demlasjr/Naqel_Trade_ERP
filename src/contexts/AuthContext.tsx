import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types/user';
import { Role } from '@/types/role';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function with timeout (reduced for faster loading)
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );
  return Promise.race([promise, timeout]);
};

// Faster timeout values
const FAST_TIMEOUT = 3000; // 3 seconds for critical operations
const INIT_TIMEOUT = 5000; // 5 seconds max for initialization

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create basic user from session data
  const createBasicUser = (authUser: { id: string; email?: string }): User => ({
    id: authUser.id,
    name: authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    role: 'viewer',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  const fetchUserProfile = async (userId: string, userEmail?: string): Promise<void> => {
    try {
      // Fetch profile and role in parallel for faster loading
      const [profileResult, roleResult] = await Promise.all([
        withTimeout(
          supabase.from('profiles').select('*').eq('id', userId).single(),
          FAST_TIMEOUT
        ).catch(() => ({ data: null, error: new Error('Profile fetch failed') })),
        withTimeout(
          supabase.from('user_roles').select('role').eq('user_id', userId).single(),
          FAST_TIMEOUT
        ).catch(() => ({ data: null, error: null })),
      ]);

      const profile = profileResult.data;
      const userRole = roleResult.data;

      // Always set user immediately with available data
      const userData: User = {
        id: userId,
        name: profile?.name || userEmail?.split('@')[0] || 'User',
        email: profile?.email || userEmail || '',
        role: userRole?.role || 'viewer',
        status: profile?.status || 'active',
        avatar: profile?.avatar_url || undefined,
        createdAt: profile?.created_at || new Date().toISOString(),
      };
      setUser(userData);

      // Fetch role details in background (non-blocking)
      if (userRole?.role) {
        supabase
          .from('roles')
          .select('*')
          .eq('role_type', userRole.role)
          .single()
          .then(({ data: roleData }) => {
            if (roleData) {
              setRole({
                id: roleData.id,
                name: roleData.name,
                roleType: roleData.role_type,
                description: roleData.description || '',
                permissions: [],
                userCount: 0,
                isSystemRole: roleData.is_system_role || false,
                createdAt: roleData.created_at,
              });
            }
          })
          .catch(() => {}); // Ignore errors for non-critical data
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUser(createBasicUser({ id: userId, email: userEmail }));
    }
  };

  useEffect(() => {
    let mounted = true;
    let initTimeout: ReturnType<typeof setTimeout>;

    const initializeAuth = async () => {
      try {
        // Set a maximum timeout for the entire init process (reduced for faster UX)
        initTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            console.warn('Auth initialization timeout, proceeding without user data');
            setIsLoading(false);
          }
        }, INIT_TIMEOUT);

        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (!mounted) return;

        setSession(currentSession);

        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id, currentSession.user.email);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        clearTimeout(initTimeout);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        setSession(newSession);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
        } else if (newSession?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          // Update last login timestamp on sign in
          if (event === 'SIGNED_IN') {
            await supabase
              .from('profiles')
              .update({ last_login: new Date().toISOString() })
              .eq('id', newSession.user.id)
              .catch(() => {}); // Don't block if this fails
          }
          await fetchUserProfile(newSession.user.id, newSession.user.email);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setSession(data.session);
        // Update last login timestamp
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id)
          .catch(() => {}); // Don't block login if this fails
        await fetchUserProfile(data.user.id, data.user.email);
      }

      return {};
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
            email: email,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        // Try to assign default role
        try {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            role: 'viewer',
          });
        } catch (roleError) {
          console.warn('Could not assign default role:', roleError);
        }

        if (data.session) {
          setSession(data.session);
          await fetchUserProfile(data.user.id, data.user.email);
        }
      }

      return {};
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRole(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, session, login, signup, logout, resetPassword, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
