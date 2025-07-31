-- Full Database Schema for Public Tables (with Quest Tracking, LLM Support, and Authentication)

-- Drop existing tables if they exist (in correct order to handle foreign key constraints)
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.oauth_connections CASCADE;
DROP TABLE IF EXISTS public.user_quests CASCADE;
DROP TABLE IF EXISTS public.agent_tasks CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.quests CASCADE;
DROP TABLE IF EXISTS public.daily_reports CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create Users Table (Enhanced with Authentication)
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

-- Insert a test user for development/testing (Enhanced)
INSERT INTO public.users (
    id, 
    email, 
    password_hash, 
    display_name,
    email_verified,
    last_login,
    is_active,
    preferences,
    elo, 
    level,
    experience,
    experience_to_next_level
)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'test@example.com', 
    'testpasswordhash', 
    'Test User',
    TRUE,
    NOW(),
    TRUE,
    '{"theme": "light", "notifications": true}',
    0, 
    1,
    0,
    100
);

-- Create User Sessions Table for Token Management
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

-- Create OAuth Connections Table for Third-party Logins
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

-- Create Agents Table
CREATE TABLE public.agents (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    description TEXT,
    capabilities TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    user_selectable BOOLEAN DEFAULT TRUE
);

-- Create Tasks Table
CREATE TABLE public.tasks (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (agent_id) REFERENCES public.agents(id)
);

-- Create Agent Tasks Table
CREATE TABLE public.agent_tasks (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    agent_id INTEGER,
    user_id UUID,
    input TEXT NOT NULL,
    output TEXT,
    status TEXT,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (agent_id) REFERENCES public.agents(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Create Quests Table (template for all quests, default and LLM-generated)
CREATE TABLE public.quests (
    id VARCHAR PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    elo_reward INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    created_by_llm BOOLEAN DEFAULT FALSE
);

-- Create User Quests Table (tracks which quests are assigned/accepted/completed by which user)
CREATE TABLE public.user_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    quest_id VARCHAR REFERENCES public.quests(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active, completed, abandoned, etc.
    progress DOUBLE PRECISION DEFAULT 0.0,
    date_accepted TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    date_completed TIMESTAMP WITH TIME ZONE
);
ALTER TABLE public.user_quests ADD CONSTRAINT uq_user_quest UNIQUE (user_id, quest_id);

-- Create Daily Reports Table
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    date_submitted DATE NOT NULL,
    llm_feedback TEXT,
    generated_quests JSONB
);

-- Create Files Table
CREATE TABLE public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    content TEXT,
    supabase_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create Email Verification Codes Table
CREATE TABLE public.email_verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    used BOOLEAN DEFAULT FALSE
);

-- ===== GAMIFICATION TABLES =====

-- Skills definitions
CREATE TABLE public.skills (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'business', 'technical', 'creative', 'social'
    max_level INTEGER DEFAULT 10,
    xp_per_level INTEGER DEFAULT 100,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User skills progress
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

-- Quest-skill relationships
CREATE TABLE public.quest_skill_rewards (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    quest_id VARCHAR REFERENCES public.quests(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES public.skills(id),
    xp_reward INTEGER NOT NULL,
    UNIQUE(quest_id, skill_id)
);

-- Achievement definitions
CREATE TABLE public.achievements (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(100), -- 'quests', 'skills', 'streaks', 'social', 'ai'
    trigger_type VARCHAR(50), -- 'quests_completed', 'streak_days', 'skill_level', 'ai_interactions'
    trigger_value INTEGER NOT NULL,
    reward_points INTEGER DEFAULT 0,
    reward_title VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User achievements
CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES public.achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    progress INTEGER DEFAULT 0,
    UNIQUE(user_id, achievement_id)
);

-- User activity logging
CREATE TABLE public.user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50), -- 'login', 'quest_completed', 'skill_gained', 'ai_interaction'
    activity_data JSONB, -- flexible data storage
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Daily streaks
CREATE TABLE public.user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50), -- 'login', 'quests', 'learning'
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id, streak_type)
);

