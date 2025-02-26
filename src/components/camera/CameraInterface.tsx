import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, Image as ImageIcon, X, Send } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent } from "../ui/dialog";

interface CapturedMedia {
  type: "photo" | "video";
  url: string;
}

interface CameraInterfaceProps {
  onCapture?: (media: CapturedMedia) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const CameraInterface = ({
  onCapture = () => {},
  onClose = () => {},
  isOpen = true,
}: CameraInterfaceProps) => {
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(
    null,
  );

  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment",
  );
  const chunks = useRef<Blob[]>([]);

  React.useEffect(() => {
    if (mode === "camera") {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;

            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);

            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) {
                chunks.current.push(e.data);
              }
            };

            recorder.onstop = () => {
              const blob = new Blob(chunks.current, { type: "video/webm" });
              const videoUrl = URL.createObjectURL(blob);
              setCapturedMedia({
                type: "video",
                url: videoUrl,
              });
              chunks.current = [];
              setMode("preview");
            };
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err);
          alert("Unable to access camera");
        });

      return () => {
        if (videoRef.current?.srcObject) {
          const tracks = (
            videoRef.current.srcObject as MediaStream
          ).getTracks();
          tracks.forEach((track) => track.stop());
        }
      };
    }
  }, [mode, facingMode]);

  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    if (mediaRecorder) {
      chunks.current = [];
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const photoUrl = canvas.toDataURL("image/jpeg");
      setCapturedMedia({
        type: "photo",
        url: photoUrl,
      });
      setMode("preview");
    }
  };

  const handlePressStart = () => {
    const timer = setTimeout(() => {
      startRecording();
    }, 500); // Start recording after 500ms press
    setPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
    if (isRecording) {
      stopRecording();
    } else {
      takePhoto();
    }
  };

  const handleSwitchCamera = async () => {
    try {
      // First stop all tracks
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }

      // Then request new permission with new facing mode
      const newFacingMode = facingMode === "user" ? "environment" : "user";
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setFacingMode(newFacingMode);

        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks.current, { type: "video/webm" });
          const videoUrl = URL.createObjectURL(blob);
          setCapturedMedia({
            type: "video",
            url: videoUrl,
          });
          chunks.current = [];
          setMode("preview");
        };
      }
    } catch (err) {
      console.error("Error switching camera:", err);
      alert("Unable to switch camera. Please check permissions.");
    }
  };

  const handleGallerySelect = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCapturedMedia({
            type: file.type.startsWith("image/") ? "photo" : "video",
            url: reader.result as string,
          });
          setMode("preview");
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSend = async () => {
    if (capturedMedia) {
      try {
        // Upload image to Supabase Storage
        // Convert base64 to blob
        const base64Data = capturedMedia.url.split(",")[1];
        const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
          (r) => r.blob(),
        );

        const { data: imageData, error: uploadError } = await supabase.storage
          .from("stories")
          .upload(`story-${Date.now()}.jpg`, blob, {
            contentType: "image/jpeg",
          });

        if (uploadError) throw uploadError;

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Create story record
        const { data: storyData, error: storyError } = await supabase
          .from("stories")
          .insert([
            {
              user_id: user.id,
              image_url: imageData.path,
              caption: "",
              expires_at: new Date(
                Date.now() + 24 * 60 * 60 * 1000,
              ).toISOString(),
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (storyError) throw storyError;

        onCapture(capturedMedia);
        onClose();
      } catch (error) {
        console.error("Error sharing story:", error);
        alert("Failed to share story. Please try again.");
      }
    }
  };

  const handleReset = () => {
    setCapturedMedia(null);
    setMode("camera");
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] h-[90vh] p-0 bg-black">
        <div className="relative w-full h-full bg-gray-900 flex flex-col">
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-gray-800/50"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Content */}
          {mode === "camera" ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              {/* Camera Preview (placeholder) */}
              <div className="w-full h-full bg-gray-800 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Camera Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-around items-center bg-gradient-to-t from-black/50 to-transparent">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-gray-800/50"
                  onClick={handleGallerySelect}
                >
                  <ImageIcon className="h-6 w-6" />
                </Button>

                <Button
                  size="lg"
                  className={`rounded-full w-16 h-16 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-white hover:bg-gray-200"}`}
                  onMouseDown={handlePressStart}
                  onMouseUp={handlePressEnd}
                  onTouchStart={handlePressStart}
                  onTouchEnd={handlePressEnd}
                >
                  <div
                    className={`w-12 h-12 rounded-full border-4 ${isRecording ? "border-white" : "border-black"}`}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-gray-800/50"
                  onClick={handleSwitchCamera}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Preview */}
              <div className="flex-1 relative">
                {capturedMedia &&
                  (capturedMedia.type === "video" ? (
                    <video
                      src={capturedMedia.url}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={capturedMedia.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ))}
              </div>

              {/* Preview Controls */}
              <div className="p-6 flex justify-around items-center bg-black/50">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-gray-800/50"
                  onClick={handleReset}
                >
                  Retake
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraInterface;
