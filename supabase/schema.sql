-- ============================================================================
-- AWARDX SUPABASE DATABASE SCHEMA
-- Complete SQL schema for converting static data to dynamic Supabase backend
-- Generated: December 2025
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- SECTION 1: CORE MULTI-TENANT INFRASTRUCTURE
-- ============================================================================

-- Organizations (Multi-tenant container)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    industry VARCHAR(100),
    plan VARCHAR(50) DEFAULT 'starter', -- starter, growth, enterprise
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: ROLES & PERMISSIONS (RBAC)
-- ============================================================================

-- Permission Definitions (Global lookup table)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) -- For grouping in UI
);

-- Seed default permissions
INSERT INTO permissions (key, name, description, category) VALUES
    ('view_overview', 'View Overview', 'View dashboard statistics and overview', 'Dashboard'),
    ('manage_programs', 'Manage Programs', 'Create, edit, delete programs and schedules', 'Programs'),
    ('view_submissions', 'View Submissions', 'View all submissions', 'Submissions'),
    ('manage_submissions', 'Manage Submissions', 'Accept, reject, delete submissions', 'Submissions'),
    ('view_judging', 'View Judging', 'View judging panels and scores', 'Judging'),
    ('manage_judging', 'Manage Judging', 'Assign judges, configure judging criteria', 'Judging'),
    ('manage_forms', 'Manage Forms', 'Edit submission and registration forms', 'Forms'),
    ('view_messages', 'View Messages', 'View inbox and message threads', 'Communication'),
    ('manage_reach', 'Manage Reach', 'Manage social accounts and campaigns', 'Marketing'),
    ('view_analytics', 'View Analytics', 'Access analytics and reports', 'Analytics'),
    ('manage_crm', 'Manage CRM', 'Manage contacts and segments', 'CRM'),
    ('manage_teams', 'Manage Teams', 'Manage team members, roles, and invites', 'Administration'),
    ('view_logs', 'View Logs', 'View audit logs and activity history', 'Administration'),
    ('manage_settings', 'Manage Settings', 'Access organization settings', 'Administration');

-- Roles (per organization)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(100) DEFAULT 'bg-slate-100 text-slate-700', -- Tailwind classes
    is_system BOOLEAN DEFAULT FALSE, -- Prevent deletion of system roles
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Role-Permission Junction Table
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Organization Members (User-Org-Role relationship)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, invited, inactive
    invited_by UUID REFERENCES profiles(id),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- SECTION 3: PROGRAMS / EVENTS
-- ============================================================================

-- Event Types Taxonomy (Global lookup)
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50), -- Lucide icon name
    description TEXT,
    category VARCHAR(100) -- Recognition, Funding, Showcase, Custom
);

-- Seed event types
INSERT INTO event_types (name, icon, description, category) VALUES
    ('Award', 'Trophy', 'Recognize excellence with prestigious awards', 'Recognition & Excellence'),
    ('Competition', 'Target', 'Challenge participants to compete for prizes', 'Recognition & Excellence'),
    ('Grant', 'Landmark', 'Fund projects and initiatives through grants', 'Funding & Opportunities'),
    ('Residency', 'Building', 'Offer residency programs for creators', 'Funding & Opportunities'),
    ('Commission', 'Briefcase', 'Commission work from selected applicants', 'Funding & Opportunities'),
    ('Exhibition', 'Frame', 'Curate and showcase selected works', 'Showcase & Events'),
    ('Fair', 'Store', 'Organize fairs and marketplaces', 'Showcase & Events'),
    ('Internal Event', 'Users', 'Run internal recognition programs', 'Showcase & Events'),
    ('Other', 'Sparkles', 'Custom event type', 'Custom');

-- Programs (Main events/competitions)
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    cover_image_url TEXT,
    industry_category VARCHAR(100), -- Design, Tech, Film, Music, etc.
    event_type_id UUID REFERENCES event_types(id),
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, completed, archived
    visibility VARCHAR(50) DEFAULT 'public', -- public, private, unlisted
    deadline TIMESTAMPTZ,
    timezone VARCHAR(100) DEFAULT 'UTC',
    entries_count INTEGER DEFAULT 0, -- Denormalized for performance
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    UNIQUE(organization_id, slug)
);

-- Program Payment Configuration
CREATE TABLE program_payment_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE UNIQUE,
    enabled BOOLEAN DEFAULT FALSE,
    provider VARCHAR(50) DEFAULT 'stripe', -- stripe, paypal, razorpay
    currency VARCHAR(10) DEFAULT 'USD',
    fee_amount DECIMAL(10, 2) DEFAULT 0,
    fee_type VARCHAR(20) DEFAULT 'fixed', -- fixed, percentage
    public_key TEXT, -- Provider public key
    secret_key_encrypted TEXT, -- Encrypted secret key
    webhook_secret_encrypted TEXT,
    connected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Categories (Award categories, hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL, -- For hierarchy
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    entries_count INTEGER DEFAULT 0, -- Denormalized
    max_entries INTEGER, -- Optional limit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Rounds (Schedule/Timeline)
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- submission, judging, voting, announcement
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, active, completed
    sort_order INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}', -- Round-specific settings
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: SUBMISSIONS & ENTRIES
-- ============================================================================

