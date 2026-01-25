-- Drop existing tables in proper dependency order
DROP TABLE IF EXISTS public.user_quest_progress CASCADE;
DROP TABLE IF EXISTS public.user_chapter_cache CASCADE;
DROP TABLE IF EXISTS public.user_story_progress CASCADE;
DROP TABLE IF EXISTS public.story_chapters CASCADE;
DROP TABLE IF EXISTS public.user_agent_stats CASCADE;
DROP TABLE IF EXISTS public.agent_usage_log CASCADE;
DROP TABLE IF EXISTS public.user_weekly_stats CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.user_activity_log CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.quest_skill_rewards CASCADE;
DROP TABLE IF EXISTS public.user_skills CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.email_verification_codes CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.daily_reports CASCADE;
DROP TABLE IF EXISTS public.user_quests CASCADE;
DROP TABLE IF EXISTS public.agent_tasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.quests CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.oauth_connections CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    password_hash TEXT,
    auth_provider VARCHAR(50) DEFAULT 'email',
    provider_user_id VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    elo INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    experience_to_next_level INTEGER DEFAULT 100,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_days_active INTEGER DEFAULT 0,
    last_active_date DATE,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User Sessions table
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    user_agent TEXT,
    ip_address INET
);

-- OAuth Connections table
CREATE TABLE public.oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id, provider)
);

-- Agents
CREATE TABLE public.agents (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    description TEXT,
    capabilities TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    user_selectable BOOLEAN DEFAULT TRUE
);

-- Tasks
CREATE TABLE public.tasks (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_id INTEGER REFERENCES public.agents(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending'
);

-- Agent Tasks
CREATE TABLE public.agent_tasks (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_id INTEGER REFERENCES public.agents(id),
    user_id UUID REFERENCES public.users(id),
    input TEXT NOT NULL,
    output TEXT,
    status TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Quests
CREATE TABLE public.quests (
    id VARCHAR PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    elo_reward INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_by_llm BOOLEAN DEFAULT FALSE
);

-- User Quests
CREATE TABLE public.user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    quest_id VARCHAR REFERENCES public.quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    progress DOUBLE PRECISION DEFAULT 0.0,
    date_accepted TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    date_completed TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, quest_id)
);

-- Daily Reports
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date_submitted DATE NOT NULL,
    llm_feedback TEXT,
    generated_quests JSONB
);

-- Files
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT,
    supabase_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);

-- Email Verification Codes
CREATE TABLE public.email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    used BOOLEAN DEFAULT FALSE
);

-- Skills
CREATE TABLE public.skills (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    max_level INTEGER DEFAULT 10,
    xp_per_level INTEGER DEFAULT 100,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User Skills
CREATE TABLE public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES public.skills(id),
    current_level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id, skill_id)
);

-- Quest Skill Rewards
CREATE TABLE public.quest_skill_rewards (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    quest_id VARCHAR REFERENCES public.quests(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES public.skills(id),
    xp_reward INTEGER NOT NULL,
    UNIQUE(quest_id, skill_id)
);

-- Achievements
CREATE TABLE public.achievements (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(100),
    trigger_type VARCHAR(50),
    trigger_value INTEGER NOT NULL,
    reward_points INTEGER DEFAULT 0,
    reward_title VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User Achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES public.achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- (Rest of your functions, triggers, RLS policies, and inserts can follow exactly as-is)
