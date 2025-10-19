-- Create progress_data table for journal entries and goals
CREATE TABLE IF NOT EXISTS progress_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('journal', 'goal', 'achievement')),
  title TEXT,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS progress_data_user_id_idx ON progress_data(user_id);
CREATE INDEX IF NOT EXISTS progress_data_type_idx ON progress_data(type);
CREATE INDEX IF NOT EXISTS progress_data_created_at_idx ON progress_data(created_at DESC);

-- Enable Row Level Security
ALTER TABLE progress_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own progress data"
  ON progress_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress data"
  ON progress_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress data"
  ON progress_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress data"
  ON progress_data FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_progress_data_updated_at
  BEFORE UPDATE ON progress_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
