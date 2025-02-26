import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Progress } from "../ui/progress";
import { AuthSteps } from "./AuthSteps";

interface EmailAuthFlowProps {
  isOpen?: boolean;
  onComplete?: () => void;
  onClose?: () => void;
}

const EmailAuthFlow = ({
  isOpen = true,
  onComplete = () => {},
  onClose = () => {},
}: EmailAuthFlowProps) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        onComplete();
        return;
      }

      // If sign in fails, try to sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) throw signUpError;

      alert("Check your email for the confirmation link!");
      setStep(3);
    } catch (error) {
      console.error("Error signing up:", error);
      alert("Error signing up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let avatar_url = avatarUrl;
      if (avatarUrl.startsWith("data:image")) {
        try {
          const file = await fetch(avatarUrl).then((r) => r.blob());
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("avatars")
              .upload(`avatar-${user.id}.jpg`, file, {
                contentType: "image/jpeg",
                upsert: true,
              });
          if (uploadError) throw uploadError;
          avatar_url = uploadData.path;
        } catch (error) {
          console.error("Error uploading avatar:", error);
          alert("Failed to upload profile picture. Using default avatar.");
          avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
        }
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: email,
        username: name,
        avatar_url,
        created_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;
      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            {step === 1 && "Sign Up"}
            {step === 4 && "Log In"}
            {step === 3 && "Complete Your Profile"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Progress value={(step / 4) * 100} className="w-full h-2" />
          <div className="mt-8">
            <AuthSteps
              step={step}
              email={email}
              otp=""
              name={name}
              avatarUrl={avatarUrl}
              loading={loading}
              onEmailSubmit={handleEmailSubmit}
              onLoginSubmit={handleLoginSubmit}
              onOtpSubmit={() => {}}
              onProfileSubmit={handleProfileSubmit}
              onEmailChange={(e) => setEmail(e.target.value)}
              onOtpChange={() => {}}
              onNameChange={(e) => setName(e.target.value)}
              onAvatarChange={setAvatarUrl}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailAuthFlow;
