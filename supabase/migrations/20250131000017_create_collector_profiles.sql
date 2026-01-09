-- Migration: Create Collector Profiles Table
-- Stores user-managed profile information with immutable change history

CREATE TABLE IF NOT EXISTS "public"."collector_profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL, -- Primary email, may differ from auth.users.email
    "phone" TEXT,
    "bio" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_collector_profiles_user_id ON "public"."collector_profiles"("user_id");
CREATE INDEX IF NOT EXISTS idx_collector_profiles_email ON "public"."collector_profiles"("email");

-- Add comment
COMMENT ON TABLE "public"."collector_profiles" IS 'User-managed collector profile information. Users can update their preferred names and details while preserving purchase history.';

-- Migration: Create Profile Change History Table
-- Immutable log of all profile changes

CREATE TABLE IF NOT EXISTS "public"."collector_profile_changes" (
    "id" BIGSERIAL PRIMARY KEY,
    "profile_id" UUID NOT NULL REFERENCES collector_profiles(id) ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    "change_type" TEXT NOT NULL CHECK (change_type IN ('created', 'updated')),
    "changed_fields" JSONB NOT NULL, -- What fields were changed
    "old_values" JSONB NOT NULL DEFAULT '{}', -- Previous values
    "new_values" JSONB NOT NULL DEFAULT '{}', -- New values
    "reason" TEXT, -- Optional reason for change
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for the change history
CREATE INDEX IF NOT EXISTS idx_profile_changes_profile_id ON "public"."collector_profile_changes"("profile_id");
CREATE INDEX IF NOT EXISTS idx_profile_changes_user_id ON "public"."collector_profile_changes"("user_id");
CREATE INDEX IF NOT EXISTS idx_profile_changes_created_at ON "public"."collector_profile_changes"("created_at" DESC);

-- Add comment
COMMENT ON TABLE "public"."collector_profile_changes" IS 'Immutable audit log of all collector profile changes. Preserves the history of name and detail updates.';

-- Create trigger to prevent updates to profile_changes
CREATE OR REPLACE FUNCTION protect_profile_change_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Deleting profile change records is strictly forbidden for audit compliance.';
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Updating profile change records is strictly forbidden. Changes are immutable.';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_profile_change_immutability ON collector_profile_changes;
CREATE TRIGGER trg_protect_profile_change_immutability
BEFORE UPDATE OR DELETE ON collector_profile_changes
FOR EACH ROW EXECUTE FUNCTION protect_profile_change_immutability();

-- Create trigger to log profile changes
CREATE OR REPLACE FUNCTION log_profile_change()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields JSONB := '{}';
    old_vals JSONB := '{}';
    new_vals JSONB := '{}';
BEGIN
    -- Determine what changed
    IF TG_OP = 'INSERT' THEN
        -- For new profiles, log all initial values
        changed_fields := jsonb_build_array('first_name', 'last_name', 'email', 'phone', 'bio', 'avatar_url');
        new_vals := jsonb_build_object(
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'email', NEW.email,
            'phone', NEW.phone,
            'bio', NEW.bio,
            'avatar_url', NEW.avatar_url
        );

        INSERT INTO collector_profile_changes (
            profile_id, user_id, change_type, changed_fields, old_values, new_values, reason
        ) VALUES (
            NEW.id, NEW.user_id, 'created', changed_fields, old_vals, new_vals, 'Profile created'
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- For updates, log only changed fields
        IF OLD.first_name IS DISTINCT FROM NEW.first_name THEN
            changed_fields := changed_fields || '["first_name"]';
            old_vals := old_vals || jsonb_build_object('first_name', OLD.first_name);
            new_vals := new_vals || jsonb_build_object('first_name', NEW.first_name);
        END IF;

        IF OLD.last_name IS DISTINCT FROM NEW.last_name THEN
            changed_fields := changed_fields || '["last_name"]';
            old_vals := old_vals || jsonb_build_object('last_name', OLD.last_name);
            new_vals := new_vals || jsonb_build_object('last_name', NEW.last_name);
        END IF;

        IF OLD.email IS DISTINCT FROM NEW.email THEN
            changed_fields := changed_fields || '["email"]';
            old_vals := old_vals || jsonb_build_object('email', OLD.email);
            new_vals := new_vals || jsonb_build_object('email', NEW.email);
        END IF;

        IF OLD.phone IS DISTINCT FROM NEW.phone THEN
            changed_fields := changed_fields || '["phone"]';
            old_vals := old_vals || jsonb_build_object('phone', OLD.phone);
            new_vals := new_vals || jsonb_build_object('phone', NEW.phone);
        END IF;

        IF OLD.bio IS DISTINCT FROM NEW.bio THEN
            changed_fields := changed_fields || '["bio"]';
            old_vals := old_vals || jsonb_build_object('bio', OLD.bio);
            new_vals := new_vals || jsonb_build_object('bio', NEW.bio);
        END IF;

        IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
            changed_fields := changed_fields || '["avatar_url"]';
            old_vals := old_vals || jsonb_build_object('avatar_url', OLD.avatar_url);
            new_vals := new_vals || jsonb_build_object('avatar_url', NEW.avatar_url);
        END IF;

        -- Only insert if something actually changed
        IF changed_fields != '{}' THEN
            INSERT INTO collector_profile_changes (
                profile_id, user_id, change_type, changed_fields, old_values, new_values, reason
            ) VALUES (
                NEW.id, NEW.user_id, 'updated', changed_fields, old_vals, new_vals, 'Profile updated by user'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_profile_change ON collector_profiles;
CREATE TRIGGER trg_log_profile_change
AFTER INSERT OR UPDATE ON collector_profiles
FOR EACH ROW EXECUTE FUNCTION log_profile_change();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_collector_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_collector_profile_updated_at ON collector_profiles;
CREATE TRIGGER trg_update_collector_profile_updated_at
BEFORE UPDATE ON collector_profiles
FOR EACH ROW EXECUTE FUNCTION update_collector_profile_updated_at();