-- Submissions
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    applicant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Submission details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, shortlisted, accepted, rejected, withdrawn
    
    -- Scoring
    average_score DECIMAL(5, 2),
    total_scores INTEGER DEFAULT 0,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded, waived
    payment_amount DECIMAL(10, 2),
    payment_id VARCHAR(255), -- External payment provider ID
    
    -- Metadata
    submission_data JSONB DEFAULT '{}', -- Custom form fields
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Denormalized for display
    applicant_name VARCHAR(255),
    applicant_email VARCHAR(255)
);

-- Submission Files/Attachments
CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    sort_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: JUDGING SYSTEM
-- ============================================================================

-- Judges (can be organization members or external)
CREATE TABLE judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Linked if registered user
    
    -- Judge info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'invited', -- invited, active, completed, declined
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    -- Stats (denormalized)
    assigned_count INTEGER DEFAULT 0,
    completed_count INTEGER DEFAULT 0,
    
    UNIQUE(organization_id, email)
);

-- Judging Criteria (per program)
CREATE TABLE judging_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight INTEGER DEFAULT 100, -- Percentage weight (all should sum to 100)
    min_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission-Judge Assignments (Junction table)
CREATE TABLE submission_judges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    judge_id UUID REFERENCES judges(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    completed_at TIMESTAMPTZ,
    UNIQUE(submission_id, judge_id)
);

-- Judge Scores (Individual criterion scores)
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_judge_id UUID REFERENCES submission_judges(id) ON DELETE CASCADE,
    criterion_id UUID REFERENCES judging_criteria(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    comment TEXT,
    scored_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_judge_id, criterion_id)
);

-- Judge Comments (Overall feedback)
CREATE TABLE judge_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_judge_id UUID REFERENCES submission_judges(id) ON DELETE CASCADE UNIQUE,
    overall_comment TEXT,
    private_notes TEXT, -- Notes visible only to admins
    recommendation VARCHAR(50), -- strongly_recommend, recommend, neutral, not_recommend
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 6: CRM & CONTACTS
-- ============================================================================

-- Contacts (CRM)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Linked if registered
    
    -- Contact info
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    
    -- Metadata
    source VARCHAR(100), -- website, import, manual, social, referral
    survey_answer TEXT, -- How did you hear about us
    tags TEXT[], -- Array of tags
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, unsubscribed
    
    -- Timestamps
    last_active_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, email)
);

-- Contact Custom Fields
CREATE TABLE contact_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    UNIQUE(contact_id, field_name)
);

-- ============================================================================
-- SECTION 7: MESSAGING SYSTEM
-- ============================================================================

-- Message Threads
CREATE TABLE message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    thread_type VARCHAR(50) DEFAULT 'direct', -- direct, submission, announcement
    related_submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread Participants
CREATE TABLE thread_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ,
    is_archived BOOLEAN DEFAULT FALSE,
    UNIQUE(thread_id, user_id)
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Denormalized for quick display
    sender_name VARCHAR(255),
    sender_avatar TEXT
);

-- ============================================================================
-- SECTION 8: SOCIAL & MARKETING
-- ============================================================================

-- Connected Social Accounts
CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- twitter, linkedin, instagram, facebook
    platform_user_id VARCHAR(255),
    handle VARCHAR(255),
    avatar_url TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'connected', -- connected, disconnected, expired
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, platform, handle)
);

-- Scheduled Posts
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    
    -- Content
    content TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    
    -- Scheduling
    platforms TEXT[] NOT NULL, -- Array of platform names
    scheduled_for TIMESTAMPTZ NOT NULL,
    trigger_type VARCHAR(50) DEFAULT 'manual', -- manual, voting_open, half_time, winners, deadline
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled', -- draft, scheduled, posted, failed
    posted_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Templates
CREATE TABLE campaign_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(100),
    is_system BOOLEAN DEFAULT FALSE, -- System templates can't be deleted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default campaign templates (global)
