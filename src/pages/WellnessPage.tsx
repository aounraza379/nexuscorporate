import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWellnessCheckins } from "@/hooks/useWellnessCheckins";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Heart,
  Brain,
  Battery,
  Smile,
  Frown,
  Meh,
  Target,
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";

const wellnessTips = [
  "Take a 5-minute break every hour to stretch",
  "Stay hydrated - aim for 8 glasses of water today",
  "Practice deep breathing when feeling stressed",
  "Consider a short walk during lunch break",
];

export default function WellnessPage() {
  const { profile } = useAuth();
  const { checkins, todayCheckin, hasCheckedInToday, submitCheckin, isLoading } = useWellnessCheckins();
  const [todayMood, setTodayMood] = useState<number[]>([3]);
  const [todayEnergy, setTodayEnergy] = useState<number[]>([3]);
  const [todayStress, setTodayStress] = useState<number[]>([2]);

  const getMoodEmoji = (value: number) => {
    if (value >= 4) return <Smile className="w-6 h-6 text-green-500" />;
    if (value >= 3) return <Meh className="w-6 h-6 text-yellow-500" />;
    return <Frown className="w-6 h-6 text-red-500" />;
  };

  const getScoreColor = (value: number, isStress = false) => {
    if (isStress) {
      if (value <= 2) return "text-green-500";
      if (value <= 3) return "text-yellow-500";
      return "text-red-500";
    }
    if (value >= 4) return "text-green-500";
    if (value >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  const handleCheckIn = async () => {
    await submitCheckin.mutateAsync({
      mood: todayMood[0],
      energy: todayEnergy[0],
      stress: todayStress[0],
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const currentMood = hasCheckedInToday ? todayCheckin!.mood : todayMood[0];
  const currentEnergy = hasCheckedInToday ? todayCheckin!.energy : todayEnergy[0];
  const currentStress = hasCheckedInToday ? todayCheckin!.stress : todayStress[0];
  const overallScore = Math.round((currentMood + currentEnergy + (5 - currentStress)) / 3 * 20);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Wellness Check
          </h1>
          <p className="text-muted-foreground">Track your daily wellness and mental health</p>
        </div>
      </div>

      {/* Overall Score */}
      <motion.div variants={itemVariants}>
        <GlassCard glow className="text-center">
          <h3 className="text-lg font-semibold mb-4">Today's Wellness Score</h3>
          <div className="relative inline-flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">{overallScore}%</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-4">
            {overallScore >= 80 ? "You're doing great! Keep it up! 🌟"
              : overallScore >= 60 ? "Good progress. Consider taking short breaks."
              : "Take some time for self-care today."}
          </p>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Check-in */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-primary" />
              Daily Check-in
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smile className="w-5 h-5 text-primary" />
                    <span className="font-medium">Mood</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getMoodEmoji(hasCheckedInToday ? todayCheckin!.mood : todayMood[0])}
                    <span className={`font-bold ${getScoreColor(hasCheckedInToday ? todayCheckin!.mood : todayMood[0])}`}>
                      {hasCheckedInToday ? todayCheckin!.mood : todayMood[0]}/5
                    </span>
                  </div>
                </div>
                <Slider
                  value={hasCheckedInToday ? [todayCheckin!.mood] : todayMood}
                  onValueChange={hasCheckedInToday ? undefined : setTodayMood}
                  max={5} min={1} step={1}
                  disabled={hasCheckedInToday}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-primary" />
                    <span className="font-medium">Energy Level</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(hasCheckedInToday ? todayCheckin!.energy : todayEnergy[0])}`}>
                    {hasCheckedInToday ? todayCheckin!.energy : todayEnergy[0]}/5
                  </span>
                </div>
                <Slider
                  value={hasCheckedInToday ? [todayCheckin!.energy] : todayEnergy}
                  onValueChange={hasCheckedInToday ? undefined : setTodayEnergy}
                  max={5} min={1} step={1}
                  disabled={hasCheckedInToday}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" />
                    <span className="font-medium">Stress Level</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(hasCheckedInToday ? todayCheckin!.stress : todayStress[0], true)}`}>
                    {hasCheckedInToday ? todayCheckin!.stress : todayStress[0]}/5
                  </span>
                </div>
                <Slider
                  value={hasCheckedInToday ? [todayCheckin!.stress] : todayStress}
                  onValueChange={hasCheckedInToday ? undefined : setTodayStress}
                  max={5} min={1} step={1}
                  disabled={hasCheckedInToday}
                />
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={hasCheckedInToday || submitCheckin.isPending}
                className="w-full"
              >
                {submitCheckin.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {hasCheckedInToday ? "Checked In Today ✓" : "Submit Check-in"}
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Wellness Tips */}
        <motion.div variants={itemVariants}>
          <GlassCard>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              Today's Wellness Tips
            </h3>
            <div className="space-y-3">
              {wellnessTips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">{index + 1}</span>
                  </div>
                  <p className="text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* History from DB */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Check-ins
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No check-ins yet. Start your first wellness check-in above!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Mood</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Energy</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Stress</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.slice(0, 10).map((entry) => {
                      const overall = Math.round((entry.mood + entry.energy + (5 - entry.stress)) / 3 * 20);
                      return (
                        <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="py-3 px-4 font-medium">
                            {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={getScoreColor(entry.mood)}>{entry.mood}/5</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={getScoreColor(entry.energy)}>{entry.energy}/5</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={getScoreColor(entry.stress, true)}>{entry.stress}/5</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-bold ${
                              overall >= 80 ? "text-green-500" : overall >= 60 ? "text-yellow-500" : "text-red-500"
                            }`}>
                              {overall}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
