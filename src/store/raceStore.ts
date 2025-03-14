import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Runner {
  id?: number;
  name: string;
  house: string;
  age_group: string;
  date_of_birth: string;
  finish_time: string | null;
  position: number | null;
  running_time_seconds?: number | null;
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
  fetchRunners: () => Promise<void>;
  addRunner: (runner: Runner) => Promise<void>;
  recordFinish: (id: number) => Promise<void>;
  undoLastFinish: () => Promise<void>;
  createRace: (name: string, date: string) => Promise<void>;
  setCurrentRace: (race: any) => void;
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

  setCurrentRace: (race) => {
    set({ 
      currentRace: {
        id: race.id,
        name: race.name,
        date: race.date,
        status: race.status
      }
    });
  },

  fetchRunners: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('runners')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Update finishOrder with the runners who have finished
      const finishedRunners = data?.filter(r => r.finish_time !== null) || [];
      finishedRunners.sort((a, b) => 
        (a.position || Infinity) - (b.position || Infinity)
      );
      
      set({ 
        runners: data || [], 
        finishOrder: finishedRunners,
        isLoading: false 
      });
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

  recordFinish: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Find the runner
      const runner = get().runners.find(r => r.id === id);
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
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      const updatedRunner = { ...runner, finish_time: finishTime, position };
      set(state => ({
        runners: state.runners.map(r => 
          r.id === id ? updatedRunner : r
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
          position: null,
          running_time_seconds: null
        })
        .eq('id', lastRunner.id);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        runners: state.runners.map(r => 
          r.id === lastRunner.id 
            ? { ...r, finish_time: null, position: null, running_time_seconds: null } 
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
      
      const newRace = data[0];
      set({ 
        currentRace: {
          id: newRace.id,
          name: newRace.name,
          date: newRace.date,
          status: newRace.status
        },
        isLoading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
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
      const { runners, currentRace } = get();
      const finishedRunners = runners.filter(r => r.position !== null);
      
      // Group runners by age group
      const runnersByAgeGroup: Record<string, Runner[]> = {};
      finishedRunners.forEach(runner => {
        if (!runnersByAgeGroup[runner.age_group]) {
          runnersByAgeGroup[runner.age_group] = [];
        }
        runnersByAgeGroup[runner.age_group].push(runner);
      });
      
      // Initialize house points
      const housePoints: Record<string, number> = {
        'Broughton': 0,
        'Abbott': 0,
        'Croft': 0,
        'Tyrell': 0,
        'Green': 0,
        'Ross': 0
      };

      // Process each age group
      Object.values(runnersByAgeGroup).forEach(groupRunners => {
        // Sort runners by position within their age group
        groupRunners.sort((a, b) => (a.position || 0) - (b.position || 0));

        // Award points for top 20 positions
        groupRunners.slice(0, 20).forEach((runner, index) => {
          if (runner.house) {
            // Position points: 1st = 22 points, 2nd = 21 points, etc.
            const positionPoints = 22 - index;
            housePoints[runner.house] += positionPoints;
          }
        });
      });

      // Award completion points
      finishedRunners.forEach(runner => {
        if (runner.house && runner.running_time_seconds) {
          // Check if runner completed first lap (2km) - assume 20 minutes is cutoff
          if (runner.running_time_seconds <= 1200) {
            housePoints[runner.house] += 1; // 1 point for completing first lap
          }
          
          // Check if runner completed full course (4km)
          if (runner.running_time_seconds > 0) {
            housePoints[runner.house] += 2; // 2 points for completing full course
          }
        }
      });

      // Save points to database
      for (const [house, points] of Object.entries(housePoints)) {
        if (points > 0) {
          const { error } = await supabase
            .from('house_points')
            .insert({
              house,
              points,
              race_id: currentRace.id
            });
          
          if (error) throw error;
        }
      }

      // Log the action
      await get().logAdminAction('calculate_house_points', {
        race_id: currentRace.id,
        race_name: currentRace.name,
        points_awarded: housePoints,
        total_runners: finishedRunners.length,
        timestamp: new Date().toISOString()
      });

      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addQuickHousePoint: async (house) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('house_points')
        .insert({
          house,
          points: 1
        });
      
      if (error) throw error;
      
      await get().logAdminAction('add_quick_point', {
        house,
        points: 1
      });
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  resetHousePoints: async () => {
    set({ isLoading: true, error: null });
    try {
      await get().logAdminAction('reset_house_points', {
        timestamp: new Date().toISOString()
      });
      
      const { error } = await supabase
        .from('house_points')
        .delete()
        .gte('id', 0);
      
      if (error) throw error;
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  verifyAdminPassword: async (password) => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('key', 'admin_password');
      
      if (error) {
        console.error('Error fetching admin settings:', error);
        return false;
      }
      
      if (!data || data.length === 0) {
        return password === 'NewStart37#';
      }
      
      return data[0].value === password;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  },

  backupHousePoints: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('house_points')
        .select('*');
      
      if (error) throw error;
      
      const timestamp = new Date().toISOString();
      const backup = {
        timestamp,
        data: data || []
      };
      
      const backupString = JSON.stringify(backup);
      
      const { data: existingData } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'house_points_backup');
      
      if (existingData && existingData.length > 0) {
        const { error: saveError } = await supabase
          .from('admin_settings')
          .update({
            value: backupString,
            updated_at: new Date().toISOString()
          })
          .eq('key', 'house_points_backup');
        
        if (saveError) throw saveError;
      } else {
        const { error: saveError } = await supabase
          .from('admin_settings')
          .insert({
            key: 'house_points_backup',
            value: backupString
          });
        
        if (saveError) throw saveError;
      }
      
      const backupKey = `house_points_backup_${timestamp.replace(/[:.]/g, '_')}`;
      const { error: historyError } = await supabase
        .from('admin_settings')
        .insert({
          key: backupKey,
          value: backupString
        });
      
      if (historyError) {
        console.error('Error creating historical backup:', historyError);
      }
      
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
      const backup = JSON.parse(backupData);
      
      if (!backup.data || !Array.isArray(backup.data)) {
        throw new Error('Invalid backup data format');
      }
      
      await get().logAdminAction('restore_house_points', {
        timestamp: backup.timestamp,
        entries: backup.data.length
      });
      
      await get().resetHousePoints();
      
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
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || 'anonymous';
      
      const logEntry = {
        action,
        user_id: userId,
        timestamp: new Date().toISOString(),
        details: JSON.stringify(details)
      };
      
      const { error } = await supabase
        .from('admin_logs')
        .insert(logEntry);
      
      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (err) {
      console.error('Failed to log admin action:', err);
    }
  }
}));