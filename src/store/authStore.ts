import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

export default useAuthStore;

export { useAuthStore }