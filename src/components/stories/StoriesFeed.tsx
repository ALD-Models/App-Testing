import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "../ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";

import { type Story } from "@/types/database";

interface StoryWithCounts extends Story {
  profiles: {
    username: string;
    avatar_url: string;
  };
  likes: { count: number };
  comments: { count: number };
}

interface StoriesFeedProps {
  stories?: Story[];
}

const StoriesFeed = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stories, setStories] = useState<StoryWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from("stories")
          .select(
            `
            *,
            profiles!stories_user_id_fkey(username, avatar_url),
            likes(count),
            comments(count)
          `,
          )
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;
        setStories(data || []);
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleScroll = () => {
    if (feedRef.current) {
      const scrollTop = feedRef.current.scrollTop;
      const storyHeight = window.innerHeight;
      const index = Math.round(scrollTop / storyHeight);
      setCurrentIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center text-center p-4">
        <p className="text-lg mb-2">No stories yet</p>
        <p className="text-sm text-muted-foreground">
          Be the first to share a story!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      className="w-full h-[100vh] overflow-y-scroll snap-y snap-mandatory"
      onScroll={handleScroll}
    >
      {stories.map((story, index) => (
        <div
          key={story.id}
          className="w-full h-[100vh] snap-start relative bg-black flex items-center justify-center"
        >
          <img
            src={
              supabase.storage.from("stories").getPublicUrl(story.image_url)
                .data.publicUrl
            }
            alt={`Story by ${story.profiles?.username}`}
            className="w-full h-full object-cover"
          />

          {/* User Info & Caption */}
          <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden">
                <img
                  src={
                    story.profiles?.avatar_url ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.profiles?.username}`
                  }
                  alt={story.profiles?.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-white font-semibold">
                {story.profiles?.username}
              </span>
            </div>
            <p className="text-white text-sm ml-12">{story.caption}</p>
          </div>

          {/* Interaction Buttons */}
          <div className="absolute right-4 bottom-32 flex flex-col space-y-4">
            {story.profiles?.username === profile?.username && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-red-500/20 text-white hover:bg-red-500/40"
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this story?")) {
                    try {
                      const { error } = await supabase
                        .from("stories")
                        .delete()
                        .eq("id", story.id);

                      if (error) throw error;

                      // Remove story from state
                      setStories(stories.filter((s) => s.id !== story.id));
                    } catch (error) {
                      console.error("Error deleting story:", error);
                      alert("Failed to delete story");
                    }
                  }
                }}
              >
                <X className="h-6 w-6" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 text-white hover:bg-black/40"
            >
              <Heart className="h-6 w-6" />
              <span className="text-xs mt-1">{story.likes?.count || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 text-white hover:bg-black/40"
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs mt-1">{story.comments?.count || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/20 text-white hover:bg-black/40"
            >
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoriesFeed;