-- Weekly stats (calculated/aggregated)
CREATE TABLE public.user_weekly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    week_start_date DATE,
    quests_completed INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    hours_learned DECIMAL(5,2) DEFAULT 0,
    skills_improved INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id, week_start_date)
);

-- Agent usage tracking
CREATE TABLE public.agent_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES public.agents(id),
    task_type VARCHAR(100),
    task_duration INTEGER, -- seconds
    task_status VARCHAR(50), -- 'completed', 'failed', 'in_progress'
    efficiency_score DECIMAL(3,2), -- 0.00 to 1.00
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User agent stats (aggregated)
CREATE TABLE public.user_agent_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    total_agents_used INTEGER DEFAULT 0,
    active_agents INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    total_efficiency DECIMAL(3,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id)
);

-- Story chapters
CREATE TABLE public.story_chapters (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    chapter_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT, -- LLM-generated content
    required_quests INTEGER DEFAULT 0,
    required_achievements INTEGER DEFAULT 0,
    required_skills_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- User story progress
CREATE TABLE public.user_story_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    current_chapter INTEGER DEFAULT 1,
    completed_chapters INTEGER DEFAULT 0,
    total_chapters INTEGER DEFAULT 10,
    story_points INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id)
);

-- Generated chapter cache
CREATE TABLE public.user_chapter_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    chapter_number INTEGER,
    generated_content TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    UNIQUE(user_id, chapter_number)
);

-- User quest progress tracking (enhanced)
CREATE TABLE public.user_quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    quest_id VARCHAR REFERENCES public.quests(id),
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'in_progress', 'completed', 'failed'
    progress INTEGER DEFAULT 0, -- 0-100
    started_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'UTC'),
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, quest_id)
);



-- ===== GAMIFICATION INDEXES =====

-- Skills indexes
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_skills_active ON public.skills(is_active);

-- User skills indexes
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX idx_user_skills_level ON public.user_skills(current_level);

-- Quest skill rewards indexes
CREATE INDEX idx_quest_skill_rewards_quest_id ON public.quest_skill_rewards(quest_id);
CREATE INDEX idx_quest_skill_rewards_skill_id ON public.quest_skill_rewards(skill_id);

-- Achievements indexes
CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_trigger_type ON public.achievements(trigger_type);
CREATE INDEX idx_achievements_active ON public.achievements(is_active);

-- User achievements indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at);

-- Activity log indexes
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_type ON public.user_activity_log(activity_type);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Streaks indexes
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_user_streaks_type ON public.user_streaks(streak_type);
CREATE INDEX idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);

-- Weekly stats indexes
CREATE INDEX idx_user_weekly_stats_user_id ON public.user_weekly_stats(user_id);
CREATE INDEX idx_user_weekly_stats_week_start ON public.user_weekly_stats(week_start_date);

-- Agent usage indexes
CREATE INDEX idx_agent_usage_log_user_id ON public.agent_usage_log(user_id);
CREATE INDEX idx_agent_usage_log_agent_id ON public.agent_usage_log(agent_id);
CREATE INDEX idx_agent_usage_log_status ON public.agent_usage_log(task_status);
CREATE INDEX idx_agent_usage_log_created_at ON public.agent_usage_log(created_at);

-- Agent stats indexes
CREATE INDEX idx_user_agent_stats_user_id ON public.user_agent_stats(user_id);

-- Story chapters indexes
CREATE INDEX idx_story_chapters_number ON public.story_chapters(chapter_number);
CREATE INDEX idx_story_chapters_active ON public.story_chapters(is_active);

-- User story progress indexes
CREATE INDEX idx_user_story_progress_user_id ON public.user_story_progress(user_id);
CREATE INDEX idx_user_story_progress_chapter ON public.user_story_progress(current_chapter);

-- Chapter cache indexes
CREATE INDEX idx_user_chapter_cache_user_id ON public.user_chapter_cache(user_id);
CREATE INDEX idx_user_chapter_cache_chapter ON public.user_chapter_cache(chapter_number);

