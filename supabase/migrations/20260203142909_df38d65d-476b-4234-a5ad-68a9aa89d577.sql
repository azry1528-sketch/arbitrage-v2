-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for transaction status
CREATE TYPE public.transaction_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    referral_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
    referred_by UUID REFERENCES public.profiles(id),
    balance DECIMAL(20, 8) DEFAULT 0,
    total_earnings DECIMAL(20, 8) DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    withdrawals_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Create investment_plans table
CREATE TABLE public.investment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_amount DECIMAL(20, 8) NOT NULL,
    max_amount DECIMAL(20, 8) NOT NULL,
    daily_return_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    duration_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create investments table
CREATE TABLE public.investments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.investment_plans(id) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    daily_return DECIMAL(20, 8) NOT NULL,
    total_earned DECIMAL(20, 8) DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create deposits table
CREATE TABLE public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    crypto_type TEXT DEFAULT 'USDT',
    wallet_address TEXT,
    transaction_hash TEXT,
    status transaction_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    crypto_type TEXT DEFAULT 'USDT',
    wallet_address TEXT NOT NULL,
    status transaction_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create arbitrage_sessions table
CREATE TABLE public.arbitrage_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    investment_id UUID REFERENCES public.investments(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_trades INTEGER DEFAULT 0,
    total_profit DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create arbitrage_trades table for real-time visualization
CREATE TABLE public.arbitrage_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.arbitrage_sessions(id) ON DELETE CASCADE NOT NULL,
    buy_exchange TEXT NOT NULL,
    sell_exchange TEXT NOT NULL,
    crypto_pair TEXT NOT NULL,
    buy_price DECIMAL(20, 8) NOT NULL,
    sell_price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    profit DECIMAL(20, 8) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user profile id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON public.profiles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investment_plans (public read)
CREATE POLICY "Anyone can view active plans" ON public.investment_plans
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage plans" ON public.investment_plans
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investments
CREATE POLICY "Users can view own investments" ON public.investments
    FOR SELECT USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create investments" ON public.investments
    FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage investments" ON public.investments
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits" ON public.deposits
    FOR SELECT USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create deposits" ON public.deposits
    FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage deposits" ON public.deposits
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
    FOR SELECT USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
    FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage withdrawals" ON public.withdrawals
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for arbitrage_sessions
CREATE POLICY "Users can view own sessions" ON public.arbitrage_sessions
    FOR SELECT USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage own sessions" ON public.arbitrage_sessions
    FOR ALL USING (user_id = public.get_profile_id(auth.uid()));

-- RLS Policies for arbitrage_trades
CREATE POLICY "Users can view trades from own sessions" ON public.arbitrage_trades
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.arbitrage_sessions 
            WHERE id = arbitrage_trades.session_id 
            AND (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'))
        )
    );

CREATE POLICY "System can insert trades" ON public.arbitrage_trades
    FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage notifications" ON public.notifications
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (user_id = public.get_profile_id(auth.uid()) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Users can update own tickets" ON public.support_tickets
    FOR UPDATE USING (user_id = public.get_profile_id(auth.uid()));

CREATE POLICY "Admins can manage tickets" ON public.support_tickets
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at
    BEFORE UPDATE ON public.deposits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON public.withdrawals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default investment plans
INSERT INTO public.investment_plans (name, min_amount, max_amount, daily_return_rate, duration_days) VALUES
    ('Starter', 50, 999, 5.00, 30),
    ('Silver', 1000, 4999, 5.50, 30),
    ('Gold', 5000, 19999, 6.00, 30),
    ('Platinum', 20000, 99999, 6.50, 30),
    ('Diamond', 100000, 1000000, 7.00, 30);

-- Enable realtime for arbitrage trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.arbitrage_trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arbitrage_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;