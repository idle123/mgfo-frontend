import { motion } from 'motion/react';
import backgroundImage from 'figma:asset/e6710306dc3ececa10adef4bd01ef48ad5d13f56.png';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Base background image */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      />

      {/* Animated overlay layer 1 - slow horizontal drift */}
      <motion.div
        className="absolute inset-0 w-full h-full opacity-40"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated overlay layer 2 - vertical breathing motion */}
      <motion.div
        className="absolute inset-0 w-full h-full opacity-30"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: '105%',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
        animate={{
          y: [0, -20, 0],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Animated overlay layer 3 - subtle rotation and scale */}
      <motion.div
        className="absolute inset-0 w-full h-full opacity-20"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
          transformOrigin: 'center bottom',
        }}
        animate={{
          scale: [1, 1.05, 1],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Gradient overlay for depth */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, transparent 0%, rgba(10, 10, 15, 0.3) 100%)',
        }}
      />
    </div>
  );
}
