import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    adminLoading: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
    linkGoogleSheets: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    adminLoading: false,
    isAdmin: false,
    signInWithGoogle: async () => { },
    linkGoogleSheets: async () => { },
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminLoading, setAdminLoading] = useState(false);

    useEffect(() => {
        // Check active sessions and sets the user
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminRole(session.user.id);
            }
            setLoading(false);
        };

        getSession();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkAdminRole(session.user.id);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdminRole = async (userId: string) => {
        setAdminLoading(true);
        try {
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (data && data.role === 'admin') {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        } finally {
            setAdminLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
        });
    };

    const linkGoogleSheets = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
                scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            }
        });
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) {
            console.error('Sign out error:', error.message, error.status);
        } else {
            // Redirect to login page after successful sign out
            window.location.hash = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, adminLoading, isAdmin, signInWithGoogle, linkGoogleSheets, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

