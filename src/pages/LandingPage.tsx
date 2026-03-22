import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion'; // <-- type import
import { 
  ShoppingBag, 
  Store, 
  Bike, 
  Search, 
  Package, 
  Truck, 
  User, 
  LogIn,
  ChevronDown,
  Play,
  Star,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types'; // <-- import enum

// Animation variants (rest unchanged)
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const scaleOnHover: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Scroll-triggered section component (unchanged)
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "" 
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Feature Card Component (unchanged)
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, color }) => {
  return (
    <motion.div
      variants={scaleOnHover}
      initial="rest"
      whileHover="hover"
      className={`relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl border border-gray-100 ${color}`}
    >
      <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-gray-900">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 opacity-50" />
    </motion.div>
  );
};

// Step Component (unchanged)
interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ number, icon, title, description }) => {
  return (
    <motion.div 
      variants={fadeInUp}
      className="relative flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
          {icon}
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-indigo-600 shadow-md border border-gray-100">
          {number}
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-xs text-gray-600">{description}</p>
    </motion.div>
  );
};

// Testimonial Card (unchanged)
interface TestimonialProps {
  name: string;
  role: string;
  quote: string;
  image: string;
  rating: number;
}

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, quote, image, rating }) => {
  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-2xl bg-white p-6 shadow-xl border border-gray-100"
    >
      <div className="mb-4 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <p className="mb-6 text-gray-700 italic leading-relaxed">"{quote}"</p>
      <div className="flex items-center gap-4">
        <img
          src={image}
          alt={name}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-indigo-100"
        />
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </div>
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAuthClick = () => {
    if (isAuthenticated) {
      // Navigate based on role using enum values
      if (user?.role === UserRole.SELLER) {
        navigate('/seller');
      } else if (user?.role === UserRole.RIDER) {
        navigate('/rider');
      } else {
        navigate('/dashboard'); // default for customer
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EasyBuy
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAuthClick}
                className="flex items-center gap-2 hover:bg-gray-100"
              >
                {isAuthenticated ? (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                      <User className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-gray-700">
                      {user?.fullName || 'Profile'}   {/* <-- use fullName */}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm font-medium">Login</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Video – unchanged */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            poster="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80"
          >
            <source
              src="https://cdn.pixabay.com/video/2020/05/25/40130-424930032_large.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex h-full items-center justify-center px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="mb-6 text-5xl font-bold text-white sm:text-6xl md:text-7xl lg:text-8xl"
            >
              EasyBuy
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mb-8 text-xl text-gray-200 sm:text-2xl md:text-3xl font-light"
            >
              Shop Smarter, Deliver Faster
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Button
                size="lg"
                onClick={scrollToFeatures}
                className="group bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-full shadow-xl transition-all"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm px-8 py-6 text-lg rounded-full"
                onClick={() => navigate('/login')}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.div
              variants={fadeIn}
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ChevronDown className="h-8 w-8 text-white/60" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* All remaining sections remain unchanged */}
      {/* ... (rest of the file – keep as is) ... */}

    </div>
  );
};

export default LandingPage;