INSERT INTO campaign_templates (organization_id, title, description, content, icon, color, is_system) VALUES
    (NULL, 'Winner Announcement', 'Celebrate and share your winners', 'We''re thrilled to announce the winners of {{program_name}}! Congratulations to all our talented participants. 🏆 #Awards #Winners', 'Trophy', 'bg-amber-100 text-amber-700', TRUE),
    (NULL, 'Early Bird Reminder', 'Remind about upcoming deadlines', 'Don''t miss out! Early bird submissions for {{program_name}} close in {{days_remaining}} days. Submit your entry now! ⏰ #CallForEntries', 'Clock', 'bg-blue-100 text-blue-700', TRUE),
    (NULL, 'Call for Entries', 'Announce your program launch', 'Exciting news! {{program_name}} is now accepting submissions. Show us your best work and compete for amazing prizes! 🚀 #OpenCall #Submit', 'Megaphone', 'bg-purple-100 text-purple-700', TRUE);

-- ============================================================================
-- SECTION 9: AUDIT LOGS
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- create, update, delete, warning, login, export
    resource_type VARCHAR(100), -- program, submission, judge, etc.
    resource_id UUID,
    
    -- Context
    details TEXT,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    
    -- Denormalized
    user_name VARCHAR(255),
    user_avatar TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 10: CMS / MARKETING CONTENT (Global tables for landing pages)
-- ============================================================================

-- Testimonials
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    company VARCHAR(255),
    content TEXT NOT NULL,
    avatar_url TEXT,
    rating INTEGER DEFAULT 5,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed testimonials
INSERT INTO testimonials (name, role, company, content, avatar_url, is_featured, sort_order) VALUES
    ('Sarah Jenkins', 'Awards Director', 'Design Institute of America', 'AwardX transformed how we run our annual design competition. The multi-round judging and automated communications saved us countless hours.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', TRUE, 1),
    ('David Chen', 'Program Manager', 'TechGlobal Summit', 'We switched from spreadsheets to AwardX and never looked back. Managing 500+ submissions across 12 categories is now a breeze.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', TRUE, 2),
    ('Elena Rodriguez', 'Executive Director', 'Creative Arts Council', 'The analytics dashboard gives us insights we never had before. We can now make data-driven decisions about our grant programs.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80', TRUE, 3);

-- Pricing Tiers
CREATE TABLE pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    price_display VARCHAR(50), -- "99", "299", "Custom"
    description TEXT,
    features JSONB DEFAULT '[]', -- Array of feature strings
    limits JSONB DEFAULT '{}', -- { entries: 250, judges: 5, programs: 3 }
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed pricing tiers
INSERT INTO pricing_tiers (name, slug, price_monthly, price_yearly, price_display, description, features, limits, is_recommended, sort_order) VALUES
    ('Starter', 'starter', 99, 990, '$99', 'Perfect for small competitions and first-time organizers.',
     '["Up to 250 submissions", "5 judges per program", "Basic analytics", "Email support", "Custom branding", "Single program"]'::jsonb,
     '{"entries": 250, "judges": 5, "programs": 1}'::jsonb, FALSE, 1),
    ('Growth', 'growth', 299, 2990, '$299', 'For growing organizations running multiple programs.',
     '["Unlimited submissions", "Unlimited judges", "Advanced analytics", "Priority support", "Custom domain", "Multi-round judging", "API access", "Up to 10 programs"]'::jsonb,
     '{"entries": -1, "judges": -1, "programs": 10}'::jsonb, TRUE, 2),
    ('Enterprise', 'enterprise', NULL, NULL, 'Custom', 'For large organizations with complex needs.',
     '["Everything in Growth", "Dedicated account manager", "Custom integrations", "SLA guarantee", "SSO/SAML", "Unlimited programs", "White-label solution", "On-premise option"]'::jsonb,
     '{"entries": -1, "judges": -1, "programs": -1}'::jsonb, FALSE, 3);

-- Features (for marketing pages)
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(100),
    items JSONB DEFAULT '[]', -- Bullet points
    category VARCHAR(100), -- For grouping
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed features
INSERT INTO features (title, description, icon, color, items, category, sort_order) VALUES
    ('Multi-Round Judging', 'Configure complex judging workflows with weighted criteria, blind reviews, and automatic score aggregation.', 'Scale', 'from-violet-500 to-purple-600', '["Weighted scoring criteria", "Blind & open review modes", "Judge assignment automation", "Score normalization", "Conflict of interest flags"]'::jsonb, 'Judging', 1),
    ('Smart CRM', 'Track every interaction with applicants, judges, and sponsors in one unified database.', 'Users', 'from-blue-500 to-cyan-500', '["Contact management", "Interaction history", "Custom fields & tags", "Segmentation & filters", "Bulk communications"]'::jsonb, 'CRM', 2),
    ('Deep Analytics', 'Make data-driven decisions with real-time insights into submissions, demographics, and trends.', 'BarChart3', 'from-emerald-500 to-teal-500', '["Real-time dashboards", "Submission trends", "Geographic insights", "Conversion funnels", "Custom reports"]'::jsonb, 'Analytics', 3),
    ('Form Builder', 'Create custom application forms with conditional logic, file uploads, and validation rules.', 'FileEdit', 'from-orange-500 to-red-500', '["Drag-and-drop builder", "Conditional fields", "File uploads", "Multi-page forms", "Save & resume"]'::jsonb, 'Forms', 4),
    ('Automation', 'Set up triggers and workflows to automate repetitive tasks and communications.', 'Zap', 'from-pink-500 to-rose-500', '["Email sequences", "Status change triggers", "Deadline reminders", "Judge notifications", "Webhook integrations"]'::jsonb, 'Automation', 5),
    ('Social Integration', 'Connect your social accounts and schedule promotional posts automatically.', 'Share2', 'from-indigo-500 to-blue-500', '["Multi-platform posting", "Scheduled campaigns", "Winner announcements", "Hashtag tracking", "Engagement analytics"]'::jsonb, 'Marketing', 6);

