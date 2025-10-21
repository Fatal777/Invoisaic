import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ArrowRight } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function InteractiveHero() {
  const { theme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  // Generate random dots for background
  const backgroundDots = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
  }));

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
      {/* Interactive Background Dots */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <div className={`absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#F97272]/15 to-zinc-900/10'
            : 'bg-gradient-to-br from-[#EFA498]/30 to-gray-100/30'
        }`} />
        <div className={`absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-zinc-800/10 to-black/5'
            : 'bg-gradient-to-br from-gray-200/20 to-gray-100/20'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-[#F97272]/8 to-zinc-900/5'
            : 'bg-gradient-to-br from-[#EFA498]/30 to-gray-100/20'
        }`} />
        
        {/* Interactive Dots */}
        {backgroundDots.map((dot) => {
          const distance = Math.sqrt(
            Math.pow((dot.x / 100) * window.innerWidth - mousePosition.x, 2) +
            Math.pow((dot.y / 100) * window.innerHeight - mousePosition.y, 2)
          );
          const isNear = distance < 150;
          
          return (
            <motion.div
              key={dot.id}
              className={`absolute rounded-full cursor-pointer ${
                theme === 'dark' ? 'bg-[#F97272]' : 'bg-[#EFA498]'
              }`}
              style={{
                left: `${dot.x}%`,
                top: `${dot.y}%`,
                width: dot.size,
                height: dot.size,
              }}
              animate={{
                scale: isNear || hoveredDot === dot.id ? 3 : 1,
                opacity: isNear || hoveredDot === dot.id ? 1 : 0.3,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              onMouseEnter={() => setHoveredDot(dot.id)}
              onMouseLeave={() => setHoveredDot(null)}
            />
          );
        })}
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

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`text-6xl md:text-8xl lg:text-9xl font-logo font-bold mb-8 leading-none tracking-tight transition-colors ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            AI Invoice
            <br />
            <span className={theme === 'dark' ? 'text-[#F97272]' : 'text-[#EFA498]'}>
              Automation
            </span>
          </motion.h1>

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