-- Quest progress indexes
CREATE INDEX idx_user_quest_progress_user_id ON public.user_quest_progress(user_id);
CREATE INDEX idx_user_quest_progress_quest_id ON public.user_quest_progress(quest_id);
CREATE INDEX idx_user_quest_progress_status ON public.user_quest_progress(status);
CREATE INDEX idx_user_quest_progress_due_date ON public.user_quest_progress(due_date);

-- Row Level Security Policies (UUID user_id, so use user_id = auth.uid())

-- Users Table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own user info" ON public.users
    FOR SELECT USING (id = auth.uid());
CREATE POLICY "Authenticated users can insert their own user" ON public.users
    FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update their own info" ON public.users
    FOR UPDATE USING (id = auth.uid());

-- User Sessions Table RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
    FOR ALL USING (user_id = auth.uid());

-- OAuth Connections Table RLS
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own OAuth connections" ON public.oauth_connections
    FOR ALL USING (user_id = auth.uid());

-- Agents Table RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents are viewable by all" ON public.agents
    FOR SELECT USING (true);

-- Tasks Table RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are viewable by all" ON public.tasks
    FOR SELECT USING (true);

-- Agent Tasks Table RLS
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agent tasks" ON public.agent_tasks
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own agent tasks" ON public.agent_tasks
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own agent tasks" ON public.agent_tasks
    FOR UPDATE USING (user_id = auth.uid());

-- Quests Table RLS (template quests, viewable by all)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are viewable by all" ON public.quests
    FOR SELECT USING (true);

-- User Quests Table RLS
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own user quests" ON public.user_quests
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own user quests" ON public.user_quests
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own user quests" ON public.user_quests
    FOR UPDATE USING (user_id = auth.uid());

-- Daily Reports Table RLS
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own daily reports" ON public.daily_reports
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own daily reports" ON public.daily_reports
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own daily reports" ON public.daily_reports
    FOR UPDATE USING (user_id = auth.uid());

-- Files Table RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own files" ON public.files
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own files" ON public.files
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own files" ON public.files
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own files" ON public.files
    FOR DELETE USING (user_id = auth.uid());

-- Email Verification Codes Table RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own verification codes" ON public.email_verification_codes
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Allow creation of verification codes" ON public.email_verification_codes
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own verification codes" ON public.email_verification_codes
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own verification codes" ON public.email_verification_codes
    FOR DELETE USING (user_id = auth.uid());

-- ===== GAMIFICATION RLS POLICIES =====

-- Skills Table RLS (viewable by all)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by all" ON public.skills
    FOR SELECT USING (true);

-- User Skills Table RLS
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own skills" ON public.user_skills
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own skills" ON public.user_skills
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own skills" ON public.user_skills
    FOR UPDATE USING (user_id = auth.uid());

-- Quest Skill Rewards Table RLS (viewable by all)
ALTER TABLE public.quest_skill_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quest skill rewards are viewable by all" ON public.quest_skill_rewards
    FOR SELECT USING (true);

-- Achievements Table RLS (viewable by all)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are viewable by all" ON public.achievements
    FOR SELECT USING (true);

-- User Achievements Table RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own achievements" ON public.user_achievements
    FOR UPDATE USING (user_id = auth.uid());

-- User Activity Log Table RLS
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activity log" ON public.user_activity_log
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own activity log entries" ON public.user_activity_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- User Streaks Table RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own streaks" ON public.user_streaks
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own streaks" ON public.user_streaks
    FOR UPDATE USING (user_id = auth.uid());

-- User Weekly Stats Table RLS
ALTER TABLE public.user_weekly_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own weekly stats" ON public.user_weekly_stats
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own weekly stats" ON public.user_weekly_stats
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own weekly stats" ON public.user_weekly_stats
    FOR UPDATE USING (user_id = auth.uid());

-- Agent Usage Log Table RLS
ALTER TABLE public.agent_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agent usage" ON public.agent_usage_log
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own agent usage entries" ON public.agent_usage_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- User Agent Stats Table RLS
ALTER TABLE public.user_agent_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agent stats" ON public.user_agent_stats
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own agent stats" ON public.user_agent_stats
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own agent stats" ON public.user_agent_stats
    FOR UPDATE USING (user_id = auth.uid());