-- Use Cases / Industries
CREATE TABLE use_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- Industry vertical
    description TEXT,
    icon VARCHAR(50),
    gradient VARCHAR(255), -- CSS gradient classes
    image_url TEXT,
    stats JSONB DEFAULT '[]', -- [{value: "50+", label: "Annual Awards"}]
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed use cases
INSERT INTO use_cases (title, category, description, icon, gradient, sort_order) VALUES
    ('Design Awards', 'Design', 'Run prestigious design competitions with portfolio submissions and expert jury panels.', 'Palette', 'from-pink-500 to-rose-500', 1),
    ('Startup Pitch Competitions', 'Business', 'Manage pitch competitions with video submissions, investor judging, and prize distribution.', 'Rocket', 'from-violet-500 to-purple-500', 2),
    ('Film Festivals', 'Entertainment', 'Accept film submissions, coordinate screening schedules, and announce winners.', 'Film', 'from-amber-500 to-orange-500', 3),
    ('Hackathons', 'Technology', 'Organize coding competitions with team registration, project submissions, and live judging.', 'Code', 'from-cyan-500 to-blue-500', 4),
    ('Music Contests', 'Music', 'Run music competitions with audio/video submissions and fan voting integration.', 'Music', 'from-emerald-500 to-teal-500', 5),
    ('Academic Grants', 'Education', 'Manage grant applications with research proposals, peer review, and funding allocation.', 'GraduationCap', 'from-indigo-500 to-violet-500', 6);

-- How It Works Steps
CREATE TABLE how_it_works_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    items JSONB DEFAULT '[]', -- Checklist items
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed steps
INSERT INTO how_it_works_steps (step_number, title, description, icon, items, sort_order) VALUES
    (1, 'Create Your Program', 'Set up your competition in minutes with our intuitive program builder.', 'Rocket', '["Choose your event type", "Configure categories", "Set deadlines and rounds", "Customize branding"]'::jsonb, 1),
    (2, 'Build Your Form', 'Create custom submission forms with our drag-and-drop builder.', 'FileEdit', '["Add custom fields", "Set up file uploads", "Configure validation", "Preview and test"]'::jsonb, 2),
    (3, 'Accept Submissions', 'Launch your program and start collecting entries from around the world.', 'Inbox', '["Share your entry page", "Collect payments", "Track submissions", "Communicate with applicants"]'::jsonb, 3),
    (4, 'Organize & Judge', 'Assign judges, configure scoring criteria, and manage the review process.', 'Scale', '["Invite your jury", "Assign submissions", "Track progress", "Aggregate scores"]'::jsonb, 4),
    (5, 'Announce Winners', 'Celebrate your winners and share results with the world.', 'Trophy', '["Finalize results", "Generate certificates", "Send announcements", "Share on social media"]'::jsonb, 5);

-- Case Studies / Customer Stories
CREATE TABLE case_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(100),
    company_name VARCHAR(255),
    company_logo_url TEXT,
    cover_image_url TEXT,
    color VARCHAR(255), -- CSS gradient
    challenge TEXT,
    solution TEXT,
    results TEXT,
    quote TEXT,
    quote_author VARCHAR(255),
    quote_author_role VARCHAR(255),
    stats JSONB DEFAULT '[]', -- [{value: "300%", label: "Increase in entries"}]
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed case studies
INSERT INTO case_studies (title, slug, industry, color, challenge, quote, quote_author, stats, is_featured) VALUES
    ('How Indie Film Awards Scaled to 5,000 Submissions', 'indie-film-awards', 'Film & Entertainment', 'from-amber-500 to-orange-500',
     'Managing a rapidly growing film festival with limited staff and outdated tools.',
     'AwardX helped us scale from 500 to 5,000 submissions without adding headcount. The automation features alone saved us 200+ hours.',
     'Maria Santos, Festival Director',
     '[{"value": "10x", "label": "Submission Growth"}, {"value": "200+", "label": "Hours Saved"}, {"value": "98%", "label": "Judge Satisfaction"}]'::jsonb,
     TRUE),
    ('TechCrunch Disrupt: Managing a Global Pitch Competition', 'techcrunch-disrupt', 'Technology', 'from-cyan-500 to-blue-500',
     'Coordinating judges across time zones and managing video pitch submissions at scale.',
     'The multi-round judging feature let us run preliminary, semifinal, and final rounds seamlessly. Our judges loved the intuitive interface.',
     'Alex Kim, Program Manager',
     '[{"value": "2,500+", "label": "Startups Applied"}, {"value": "150+", "label": "Global Judges"}, {"value": "$1M", "label": "Prizes Awarded"}]'::jsonb,
     TRUE),
    ('NextGen Art Scholarship: Democratizing Arts Funding', 'nextgen-art-scholarship', 'Arts & Education', 'from-violet-500 to-purple-500',
     'Creating an equitable grant application process with diverse review panels.',
     'The blind review feature ensures every application is evaluated on merit alone. We''ve seen a 40% increase in applications from underrepresented communities.',
     'Dr. James Wright, Foundation Chair',
     '[{"value": "40%", "label": "More Diverse Applicants"}, {"value": "$500K", "label": "Grants Distributed"}, {"value": "50+", "label": "Scholarships Awarded"}]'::jsonb,
     TRUE);

