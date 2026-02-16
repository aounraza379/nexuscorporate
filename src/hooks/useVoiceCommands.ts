import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoiceCommandConfig {
  onCommand: (transcript: string) => void;
  onInterimTranscript?: (transcript: string) => void;
  enabled?: boolean;
}

export function useVoiceCommands({ onCommand, onInterimTranscript, enabled = true }: VoiceCommandConfig) {
  const { userRole } = useAuth();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }
    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setTranscript(interimTranscript);
        onInterimTranscript?.(interimTranscript);
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        onCommand(finalTranscript.trim());
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // Auto-restart on silence timeout
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition:", e);
          isListeningRef.current = false;
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow microphone permissions.");
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === "no-speech") {
        // Normal silence timeout — will auto-restart via onend
      } else if (event.error !== "aborted") {
        toast.error("Voice recognition error. Please try again.");
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    return recognition;
  }, [onCommand, onInterimTranscript]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = useCallback(() => {
    if (!enabled) return;

    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    if (!recognitionRef.current) return;

    try {
      setTranscript("");
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [enabled, initRecognition]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    setTranscript("");
    recognitionRef.current?.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

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