-- Story Chapters Table RLS (viewable by all)
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story chapters are viewable by all" ON public.story_chapters
    FOR SELECT USING (true);

-- User Story Progress Table RLS
ALTER TABLE public.user_story_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own story progress" ON public.user_story_progress
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own story progress" ON public.user_story_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own story progress" ON public.user_story_progress
    FOR UPDATE USING (user_id = auth.uid());

-- User Chapter Cache Table RLS
ALTER TABLE public.user_chapter_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own chapter cache" ON public.user_chapter_cache
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own chapter cache entries" ON public.user_chapter_cache
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own chapter cache" ON public.user_chapter_cache
    FOR UPDATE USING (user_id = auth.uid());

-- User Quest Progress Table RLS
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own quest progress" ON public.user_quest_progress
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own quest progress" ON public.user_quest_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own quest progress" ON public.user_quest_progress
    FOR UPDATE USING (user_id = auth.uid());

-- Indexes for Foreign Keys
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_oauth_connections_user_id ON public.oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON public.oauth_connections(provider);
CREATE INDEX idx_agent_tasks_agent_id ON public.agent_tasks(agent_id);
CREATE INDEX idx_agent_tasks_user_id ON public.agent_tasks(user_id);
CREATE INDEX idx_tasks_agent_id ON public.tasks(agent_id);
CREATE INDEX idx_user_quests_user_id ON public.user_quests(user_id);
CREATE INDEX idx_user_quests_quest_id ON public.user_quests(quest_id);
CREATE INDEX idx_daily_reports_user_id ON public.daily_reports(user_id);
CREATE INDEX idx_files_user_id ON public.files(user_id); 
CREATE INDEX idx_email_verification_codes_user_id ON public.email_verification_codes(user_id);
CREATE INDEX idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX idx_email_verification_codes_code ON public.email_verification_codes(verification_code);

-- ===== GAMIFICATION INDEXES =====

-- Skills indexes
CREATE INDEX idx_skills_category ON public.skills(category);
CREATE INDEX idx_skills_active ON public.skills(is_active);

-- User skills indexes
CREATE INDEX idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON public.user_skills(skill_id);
CREATE INDEX idx_user_skills_level ON public.user_skills(current_level);

-- Quest skill rewards indexes
CREATE INDEX idx_quest_skill_rewards_quest_id ON public.quest_skill_rewards(quest_id);
CREATE INDEX idx_quest_skill_rewards_skill_id ON public.quest_skill_rewards(skill_id);

-- Achievements indexes
CREATE INDEX idx_achievements_category ON public.achievements(category);
CREATE INDEX idx_achievements_trigger_type ON public.achievements(trigger_type);
CREATE INDEX idx_achievements_active ON public.achievements(is_active);

-- User achievements indexes
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at);

-- Activity log indexes
CREATE INDEX idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_type ON public.user_activity_log(activity_type);
CREATE INDEX idx_user_activity_log_created_at ON public.user_activity_log(created_at);

-- Streaks indexes
CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
CREATE INDEX idx_user_streaks_type ON public.user_streaks(streak_type);
CREATE INDEX idx_user_streaks_last_activity ON public.user_streaks(last_activity_date);

-- Weekly stats indexes
CREATE INDEX idx_user_weekly_stats_user_id ON public.user_weekly_stats(user_id);
CREATE INDEX idx_user_weekly_stats_week_start ON public.user_weekly_stats(week_start_date);

-- Agent usage indexes
CREATE INDEX idx_agent_usage_log_user_id ON public.agent_usage_log(user_id);
CREATE INDEX idx_agent_usage_log_agent_id ON public.agent_usage_log(agent_id);
CREATE INDEX idx_agent_usage_log_status ON public.agent_usage_log(task_status);
CREATE INDEX idx_agent_usage_log_created_at ON public.agent_usage_log(created_at);