-- FAQs
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100), -- pricing, general, features, etc.
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed FAQs
INSERT INTO faqs (question, answer, category, sort_order) VALUES
    ('What counts as a submission?', 'A submission is counted each time an applicant completes and submits an entry form. Draft submissions that are not completed do not count towards your limit.', 'pricing', 1),
    ('Do you take a percentage of transaction fees?', 'No, we don''t take any percentage of your entry fees. You only pay the flat monthly subscription. Payment processing fees from Stripe/PayPal apply separately.', 'pricing', 2),
    ('Can I upgrade or downgrade my plan?', 'Yes, you can change your plan at any time. When upgrading, you''ll be prorated for the remainder of your billing cycle. When downgrading, changes take effect at the next billing date.', 'pricing', 3),
    ('Do judges need to create accounts?', 'Judges receive a magic link via email that gives them secure access to their assigned submissions. They don''t need to remember passwords or go through a complex signup process.', 'features', 4),
    ('Can I white-label the platform?', 'Enterprise customers can fully white-label the platform with their own domain, logo, and color scheme. Contact our sales team for details.', 'features', 5),
    ('Is my data secure?', 'Yes, we use industry-standard encryption for all data at rest and in transit. We''re SOC 2 Type II certified and GDPR compliant.', 'security', 6),
    ('Can I export my data?', 'Yes, you can export all your data including submissions, scores, and contact information in CSV or JSON format at any time.', 'features', 7),
    ('Do you offer refunds?', 'We offer a 14-day money-back guarantee for new customers. If you''re not satisfied, contact support for a full refund.', 'pricing', 8);

-- Program Templates (Pre-built configurations)
CREATE TABLE program_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    cover_image_url TEXT,
    industry_category VARCHAR(100),
    event_type_id UUID REFERENCES event_types(id),
    default_categories JSONB DEFAULT '[]',
    default_rounds JSONB DEFAULT '[]',
    default_criteria JSONB DEFAULT '[]',
    default_form_fields JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed program templates
INSERT INTO program_templates (title, description, icon, cover_image_url, industry_category, default_categories, default_rounds, sort_order) VALUES
    ('Photography Awards', 'Professional photography competition template with standard categories.', 'Camera', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400', 'Photography',
     '["Landscape", "Portrait", "Street Photography", "Wildlife", "Documentary"]'::jsonb,
     '[{"title": "Submissions Open", "type": "submission"}, {"title": "Judging Round", "type": "judging"}, {"title": "Winners Announced", "type": "announcement"}]'::jsonb, 1),
    ('Startup Pitch Competition', 'Run a pitch competition with video submissions and investor judges.', 'Rocket', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400', 'Business',
     '["Pre-Seed", "Seed Stage", "Series A", "Social Impact", "Student Founders"]'::jsonb,
     '[{"title": "Applications Open", "type": "submission"}, {"title": "Preliminary Review", "type": "judging"}, {"title": "Finals", "type": "judging"}, {"title": "Demo Day", "type": "announcement"}]'::jsonb, 2),
    ('Hackathon', 'Coding competition with team registration and project submissions.', 'Code', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400', 'Technology',
     '["AI/ML", "Web3", "Healthcare", "Sustainability", "Open Innovation"]'::jsonb,
     '[{"title": "Registration", "type": "submission"}, {"title": "Hacking Period", "type": "submission"}, {"title": "Judging", "type": "judging"}, {"title": "Awards Ceremony", "type": "announcement"}]'::jsonb, 3),
    ('Design Excellence Awards', 'Recognize outstanding design work across multiple disciplines.', 'Palette', 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400', 'Design',
     '["Brand Identity", "Digital Product", "Print Design", "Packaging", "Motion Graphics", "Student Work"]'::jsonb,
     '[{"title": "Entry Period", "type": "submission"}, {"title": "First Round", "type": "judging"}, {"title": "Final Round", "type": "judging"}, {"title": "Gala Night", "type": "announcement"}]'::jsonb, 4),
    ('Employee Recognition Program', 'Internal program to recognize and celebrate team achievements.', 'Award', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400', 'Corporate',
     '["Innovation Award", "Leadership Excellence", "Team Player", "Customer Champion", "Rising Star"]'::jsonb,
     '[{"title": "Nominations Open", "type": "submission"}, {"title": "Committee Review", "type": "judging"}, {"title": "All-Hands Announcement", "type": "announcement"}]'::jsonb, 5),
    ('Academic Grant Application', 'Research grant application with peer review process.', 'GraduationCap', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400', 'Education',
     '["Research Grant", "Fellowship", "Travel Grant", "Equipment Grant", "Publication Support"]'::jsonb,
     '[{"title": "Proposal Submission", "type": "submission"}, {"title": "Peer Review", "type": "judging"}, {"title": "Committee Decision", "type": "judging"}, {"title": "Award Notification", "type": "announcement"}]'::jsonb, 6);

