-- Fix the overly permissive RLS policy for arbitrage_trades
DROP POLICY IF EXISTS "System can insert trades" ON public.arbitrage_trades;

-- Create a proper policy for inserting trades (only from active sessions owned by the user)
CREATE POLICY "Users can insert trades for own sessions" ON public.arbitrage_trades
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.arbitrage_sessions 
            WHERE id = arbitrage_trades.session_id 
            AND user_id = public.get_profile_id(auth.uid())
            AND is_active = true
        )
    );