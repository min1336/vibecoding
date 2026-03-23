export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  screenshot_url: string;
  file_url: string;
  preview_url: string | null;
  tool_used: string | null;
  user_id: string;
  created_at: string;
  profiles?: Profile;
}
