import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Runner {
  id?: number;
  student_id: string;
  name: string;
  house: string;
  age_group: string;
  finish_time: string | null;
  position: number | null;
}

interface RaceState {
  runners: Runner[];
  currentRace: {
    id: number | null;
    name: string;
    date: string;
    status: string;
  };
  finishOrder: Runner[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRunners: (ageGroup?: string) => Promise<void>;
  addRunner: (runner: Runner) => Promise<void>;
  recordFinish: (studentId: string) => Promise<void>;
  undoLastFinish: () => Promise<void>;
  createRace: (name: string, date: string) => Promise<void>;
  updateRaceStatus: (status: string) => Promise<void>;
  calculateHousePoints: () => Promise<void>;
  addQuickHousePoint: (house: string) => Promise<void>;
  resetHousePoints: () => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  backupHousePoints: () => Promise<string>;
  restoreHousePoints: (backupData: string) => Promise<void>;
  logAdminAction: (action: string, details?: any) => Promise<void>;
}

export const useRaceStore = create<RaceState>((set, get) => ({
  runners: [],
  currentRace: {
    id: null,
    name: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  },
  finishOrder: [],
  isLoading: false,
  error: null,

  fetchRunners: async (ageGroup) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('runners').select('*');
      
      if (ageGroup) {
        query = query.eq('age_group', ageGroup);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      set({ runners: data || [], isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addRunner: async (runner) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('runners')
        .insert(runner)
        .select();
      
      if (error) throw error;
      
      set(state => ({ 
        runners: [...state.runners, data[0]],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  recordFinish: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      // Find the runner
      const runner = get().runners.find(r => r.student_id === studentId);
      if (!runner) {
        throw new Error('Runner not found');
      }

      // Record finish time
      const finishTime = new Date().toISOString();
      const position = get().finishOrder.length + 1;

      // Update in database
      const { error } = await supabase
        .from('runners')
        .update({ 
          finish_time: finishTime,
          position: position
        })
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      // Update local state
      const updatedRunner = { ...runner, finish_time: finishTime, position };
      set(state => ({
        runners: state.runners.map(r => 
          r.student_id === studentId ? updatedRunner : r
        ),
        finishOrder: [...state.finishOrder, updatedRunner],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  undoLastFinish: async () => {
    set({ isLoading: true, error: null });
    try {
      const { finishOrder } = get();
      if (finishOrder.length === 0) {
        throw new Error('No finishes to undo');
      }

      // Get the last runner who finished
      const lastRunner = finishOrder[finishOrder.length - 1];
      
      // Update in database
      const { error } = await supabase
        .from('runners')
        .update({ 
          finish_time: null,
          position: null
        })
        .eq('student_id', lastRunner.student_id);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        runners: state.runners.map(r => 
          r.student_id === lastRunner.student_id 
            ? { ...r, finish_time: null, position: null } 
            : r
        ),
        finishOrder: state.finishOrder.slice(0, -1),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createRace: async (name, date) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('race_events')
        .insert({
          name,
          date,
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      set({ 
        currentRace: {
          id: data[0].id,
          name: data[0].name,
          date: data[0].date,
          status: data[0].status
        },
        isLoading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateRaceStatus: async (status) => {
    const { currentRace } = get();
    if (!currentRace.id) {
      set({ error: 'No active race', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('race_events')
        .update({ status })
        .eq('id', currentRace.id);
      
      if (error) throw error;
      
      set(state => ({ 
        currentRace: {
          ...state.currentRace,
          status
        },
        isLoading: false 
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  calculateHousePoints: async () => {
    set({ isLoading: true, error: null });
    try {
      const { runners } = get();
      const finishedRunners = runners.filter(r => r.position !== null);
      
      // Sort by position
      finishedRunners.sort((a, b) => 
        (a.position || Infinity) - (b.position || Infinity)
      );
      
      // Calculate points by house
      const housePoints: Record<string, number> = {
        'Broughton': 0,
        'Abbott': 0,
        'Croft': 0,
        'Tyrell': 0,
        'Green': 0,
        'Ross': 0
      };
      
      // Simple scoring system: 10 points for 1st, 9 for 2nd, etc.
      finishedRunners.forEach((runner, index) => {
        if (index < 10 && runner.house) {
          housePoints[runner.house] += (10 - index);
        }
      });
      
      // Save to database
      for (const [house, points] of Object.entries(housePoints)) {
        if (points > 0) {
          const { error } = await supabase
            .from('house_points')
            .insert({
              house,
              points
            });
          
          if (error) throw error;
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addQuickHousePoint: async (house) => {
    set({ isLoading: true, error: null });
    try {
      // Add a single point for the house
      const { error } = await supabase
        .from('house_points')
        .insert({
          house,
          points: 1
        });
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  resetHousePoints: async () => {
    set({ isLoading: true, error: null });
    try {
      // Log the reset action
      await get().logAdminAction('reset_house_points', {
        timestamp: new Date().toISOString()
      });
      
      // Delete all house points
      const { error } = await supabase
        .from('house_points')
        .delete()
        .gte('id', 0); // This will delete all rows since all IDs are >= 0
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  verifyAdminPassword: async (password) => {
    try {
      // First, check if the admin_settings table exists and has the password entry
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'admin_password');
      
      if (error) {
        console.error('Error fetching admin settings:', error);
        return false;
      }
      
      // If no data or empty array, use the default password
      if (!data || data.length === 0) {
        // Default password as fallback
        return password === 'NewStart37#';
      }
      
      // Compare with the stored password
      return data[0].value === password;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  },

  backupHousePoints: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch all house points
      const { data, error } = await supabase
        .from('house_points')
        .select('*');
      
      if (error) throw error;
      
      // Create a backup object with timestamp
      const timestamp = new Date().toISOString();
      const backup = {
        timestamp,
        data: data || []
      };
      
      // Convert to JSON string
      const backupString = JSON.stringify(backup);
      
      // Check if backup entry already exists
      const { data: existingData } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'house_points_backup');
      
      if (existingData && existingData.length > 0) {
        // Update existing backup
        const { error: saveError } = await supabase
          .from('admin_settings')
          .update({
            value: backupString,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'house_points_backup');
        
        if (saveError) throw saveError;
      } else {
        // Create new backup entry
        const { error: saveError } = await supabase
          .from('admin_settings')
          .insert({
            key: 'house_points_backup',
            value: backupString
          });
        
        if (saveError) throw saveError;
      }
      
      // Also create a historical backup with timestamp in the key
      const backupKey = `house_points_backup_${timestamp.replace(/[:.]/g, '_')}`;
      const { error: historyError } = await supabase
        .from('admin_settings')
        .insert({
          key: backupKey,
          value: backupString
        });
      
      if (historyError) {
        console.error('Error creating historical backup:', historyError);
        // Continue even if historical backup fails
      }
      
      // Log the backup action
      await get().logAdminAction('backup_house_points', {
        timestamp,
        entries: data?.length || 0
      });
      
      set({ isLoading: false });
      
      return backupString;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return '';
    }
  },

  restoreHousePoints: async (backupData) => {
    set({ isLoading: true, error: null });
    try {
      // Parse the backup data
      const backup = JSON.parse(backupData);
      
      if (!backup.data || !Array.isArray(backup.data)) {
        throw new Error('Invalid backup data format');
      }
      
      // Log the restore action
      await get().logAdminAction('restore_house_points', {
        timestamp: backup.timestamp,
        entries: backup.data.length
      });
      
      // First, delete all existing house points
      await get().resetHousePoints();
      
      // Then insert the backup data
      for (const point of backup.data) {
        const { error } = await supabase
          .from('house_points')
          .insert({
            house: point.house,
            points: point.points
          });
        
        if (error) throw error;
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  logAdminAction: async (action, details = {}) => {
    try {
      // Get the current user session if available
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'anonymous';
      
      const logEntry = {
        action,
        user_id: userId,
        timestamp: new Date().toISOString(),
        details: JSON.stringify(details)
      };
      
      // Insert into admin_logs table
      const { error } = await supabase
        .from('admin_logs')
        .insert(logEntry);
      
      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (err) {
      console.error('Failed to log admin action:', err);
      // Don't throw - logging should not interrupt the main flow
    }
  }
}));