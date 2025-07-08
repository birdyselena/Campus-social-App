-- Campus Social App Database Schema
-- This file contains the SQL commands to set up the database structure in Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    university TEXT NOT NULL,
    student_id TEXT NOT NULL,
    coins_balance INTEGER DEFAULT 0,
    avatar_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat groups table
CREATE TABLE IF NOT EXISTS chat_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    university TEXT,
    created_by UUID REFERENCES users(id) NOT NULL,
    member_count INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat group members table
CREATE TABLE IF NOT EXISTS chat_group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    university TEXT,
    max_attendees INTEGER,
    coins_reward INTEGER DEFAULT 15,
    event_type TEXT DEFAULT 'general',
    image_url TEXT,
    created_by UUID REFERENCES users(id) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'attending' CHECK (status IN ('attending', 'maybe', 'not_attending')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Coins transactions table
CREATE TABLE IF NOT EXISTS coins_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('daily_checkin', 'event_attendance', 'chat_participation', 'redemption', 'bonus', 'admin_adjustment')),
    description TEXT NOT NULL,
    reference_id UUID, -- Can reference events, purchases, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner brands table
CREATE TABLE IF NOT EXISTS partner_brands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    max_discount INTEGER DEFAULT 0,
    min_coins_required INTEGER DEFAULT 0,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brand offers table
CREATE TABLE IF NOT EXISTS brand_offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    brand_id UUID REFERENCES partner_brands(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage INTEGER NOT NULL,
    coins_cost INTEGER NOT NULL,
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES brand_offers(id) ON DELETE CASCADE,
    coins_spent INTEGER NOT NULL,
    redemption_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User engagement tracking
CREATE TABLE IF NOT EXISTS user_engagement (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Chat groups policies
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public groups" ON chat_groups
    FOR SELECT USING (is_public = true OR id IN (
        SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create groups" ON chat_groups
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admins can update groups" ON chat_groups
    FOR UPDATE USING (id IN (
        SELECT group_id FROM chat_group_members 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Messages policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their groups" ON messages
    FOR SELECT USING (group_id IN (
        SELECT group_id FROM chat_group_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can send messages to their groups" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        group_id IN (SELECT group_id FROM chat_group_members WHERE user_id = auth.uid())
    );

-- Events policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events" ON events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Event creators can update their events" ON events
    FOR UPDATE USING (auth.uid() = created_by);

-- Functions and Triggers

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_groups 
        SET member_count = member_count + 1 
        WHERE id = NEW.group_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_groups 
        SET member_count = member_count - 1 
        WHERE id = OLD.group_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for group member count
CREATE TRIGGER trigger_update_group_member_count
    AFTER INSERT OR DELETE ON chat_group_members
    FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function to update user coins balance
CREATE OR REPLACE FUNCTION update_user_coins()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET coins_balance = coins_balance + NEW.amount 
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for coins transactions
CREATE TRIGGER trigger_update_user_coins
    AFTER INSERT ON coins_transactions
    FOR EACH ROW EXECUTE FUNCTION update_user_coins();

-- Function to generate redemption codes
CREATE OR REPLACE FUNCTION generate_redemption_code()
RETURNS TEXT AS $$
BEGIN
    RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_university ON events(university);
CREATE INDEX IF NOT EXISTS idx_coins_transactions_user_id ON coins_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON user_engagement(user_id);

-- Insert sample partner brands
INSERT INTO partner_brands (name, description, max_discount, min_coins_required, category, logo_url) VALUES
('Campus Cafe', 'Your favorite campus coffee shop', 20, 50, 'Food & Drink', null),
('Study Supplies Store', 'All your academic needs in one place', 15, 75, 'Academic', null),
('Fitness Center', 'Stay healthy with student discounts', 25, 100, 'Health & Fitness', null),
('Local Pizza', 'Best pizza near campus', 30, 80, 'Food & Drink', null),
('Bookstore', 'Textbooks and course materials', 10, 60, 'Academic', null);

-- Insert sample offers
INSERT INTO brand_offers (brand_id, title, description, discount_percentage, coins_cost, max_redemptions, valid_until) 
SELECT 
    b.id,
    b.name || ' Student Discount',
    'Exclusive discount for students at ' || b.name,
    b.max_discount,
    b.min_coins_required,
    100,
    NOW() + INTERVAL '30 days'
FROM partner_brands b;

-- Comments for documentation
COMMENT ON TABLE users IS 'Extended user profiles with university information';
COMMENT ON TABLE chat_groups IS 'Chat groups for student communication';
COMMENT ON TABLE messages IS 'Messages within chat groups';
COMMENT ON TABLE events IS 'Campus events that students can attend';
COMMENT ON TABLE coins_transactions IS 'Record of all coin transactions';
COMMENT ON TABLE partner_brands IS 'Brands offering student discounts';
COMMENT ON TABLE redemptions IS 'Coin redemptions for brand offers';
