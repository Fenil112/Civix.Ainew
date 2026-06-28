import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import {
  MapPin, Shield, Zap, Users, Bell, CheckCircle,
  ChevronDown, Star, ArrowRight, Brain, Camera, Globe, Award,
  TrendingUp, Clock, Smartphone
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const stats = [
  { value: '50K+', label: 'Issues Resolved', icon: CheckCircle, color: 'text-emerald-400' },
  { value: '1.2M', label: 'Active Citizens', icon: Users, color: 'text-indigo-400' },
  { value: '95%', label: 'Resolution Rate', icon: TrendingUp, color: 'text-purple-400' },
  { value: '4.2 days', label: 'Avg Resolution', icon: Clock, color: 'text-amber-400' },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description: 'Gemini AI automatically categorizes, prioritizes, and routes issues to the right department—eliminating manual triage.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    icon: Camera,
    title: 'Multi-Media Reporting',
    description: 'Attach photos, videos, or voice recordings. Our AI extracts context from visual data to enhance complaint accuracy.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: MapPin,
    title: 'Smart Location Mapping',
    description: 'GPS-based location tagging with Google Maps integration. Visualize issues as heatmaps by severity and category.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Shield,
    title: 'Duplicate Detection',
    description: 'AI scans existing complaints before submission to prevent duplicates—merging reports and boosting supporter counts instead.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Bell,
    title: 'Real-Time Notifications',
    description: 'Push notifications keep citizens updated through every stage—from submission to resolution and beyond.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Award,
    title: 'Community Leaderboard',
    description: 'Gamification drives civic participation. Earn badges, climb rankings, and get recognized for community contributions.',
    color: 'from-sky-500 to-blue-600',
  },
];

const steps = [
  {
    step: '01',
    title: 'Report an Issue',
    description: 'Take a photo, describe the problem, and let AI fill in the rest. GPS pins the exact location automatically.',
    icon: Smartphone,
  },
  {
    step: '02',
    title: 'AI Validates & Routes',
    description: 'Gemini AI analyzes severity, detects duplicates, categorizes the issue, and assigns it to the right department.',
    icon: Brain,
  },
  {
    step: '03',
    title: 'Authority Acts',
    description: 'Government authorities receive assignments, update progress, and upload repair proof directly in the platform.',
    icon: Shield,
  },
  {
    step: '04',
    title: 'Community Verified',
    description: 'Citizens confirm resolution, earn community points, and the data improves future AI accuracy for your city.',
    icon: CheckCircle,
  },
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Citizen, Mumbai',
    avatar: 'PS',
    text: 'CIVIX AI resolved the broken streetlight near my building in just 3 days. The real-time tracking kept me informed throughout. Incredible platform!',
    rating: 5,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    name: 'Rajesh Kumar',
    role: 'Ward Officer, Delhi',
    avatar: 'RK',
    text: 'As an authority, the AI-categorized dashboard saves 4 hours daily. I can see every complaint in my jurisdiction with priority scoring—game changer.',
    rating: 5,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Ananya Singh',
    role: 'Civic Administrator, Bangalore',
    avatar: 'AS',
    text: 'The analytics dashboard gives us city-wide visibility. We reduced average resolution time by 62% in the first quarter using CIVIX AI insights.',
    rating: 5,
    color: 'from-purple-500 to-pink-600',
  },
];

