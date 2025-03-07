import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PlatformStatus {
  status: 'active' | 'disabled';
  message: string;
}

export const usePlatformStatus = (platform: string) => {
  const [status, setStatus] = useState<PlatformStatus>({ status: 'active', message: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_status')
          .select('status, message')
          .eq('platform', platform)
          .single();

        if (error) throw error;

        if (data) {
          setStatus({
            status: data.status as 'active' | 'disabled',
            message: data.message
          });
        }
      } catch (err) {
        console.error('Error fetching platform status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Set up real-time subscription
    const subscription = supabase
      .channel('platform_status_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'platform_status',
        filter: `platform=eq.${platform}`
      }, (payload) => {
        setStatus({
          status: payload.new.status as 'active' | 'disabled',
          message: payload.new.message
        });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [platform]);

  return { status, loading };
};