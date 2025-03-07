import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface MasterAdminState {
  isMasterAdmin: boolean;
  checkMasterAdminStatus: () => Promise<void>;
  togglePlatformStatus: (platform: string, status: string) => Promise<void>;
  activateKillswitch: (message: string) => Promise<void>;
}

const useMasterAdminStore = create<MasterAdminState>((set) => ({
  isMasterAdmin: false,

  checkMasterAdminStatus: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        set({ isMasterAdmin: false });
        return;
      }

      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'master_admin')
        .eq('user_id', session.user.id);

      set({ isMasterAdmin: data?.[0]?.value === 'true' });
    } catch (err) {
      console.error('Error checking master admin status:', err);
      set({ isMasterAdmin: false });
    }
  },

  togglePlatformStatus: async (platform: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
      const message = newStatus === 'active' ? 'System operational' : 'System temporarily disabled';

      const { error } = await supabase
        .from('platform_status')
        .update({
          status: newStatus,
          message,
          updated_by: (await supabase.auth.getSession()).data.session?.user.email,
          last_updated: new Date().toISOString()
        })
        .eq('platform', platform);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling platform status:', err);
      throw err;
    }
  },

  activateKillswitch: async (message: string) => {
    try {
      const { error } = await supabase
        .from('platform_status')
        .update({
          status: 'disabled',
          message,
          updated_by: (await supabase.auth.getSession()).data.session?.user.email,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error activating killswitch:', err);
      throw err;
    }
  }
}));

export default useMasterAdminStore;