-- ============================================================================
-- SECTION 11: FORM BUILDER
-- ============================================================================

-- Form Definitions (per program)
CREATE TABLE forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    form_type VARCHAR(50) DEFAULT 'submission', -- submission, registration, survey
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Fields
CREATE TABLE form_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES forms(id) ON DELETE CASCADE,
    field_type VARCHAR(50) NOT NULL, -- text, textarea, select, checkbox, file, date, etc.
    label VARCHAR(255) NOT NULL,
    placeholder VARCHAR(255),
    help_text TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    validation_rules JSONB DEFAULT '{}',
    options JSONB DEFAULT '[]', -- For select, radio, checkbox
    conditional_logic JSONB, -- Show/hide based on other field values
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 12: NOTIFICATIONS & EMAIL TEMPLATES
-- ============================================================================

-- Email Templates (per organization)
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    trigger_event VARCHAR(100), -- submission_received, status_changed, judge_assigned, etc.
    variables JSONB DEFAULT '[]', -- Available merge tags
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    email_submissions BOOLEAN DEFAULT TRUE,
    email_judging BOOLEAN DEFAULT TRUE,
    email_announcements BOOLEAN DEFAULT TRUE,
    email_marketing BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(50) DEFAULT 'instant', -- instant, daily, weekly
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 13: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Profiles
CREATE INDEX idx_profiles_organization ON profiles(organization_id);

