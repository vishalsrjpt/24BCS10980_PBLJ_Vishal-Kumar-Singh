-- CampusFind Database Schema Initialization
CREATE SCHEMA IF NOT EXISTS campusfind;
SET search_path TO campusfind, public;

-- Users table
CREATE TABLE IF NOT EXISTS campusfind.users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'ADMIN', 'SUPERADMIN')),
    phone_number VARCHAR(30),
    student_id VARCHAR(50),
    department VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON campusfind.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON campusfind.users(role);

-- Item Reports table
CREATE TABLE IF NOT EXISTS campusfind.item_reports (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    report_type VARCHAR(10) NOT NULL CHECK (report_type IN ('LOST', 'FOUND')),
    category VARCHAR(50) NOT NULL,
    color VARCHAR(50),
    brand VARCHAR(100),
    location VARCHAR(150) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLAIM_PENDING', 'DISPUTED', 'RECOVERED', 'REJECTED', 'EXPIRED')),
    reporter_id BIGINT NOT NULL REFERENCES campusfind.users(id) ON DELETE CASCADE,
    identifying_details TEXT,
    additional_notes TEXT,
    recovered_at TIMESTAMP WITH TIME ZONE,
    recovered_by_claim_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_reports_type ON campusfind.item_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_item_reports_category ON campusfind.item_reports(category);
CREATE INDEX IF NOT EXISTS idx_item_reports_status ON campusfind.item_reports(status);
CREATE INDEX IF NOT EXISTS idx_item_reports_reporter ON campusfind.item_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_item_reports_event_date ON campusfind.item_reports(event_date);
CREATE INDEX IF NOT EXISTS idx_item_reports_location ON campusfind.item_reports(location);

-- Item Images table
CREATE TABLE IF NOT EXISTS campusfind.item_images (
    id BIGSERIAL PRIMARY KEY,
    item_report_id BIGINT NOT NULL REFERENCES campusfind.item_reports(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_item_images_report ON campusfind.item_images(item_report_id);

-- Claims table
CREATE TABLE IF NOT EXISTS campusfind.claims (
    id BIGSERIAL PRIMARY KEY,
    item_report_id BIGINT NOT NULL REFERENCES campusfind.item_reports(id) ON DELETE CASCADE,
    claimant_id BIGINT NOT NULL REFERENCES campusfind.users(id) ON DELETE CASCADE,
    explanation TEXT NOT NULL,
    identifying_details TEXT NOT NULL,
    purchase_details TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED', 'DISPUTED')),
    admin_notes TEXT,
    reviewed_by BIGINT REFERENCES campusfind.users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_claims_report ON campusfind.claims(item_report_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant ON campusfind.claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON campusfind.claims(status);

-- Claim Images / Proofs table
CREATE TABLE IF NOT EXISTS campusfind.claim_images (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT NOT NULL REFERENCES campusfind.claims(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_claim_images_claim ON campusfind.claim_images(claim_id);

-- Item Matches table (Smart Matching Engine results)
CREATE TABLE IF NOT EXISTS campusfind.item_matches (
    id BIGSERIAL PRIMARY KEY,
    lost_report_id BIGINT NOT NULL REFERENCES campusfind.item_reports(id) ON DELETE CASCADE,
    found_report_id BIGINT NOT NULL REFERENCES campusfind.item_reports(id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION NOT NULL,
    match_reason TEXT NOT NULL,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lost_found UNIQUE (lost_report_id, found_report_id)
);

CREATE INDEX IF NOT EXISTS idx_item_matches_lost ON campusfind.item_matches(lost_report_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_found ON campusfind.item_matches(found_report_id);
CREATE INDEX IF NOT EXISTS idx_item_matches_score ON campusfind.item_matches(similarity_score);

-- Notifications table
CREATE TABLE IF NOT EXISTS campusfind.notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES campusfind.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON campusfind.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON campusfind.notifications(recipient_id, is_read);

-- Admin Audit Logs table
CREATE TABLE IF NOT EXISTS campusfind.admin_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id BIGINT NOT NULL REFERENCES campusfind.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON campusfind.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON campusfind.admin_audit_logs(created_at);
