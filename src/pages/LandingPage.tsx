import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Shield, Zap, Brain, CloudRain, Car, MapPin, Radio,
  BarChart3, AlertTriangle, Users, ArrowRight, ChevronDown, Globe,
  Cpu, Database, Lock, Eye, Gauge, Ambulance, HeartPulse, Leaf,
  Fuel, Briefcase, CheckCircle2, XCircle, Sparkles
} from 'lucide-react';

const STATS = [
  { label: 'Indian Zones Monitored', value: '36', icon: MapPin },
  { label: 'Real-Time Data Points', value: '10K+', icon: Database },
  { label: 'AI Prediction Accuracy', value: '92%', icon: Brain },
  { label: 'Avg Response Time', value: '<2s', icon: Zap },
];

const FEATURES = [
  {
    icon: Car,
    title: 'Real-Time Traffic Intelligence',
    desc: 'Live congestion tracking across 36 states & UTs with vehicle counts, average speeds, and congestion heatmaps powered by real sensor data.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    image: '/images/hero-dashboard.jpg',
  },
  {
    icon: Brain,
    title: 'AI-Powered Predictions',
    desc: 'LSTM-style deep learning model predicts traffic congestion 30/60/120 minutes ahead. Accuracy timeline tracks model improvement over time.',
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10',
    image: '/images/ai-prediction.jpg',
  },
  {
    icon: CloudRain,
    title: 'Flood Risk Monitoring',
    desc: 'OpenWeatherMap API fetches live rainfall for all zones. Elevation-based risk scoring identifies flood-vulnerable areas before disaster strikes.',
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    image: '/images/flood-monitoring.jpg',
  },
  {
    icon: Ambulance,
    title: 'Emergency Dispatch System',
    desc: 'Real-time tracking of ambulance, fire, and police units. Optimized route calculation for fastest emergency response across India.',
    color: 'text-neon-orange',
    bg: 'bg-neon-orange/10',
    image: '/images/hero-dashboard.jpg',
  },
];

const TECH_STACK = [
  { name: 'React + Vite', desc: 'Lightning-fast frontend', icon: Zap },
  { name: 'Three.js + Leaflet', desc: '3D & Map visualization', icon: Globe },
  { name: 'Supabase Cloud', desc: 'Real-time backend', icon: Database },
  { name: 'OpenWeatherMap', desc: 'Live weather API', icon: CloudRain },
  { name: 'AI/ML Models', desc: 'LSTM predictions', icon: Cpu },
  { name: 'RLS Security', desc: 'Row-level protection', icon: Lock },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [count, setCount] = useState({ zones: 0, points: 0, accuracy: 0 });

  // Animated counter
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setCount({
        zones: Math.floor(36 * progress),
        points: Math.floor(10000 * progress),
        accuracy: Math.floor(92 * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % FEATURES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center glow-blue">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-lg tracking-widest text-primary text-glow-blue">URBANPULSE</h1>
              <p className="text-[10px] text-muted-foreground font-mono-tech -mt-1">India Digital Twin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/auth')}
              className="px-4 py-2 text-sm font-mono-tech text-foreground hover:text-primary transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2 text-sm font-mono-tech bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors glow-blue"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 grid-bg">
        {/* Animated grid overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8"
            >
              <Radio className="w-3 h-3 text-neon-green animate-pulse" />
              <span className="text-xs font-mono-tech text-primary">LIVE — Real-Time Data from 36 Indian Zones</span>
            </motion.div>

            <h1 className="font-display text-5xl md:text-7xl tracking-wider text-foreground leading-tight mb-6">
              India's{' '}
              <span className="text-primary text-glow-blue">Predictive</span>
              <br />
              Urban Digital Twin
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground font-body max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered command center monitoring <span className="text-primary">traffic</span>,{' '}
              <span className="text-neon-cyan">weather</span>,{' '}
              <span className="text-neon-orange">accidents</span>, and{' '}
              <span className="text-neon-green">emergencies</span> across all Indian states & union territories — in real time.
            </p>

            <div className="flex items-center justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/auth')}
                className="group flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-mono-tech text-sm rounded-lg hover:bg-primary/90 transition-all glow-blue"
              >
                Launch Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-3.5 border border-border text-foreground font-mono-tech text-sm rounded-lg hover:border-primary/50 transition-colors"
              >
                Explore Features
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 via-transparent to-transparent rounded-2xl blur-xl" />
            <div className="relative rounded-xl overflow-hidden border border-border border-glow">
              <img
                src="/images/hero-dashboard.jpg"
                alt="UrbanPulse Dashboard — Real-time monitoring of India's urban infrastructure"
                className="w-full"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="font-display text-3xl text-foreground">{stat.value}</div>
              <div className="text-xs font-mono-tech text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-mono-tech text-primary tracking-widest uppercase">Core Capabilities</span>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mt-3">
              Powered by Real-Time Data & AI
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Every data point is sourced from live APIs. No mock data. No stale datasets.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Feature Cards */}
            <div className="space-y-4">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveFeature(i)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                    activeFeature === i
                      ? 'border-primary/50 bg-primary/5 border-glow'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${feature.bg}`}>
                      <feature.icon className={`w-5 h-5 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-sm tracking-wider text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 font-body leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feature Preview */}
            <div className="relative lg:sticky lg:top-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-xl overflow-hidden border border-border"
                >
                  <img
                    src={FEATURES[activeFeature].image}
                    alt={FEATURES[activeFeature].title}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-mono-tech text-neon-green tracking-widest uppercase">Enterprise-Grade</span>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mt-3">
              Security at Every Layer
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Row-Level Security', desc: 'Every database table protected with granular RLS policies. Users can only access their own data.', color: 'text-neon-green' },
              { icon: Lock, title: 'Authenticated Access', desc: 'Emergency unit locations, citizen reports, and user profiles are accessible only to verified users.', color: 'text-primary' },
              { icon: Eye, title: 'Vote Manipulation Guard', desc: 'Server-side triggers prevent vote count tampering. Only the trigger function can modify vote counts.', color: 'text-neon-cyan' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
                <h3 className="font-display text-sm tracking-wider text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs font-mono-tech text-neon-purple tracking-widest uppercase">Architecture</span>
            <h2 className="font-display text-3xl md:text-4xl text-foreground mt-3">
              Built with Modern Tech
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TECH_STACK.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
              >
                <tech.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                <div className="font-display text-xs tracking-wider text-foreground">{tech.name}</div>
                <div className="text-xs text-muted-foreground font-mono-tech mt-1">{tech.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-5xl text-foreground mb-6">
              Ready to Monitor India's Pulse?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 font-body">
              Sign up in seconds and access the real-time urban intelligence dashboard.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/auth')}
                className="group flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground font-mono-tech rounded-lg hover:bg-primary/90 transition-all glow-blue text-base"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="px-10 py-4 border border-border text-foreground font-mono-tech rounded-lg hover:border-primary/50 transition-colors text-base"
              >
                Sign In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="font-display text-sm tracking-widest text-primary">URBANPULSE</span>
          </div>
          <p className="text-xs text-muted-foreground font-mono-tech">
            © 2026 UrbanPulse — India's Predictive Digital Twin Platform
          </p>
          <div className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-neon-green animate-pulse" />
            <span className="text-xs font-mono-tech text-neon-green">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