-- Agent stats indexes
CREATE INDEX idx_user_agent_stats_user_id ON public.user_agent_stats(user_id);

-- Story chapters indexes
CREATE INDEX idx_story_chapters_number ON public.story_chapters(chapter_number);
CREATE INDEX idx_story_chapters_active ON public.story_chapters(is_active);

-- User story progress indexes
CREATE INDEX idx_user_story_progress_user_id ON public.user_story_progress(user_id);
CREATE INDEX idx_user_story_progress_chapter ON public.user_story_progress(current_chapter);

-- Chapter cache indexes
CREATE INDEX idx_user_chapter_cache_user_id ON public.user_chapter_cache(user_id);
CREATE INDEX idx_user_chapter_cache_chapter ON public.user_chapter_cache(chapter_number);

-- Quest progress indexes
CREATE INDEX idx_user_quest_progress_user_id ON public.user_quest_progress(user_id);
CREATE INDEX idx_user_quest_progress_quest_id ON public.user_quest_progress(quest_id);
CREATE INDEX idx_user_quest_progress_status ON public.user_quest_progress(status);
CREATE INDEX idx_user_quest_progress_due_date ON public.user_quest_progress(due_date);

-- Insert default quests
INSERT INTO public.quests (id, title, description, elo_reward, difficulty, created_by_llm)
VALUES
('q1', 'Complete a focused work session', 'Work on a single task for 60 minutes without distractions.', 10, 'normal', FALSE),
('q2', 'Organize your workspace', 'Clean and organize your desk or digital workspace.', 8, 'normal', FALSE),
('q3', 'Reflect and plan tomorrow', 'Write a short plan for tomorrow\'s top 3 priorities.', 12, 'normal', FALSE);

-- Insert default agents
INSERT INTO public.agents (name, description, capabilities, is_active, user_selectable)
VALUES
('Email Agent', 'Handles sending and receiving emails for users.', 'email,send,receive', TRUE, TRUE),
('Quest Agent', 'Generates and manages user quests using LLM.', 'quest,generation,management,llm', TRUE, TRUE),
('Query Agent', 'Handles user queries and knowledge base search.', 'query,search,knowledge', TRUE, TRUE);

-- ===== GAMIFICATION DATA INSERTS =====

-- Insert default skills
INSERT INTO public.skills (name, description, category, icon, max_level, xp_per_level) VALUES
('Business Strategy', 'Strategic thinking and business planning skills', 'business', '💼', 10, 100),
('Technical Skills', 'Programming and technical problem solving', 'technical', '💻', 10, 100),
('Creative Thinking', 'Innovation and creative problem solving', 'creative', '🎨', 10, 100),
('Communication', 'Effective communication and presentation skills', 'social', '💬', 10, 100),
('Leadership', 'Team leadership and management skills', 'business', '👑', 10, 100),
('Problem Solving', 'Analytical thinking and problem resolution', 'technical', '🔧', 10, 100),
('Time Management', 'Productivity and time organization skills', 'business', '⏰', 10, 100),
('Learning', 'Continuous learning and knowledge acquisition', 'creative', '📚', 10, 100);

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, trigger_type, trigger_value, reward_points) VALUES
('First Steps', 'Complete your first quest', '🎯', 'quests', 'quests_completed', 1, 50),
('Quest Master', 'Complete 10 quests', '🏆', 'quests', 'quests_completed', 10, 200),
('Skill Learner', 'Reach level 5 in any skill', '⭐', 'skills', 'skill_level', 5, 150),
('Streak Keeper', 'Maintain a 7-day login streak', '🔥', 'streaks', 'streak_days', 7, 100),
('AI Collaborator', 'Interact with AI agents 50 times', '🤖', 'ai', 'ai_interactions', 50, 300),
('Business Expert', 'Reach level 8 in Business Strategy', '💼', 'skills', 'skill_level', 8, 400),
('Technical Wizard', 'Reach level 8 in Technical Skills', '💻', 'skills', 'skill_level', 8, 400),
('Creative Genius', 'Reach level 8 in Creative Thinking', '🎨', 'skills', 'skill_level', 8, 400),
('Social Butterfly', 'Reach level 8 in Communication', '💬', 'skills', 'skill_level', 8, 400),
('Natural Leader', 'Reach level 8 in Leadership', '👑', 'skills', 'skill_level', 8, 400),
('Problem Solver', 'Reach level 8 in Problem Solving', '🔧', 'skills', 'skill_level', 8, 400),
('Time Master', 'Reach level 8 in Time Management', '⏰', 'skills', 'skill_level', 8, 400),
('Knowledge Seeker', 'Reach level 8 in Learning', '📚', 'skills', 'skill_level', 8, 400),
('Consistent Learner', 'Maintain a 30-day learning streak', '📈', 'streaks', 'streak_days', 30, 500),
('Quest Champion', 'Complete 50 quests', '🏅', 'quests', 'quests_completed', 50, 1000),
('AI Master', 'Interact with AI agents 200 times', '🤖', 'ai', 'ai_interactions', 200, 800);

