import React, { useState, useEffect } from "react";
import { type Profile, type Story } from "@/types/database";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Settings, Grid, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "../ui/input";

const ProfileView = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        const { data: stories } = await supabase
          .from("stories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        setProfile(profile);
        setEditUsername(profile?.username || "");
        setEditAvatarUrl(profile?.avatar_url || "");
        setUserStories(stories || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatar_url = editAvatarUrl;
      if (editAvatarUrl.startsWith("data:image")) {
        const file = await fetch(editAvatarUrl).then((r) => r.blob());
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(`avatar-${user.id}-${Date.now()}.jpg`, file, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) throw uploadError;
        avatar_url = uploadData.path;
      }

      const { error: updateError } = await supabase.from("profiles").upsert({
        id: user.id,
        username: editUsername,
        avatar_url: avatar_url || profile?.avatar_url,
        email: user.email,
        created_at: profile?.created_at || new Date().toISOString(),
      });

      if (updateError) throw updateError;

      await fetchProfile();
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Info */}
      {isEditing ? (
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="relative">
            <Avatar
              className="w-24 h-24 cursor-pointer"
              onClick={() => document.getElementById("avatar-upload")?.click()}
            >
              <AvatarImage src={editAvatarUrl || profile?.avatar_url} />
              <AvatarFallback>
                {editUsername[0] || profile?.username?.[0]}
              </AvatarFallback>
            </Avatar>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="w-full max-w-xs space-y-4">
            <Input
              placeholder="Username"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
            />
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>Save</Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 mb-8">
          <Avatar className="w-24 h-24">
            <AvatarImage
              src={
                profile?.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`
              }
            />
            <AvatarFallback>{profile?.username?.[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{profile?.username}</h2>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="text-center">
          <div className="text-xl font-bold">{userStories.length}</div>
          <div className="text-sm text-muted-foreground">Stories</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">Following</div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-3 gap-1">
        {userStories.map((story) => (
          <div
            key={story.id}
            className="aspect-square bg-muted overflow-hidden"
          >
            <img
              src={
                supabase.storage.from("stories").getPublicUrl(story.image_url)
                  .data.publicUrl
              }
              alt="Story"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {userStories.length === 0 && (
          <div className="aspect-square bg-muted flex items-center justify-center">
            <Grid className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Logout Button */}
      <Button
        variant="destructive"
        className="w-full mt-8"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
};

export default ProfileView;
