import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ fullScreen, message, size = 'md' }: LoadingSpinnerProps) {
  const sizeMap = { sm: 24, md: 40, lg: 56 };
  const spinnerSize = sizeMap[size];

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: spinnerSize, height: spinnerSize }}>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-indigo-500/20"
          style={{ borderTopColor: '#6366f1' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-purple-500/20"
          style={{ borderBottomColor: '#a855f7' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-indigo-500 pulse-glow" />
        </div>
      </div>
      {message && (
        <p className="text-slate-400 text-sm font-medium">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-surface-900 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold gradient-text font-display">CIVIX AI</span>
          </div>
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}