-- Programs
CREATE INDEX idx_programs_organization ON programs(organization_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_deadline ON programs(deadline);
CREATE INDEX idx_programs_slug ON programs(organization_id, slug);

-- Categories
CREATE INDEX idx_categories_program ON categories(program_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Rounds
CREATE INDEX idx_rounds_program ON rounds(program_id);
CREATE INDEX idx_rounds_dates ON rounds(start_date, end_date);

-- Submissions
CREATE INDEX idx_submissions_program ON submissions(program_id);
CREATE INDEX idx_submissions_category ON submissions(category_id);
CREATE INDEX idx_submissions_applicant ON submissions(applicant_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_date ON submissions(submitted_at);

-- Judges
CREATE INDEX idx_judges_organization ON judges(organization_id);
CREATE INDEX idx_judges_email ON judges(organization_id, email);

-- Submission Judges
CREATE INDEX idx_submission_judges_submission ON submission_judges(submission_id);
CREATE INDEX idx_submission_judges_judge ON submission_judges(judge_id);

-- Contacts
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_email ON contacts(organization_id, email);
CREATE INDEX idx_contacts_status ON contacts(status);

-- Messages
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_sent ON messages(sent_at);

-- Audit Logs
CREATE INDEX idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ============================================================================
-- SECTION 14: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE judging_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION auth.user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid());

-- Organization policies
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (id = auth.user_organization_id());

-- Programs policies (organization-scoped)
CREATE POLICY "Users can view their org programs"
    ON programs FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can create programs in their org"
    ON programs FOR INSERT
    WITH CHECK (organization_id = auth.user_organization_id());

CREATE POLICY "Users can update their org programs"
    ON programs FOR UPDATE
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can delete their org programs"
    ON programs FOR DELETE
    USING (organization_id = auth.user_organization_id());

-- Submissions policies
CREATE POLICY "Users can view their org submissions"
    ON submissions FOR SELECT
    USING (program_id IN (SELECT id FROM programs WHERE organization_id = auth.user_organization_id()));

CREATE POLICY "Anyone can create submissions on public programs"
    ON submissions FOR INSERT
    WITH CHECK (program_id IN (SELECT id FROM programs WHERE visibility = 'public'));

CREATE POLICY "Applicants can view their own submissions"
    ON submissions FOR SELECT
    USING (applicant_id = auth.uid());

-- Judges policies
CREATE POLICY "Users can view their org judges"
    ON judges FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can manage their org judges"
    ON judges FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Contacts policies
CREATE POLICY "Users can view their org contacts"
    ON contacts FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "Users can manage their org contacts"
    ON contacts FOR ALL
    USING (organization_id = auth.user_organization_id());

-- Messages policies
CREATE POLICY "Users can view threads they participate in"
    ON messages FOR SELECT
    USING (thread_id IN (
        SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
    ));

-- Audit logs policies
CREATE POLICY "Users can view their org audit logs"
    ON audit_logs FOR SELECT
    USING (organization_id = auth.user_organization_id());

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- Public tables (no RLS needed for read)
-- testimonials, pricing_tiers, features, use_cases, how_it_works_steps, case_studies, faqs, program_templates

-- ============================================================================
-- SECTION 15: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at
    BEFORE UPDATE ON message_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update submission counts
CREATE OR REPLACE FUNCTION update_submission_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update program count
        UPDATE programs SET entries_count = entries_count + 1 WHERE id = NEW.program_id;
        -- Update category count
        IF NEW.category_id IS NOT NULL THEN
            UPDATE categories SET entries_count = entries_count + 1 WHERE id = NEW.category_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE programs SET entries_count = entries_count - 1 WHERE id = OLD.program_id;
        IF OLD.category_id IS NOT NULL THEN
            UPDATE categories SET entries_count = entries_count - 1 WHERE id = OLD.category_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_counts_on_submission
    AFTER INSERT OR DELETE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_submission_counts();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_organization_id UUID,
    p_action VARCHAR,
    p_action_type VARCHAR,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_user_name VARCHAR;
    v_user_avatar TEXT;
    v_log_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    SELECT full_name, avatar_url INTO v_user_name, v_user_avatar
    FROM profiles WHERE id = v_user_id;
    
    INSERT INTO audit_logs (
        organization_id, user_id, action, action_type,
        resource_type, resource_id, details, metadata,
        user_name, user_avatar
    ) VALUES (
        p_organization_id, v_user_id, p_action, p_action_type,
        p_resource_type, p_resource_id, p_details, p_metadata,
        v_user_name, v_user_avatar
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate submission average score
CREATE OR REPLACE FUNCTION update_submission_average_score()
RETURNS TRIGGER AS $$
DECLARE
    v_submission_id UUID;
    v_avg DECIMAL(5,2);
    v_count INTEGER;
BEGIN
    -- Get submission_id from submission_judges
    SELECT submission_id INTO v_submission_id
    FROM submission_judges
    WHERE id = NEW.submission_judge_id;
    
    -- Calculate weighted average
    SELECT 
        AVG(s.score * jc.weight / 100.0),
        COUNT(DISTINCT sj.judge_id)
    INTO v_avg, v_count
    FROM scores s
    JOIN submission_judges sj ON s.submission_judge_id = sj.id
    JOIN judging_criteria jc ON s.criterion_id = jc.id
    WHERE sj.submission_id = v_submission_id;
    
    -- Update submission
    UPDATE submissions 
    SET average_score = v_avg, total_scores = v_count
    WHERE id = v_submission_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_avg_score_on_score
    AFTER INSERT OR UPDATE ON scores
    FOR EACH ROW EXECUTE FUNCTION update_submission_average_score();

-- ============================================================================
-- SECTION 16: VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Submission with all related data
CREATE OR REPLACE VIEW submission_details AS
SELECT 
    s.*,
    p.title as program_title,
    p.status as program_status,
    c.title as category_title,
    pr.full_name as applicant_full_name,
    pr.avatar_url as applicant_avatar,
    (SELECT COUNT(*) FROM submission_judges sj WHERE sj.submission_id = s.id) as assigned_judges_count,
    (SELECT COUNT(*) FROM submission_judges sj WHERE sj.submission_id = s.id AND sj.status = 'completed') as completed_judges_count
FROM submissions s
LEFT JOIN programs p ON s.program_id = p.id
LEFT JOIN categories c ON s.category_id = c.id
LEFT JOIN profiles pr ON s.applicant_id = pr.id;

-- Judge workload summary
CREATE OR REPLACE VIEW judge_workload AS
SELECT 
    j.*,
    (SELECT COUNT(*) FROM submission_judges sj WHERE sj.judge_id = j.id) as total_assigned,
    (SELECT COUNT(*) FROM submission_judges sj WHERE sj.judge_id = j.id AND sj.status = 'completed') as total_completed,
    (SELECT COUNT(*) FROM submission_judges sj WHERE sj.judge_id = j.id AND sj.status = 'pending') as total_pending,
    CASE 
        WHEN (SELECT COUNT(*) FROM submission_judges sj WHERE sj.judge_id = j.id) = 0 THEN 0
        ELSE ROUND(
            (SELECT COUNT(*) FROM submission_judges sj WHERE sj.judge_id = j.id AND sj.status = 'completed')::NUMERIC /
            (SELECT COUNT(*) FROM submission_judges sj WHERE sj.judge_id = j.id)::NUMERIC * 100
        )
    END as progress_percentage
FROM judges j;

-- Program statistics
CREATE OR REPLACE VIEW program_stats AS
SELECT 
    p.id,
    p.title,
    p.status,
    p.entries_count,
    (SELECT COUNT(*) FROM submissions s WHERE s.program_id = p.id AND s.status = 'pending') as pending_count,
    (SELECT COUNT(*) FROM submissions s WHERE s.program_id = p.id AND s.status = 'under_review') as under_review_count,
    (SELECT COUNT(*) FROM submissions s WHERE s.program_id = p.id AND s.status = 'shortlisted') as shortlisted_count,
    (SELECT COUNT(*) FROM submissions s WHERE s.program_id = p.id AND s.status = 'accepted') as accepted_count,
    (SELECT COUNT(*) FROM submissions s WHERE s.program_id = p.id AND s.status = 'rejected') as rejected_count,
    (SELECT COUNT(DISTINCT j.id) FROM judges j 
     JOIN submission_judges sj ON j.id = sj.judge_id 
     JOIN submissions s ON sj.submission_id = s.id 
     WHERE s.program_id = p.id) as judges_count,
    (SELECT COALESCE(SUM(s.payment_amount), 0) FROM submissions s 
     WHERE s.program_id = p.id AND s.payment_status = 'paid') as total_revenue
FROM programs p;

-- ============================================================================
-- SECTION 17: STORAGE BUCKETS (Run in Supabase Dashboard or via API)
-- ============================================================================

-- Note: Storage buckets must be created via Supabase Dashboard or API
-- Here are the recommended buckets:

-- 1. avatars - User and organization avatars
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- 2. submissions - Submission files and attachments
-- INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- 3. program-assets - Program cover images and branding
-- INSERT INTO storage.buckets (id, name, public) VALUES ('program-assets', 'program-assets', true);

-- 4. documents - General documents and exports
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- ============================================================================
-- SECTION 18: INITIAL ORGANIZATION SETUP FUNCTION
-- ============================================================================

-- Function to set up a new organization with default roles
CREATE OR REPLACE FUNCTION setup_new_organization(
    p_org_name VARCHAR,
    p_org_slug VARCHAR,
    p_owner_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
    v_admin_role_id UUID;
    v_editor_role_id UUID;
    v_judge_role_id UUID;
    v_viewer_role_id UUID;
BEGIN
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES (p_org_name, p_org_slug)
    RETURNING id INTO v_org_id;
    
    -- Create default roles
    INSERT INTO roles (organization_id, name, color, is_system)
    VALUES (v_org_id, 'Admin', 'bg-purple-100 text-purple-700', TRUE)
    RETURNING id INTO v_admin_role_id;
    
    INSERT INTO roles (organization_id, name, color, is_system)
    VALUES (v_org_id, 'Editor', 'bg-blue-100 text-blue-700', TRUE)
    RETURNING id INTO v_editor_role_id;
    
    INSERT INTO roles (organization_id, name, color, is_system)
    VALUES (v_org_id, 'Judge', 'bg-amber-100 text-amber-700', TRUE)
    RETURNING id INTO v_judge_role_id;
    
    INSERT INTO roles (organization_id, name, color, is_system)
    VALUES (v_org_id, 'Viewer', 'bg-slate-100 text-slate-700', TRUE)
    RETURNING id INTO v_viewer_role_id;
    
    -- Assign all permissions to Admin
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_admin_role_id, id FROM permissions;
    
    -- Assign Editor permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_editor_role_id, id FROM permissions 
    WHERE key IN ('view_overview', 'view_submissions', 'manage_submissions', 
                  'manage_forms', 'manage_reach', 'view_analytics');
    
    -- Assign Judge permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_judge_role_id, id FROM permissions 
    WHERE key IN ('view_overview', 'view_judging', 'manage_judging');
    
    -- Assign Viewer permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT v_viewer_role_id, id FROM permissions 
    WHERE key IN ('view_overview', 'view_analytics', 'view_submissions');
    
    -- Update owner's profile with organization
    UPDATE profiles SET organization_id = v_org_id WHERE id = p_owner_user_id;
    
    -- Add owner as organization member with Admin role
    INSERT INTO organization_members (organization_id, user_id, role_id, status)
    VALUES (v_org_id, p_owner_user_id, v_admin_role_id, 'active');
    
    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
