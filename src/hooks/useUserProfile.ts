import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    console.log('🔍 Fetching profile for user:', user.id);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
      return;
    }
    
    if (data) {
      console.log('✅ Profile found:', data);
      setProfile(data);
    } else {
      console.log('🆕 No profile found, attempting to create one...');
      
      // First verify the user actually exists in auth.users
      try {
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser.user) {
          console.error('❌ User not found in auth, redirecting to login');
          // Clear any stale auth state
          await supabase.auth.signOut();
          // Force page reload to clear all cached state
          window.location.reload();
          return;
        }

        // Create profile using the verified user data
        const newProfile = {
          user_id: authUser.user.id,
          full_name: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || null,
          email: authUser.user.email || null,
          avatar_url: authUser.user.user_metadata?.avatar_url || authUser.user.user_metadata?.picture || null,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .maybeSingle();

        if (createError) {
          console.error('❌ Error creating profile:', createError);
          // If it's still a foreign key error, the user doesn't exist in the database
          if (createError.code === '23503') {
            console.error('🔄 User not in database, signing out to refresh auth state');
            await supabase.auth.signOut();
          }
        } else {
          console.log('✅ Profile created:', createdProfile);
          setProfile(createdProfile);
        }
      } catch (err) {
        console.error('❌ Error during profile creation process:', err);
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  const getInitials = () => {
    if (!profile?.full_name && !user?.email) return '??';
    
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    // Fallback to email initial
    return user?.email?.[0]?.toUpperCase() || '?';
  };

  return {
    profile,
    loading,
    getInitials,
    refetch: fetchProfile
  };
};