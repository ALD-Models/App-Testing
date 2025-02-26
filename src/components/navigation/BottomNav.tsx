import React from "react";
import { Home, Camera, User } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const BottomNav = ({
  activeTab = "home",
  onTabChange = () => {},
}: BottomNavProps) => {
  const navItems: NavItem[] = [
    {
      icon: <Home className="h-6 w-6" />,
      label: "Home",
      isActive: activeTab === "home",
      onClick: () => onTabChange("home"),
    },
    {
      icon: <Camera className="h-6 w-6" />,
      label: "Camera",
      isActive: activeTab === "camera",
      onClick: () => onTabChange("camera"),
    },
    {
      icon: <User className="h-6 w-6" />,
      label: "Profile",
      isActive: activeTab === "profile",
      onClick: () => onTabChange("profile"),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border h-16 px-4 flex items-center justify-around">
      {navItems.map((item, index) => (
        <Button
          key={index}
          variant="ghost"
          className={cn(
            "flex flex-col items-center gap-1 h-14 w-20",
            item.isActive && "text-primary",
          )}
          onClick={item.onClick}
        >
          {item.icon}
          <span className="text-xs">{item.label}</span>
        </Button>
      ))}
    </div>
  );
};

export default BottomNav;
