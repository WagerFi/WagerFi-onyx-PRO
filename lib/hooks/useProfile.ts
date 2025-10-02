'use client';

import { useEffect, useState } from 'react';
import { useWallet } from './useWallet';
import { supabase } from '../supabase/client';
import type { User, Database } from '../supabase/types';

export function useProfile() {
    const { walletAddress, connected } = useWallet();
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!connected || !walletAddress) {
            setProfile(null);
            setLoading(false);
            return;
        }

        fetchProfile();
    }, [walletAddress, connected]);

    async function fetchProfile() {
        if (!walletAddress) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('wallet_address', walletAddress)
                .single();

            if (fetchError) {
                if (fetchError.code === 'PGRST116') {
                    // User not found - this is expected for new users
                    setProfile(null);
                } else {
                    throw fetchError;
                }
            } else {
                setProfile(data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    }

    async function createProfile(username: string, email: string) {
        if (!walletAddress) {
            throw new Error('Wallet not connected');
        }

        setLoading(true);
        setError(null);

        try {
            const userInsert = {
                username,
                email,
                wallet_address: walletAddress,
                total_wagered: 0,
                total_won: 0,
                total_lost: 0,
                win_rate: 0,
                streak_count: 0,
            };

            const { data, error: createError } = await supabase
                .from('users')
                .insert(userInsert)
                .select()
                .single();

            if (createError) throw createError;

            setProfile(data);
            return data;
        } catch (err) {
            console.error('Error creating profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to create profile');
            throw err;
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile(updates: Partial<User>) {
        if (!profile) {
            throw new Error('No profile to update');
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: updateError } = await supabase
                .from('users')
                .update(updates)
                .eq('id', profile.id)
                .select()
                .single();

            if (updateError) throw updateError;

            setProfile(data);
            return data;
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return {
        profile,
        loading,
        error,
        createProfile,
        updateProfile,
        refetch: fetchProfile,
    };
}