-- Insert quest-skill relationships
INSERT INTO public.quest_skill_rewards (quest_id, skill_id, xp_reward) VALUES
('q1', 7, 20), -- Complete a focused work session -> Time Management
('q1', 8, 15), -- Complete a focused work session -> Learning
('q2', 7, 15), -- Organize your workspace -> Time Management
('q2', 3, 10), -- Organize your workspace -> Creative Thinking
('q3', 1, 20), -- Reflect and plan tomorrow -> Business Strategy
('q3', 7, 15); -- Reflect and plan tomorrow -> Time Management

-- Insert default story chapters
INSERT INTO public.story_chapters (chapter_number, title, description, required_quests, required_achievements, required_skills_level) VALUES
(1, 'The Beginning', 'Your journey starts here', 0, 0, 1),
(2, 'First Steps', 'Taking your first quests', 3, 1, 2),
(3, 'Building Skills', 'Developing your core abilities', 10, 3, 3),
(4, 'Strategic Thinking', 'Planning your path forward', 20, 5, 4),
(5, 'Mastery Begins', 'Reaching new heights', 35, 8, 5),
(6, 'Leadership Emerges', 'Taking charge of your development', 50, 12, 6),
(7, 'Innovation Drive', 'Breaking new ground', 70, 15, 7),
(8, 'Expert Level', 'Becoming a true expert', 100, 20, 8),
(9, 'Mentorship', 'Guiding others on their journey', 150, 25, 9),
(10, 'Legendary Status', 'Achieving legendary status', 200, 30, 10);

-- DEV ONLY: Allow all actions on agent_tasks for development
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all agent task actions for dev" ON public.agent_tasks;
CREATE POLICY "Allow all agent task actions for dev" ON public.agent_tasks FOR ALL USING (true);

-- Drop any existing views that might conflict
DROP VIEW IF EXISTS public.users_formatted CASCADE;

