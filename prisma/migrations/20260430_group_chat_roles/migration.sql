ALTER TABLE chat_thread_participants
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
