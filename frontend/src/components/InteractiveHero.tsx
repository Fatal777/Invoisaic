import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function InteractiveHero() {
  const { theme } = useTheme();
  
  // Smooth mouse tracking for background orbs and 3D parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  // 3D Parallax effects for text
  const rotateX = useTransform(y, [-300, 300], [5, -5]);
  const rotateY = useTransform(x, [-300, 300], [-5, 5]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const x = clientX - innerWidth / 2;
      const y = clientY - innerHeight / 2;
      
      mouseX.set(x);
      mouseY.set(y);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const stats = [
    { value: '98%', label: 'Accuracy' },
    { value: '<2s', label: 'Generation Time' },
    { value: '5', label: 'Countries' },
    { value: '6', label: 'AI Features' },
  ];

  return (
    <section className={`relative overflow-hidden py-16 lg:py-24 transition-colors duration-500 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-zinc-950 via-black to-zinc-950'
        : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
    }`}>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className={`absolute w-96 h-96 rounded-full blur-3xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#F97272]/15 to-zinc-900/10'
              : 'bg-gradient-to-br from-[#EFA498]/30 to-gray-100/30'
          }`}
          style={{
            top: '10%',
            right: '10%',
            x: useTransform(x, [-300, 300], [-30, 30]),
            y: useTransform(y, [-300, 300], [-30, 30]),
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.div
          className={`absolute w-96 h-96 rounded-full blur-3xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-zinc-800/10 to-black/5'
              : 'bg-gradient-to-br from-gray-200/20 to-gray-100/20'
          }`}
          style={{
            bottom: '10%',
            left: '10%',
            x: useTransform(x, [-300, 300], [30, -30]),
            y: useTransform(y, [-300, 300], [30, -30]),
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        
        <motion.div
          className={`absolute w-[600px] h-[600px] rounded-full blur-3xl ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#F97272]/8 to-zinc-900/5'
              : 'bg-gradient-to-br from-[#EFA498]/30 to-gray-100/20'
          }`}
          style={{
            top: '50%',
            left: '50%',
            x: useTransform(x, [-300, 300], [-20, 20]),
            y: useTransform(y, [-300, 300], [-20, 20]),
            translateX: '-50%',
            translateY: '-50%',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center relative">
          {/* Badge with animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-2 mb-8 px-5 py-3 rounded-full transition-colors ${
              theme === 'dark'
                ? 'border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl'
                : 'border border-gray-300 bg-white shadow-sm'
            }`}
          >
            <motion.div
              className={`w-1.5 h-1.5 rounded-full ${
                theme === 'dark' ? 'bg-[#F97272]' : 'bg-[#EFA498]'
              }`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className={`text-sm uppercase tracking-wider font-medium ${
              theme === 'dark' ? 'text-zinc-300' : 'text-gray-700'
            }`}>
              Powered by Amazon Bedrock Nova Micro
            </span>
          </motion.div>

          {/* Main Heading with 3D Parallax */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }}
          >
            <h1 className={`text-6xl md:text-8xl lg:text-9xl font-logo font-bold mb-8 leading-none tracking-tight transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              AI Invoice
              <br />
              <span className={theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'}>
                Automation
              </span>
            </h1>
          </motion.div>

          {/* Description - Keep Original */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light transition-colors ${
              theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
            }`}
          >
            Generate country-specific invoices in seconds.
            <br />
            Built for global businesses that demand precision.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Link to="/demo">
              <motion.button
                className={`text-white px-10 py-4 rounded-full text-lg font-medium flex items-center gap-2 shadow-lg ${
                  theme === 'dark'
                    ? 'bg-[#F97272] shadow-[#F97272]/30'
                    : 'bg-[#EFA498] shadow-[#EFA498]/30'
                }`}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: theme === 'dark' 
                    ? '0 20px 40px rgba(249, 114, 114, 0.4)' 
                    : '0 20px 40px rgba(239, 164, 152, 0.4)',
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Play className="h-5 w-5" />
                Live Demo
              </motion.button>
            </Link>
            
            <Link to="/features">
              <motion.button
                className={`border-2 px-10 py-4 rounded-full text-lg font-medium flex items-center gap-2 shadow-sm ${
                  theme === 'dark'
                    ? 'border-zinc-700 text-white bg-zinc-900'
                    : 'border-gray-300 text-gray-900 bg-white'
                }`}
                whileHover={{ 
                  scale: 1.05,
                  borderColor: theme === 'dark' ? '#F97272' : '#EFA498',
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Explore Features
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 + idx * 0.1 }}
                whileHover={{ 
                  y: -8,
                  transition: { type: 'spring', stiffness: 400 }
                }}
                className="relative group cursor-pointer"
              >
                <motion.div
                  className={`absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    theme === 'dark'
                      ? 'bg-gradient-to-br from-[#F97272]/30 to-[#f85c5c]/20'
                      : 'bg-gradient-to-br from-[#EFA498]/20 to-[#F97272]/20'
                  }`}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <div className={`relative border-2 rounded-3xl p-8 transition-all shadow-lg ${
                  theme === 'dark'
                    ? 'border-zinc-800 bg-zinc-950 group-hover:border-[#F97272]'
                    : 'border-gray-200 bg-white group-hover:border-[#EFA498]'
                }`}>
                  <motion.div
                    className={`text-4xl md:text-5xl font-bold mb-2 transition-colors ${
                      theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className={`text-sm uppercase tracking-wider transition-colors ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
                  }`}>
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
