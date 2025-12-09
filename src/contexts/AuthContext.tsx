import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types/user';
import { Role } from '@/types/role';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Create a basic user from auth data if profile fetch fails
        setUser({
          id: userId,
          name: userEmail?.split('@')[0] || 'User',
          email: userEmail || '',
          role: 'viewer',
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
      }

      const userData: User = {
        id: profile.id,
        name: profile.name || '',
        email: profile.email,
        role: userRole?.role || 'viewer',
        status: profile.status,
        avatar: profile.avatar_url || undefined,
        createdAt: profile.created_at,
      };
      setUser(userData);

      if (userRole) {
        // Fetch the role details from roles table
        const { data: roleData, error: roleDataError } = await supabase
          .from('roles')
          .select('*')
          .eq('role_type', userRole.role)
          .single();

        if (roleDataError) {
          console.error('Error fetching role data:', roleDataError);
        }

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
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Set minimal user data so app doesn't hang
      setUser({
        id: userId,
        name: userEmail?.split('@')[0] || 'User',
        email: userEmail || '',
        role: 'viewer',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Check for existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id, session.user.email);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event);
        setSession(session);
        
        if (session?.user) {
          // Don't set loading here as it would cause flash
          await fetchUserProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      mounted = false;
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
        await fetchUserProfile(data.user.id, data.user.email);
      }

      return {};
    } catch (error) {
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
        // Assign default 'viewer' role to new users
        await supabase.from('user_roles').insert({
          user_id: data.user.id,
          role: 'viewer',
        });

        await fetchUserProfile(data.user.id, data.user.email);
      }

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setSession(null);
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
      return { error: 'An unexpected error occurred' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, login, signup, logout, resetPassword, isLoading }}>
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
