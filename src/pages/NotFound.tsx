import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { NexusLogo } from "@/components/NexusLogo";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-mesh grid-pattern flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-8 flex justify-center">
          <NexusLogo size="md" />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-8xl font-bold text-nexus-gradient mb-4"
        >
          404
        </motion.div>

        <h1 className="text-2xl font-semibold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button variant="hero" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
