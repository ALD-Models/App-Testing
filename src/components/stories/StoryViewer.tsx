import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { cn } from "@/lib/utils";

interface Story {
  id: string;
  imageUrl: string;
  username: string;
  timestamp: string;
  duration?: number;
}

interface StoryViewerProps {
  stories?: Story[];
  currentIndex?: number;
  onClose?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const StoryViewer = ({
  stories = [
    {
      id: "1",
      imageUrl: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
      username: "demo_user1",
      timestamp: "2h ago",
      duration: 5000,
    },
    {
      id: "2",
      imageUrl: "https://images.unsplash.com/photo-1682687221038-404670f2f7ed",
      username: "demo_user2",
      timestamp: "4h ago",
      duration: 5000,
    },
  ],
  currentIndex = 0,
  onClose = () => {},
  onNext = () => {},
  onPrevious = () => {},
}: StoryViewerProps) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.duration || 5000;

  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            onNext();
            return 0;
          }
          return prev + 100 / (duration / 100);
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [currentIndex, isPaused, duration, onNext]);

  const handleMouseDown = () => setIsPaused(true);
  const handleMouseUp = () => setIsPaused(false);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* Story Container */}
      <div className="relative w-full h-full md:w-[400px] md:h-[700px] bg-gray-900">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 p-2 flex gap-1">
          {stories.map((_, idx) => (
            <Progress
              key={idx}
              value={
                idx === currentIndex ? progress : idx < currentIndex ? 100 : 0
              }
              className="h-1"
            />
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-600 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentStory?.username}`}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">
                {currentStory?.username}
              </p>
              <p className="text-gray-400 text-xs">{currentStory?.timestamp}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-gray-800"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Story Image */}
        <div
          className="absolute inset-0"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
        >
          <img
            src={currentStory?.imageUrl}
            alt="story"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-white hover:bg-gray-800/50",
              currentIndex === 0 && "invisible",
            )}
            onClick={onPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-white hover:bg-gray-800/50",
              currentIndex === stories.length - 1 && "invisible",
            )}
            onClick={onNext}
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
