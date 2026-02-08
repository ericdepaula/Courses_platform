/*
  # Create LMS Platform Schema

  ## Overview
  Creates a complete Learning Management System database schema with courses, lessons, enrollments, and progress tracking.

  ## 1. New Tables
  
  ### `courses`
  - `id` (uuid, primary key) - Unique course identifier
  - `title` (text) - Course title
  - `description` (text) - Course description
  - `instructor` (text) - Instructor name
  - `thumbnail_url` (text) - Course thumbnail image URL
  - `category` (text) - Course category (e.g., "Programming", "Design")
  - `level` (text) - Difficulty level (Beginner, Intermediate, Advanced)
  - `duration_hours` (integer) - Estimated course duration in hours
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `lessons`
  - `id` (uuid, primary key) - Unique lesson identifier
  - `course_id` (uuid, foreign key) - Reference to parent course
  - `title` (text) - Lesson title
  - `description` (text) - Lesson description
  - `video_url` (text) - Video URL placeholder
  - `duration_minutes` (integer) - Lesson duration in minutes
  - `order_index` (integer) - Order of lesson in course
  - `materials_url` (text) - URL to downloadable materials
  - `created_at` (timestamptz) - Creation timestamp

  ### `enrollments`
  - `id` (uuid, primary key) - Unique enrollment identifier
  - `user_id` (uuid, foreign key) - Reference to auth.users
  - `course_id` (uuid, foreign key) - Reference to courses
  - `enrolled_at` (timestamptz) - Enrollment timestamp
  - `completed_at` (timestamptz) - Completion timestamp (nullable)

  ### `lesson_progress`
  - `id` (uuid, primary key) - Unique progress record identifier
  - `user_id` (uuid, foreign key) - Reference to auth.users
  - `lesson_id` (uuid, foreign key) - Reference to lessons
  - `completed` (boolean) - Whether lesson is completed
  - `last_position_seconds` (integer) - Last video position in seconds
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can view all courses (public read)
  - Users can only view their own enrollments and progress
  - Users can enroll themselves in courses
  - Users can update their own progress
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructor text NOT NULL,
  thumbnail_url text DEFAULT '',
  category text NOT NULL,
  level text NOT NULL DEFAULT 'Beginner',
  duration_hours integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  video_url text DEFAULT '',
  duration_minutes integer DEFAULT 0,
  order_index integer NOT NULL DEFAULT 0,
  materials_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  last_position_seconds integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- Courses policies (public read)
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated, anon
  USING (true);

-- Lessons policies (public read)
CREATE POLICY "Anyone can view lessons"
  ON lessons FOR SELECT
  TO authenticated, anon
  USING (true);

-- Enrollments policies
CREATE POLICY "Users can view own enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lesson progress policies
CREATE POLICY "Users can view own progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert sample courses
INSERT INTO courses (title, description, instructor, thumbnail_url, category, level, duration_hours) VALUES
  ('Fundamentos de React', 'Aprenda os conceitos fundamentais do React, incluindo componentes, hooks e gerenciamento de estado.', 'Maria Silva', 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=800', 'Programação', 'Beginner', 8),
  ('Design UI/UX Avançado', 'Domine as técnicas avançadas de design de interface e experiência do usuário com ferramentas modernas.', 'João Santos', 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800', 'Design', 'Advanced', 12),
  ('JavaScript Moderno', 'Explore ES6+ e recursos modernos do JavaScript para desenvolvimento web profissional.', 'Ana Costa', 'https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=800', 'Programação', 'Intermediate', 10),
  ('Marketing Digital', 'Estratégias completas de marketing digital, SEO, redes sociais e análise de dados.', 'Pedro Oliveira', 'https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800', 'Marketing', 'Beginner', 6),
  ('Python para Data Science', 'Análise de dados e machine learning com Python, Pandas e Scikit-learn.', 'Carla Souza', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', 'Programação', 'Intermediate', 15);

-- Insert sample lessons for React course (assuming first course)
DO $$
DECLARE
  react_course_id uuid;
BEGIN
  SELECT id INTO react_course_id FROM courses WHERE title = 'Fundamentos de React' LIMIT 1;
  
  IF react_course_id IS NOT NULL THEN
    INSERT INTO lessons (course_id, title, description, video_url, duration_minutes, order_index) VALUES
      (react_course_id, 'Introdução ao React', 'Visão geral do React e configuração do ambiente', 'https://example.com/video1.mp4', 15, 1),
      (react_course_id, 'Componentes e Props', 'Criando componentes reutilizáveis e passando props', 'https://example.com/video2.mp4', 25, 2),
      (react_course_id, 'State e Lifecycle', 'Gerenciando estado de componentes', 'https://example.com/video3.mp4', 30, 3),
      (react_course_id, 'Hooks: useState e useEffect', 'Trabalhando com React Hooks', 'https://example.com/video4.mp4', 35, 4),
      (react_course_id, 'Projeto Final', 'Construindo uma aplicação completa', 'https://example.com/video5.mp4', 45, 5);
  END IF;
END $$;
