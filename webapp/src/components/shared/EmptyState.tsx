import React from 'react';
import { motion } from 'motion/react';
import { Database, FileCode, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface EmptyStateProps {
  title: string;
  description: string;
  missingFile?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  missingFile,
  onRetry,
  isRetrying = false,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border border-dashed border-white/10 bg-[#0B1020]/70 p-8 text-center backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8B7CFF]/10 text-[#8B7CFF] border border-[#8B7CFF]/20 shadow-inner">
        <Database className="h-7 w-7" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        {missingFile && (
          <Badge variant="amber" size="sm" dot>
            Missing Export
          </Badge>
        )}
      </div>

      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-400">
        {description}
      </p>

      {missingFile && (
        <div className="mx-auto mt-5 max-w-md rounded-lg border border-white/5 bg-[#11182A]/90 p-3.5 text-left text-xs font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2 mb-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <FileCode className="h-3.5 w-3.5 text-[#53DDE0]" />
              Expected static artifact:
            </span>
            <code className="text-[#8B7CFF] bg-[#8B7CFF]/10 px-1.5 py-0.5 rounded">
              public/data/{missingFile}
            </code>
          </div>
          <div className="text-[11px] text-slate-400 leading-normal">
            To generate, run the export block in{' '}
            <span className="text-slate-200">`ChurnShield_Customer_Inactivity_Prediction.ipynb`</span> or execute:
          </div>
          <div className="mt-2 flex items-center gap-2 rounded bg-[#080B14] px-2.5 py-1.5 text-[#53DDE0]">
            <span>$</span>
            <span className="text-slate-200">python export_webapp_data.py</span>
          </div>
        </div>
      )}

      {onRetry && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="border-white/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin text-[#8B7CFF]' : ''}`} />
            {isRetrying ? 'Checking Files...' : 'Check For Data'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
