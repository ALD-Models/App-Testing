import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Upload } from "lucide-react";

interface AuthStepsProps {
  onLoginSubmit: (e: React.FormEvent) => void;
  step: number;
  email: string;
  otp: string;
  name: string;
  avatarUrl: string;
  loading: boolean;
  onEmailSubmit: (e: React.FormEvent) => void;
  onOtpSubmit: (e: React.FormEvent) => void;
  onProfileSubmit: (e: React.FormEvent) => void;
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOtpChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAvatarChange: (url: string) => void;
}

export const AuthSteps = ({
  onLoginSubmit,
  step,
  email,
  otp,
  name,
  avatarUrl,
  loading,
  onEmailSubmit,
  onOtpSubmit,
  onProfileSubmit,
  onEmailChange,
  onOtpChange,
  onNameChange,
  onAvatarChange,
}: AuthStepsProps) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAvatarChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <div className="space-y-4">
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={onEmailChange}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                name="password"
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign Up / Login"
              )}
            </Button>
          </form>
        </div>
      )}
      {step === 4 && (
        <form onSubmit={onLoginSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="loginEmail">Email</Label>
            <Input
              id="loginEmail"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={onEmailChange}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loginPassword">Password</Label>
            <Input
              id="loginPassword"
              type="password"
              placeholder="Enter your password"
              name="password"
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
          </Button>
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setStep(1)}
              className="text-sm text-muted-foreground"
            >
              Don't have an account? Sign up
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={onProfileSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>{name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex gap-2"
                onClick={() =>
                  document.getElementById("avatar-upload")?.click()
                }
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={onNameChange}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !name}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Complete Setup"
            )}
          </Button>
        </form>
      )}
    </div>
  );
};
