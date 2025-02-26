import React, { useState, useEffect } from "react";
import ProfileView from "./profile/ProfileView";
import EmailAuthFlow from "./auth/PhoneAuthFlow";
import StoriesFeed from "./stories/StoriesFeed";
import CameraInterface from "./camera/CameraInterface";
import BottomNav from "./navigation/BottomNav";
import { supabase } from "@/lib/supabase";

const Home = () => {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsFirstTime(false);
      }
    };
    checkUser();
  }, []);

  const handleAuthComplete = () => {
    setIsFirstTime(false);
    localStorage.setItem("hasVisited", "true");
  };

  const handleTabChange = (tab: string) => {
    if (tab === "camera") {
      setShowCamera(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleMediaCapture = (media: { type: string; url: string }) => {
    // Handle the captured media
    console.log("Media captured:", media);
    setShowCamera(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Auth Flow for First Time Users */}
      <EmailAuthFlow
        isOpen={isFirstTime}
        onComplete={handleAuthComplete}
        onClose={() => {}}
      />

      {/* Main Content */}
      <main className="pb-16">
        {" "}
        {/* Add padding bottom to account for navigation */}
        {activeTab === "home" && <StoriesFeed />}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* Camera Interface */}
      {showCamera && (
        <CameraInterface
          isOpen={showCamera}
          onClose={handleCameraClose}
          onCapture={handleMediaCapture}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

export default Home;
