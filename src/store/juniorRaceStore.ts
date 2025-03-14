import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface JuniorRunner {
  id?: string;
  first_name: string;
  last_name: string;
  grade: string;
  house: string;
  date_of_birth: string;
  finish_time: string | null;
  position: number | null;
  running_time_seconds: number | null;
}

interface JuniorRaceState {
  runners: JuniorRunner[];
  currentRace: {
    id: string | null;
    name: string;
    date: string;
    status: string;
    finish_line: number;
  };
  finishOrder: JuniorRunner[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRunners: (grade?: string) => Promise<void>;
  addRunner: (runner: JuniorRunner) => Promise<void>;
  recordFinish: (id: string, finishLine: number) => Promise<void>;
  undoLastFinish: (finishLine: number) => Promise<void>;
  createRace: (name: string, date: string, grade: string, distance: number, ageGroup: string, finishLine: number) => Promise<void>;
  updateRaceStatus: (status: string) => Promise<void>;
  calculateHousePoints: () => Promise<void>;
}

export const useJuniorRaceStore = create<JuniorRaceState>((set, get) => ({
  runners: [],
  currentRace: {
    id: null,
    name: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    finish_line: 1
  },
  finishOrder: [],
  isLoading: false,
  error: null,

  fetchRunners: async (grade) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('junior_runners').select('*');
      
      if (grade) {
        query = query.eq('grade', grade);
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
        .from('junior_runners')
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

  recordFinish: async (id, finishLine) => {
    set({ isLoading: true, error: null });
    try {
      const runner = get().runners.find(r => r.id === id);
      if (!runner) {
        throw new Error('Runner not found');
      }

      const finishTime = new Date().toISOString();
      const position = get().finishOrder.filter(r => r.finish_line === finishLine).length + 1;

      const { error } = await supabase
        .from('junior_results')
        .insert({
          runner_id: id,
          race_id: get().currentRace.id,
          finish_time: finishTime,
          position: position,
          finish_line: finishLine
        });
      
      if (error) throw error;
      
      const updatedRunner = { ...runner, finish_time: finishTime, position, finish_line: finishLine };
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

  undoLastFinish: async (finishLine) => {
    set({ isLoading: true, error: null });
    try {
      const { finishOrder } = get();
      const finishLineRunners = finishOrder.filter(r => r.finish_line === finishLine);
      
      if (finishLineRunners.length === 0) {
        throw new Error('No finishes to undo for this finish line');
      }

      const lastRunner = finishLineRunners[finishLineRunners.length - 1];
      
      const { error } = await supabase
        .from('junior_results')
        .delete()
        .match({ 
          runner_id: lastRunner.id,
          race_id: get().currentRace.id,
          finish_line: finishLine
        });
      
      if (error) throw error;
      
      set(state => ({
        runners: state.runners.map(r => 
          r.id === lastRunner.id 
            ? { ...r, finish_time: null, position: null } 
            : r
        ),
        finishOrder: state.finishOrder.filter(r => !(r.id === lastRunner.id && r.finish_line === finishLine)),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createRace: async (name, date, grade, distance, ageGroup, finishLine) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('junior_races')
        .insert({
          name,
          date,
          grade,
          distance,
          age_group: ageGroup,
          finish_line: finishLine,
          status: 'pending'
        })
        .select();
      
      if (error) throw error;
      
      set({ 
        currentRace: {
          id: data[0].id,
          name: data[0].name,
          date: data[0].date,
          status: data[0].status,
          finish_line: data[0].finish_line
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
        .from('junior_races')
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
      
      finishedRunners.sort((a, b) => 
        (a.position || Infinity) - (b.position || Infinity)
      );
      
      const housePoints: Record<string, number> = {
        'Broughton': 0,
        'Abbott': 0,
        'Croft': 0,
        'Tyrell': 0,
        'Green': 0,
        'Ross': 0
      };
      
      finishedRunners.forEach((runner, index) => {
        if (index < 10 && runner.house) {
          housePoints[runner.house] += (10 - index);
        }
      });
      
      for (const [house, points] of Object.entries(housePoints)) {
        if (points > 0) {
          const { error } = await supabase
            .from('junior_house_points')
            .insert({
              house,
              points,
              race_id: currentRace.id
            });
          
          if (error) throw error;
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  }
}));