const faqs = [
  {
    q: 'How does the AI analyze complaints?',
    a: 'We use Google\'s Gemini AI model to analyze your description and any attached media. It extracts location context, identifies the issue category, estimates severity, and automatically routes to the correct government department.',
  },
  {
    q: 'What happens if my complaint is a duplicate?',
    a: 'Before creating a new complaint, CIVIX AI scans the database for similar reports within your area. If a match is found, your complaint is merged with the existing one and your support vote is added—increasing visibility for faster resolution.',
  },
  {
    q: 'How do I know the status of my complaint?',
    a: 'You receive real-time push notifications and email updates at every stage: submitted, verified, assigned, in progress, resolved, and closed. The full timeline is visible on your complaint detail page.',
  },
  {
    q: 'Is CIVIX AI available for all cities?',
    a: 'CIVIX AI is designed to be deployed by any municipal body or government entity. Authorities register and get approved by administrators. The platform scales from single wards to entire metro regions.',
  },
  {
    q: 'How are community scores calculated?',
    a: 'Scores are based on the number of valid complaints filed, issues resolved through your reports, community support received, accuracy of your reports, and early-reporter bonuses for unique issues.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      className="border border-white/5 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-slate-200 font-medium">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 noise-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-bg min-h-screen flex items-center pt-16 pb-20 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6"
              >
                <Zap className="w-3 h-3" />
                AI-Powered Civic Intelligence
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-bold font-display leading-tight mb-6">
                <span className="text-white">Your City.</span>
                <br />
                <span className="gradient-text">Your Voice.</span>
                <br />
                <span className="text-white">AI-Powered.</span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                CIVIX AI transforms how citizens report local issues and how governments resolve them—combining 
                real-time AI analysis, community participation, and government accountability in one unified platform.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="group flex items-center gap-2 px-6 py-3.5 btn-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/20"
                >
                  Report an Issue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/authority/login"
                  className="flex items-center gap-2 px-6 py-3.5 glass border border-white/10 text-slate-300 rounded-xl font-semibold text-sm hover:border-indigo-500/30 hover:text-white transition-all"
                >
                  <Shield className="w-4 h-4" />
                  Authority Portal
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-white/5">
                {stats.slice(0, 2).map((stat) => (
                  <div key={stat.label}>
                    <p className={`text-2xl font-bold ${stat.color} font-display`}>{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right - Live Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] as any }}
              className="relative"
            >
              <div className="glass rounded-2xl overflow-hidden shadow-2xl shadow-black/40 gradient-border">
                {/* Mock Dashboard Header */}
                <div className="bg-surface-800/80 p-4 flex items-center gap-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
                  </div>
                  <div className="flex-1 h-5 bg-surface-700 rounded-lg mx-4" />
                  <div className="w-6 h-6 rounded-lg bg-indigo-600/40" />
                </div>

                {/* Mock Stats */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Active Issues', value: '1,284', color: 'text-amber-400' },
                      { label: 'Resolved Today', value: '47', color: 'text-emerald-400' },
                      { label: 'AI Processed', value: '5,891', color: 'text-indigo-400' },
                      { label: 'Citizens Active', value: '12.4K', color: 'text-purple-400' },
                    ].map((item) => (
                      <div key={item.label} className="bg-surface-700/50 rounded-xl p-3">
                        <p className={`text-xl font-bold ${item.color} font-display`}>{item.value}</p>
                        <p className="text-xs text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mock Issue Cards */}
                  <div className="space-y-2">
                    {[
                      { cat: 'Road & Infrastructure', severity: 'critical', time: '2m ago', color: 'bg-red-500' },
                      { cat: 'Water & Sanitation', severity: 'high', time: '8m ago', color: 'bg-orange-500' },
                      { cat: 'Electricity', severity: 'medium', time: '15m ago', color: 'bg-yellow-500' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.15 }}
                        className="flex items-center gap-3 p-3 bg-surface-700/40 rounded-xl border border-white/5"
                      >
                        <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 font-medium truncate">{item.cat}</p>
                          <p className="text-[10px] text-slate-600">{item.time}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${item.color}/20 text-${item.color.split('-')[1]}-300`}>
                          {item.severity}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as any }}
                className="absolute -top-4 -right-4 glass rounded-xl px-3 py-2 border border-indigo-500/20 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-medium text-slate-200">AI Active</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="impact" className="py-16 border-y border-white/5 bg-surface-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={fadeUp} className="text-center">
                  <Icon className={`w-8 h-8 ${stat.color} mx-auto mb-3`} />
                  <p className={`text-4xl font-bold ${stat.color} font-display mb-1`}>{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </motion.div>
              );
            })}
          </AnimatedSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Features</span>
              <h2 className="text-4xl lg:text-5xl font-bold font-display text-white mt-3 mb-4">
                Built for the Future of Civic Engagement
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Every feature is purpose-built to reduce friction between citizens and government—powered by AI, backed by real data.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    variants={fadeUp}
                    className="glass rounded-2xl p-6 card-hover group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-surface-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-purple-400 text-sm font-semibold uppercase tracking-wider">Process</span>
              <h2 className="text-4xl lg:text-5xl font-bold font-display text-white mt-3 mb-4">
                From Report to Resolution
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.step} variants={fadeUp} className="relative">
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-indigo-500/30 to-transparent z-0" />
                    )}
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-indigo-400" />
                        </div>
                        <span className="text-3xl font-bold text-indigo-500/30 font-display">{step.step}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <span className="text-emerald-400 text-sm font-semibold uppercase tracking-wider">Testimonials</span>
              <h2 className="text-4xl font-bold font-display text-white mt-3">
                Trusted by Citizens & Governments
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <motion.div key={t.name} variants={fadeUp} className="glass rounded-2xl p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-surface-800/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <span className="text-amber-400 text-sm font-semibold uppercase tracking-wider">FAQ</span>
              <h2 className="text-4xl font-bold font-display text-white mt-3">
                Frequently Asked Questions
              </h2>
            </motion.div>

            <div className="space-y-3">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="glass rounded-3xl p-12 gradient-border relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-4xl lg:text-5xl font-bold font-display text-white mb-4">
                  Ready to transform your city?
                </h2>
                <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
                  Join thousands of citizens building a better community. Report your first issue in under 60 seconds.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/register"
                    className="flex items-center gap-2 px-8 py-4 btn-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30"
                  >
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/admin/login"
                    className="px-8 py-4 glass border border-white/10 text-slate-300 rounded-xl font-bold text-sm hover:border-indigo-500/30 transition-all"
                  >
                    Admin Portal
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <span className="font-bold gradient-text font-display">CIVIX AI</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Community Intelligence & Infrastructure Verification Platform
              </p>
            </div>
            {[
              { title: 'Platform', links: ['Report Issue', 'Track Complaints', 'View Map', 'Leaderboard'] },
              { title: 'Authority', links: ['Authority Portal', 'Dashboard', 'Analytics', 'Reports'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Data Policy', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-slate-500 text-sm hover:text-slate-300 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">© 2024 CIVIX AI. All rights reserved.</p>
            <div className="flex items-center gap-2 text-slate-600 text-sm">
              <Globe className="w-4 h-4" />
              <span>Built for Indian Civic Infrastructure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
