-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed default users if none exist
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM "User";

  IF user_count = 0 THEN
    INSERT INTO "User" ("login", "role", "passwordHash", "createdAt", "updatedAt")
    VALUES
      ('admin', 'admin', crypt('admin', gen_salt('bf')), NOW(), NOW()),
      ('demo', 'user', crypt('demo', gen_salt('bf')), NOW(), NOW()),
      ('manager', 'manager', crypt('manager', gen_salt('bf')), NOW(), NOW());
  END IF;
END $$;
