export interface Profile {
  id: string;
  phone: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  story_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  story_id: string;
  content: string;
  created_at: string;
}
