export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
  social_links: Record<string, string>;
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
  category: string | null;
  views_count: number;
  likes_count: number;
  user_id: string;
  created_at: string;
  profiles?: Profile;
  tags?: Tag[];
  user_has_liked?: boolean;
  project_tags?: { tags: Tag }[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface Comment {
  id: string;
  user_id: string;
  project_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}
