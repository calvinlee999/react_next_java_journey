-- Create Users Table
-- Migration: V1__Create_users_table.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    profile_image_url TEXT,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_username ON users(username);
CREATE INDEX idx_user_status ON users(status);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_created_at ON users(created_at);
CREATE INDEX idx_user_last_login ON users(last_login_at);

-- Add constraints for status and role enums
ALTER TABLE users ADD CONSTRAINT chk_user_status 
    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE', 'BANNED', 'PENDING_VERIFICATION'));

ALTER TABLE users ADD CONSTRAINT chk_user_role 
    CHECK (role IN ('USER', 'PREMIUM_USER', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'AUDITOR'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user for testing
INSERT INTO users (
    username, 
    email, 
    first_name, 
    last_name, 
    status, 
    role, 
    email_verified, 
    phone_verified
) VALUES (
    'admin',
    'admin@fintech-demo.com',
    'System',
    'Administrator',
    'ACTIVE',
    'SUPER_ADMIN',
    true,
    false
) ON CONFLICT (email) DO NOTHING;