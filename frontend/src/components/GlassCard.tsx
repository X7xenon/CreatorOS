import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  title?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ title, children, ...props }) => {
  return (
    <motion.div
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {title && (
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
};