-- Create a function to get formatted user data by ID
CREATE OR REPLACE FUNCTION get_formatted_user(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    password_hash TEXT,
    auth_provider VARCHAR(50),
    provider_user_id VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    email_verified BOOLEAN,
    elo INTEGER,
    level TEXT,
    is_active BOOLEAN,
    preferences JSONB,
    last_login TEXT,
    created_at TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.auth_provider,
        u.provider_user_id,
        u.display_name,
        u.avatar_url,
        u.email_verified,
        u.elo,
        u.level,
        u.is_active,
        u.preferences,
        to_char(u.last_login, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_login,
        to_char(u.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
    FROM public.users u
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_formatted_user(UUID) TO authenticated;

-- Create a function to ensure all new datetime values are stored with timezone
CREATE OR REPLACE FUNCTION ensure_timestamp_with_timezone()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure created_at is always UTC if it's being set
    IF NEW.created_at IS NOT NULL AND NEW.created_at::text !~ 'UTC$' THEN
        NEW.created_at = NEW.created_at AT TIME ZONE 'UTC';
    END IF;
    
    -- Ensure last_login is always UTC if it's being set
    IF NEW.last_login IS NOT NULL AND NEW.last_login::text !~ 'UTC$' THEN
        NEW.last_login = NEW.last_login AT TIME ZONE 'UTC';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== LEVELING SYSTEM FUNCTIONS =====

-- Function to calculate level based on ELO
CREATE OR REPLACE FUNCTION calculate_level_from_elo(elo_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Level calculation: every 100 ELO = 1 level, starting from level 1
    RETURN GREATEST(1, (elo_points / 100) + 1);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate experience and experience to next level
CREATE OR REPLACE FUNCTION calculate_experience_from_elo(elo_points INTEGER)
RETURNS TABLE(experience INTEGER, experience_to_next_level INTEGER) AS $$
DECLARE
    current_level INTEGER;
    experience_in_current_level INTEGER;
    total_experience_for_level INTEGER;
BEGIN
    current_level := calculate_level_from_elo(elo_points);
    
    -- Calculate experience within current level (0-99 for level 1, 100-199 for level 2, etc.)
    experience_in_current_level := elo_points % 100;
    
    -- Calculate total experience needed for current level
    total_experience_for_level := (current_level - 1) * 100;
    
    -- Experience to next level is always 100 (since each level requires 100 ELO)
    RETURN QUERY SELECT 
        experience_in_current_level,
        100;
END;
$$ LANGUAGE plpgsql;

-- Function to update user level and experience when ELO changes
CREATE OR REPLACE FUNCTION update_user_level_and_experience()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
    exp_data RECORD;
BEGIN
    -- Calculate new level based on ELO
    new_level := calculate_level_from_elo(NEW.elo);
    
    -- Get experience data
    SELECT * INTO exp_data FROM calculate_experience_from_elo(NEW.elo);
    
    -- Update level and experience
    NEW.level := new_level;
    NEW.experience := exp_data.experience;
    NEW.experience_to_next_level := exp_data.experience_to_next_level;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily streak when quest is completed
CREATE OR REPLACE FUNCTION update_daily_streak_on_quest_completion()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    today_date DATE;
    yesterday_date DATE;
BEGIN
    -- Only process when quest status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        today_date := CURRENT_DATE;
        yesterday_date := today_date - INTERVAL '1 day';
        
        -- Get current user data
        SELECT * INTO user_record FROM public.users WHERE id = NEW.user_id;
        
        -- Update user's streak and activity
        IF user_record.last_active_date IS NULL OR user_record.last_active_date < today_date THEN
            -- Check if this is a consecutive day
            IF user_record.last_active_date = yesterday_date THEN
                -- Consecutive day - increment streak
                UPDATE public.users 
                SET current_streak = user_record.current_streak + 1,
                    longest_streak = GREATEST(user_record.longest_streak, user_record.current_streak + 1),
                    total_days_active = user_record.total_days_active + 1,
                    last_active_date = today_date
                WHERE id = NEW.user_id;
            ELSE
                -- Not consecutive - reset streak to 1
                UPDATE public.users 
                SET current_streak = 1,
                    longest_streak = GREATEST(user_record.longest_streak, 1),
                    total_days_active = user_record.total_days_active + 1,
                    last_active_date = today_date
                WHERE id = NEW.user_id;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically ensure timezone consistency
DROP TRIGGER IF EXISTS ensure_users_timestamp_tz ON public.users;
CREATE TRIGGER ensure_users_timestamp_tz
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_timestamp_with_timezone();

-- Create trigger to update level and experience when ELO changes
DROP TRIGGER IF EXISTS update_user_level_trigger ON public.users;
CREATE TRIGGER update_user_level_trigger
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.elo IS DISTINCT FROM NEW.elo)
    EXECUTE FUNCTION update_user_level_and_experience();

-- Create trigger to update daily streak when quest is completed
DROP TRIGGER IF EXISTS update_streak_on_quest_completion ON public.user_quests;
CREATE TRIGGER update_streak_on_quest_completion
    AFTER UPDATE ON public.user_quests
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_streak_on_quest_completion();