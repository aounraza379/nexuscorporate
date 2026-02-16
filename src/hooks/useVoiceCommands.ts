import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoiceCommandConfig {
  onCommand: (transcript: string) => void;
  enabled?: boolean;
}

export function useVoiceCommands({ onCommand, enabled = true }: VoiceCommandConfig) {
  const { userRole } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);

        if (finalTranscript) {
          setTranscript(finalTranscript);
          onCommand(finalTranscript.trim());
          setIsListening(false);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast.error("Microphone access denied. Please allow microphone permissions.");
        } else if (event.error !== "aborted") {
          toast.error("Voice recognition error. Please try again.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.abort();
    };
  }, [onCommand]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !enabled) return;

    try {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start recognition:", error);
    }
  }, [enabled]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Role-specific voice command hints
  const commandHints = getCommandHints(userRole);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    commandHints,
  };
}

function getCommandHints(role: string | null): string[] {
  const common = [
    "Show my tasks",
    "Go to dashboard",
    "Open announcements",
  ];

  switch (role) {
    case "employee":
      return [
        ...common,
        "Request leave",
        "Check my wellness",
        "View policies",
        "What are my pending tasks?",
      ];
    case "manager":
      return [
        ...common,
        "Approve all pending leaves",
        "Show team overview",
        "Create a new task",
        "Show analytics",
        "Who has burnout risk?",
      ];
    case "hr":
      return [
        ...common,
        "Show employee list",
        "Open payroll",
        "Create announcement",
        "Show all pending leaves",
        "How many employees do we have?",
      ];
    default:
      return common;
  }
}

// Augment Window for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
