import { Bus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-indigo-50/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
            <Bus className="w-10 h-10 text-white" />
          </div>
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute -bottom-2 -right-2" />
        </div>
        <p className="mt-6 text-indigo-600 font-medium">Loading bus details...</p>
      </motion.div>
    </div>
  );
};