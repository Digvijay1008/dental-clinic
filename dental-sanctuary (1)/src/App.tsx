/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Role = 'SUPER_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
type Page = 'dashboard' | 'leads' | 'appointments' | 'emr' | 'assignment' | 'queue' | 'prescription' | 'billing' | 'whatsapp' | 'inventory';
type AuthStatus = 'landing' | 'login' | 'authenticated';

interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar: string;
}

interface Lead {
  id: string;
  name: string;
  initials: string;
  added: string;
  source: string;
  sourceIcon: string;
  interest: string;
  email: string;
  phone: string;
  status: 'NEW' | 'SCHEDULED' | 'CONTACTED' | 'JUNK';
}

interface Appointment {
  id: string;
  patientName: string;
  time: string;
  duration: string;
  type: string;
  color: string;
  day: number;
  startHour: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}

// --- Mock Data ---
const CLINICS = ['Vasai Branch', 'Kandivali Center', 'Bhayandar Hub', 'Mira Road Clinic', 'Virar Studio'];

const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'Rahul Sharma', initials: 'RS', added: '2 hours ago', source: 'WhatsApp', sourceIcon: 'chat', interest: 'Root Canal', email: 'rahul.s@email.com', phone: '+91 98210 XXXXX', status: 'NEW' },
  { id: '2', name: 'Priya Patel', initials: 'PP', added: '5 hours ago', source: 'Phone Call', sourceIcon: 'call', interest: 'Teeth Cleaning', email: 'p.patel@email.com', phone: '+91 99675 XXXXX', status: 'CONTACTED' },
  { id: '3', name: 'Amit Desai', initials: 'AD', added: 'Yesterday', source: 'Walk-in', sourceIcon: 'directions_walk', interest: 'Dental Checkup', email: 'amit.d@gmail.com', phone: '+91 98765 XXXXX', status: 'NEW' },
  { id: '4', name: 'Neha Gupta', initials: 'NG', added: '3 days ago', source: 'Website', sourceIcon: 'language', interest: 'Braces Consult', email: 'neha.g@corp.com', phone: '+91 87654 XXXXX', status: 'SCHEDULED' },
];

const APPOINTMENTS: Appointment[] = [
  { id: 'a1', patientName: 'Rahul Sharma', time: '09:00 - 10:30', duration: '1.5h', type: 'Root Canal', color: 'bg-teal-50 border-teal-500 text-teal-700', day: 0, startHour: 9 },
  { id: 'a2', patientName: 'Priya Patel', time: '10:00 - 11:00', duration: '1h', type: 'Cleaning', color: 'bg-emerald-50 border-emerald-500 text-emerald-700', day: 1, startHour: 10 },
  { id: 'a3', patientName: 'Amit Desai', time: '11:30 - 12:45', duration: '1.25h', type: 'Checkup', color: 'bg-teal-50 border-teal-500 text-teal-700', day: 1, startHour: 11.5 },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'New Lead', message: 'Rahul Sharma inquired via WhatsApp for Root Canal.', time: '2 mins ago', type: 'info', read: false },
  { id: 'n2', title: 'Appointment Confirmed', message: 'Priya Patel confirmed her 10 AM slot.', time: '15 mins ago', type: 'success', read: false },
  { id: 'n3', title: 'Low Stock Alert', message: 'Dental Cement (GIC) is below 20 units.', time: '1 hour ago', type: 'warning', read: true },
];

// --- Shared Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
              <span className="material-symbols-outlined text-slate-400">close</span>
            </button>
          </div>
          <div className="p-8">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const NotificationPanel = ({ isOpen, onClose, notifications, markAsRead }: { isOpen: boolean; onClose: () => void; notifications: Notification[]; markAsRead: (id: string) => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-transparent" />
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 10, scale: 0.95 }} 
          className="absolute right-12 top-16 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">Notifications</h4>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length} New
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-teal-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                      n.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                      n.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      <span className="material-symbols-outlined text-lg">
                        {n.type === 'success' ? 'check_circle' : n.type === 'warning' ? 'warning' : n.type === 'error' ? 'error' : 'info'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="w-full py-3 text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors border-t border-slate-50">
            View All Activity
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Pages ---

const LandingPage = ({ onLoginClick }: { onLoginClick: () => void }) => (
  <div className="min-h-screen bg-[#f0f9f9] font-sans overflow-x-hidden">
    {/* Navigation */}
    <nav className="flex items-center justify-between px-6 md:px-12 py-6 bg-white/70 backdrop-blur-xl sticky top-0 z-[100] border-b border-teal-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#008080] rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-900/20">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
        </div>
        <h1 className="text-2xl font-black text-[#008080] tracking-tight">Dental Sanctuary</h1>
      </div>
      <div className="hidden md:flex items-center gap-10 font-bold text-slate-600">
        <a href="#features" className="hover:text-[#008080] transition-colors">Features</a>
        <a href="#solutions" className="hover:text-[#008080] transition-colors">Solutions</a>
        <a href="#testimonials" className="hover:text-[#008080] transition-colors">Success Stories</a>
        <button 
          onClick={onLoginClick}
          className="bg-[#008080] text-white px-8 py-2.5 rounded-full shadow-xl shadow-teal-900/20 hover:scale-105 active:scale-95 transition-all"
        >
          Portal Login
        </button>
      </div>
      <button className="md:hidden p-2 text-slate-600">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </nav>

    {/* Hero Section */}
    <section className="relative max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
      >
        <div className="inline-flex items-center gap-2 bg-teal-100/50 border border-teal-200 text-[#008080] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Next-Gen Clinic Management
        </div>
        <h2 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.95] mb-8 tracking-tighter">
          Dental <br />
          <span className="text-[#008080]">Automation</span> <br />
          Platform
        </h2>
        <p className="text-xl text-slate-600 leading-relaxed mb-12 max-w-lg font-medium">
          The all-in-one OS for modern dental groups. Centralize leads, automate patient flows, and scale your practice with AI-driven insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-5">
          <button 
            onClick={onLoginClick}
            className="bg-[#008080] text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-teal-900/30 hover:shadow-teal-900/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            Get Started Free
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button className="bg-white text-slate-900 px-12 py-5 rounded-[2rem] font-black text-xl border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-lg shadow-slate-200/50">
            Watch Demo
          </button>
        </div>
        
        <div className="mt-16 flex items-center gap-6">
          <div className="flex -space-x-4">
            {[1,2,3,4].map(i => (
              <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-12 h-12 rounded-full border-4 border-white shadow-lg" alt="User" />
            ))}
          </div>
          <p className="text-sm font-bold text-slate-500">
            <span className="text-slate-900">500+</span> Clinics trust us daily
          </p>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
        className="relative"
      >
        <div className="relative z-10 bg-white p-4 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,128,128,0.2)] border border-teal-50">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070" 
            alt="Dashboard Preview" 
            className="rounded-[2.5rem] w-full h-auto shadow-inner"
          />
          {/* Floating Card */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 top-1/4 bg-white p-6 rounded-3xl shadow-2xl border border-teal-50 hidden md:block"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</p>
                <p className="text-lg font-black text-slate-900">+24%</p>
              </div>
            </div>
            <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-3/4"></div>
            </div>
          </motion.div>
        </div>
        <div className="absolute -top-20 -right-20 bg-teal-400/20 w-96 h-96 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-20 -left-20 bg-emerald-400/20 w-96 h-96 rounded-full blur-[100px]"></div>
      </motion.div>
    </section>

    {/* Stats Section */}
    <section className="bg-[#004d4d] py-20 text-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
        {[
          { label: 'Active Clinics', value: '1,200+' },
          { label: 'Patients Managed', value: '2.5M+' },
          { label: 'Daily Appointments', value: '45k+' },
          { label: 'Uptime Guarantee', value: '99.9%' },
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <h4 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter">{stat.value}</h4>
            <p className="text-teal-200 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>
    </section>

    {/* Features Grid */}
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h3 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">Everything you need to <span className="text-[#008080]">scale</span></h3>
          <p className="text-xl text-slate-500 font-medium">Stop juggling spreadsheets. Our integrated platform handles the heavy lifting so you can focus on dentistry.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: 'Smart Lead Routing', 
              desc: 'Automatically assign leads from WhatsApp, Phone, and Web to the nearest clinic based on availability.',
              icon: 'hub',
              color: 'bg-teal-50 text-teal-600'
            },
            { 
              title: 'Unified EMR', 
              desc: 'Access patient history, X-rays, and treatment plans across all your branches in a single secure cloud.',
              icon: 'folder_shared',
              color: 'bg-blue-50 text-blue-600'
            },
            { 
              title: 'Automated Recalls', 
              desc: 'AI-driven WhatsApp reminders for follow-ups, cleaning, and pending treatments to boost retention.',
              icon: 'auto_awesome',
              color: 'bg-purple-50 text-purple-600'
            },
            { 
              title: 'Inventory Control', 
              desc: 'Real-time tracking of consumables across centers with automated low-stock purchase orders.',
              icon: 'inventory_2',
              color: 'bg-orange-50 text-orange-600'
            },
            { 
              title: 'Financial Insights', 
              desc: 'Deep dive into revenue, outstanding payments, and clinic performance with beautiful dashboards.',
              icon: 'analytics',
              color: 'bg-emerald-50 text-emerald-600'
            },
            { 
              title: 'Multi-Clinic Queue', 
              desc: 'Manage patient wait times live across all locations. Optimize staff allocation on the fly.',
              icon: 'groups',
              color: 'bg-rose-50 text-rose-600'
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all group"
            >
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h4>
              <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section id="testimonials" className="py-32 bg-teal-50/50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h3 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter">Trusted by the best in <span className="text-[#008080]">dentistry</span>.</h3>
            <p className="text-xl text-slate-600 font-medium mb-12">"Dental Sanctuary transformed our 5-clinic group from a chaotic mess of WhatsApp groups into a streamlined, high-revenue machine. The ROI was immediate."</p>
            <div className="flex items-center gap-4">
              <img src="https://i.pravatar.cc/100?u=doctor" className="w-16 h-16 rounded-full border-4 border-white shadow-xl" alt="Doctor" />
              <div>
                <p className="font-black text-slate-900">Dr. Vikram Shah</p>
                <p className="text-sm font-bold text-teal-600 uppercase tracking-widest">Founder, Smile Dental Group</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-50">
                <p className="text-4xl font-black text-[#008080] mb-2">40%</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Increase in Lead Conversion</p>
              </div>
              <div className="bg-[#008080] p-8 rounded-3xl shadow-xl text-white">
                <p className="text-4xl font-black mb-2">2.5h</p>
                <p className="text-sm font-bold text-teal-100 uppercase tracking-widest">Saved per staff daily</p>
              </div>
            </div>
            <div className="pt-12 space-y-6">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-50">
                <p className="text-4xl font-black text-[#008080] mb-2">15%</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Reduction in No-shows</p>
              </div>
              <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                <p className="text-4xl font-black mb-2">Zero</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Paperwork required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section className="py-32">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-[#008080] rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-[0_48px_96px_-12px_rgba(0,128,128,0.4)]">
          <div className="relative z-10">
            <h3 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Ready to modernize your clinic?</h3>
            <p className="text-xl text-teal-100 mb-12 max-w-2xl mx-auto font-medium">Join 1,200+ clinics already scaling with Dental Sanctuary. No credit card required to start.</p>
            <button 
              onClick={onLoginClick}
              className="bg-white text-[#008080] px-16 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              Start Free Trial
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <footer className="bg-slate-900 text-slate-400 py-24 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#008080] rounded-xl flex items-center justify-center text-white">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Dental Sanctuary</h1>
            </div>
            <p className="text-sm leading-relaxed mb-8">The most advanced automation platform for dental groups and independent practices.</p>
            <div className="flex gap-4">
              {['facebook', 'twitter', 'linkedin', 'instagram'].map(social => (
                <a key={social} href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#008080] hover:text-white transition-all">
                  <span className="material-symbols-outlined text-lg">public</span>
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-white font-black uppercase tracking-widest text-xs mb-8">Product</h5>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-black uppercase tracking-widest text-xs mb-8">Resources</h5>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-black uppercase tracking-widest text-xs mb-8">Company</h5>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-12 border-t border-slate-800 flex flex-col md:row items-center justify-between gap-6">
          <p className="text-xs font-bold uppercase tracking-widest">© 2026 Dental Sanctuary Inc. All rights reserved.</p>
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Status</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

const LoginPage = ({ onLogin }: { onLogin: (role: Role) => void }) => {
  const [selectedRole, setSelectedRole] = useState<Role>('SUPER_ADMIN');

  return (
    <div className="min-h-screen bg-[#e0f2f1] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-teal-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#008080] rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-teal-900/20">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 mt-2">Access your dental sanctuary portal</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Your Role</label>
            <div className="grid grid-cols-1 gap-3">
              {(['SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'] as Role[]).map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    selectedRole === role 
                      ? 'border-[#008080] bg-teal-50 text-[#008080]' 
                      : 'border-slate-100 hover:border-teal-200 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {role === 'SUPER_ADMIN' ? 'admin_panel_settings' : role === 'DOCTOR' ? 'medical_services' : 'person'}
                  </span>
                  <span className="font-bold capitalize">{role.replace('_', ' ').toLowerCase()}</span>
                  {selectedRole === role && <span className="material-symbols-outlined ml-auto">check_circle</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all"
                defaultValue="admin@dentalsanctuary.com"
              />
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
              <input 
                type="password" 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all"
                defaultValue="password123"
              />
            </div>
          </div>

          <button 
            onClick={() => onLogin(selectedRole)}
            className="w-full bg-[#008080] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-teal-900/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            Login to Dashboard
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Forgot password? <a href="#" className="text-[#008080] font-bold hover:underline">Reset here</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const DashboardPage = ({ user, openModal, setPage }: { user: User; openModal: (type: string, data?: any) => void; setPage: (p: Page) => void }) => {
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly'>('monthly');

  const stats = useMemo(() => {
    if (user.role === 'SUPER_ADMIN') {
      return [
        { label: 'Total Revenue (Monthly)', value: '₹28,50,000', change: '+11% vs last month', icon: 'payments', color: 'teal' },
        { label: 'Active Patients', value: '2,340', change: '+156 new this month', icon: 'group', color: 'blue' },
        { label: 'Appointments This Month', value: '1,361', change: 'Across all centers', icon: 'calendar_month', color: 'purple' },
        { label: 'Total Centers', value: '08', change: 'All operational', icon: 'apartment', color: 'orange' },
      ];
    }
    if (user.role === 'DOCTOR') {
      return [
        { label: 'Today\'s Patients', value: '12', change: '4 procedures remaining', icon: 'medical_services', color: 'teal' },
        { label: 'Pending EMRs', value: '03', change: 'Needs update', icon: 'edit_note', color: 'orange' },
        { label: 'Avg. Consultation Time', value: '24m', change: '-2m from yesterday', icon: 'timer', color: 'blue' },
        { label: 'Patient Satisfaction', value: '4.8/5', change: 'Based on 45 reviews', icon: 'star', color: 'purple' },
      ];
    }
    return [
      { label: 'Total Leads Today', value: '24', change: '+8 from yesterday', icon: 'person_add', color: 'teal' },
      { label: 'WhatsApp Enquiries', value: '11', change: '46% of total', icon: 'chat', color: 'emerald' },
      { label: 'Phone Calls', value: '07', change: '29% of total', icon: 'call', color: 'blue' },
      { label: 'Walk-ins', value: '06', change: '25% of total', icon: 'directions_walk', color: 'orange' },
    ];
  }, [user.role]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Management Dashboard</h2>
          <p className="text-slate-500 font-medium">Full business transparency — all clinics at a glance</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
            <button 
              onClick={() => setTimeframe('monthly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'monthly' ? 'bg-teal-50 text-[#008080]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setTimeframe('weekly')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'weekly' ? 'bg-teal-50 text-[#008080]' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Weekly
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#008080] text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-900/20 hover:scale-105 transition-all">
            <span className="material-symbols-outlined text-sm">download</span> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-full">{stat.change}</span>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-bold text-slate-900">Center-wise Performance</h4>
              <button 
                onClick={() => setPage('assignment')}
                className="text-[#008080] text-sm font-bold hover:underline"
              >
                View All Assignments
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-50">
                    <th className="pb-4">Center</th>
                    <th className="pb-4">Revenue</th>
                    <th className="pb-4">Patients</th>
                    <th className="pb-4">Appointments</th>
                    <th className="pb-4 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { name: 'Vasai', rev: '₹4,85,000', pts: 312, apts: 245, trend: '+12%', color: 'text-teal-600' },
                    { name: 'Kandivali', rev: '₹5,20,000', pts: 298, apts: 267, trend: '+8%', color: 'text-teal-600' },
                    { name: 'Bhayandar', rev: '₹3,90,000', pts: 245, apts: 198, trend: '+15%', color: 'text-teal-600' },
                    { name: 'Mira Road', rev: '₹4,10,000', pts: 278, apts: 221, trend: '+6%', color: 'text-teal-600' },
                  ].map((row, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-bold text-slate-800">{row.name}</td>
                      <td className="py-4 text-sm font-semibold text-slate-600">{row.rev}</td>
                      <td className="py-4 text-sm text-slate-500">{row.pts}</td>
                      <td className="py-4 text-sm text-slate-500">{row.apts}</td>
                      <td className={`py-4 text-right text-xs font-bold ${row.color}`}>{row.trend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold">Upcoming Procedures</h4>
              <button onClick={() => setPage('appointments')} className="text-[#008080] text-sm font-bold hover:underline">Manage Full Calendar</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { time: '10:30 AM', title: 'Wisdom Tooth Extraction', patient: 'Arthur Morgan', status: 'Confirmed', color: 'teal' },
                { time: '01:15 PM', title: 'Dental Implant Surgery', patient: 'Sadie Adler', status: 'Pending', color: 'orange' },
              ].map((proc, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-${proc.color}-100 flex items-center justify-center text-${proc.color}-600`}>
                      <span className="material-symbols-outlined">medical_services</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{proc.time}</p>
                      <p className="text-sm font-bold text-slate-900">{proc.title}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Patient: {proc.patient}</p>
                    </div>
                  </div>
                  <button onClick={() => openModal('appointment')} className="p-2 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all">
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-teal-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-teal-900/30 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-6">Quick Actions</h4>
              <div className="space-y-3">
                <button 
                  onClick={() => openModal('lead')}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-white text-[#008080] rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  <span>Add New Patient</span>
                </button>
                <button 
                  onClick={() => openModal('appointment')}
                  className="w-full flex items-center gap-4 px-6 py-4 bg-teal-800 text-teal-100 border border-teal-700 rounded-2xl font-bold hover:bg-teal-700 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">add_task</span>
                  <span>Schedule Appointment</span>
                </button>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
            <h4 className="text-lg font-bold text-slate-900 mb-6">Lead Analytics</h4>
            <div className="space-y-6">
              {[
                { label: 'WhatsApp', value: 145, total: 344, color: 'bg-teal-500' },
                { label: 'Phone Calls', value: 98, total: 344, color: 'bg-blue-500' },
                { label: 'Walk-ins', value: 67, total: 344, color: 'bg-orange-500' },
                { label: 'Website', value: 34, total: 344, color: 'bg-slate-400' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="text-slate-900">{item.value} leads</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${(item.value / item.total) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500">Total Leads</span>
              <span className="text-2xl font-bold text-slate-900">344</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-slate-900">Next Scheduled</h4>
              <button className="text-xs font-bold text-teal-600 hover:underline">Reschedule</button>
            </div>
            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
              <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Root Canal Therapy</p>
              <p className="text-lg font-bold text-slate-900">Nov 02, 2023</p>
              <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs font-medium">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span>10:30 AM • Dr. Mehta</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setPage] = useState<Page>('dashboard');
  const [activeClinic, setActiveClinic] = useState(CLINICS[0]);
  const [isClinicSelectorOpen, setIsClinicSelectorOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  
  // Modal States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Lead | null>(null);

  const handleLogin = (role: Role) => {
    const mockUser: User = {
      id: 'u1',
      name: role === 'SUPER_ADMIN' ? 'Dr. Azhar Ali' : role === 'DOCTOR' ? 'Dr. Mehta' : 'Receptionist Sarah',
      role: role,
      email: `${role.toLowerCase()}@dentalsanctuary.com`,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByUCLxo0woryHnMXGCvTIvn_AFvxf1wOsOWAgV_4qnC3gUooSoHKZ0pjUR83MpoRVb2eqre8M8xyABaXs8zvejsy9qvcAwj2htlZ3lafiW0ggWd_7tbKLs1fm9hcsZleBTVbNjq9Jzvw0VCjgIk8-TS49NanzRQnqBn1Nzi4Zq8d-ZgdG--J8M12yIqH6WI6Umr0utVjPmKeqdZXDCfdBPGnSEZUUKXHMXoeqoZHHh-18hVjz61U9i0uyhXciN-3-_UGALCmyVcF8'
    };
    setUser(mockUser);
    setAuthStatus('authenticated');
    setPage('dashboard');
    
    // Add a welcome notification
    const welcomeNote: Notification = {
      id: Date.now().toString(),
      title: 'Welcome Back',
      message: `Logged in as ${role.replace('_', ' ')}. Have a great day!`,
      time: 'Just now',
      type: 'success',
      read: false
    };
    setNotifications(prev => [welcomeNote, ...prev]);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthStatus('landing');
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const openModal = (type: string, data?: any) => {
    if (data) setSelectedPatient(data);
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedPatient(null);
  };

  const renderContent = () => {
    if (!user) return null;

    switch (currentPage) {
      case 'dashboard': return <DashboardPage user={user} openModal={openModal} setPage={setPage} />;
      case 'leads': return <LeadsPage openModal={openModal} />;
      case 'appointments': return <AppointmentsPage openModal={openModal} />;
      case 'queue': return <QueuePage openModal={openModal} />;
      case 'billing': return <BillingPage openModal={openModal} />;
      case 'inventory': return <InventoryPage />;
      case 'whatsapp': return <WhatsAppPage />;
      case 'assignment': return <ClinicAssignmentPage />;
      case 'prescription': return <PrescriptionPage openModal={openModal} />;
      case 'emr': return <EMRPage />;
      default: return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
          <span className="material-symbols-outlined text-6xl mb-4">construction</span>
          <h2 className="text-2xl font-bold text-slate-600">Module Under Construction</h2>
          <p className="mt-2">The {currentPage.replace('_', ' ')} system is being optimized for your role.</p>
          <button onClick={() => setPage('dashboard')} className="mt-8 px-8 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
            Back to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AnimatePresence mode="wait">
        {authStatus === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LandingPage onLoginClick={() => setAuthStatus('login')} />
          </motion.div>
        )}

        {authStatus === 'login' && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        )}

        {authStatus === 'authenticated' && user && (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex">
            <Sidebar 
              currentPage={currentPage} 
              setPage={setPage} 
              user={user} 
              onLogout={handleLogout} 
            />
            <div className="flex-1 ml-64 min-h-screen">
              <header className="sticky top-0 z-30 flex items-center justify-between px-12 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative w-96 group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input 
                      type="text" 
                      placeholder="Search patient records, invoices..." 
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <button 
                      onClick={() => setIsClinicSelectorOpen(!isClinicSelectorOpen)}
                      className="flex items-center gap-2 text-[#008080] font-bold text-sm cursor-pointer hover:bg-teal-50 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">location_on</span>
                      <span>{activeClinic}</span>
                      <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                    <AnimatePresence>
                      {isClinicSelectorOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                        >
                          {CLINICS.map(c => (
                            <button 
                              key={c} 
                              onClick={() => { setActiveClinic(c); setIsClinicSelectorOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${activeClinic === c ? 'bg-teal-50 text-[#008080]' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <button 
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={`p-2 rounded-full transition-colors relative ${isNotificationOpen ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}
                      >
                        <span className="material-symbols-outlined">notifications</span>
                        {notifications.some(n => !n.read) && (
                          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        )}
                      </button>
                      <NotificationPanel 
                        isOpen={isNotificationOpen} 
                        onClose={() => setIsNotificationOpen(false)} 
                        notifications={notifications} 
                        markAsRead={markAsRead}
                      />
                    </div>
                    <div className="h-6 w-[1px] bg-slate-200"></div>
                    <div className="flex items-center gap-3 pl-2">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-900">{user.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
                      </div>
                      <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-teal-100 shadow-sm" alt="Profile" />
                    </div>
                  </div>
                </div>
              </header>
              <main className="p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal 
        isOpen={activeModal === 'lead'} 
        onClose={closeModal} 
        title="Add New Patient Lead"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
              <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="John Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
              <input type="tel" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Treatment Interest</label>
            <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20">
              <option>Root Canal</option>
              <option>Teeth Cleaning</option>
              <option>Braces Consultation</option>
              <option>Dental Implant</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Source</label>
            <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20">
              <option>WhatsApp</option>
              <option>Phone Call</option>
              <option>Walk-in</option>
              <option>Website</option>
            </select>
          </div>
          <button 
            onClick={() => {
              const newNote: Notification = {
                id: Date.now().toString(),
                title: 'Lead Added',
                message: 'Successfully added a new patient lead to the pipeline.',
                time: 'Just now',
                type: 'success',
                read: false
              };
              setNotifications(prev => [newNote, ...prev]);
              closeModal();
            }}
            className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold shadow-xl shadow-teal-900/20 mt-4"
          >
            Save Lead
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'appointment'} 
        onClose={closeModal} 
        title="Schedule Appointment"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Select Patient</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Search by name or ID..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
              <input type="date" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Time</label>
              <input type="time" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Assigned Doctor</label>
            <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20">
              <option>Dr. Mehta (Endodontist)</option>
              <option>Dr. Shah (Orthodontist)</option>
              <option>Dr. Patel (General)</option>
            </select>
          </div>
          <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-teal-600">chat</span>
            <p className="text-[11px] font-bold text-teal-700">An automatic WhatsApp confirmation will be sent to the patient upon saving.</p>
          </div>
          <button 
            onClick={() => {
              const newNote: Notification = {
                id: Date.now().toString(),
                title: 'Appointment Scheduled',
                message: 'New appointment confirmed and WhatsApp notification sent.',
                time: 'Just now',
                type: 'success',
                read: false
              };
              setNotifications(prev => [newNote, ...prev]);
              closeModal();
            }}
            className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold shadow-xl shadow-teal-900/20 mt-4"
          >
            Confirm Appointment
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'patient_details'} 
        onClose={closeModal} 
        title="Patient Details"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xl">
                {selectedPatient.initials}
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">{selectedPatient.name}</h4>
                <p className="text-sm text-slate-500">{selectedPatient.phone}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                  selectedPatient.status === 'NEW' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {selectedPatient.status}
                </span>
              </div>
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Interest</p>
                <p className="text-sm font-bold text-slate-900">{selectedPatient.interest}</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Internal Notes</label>
              <textarea 
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 h-24 resize-none"
                placeholder="Add notes about this patient..."
              ></textarea>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Archive</button>
              <button className="flex-1 py-3 bg-[#008080] text-white rounded-xl font-bold text-sm">Schedule Call</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal 
        isOpen={activeModal === 'invoice'} 
        onClose={closeModal} 
        title="Create New Invoice"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Patient Name</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Search patient..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Treatment / Item</label>
            <div className="flex gap-2">
              <input type="text" className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="e.g. Root Canal" />
              <input type="number" className="w-24 px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Price" />
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>Subtotal</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-teal-600">
              <span>Total Amount</span>
              <span>₹0.00</span>
            </div>
          </div>
          <button className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold shadow-xl shadow-teal-900/20 mt-4">
            Generate Invoice
          </button>
        </div>
      </Modal>

      <Modal 
        isOpen={activeModal === 'prescription'} 
        onClose={closeModal} 
        title="New Digital Prescription"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Patient</label>
            <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Search patient..." />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Medication</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Drug name..." />
                <input type="text" className="w-32 px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Dosage" />
              </div>
              <textarea className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 h-20 resize-none" placeholder="Instructions (e.g. Twice a day after meals)"></textarea>
            </div>
          </div>
          <button className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold shadow-xl shadow-teal-900/20 mt-4">
            Print & Save Prescription
          </button>
        </div>
      </Modal>
    </div>
  );
}

const LeadsPage = ({ openModal }: { openModal: (t: string, data?: any) => void }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Lead Pipeline</h2>
        <p className="text-slate-500">Track and manage new patient inquiries</p>
      </div>
      <button onClick={() => openModal('lead')} className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
        <span className="material-symbols-outlined">add</span> New Lead
      </button>
    </div>
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            <th className="px-8 py-4">Patient</th>
            <th className="px-8 py-4">Source</th>
            <th className="px-8 py-4">Interest</th>
            <th className="px-8 py-4">Status</th>
            <th className="px-8 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {INITIAL_LEADS.map(lead => (
            <tr key={lead.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openModal('patient_details', lead)}>
              <td className="px-8 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-xs">{lead.initials}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{lead.phone}</p>
                  </div>
                </div>
              </td>
              <td className="px-8 py-4">
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <span className="material-symbols-outlined text-lg">{lead.sourceIcon}</span>
                  <span>{lead.source}</span>
                </div>
              </td>
              <td className="px-8 py-4">
                <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-full">{lead.interest}</span>
              </td>
              <td className="px-8 py-4">
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                  lead.status === 'NEW' ? 'bg-orange-100 text-orange-600' :
                  lead.status === 'SCHEDULED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  {lead.status}
                </span>
              </td>
              <td className="px-8 py-4 text-right">
                <button className="p-2 text-slate-400 hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-all">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const AppointmentsPage = ({ openModal }: { openModal: (t: string, data?: any) => void }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Calendar</h2>
        <p className="text-slate-500">Manage clinic schedules and bookings</p>
      </div>
      <button onClick={() => openModal('appointment')} className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
        <span className="material-symbols-outlined">event</span> Schedule New
      </button>
    </div>
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
      <div className="grid grid-cols-7 gap-4 mb-8">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">{day}</p>
            <div className={`h-24 rounded-2xl border border-slate-100 p-2 flex flex-col items-center justify-center hover:bg-teal-50 transition-colors cursor-pointer ${day === 'Wed' ? 'bg-teal-50 border-teal-200' : ''}`}>
              <span className="text-lg font-bold text-slate-900">{Math.floor(Math.random() * 30) + 1}</span>
              <span className="text-[10px] text-teal-600 font-bold">4 Slots</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <h4 className="font-bold text-slate-900">Today's Schedule</h4>
        {APPOINTMENTS.map(apt => (
          <div key={apt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white flex flex-col items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-slate-900">{apt.time.split(' ')[0]}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">AM</span>
              </div>
              <div className="cursor-pointer" onClick={() => openModal('patient_details', { name: apt.patientName, initials: apt.patientName.split(' ').map(n => n[0]).join(''), phone: '+91 XXXXX XXXXX', status: 'SCHEDULED', interest: apt.type })}>
                <p className="text-sm font-bold text-slate-900">{apt.patientName}</p>
                <p className="text-[11px] text-slate-500 font-medium">{apt.type} • {apt.duration}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-600 transition-colors">Reschedule</button>
              <button className="px-4 py-2 bg-[#008080] text-white rounded-xl text-xs font-bold shadow-md">Check-in</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const QueuePage = ({ openModal }: { openModal: (t: string, data?: any) => void }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Live Queue</h2>
        <p className="text-slate-500">Real-time patient flow management</p>
      </div>
      <div className="flex gap-3">
        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
          Avg. Wait: 12m
        </div>
        <button onClick={() => openModal('appointment')} className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
          <span className="material-symbols-outlined">add</span> Add Walk-in
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {[
          { name: 'Rahul Sharma', time: '10:15 AM', status: 'In Consultation', doctor: 'Dr. Mehta', room: 'Room 1', color: 'teal' },
          { name: 'Priya Patel', time: '10:45 AM', status: 'Waiting', doctor: 'Dr. Shah', room: 'Waiting Area', color: 'orange' },
          { name: 'Amit Desai', time: '11:00 AM', status: 'Waiting', doctor: 'Dr. Mehta', room: 'Waiting Area', color: 'orange' },
        ].map((q, i) => (
          <div key={i} className={`p-6 bg-white rounded-[2rem] shadow-sm border-l-8 border-${q.color}-500 flex items-center justify-between group hover:shadow-xl transition-all`}>
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined text-3xl">person</span>
              </div>
              <div className="cursor-pointer" onClick={() => openModal('patient_details', { name: q.name, initials: q.name.split(' ').map(n => n[0]).join(''), phone: '+91 XXXXX XXXXX', status: q.status === 'Waiting' ? 'NEW' : 'CONTACTED', interest: 'General Checkup' })}>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-lg font-bold text-slate-900">{q.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.status === 'Waiting' ? 'bg-orange-50 text-orange-600' : 'bg-teal-50 text-teal-600'}`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{q.doctor} • {q.room}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Arrival</p>
                <p className="text-sm font-bold text-slate-900">{q.time}</p>
              </div>
              <div className="h-10 w-[1px] bg-slate-100"></div>
              <button className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${q.status === 'Waiting' ? 'bg-[#008080] text-white shadow-lg shadow-teal-900/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                {q.status === 'Waiting' ? 'Call Patient' : 'In Progress'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-6">Clinic Status</h4>
          <div className="space-y-4">
            {[
              { room: 'Room 1', status: 'Occupied', doctor: 'Dr. Mehta' },
              { room: 'Room 2', status: 'Available', doctor: 'None' },
              { room: 'Room 3', status: 'Occupied', doctor: 'Dr. Shah' },
              { room: 'X-Ray Room', status: 'Available', doctor: 'None' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-xs font-bold text-slate-700">{r.room}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'Available' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const BillingPage = ({ openModal }: { openModal: (t: string) => void }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Billing & Invoices</h2>
        <p className="text-slate-500">Manage patient payments and clinic revenue</p>
      </div>
      <button onClick={() => openModal('invoice')} className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
        <span className="material-symbols-outlined">add</span> Create Invoice
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'Pending Payments', value: '₹1,45,000', icon: 'pending_actions', color: 'orange' },
        { label: 'Collected Today', value: '₹84,200', icon: 'payments', color: 'emerald' },
        { label: 'Monthly Revenue', value: '₹28,50,000', icon: 'account_balance_wallet', color: 'teal' },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
          <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-4`}>
            <span className="material-symbols-outlined">{stat.icon}</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
          <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <h4 className="font-bold text-slate-900">Recent Transactions</h4>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold">All</button>
          <button className="px-4 py-2 text-slate-400 rounded-xl text-xs font-bold">Unpaid</button>
          <button className="px-4 py-2 text-slate-400 rounded-xl text-xs font-bold">Refunded</button>
        </div>
      </div>
      <table className="w-full text-left">
        <thead className="bg-slate-50">
          <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            <th className="px-8 py-4">Invoice ID</th>
            <th className="px-8 py-4">Patient</th>
            <th className="px-8 py-4">Amount</th>
            <th className="px-8 py-4">Status</th>
            <th className="px-8 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {[
            { id: 'INV-99021', patient: 'Rahul Sharma', amount: '₹12,500', status: 'Paid', date: 'Oct 24, 2023' },
            { id: 'INV-99022', patient: 'Priya Patel', amount: '₹4,200', status: 'Pending', date: 'Oct 24, 2023' },
            { id: 'INV-99023', patient: 'Amit Desai', amount: '₹1,500', status: 'Paid', date: 'Oct 23, 2023' },
          ].map(inv => (
            <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
              <td className="px-8 py-4 font-bold text-slate-900 text-sm">{inv.id}</td>
              <td className="px-8 py-4">
                <p className="text-sm font-bold text-slate-900">{inv.patient}</p>
                <p className="text-[10px] text-slate-400 font-medium">{inv.date}</p>
              </td>
              <td className="px-8 py-4 text-sm font-bold text-slate-900">{inv.amount}</td>
              <td className="px-8 py-4">
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                  inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {inv.status}
                </span>
              </td>
              <td className="px-8 py-4 text-right">
                <button className="p-2 text-slate-400 hover:text-teal-600 transition-all">
                  <span className="material-symbols-outlined">print</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);


const ClinicAssignmentPage = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Clinic Assignment</h2>
        <p className="text-slate-500">Assign doctors and staff to clinic branches</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {CLINICS.map((clinic, i) => (
        <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{clinic}</h4>
                <p className="text-xs text-slate-500">Active Branch</p>
              </div>
            </div>
            <button className="text-teal-600 font-bold text-xs hover:underline">Manage</button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-[10px]">DM</div>
                <span className="text-sm font-bold text-slate-700">Dr. Mehta</span>
              </div>
              <span className="px-2 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg">Primary</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-[10px]">DS</div>
                <span className="text-sm font-bold text-slate-700">Dr. Shah</span>
              </div>
              <span className="px-2 py-1 bg-slate-200 text-slate-500 text-[10px] font-bold rounded-lg">On Leave</span>
            </div>
          </div>
          <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-teal-200 hover:text-teal-600 transition-all">
            + Assign Staff
          </button>
        </div>
      ))}
    </div>
  </div>
);

const PrescriptionPage = ({ openModal }: { openModal: (t: string) => void }) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Digital Prescriptions</h2>
        <p className="text-slate-500">Create and manage patient prescriptions</p>
      </div>
      <button onClick={() => openModal('prescription')} className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
        <span className="material-symbols-outlined">add_notes</span> New Prescription
      </button>
    </div>
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50">
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20" placeholder="Search drug database..." />
          </div>
          <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold">Search</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-teal-600">history</span> Recent Prescriptions
            </h4>
            {[
              { patient: 'Rahul Sharma', date: 'Oct 24, 2023', drugs: 'Amoxicillin, Paracetamol' },
              { patient: 'Priya Patel', date: 'Oct 22, 2023', drugs: 'Ibuprofen, Mouthwash' },
            ].map((p, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-slate-900">{p.patient}</p>
                  <span className="text-[10px] text-slate-400 font-bold">{p.date}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{p.drugs}</p>
              </div>
            ))}
          </div>
          <div className="p-6 bg-teal-50 rounded-[2rem] border border-teal-100">
            <h4 className="font-bold text-teal-900 mb-4">Quick Templates</h4>
            <div className="grid grid-cols-2 gap-3">
              {['Post-Extraction', 'Root Canal Care', 'Orthodontic Pain', 'Gum Infection'].map(t => (
                <button key={t} className="p-3 bg-white rounded-xl text-[11px] font-bold text-teal-700 shadow-sm hover:shadow-md transition-all text-left">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const EMRPage = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Electronic Medical Records</h2>
        <p className="text-slate-500">Comprehensive patient clinical history</p>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-4">Patient List</h4>
          <div className="space-y-2">
            {INITIAL_LEADS.map(p => (
              <button key={p.id} className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-teal-50 transition-all text-left group">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] group-hover:bg-teal-200 group-hover:text-teal-600">{p.initials}</div>
                <span className="text-xs font-bold text-slate-700">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <span className="material-symbols-outlined text-4xl">account_circle</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Rahul Sharma</h3>
                <p className="text-sm text-slate-500 font-medium">Patient ID: #PS-2023-001 • 28 Years • Male</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-teal-600 transition-all">
                <span className="material-symbols-outlined">print</span>
              </button>
              <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-teal-600 transition-all">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Allergies</p>
              <p className="text-sm font-bold text-rose-700">Penicillin, Pollen</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Blood Group</p>
              <p className="text-sm font-bold text-emerald-700">O Positive</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Last Visit</p>
              <p className="text-sm font-bold text-orange-700">24 Oct 2023</p>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-slate-900">Clinical Notes</h4>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-400">Oct 24, 2023 • Dr. Mehta</span>
                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-lg">Root Canal</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Patient presented with acute pain in upper right molar. X-ray revealed deep decay reaching the pulp. Initiated first stage of RCT. Cleaning and shaping completed. Temporary filling placed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const InventoryPage = () => {
  const inventory = [
    { id: 1, name: 'Dental Implants', category: 'Surgical', stock: 45, unit: 'pcs', status: 'In Stock' },
    { id: 2, name: 'Composite Resin', category: 'Restorative', stock: 12, unit: 'tubes', status: 'Low Stock' },
    { id: 3, name: 'Local Anesthesia', category: 'Consumables', stock: 150, unit: 'vials', status: 'In Stock' },
    { id: 4, name: 'Face Masks', category: 'PPE', stock: 5, unit: 'boxes', status: 'Critical' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Inventory Management</h2>
          <p className="text-slate-500">Track and manage clinic supplies</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#008080] text-white rounded-2xl font-bold shadow-lg shadow-teal-900/20">
          <span className="material-symbols-outlined">add</span> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Items', value: '1,240', icon: 'inventory_2', color: 'teal' },
          { label: 'Low Stock Alerts', value: '8', icon: 'warning', color: 'orange' },
          { label: 'Out of Stock', value: '2', icon: 'error', color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50">
            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-600 mb-4`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              <th className="px-8 py-4">Item Name</th>
              <th className="px-8 py-4">Category</th>
              <th className="px-8 py-4">Stock Level</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-4 font-bold text-slate-900 text-sm">{item.name}</td>
                <td className="px-8 py-4 text-sm text-slate-500">{item.category}</td>
                <td className="px-8 py-4 text-sm font-bold text-slate-900">{item.stock} {item.unit}</td>
                <td className="px-8 py-4">
                  <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                    item.status === 'In Stock' ? 'bg-emerald-50 text-emerald-600' :
                    item.status === 'Low Stock' ? 'bg-orange-50 text-orange-600' :
                    'bg-rose-50 text-rose-600'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button className="text-teal-600 font-bold text-xs hover:underline">Order</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const WhatsAppPage = () => {
  const chats = [
    { id: 1, name: 'Rahul Sharma', lastMsg: 'I need to reschedule my appointment.', time: '10:30 AM', unread: 2 },
    { id: 2, name: 'Anita Desai', lastMsg: 'Thank you for the prescription.', time: 'Yesterday', unread: 0 },
    { id: 3, name: 'Vikram Singh', lastMsg: 'Is the clinic open on Sunday?', time: 'Yesterday', unread: 0 },
  ];

  return (
    <div className="h-[calc(100vh-180px)] flex gap-6">
      <div className="w-80 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input type="text" className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm" placeholder="Search chats..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.map((chat) => (
            <button key={chat.id} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-2xl transition-all text-left group">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold">
                {chat.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900 truncate">{chat.name}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
              </div>
              {chat.unread > 0 && (
                <div className="w-5 h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-teal-500/20">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold">R</div>
            <div>
              <h3 className="font-bold text-slate-900">Rahul Sharma</h3>
              <p className="text-[10px] text-teal-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-teal-600 transition-all shadow-sm">
              <span className="material-symbols-outlined">call</span>
            </button>
            <button className="p-3 bg-white text-slate-400 rounded-xl hover:text-teal-600 transition-all shadow-sm">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/10">
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed">Hello, I have an appointment tomorrow at 11 AM.</p>
              <p className="text-[10px] text-slate-400 mt-2 text-right font-bold">10:25 AM</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100">
              <p className="text-sm text-slate-700 leading-relaxed">But I need to reschedule it to next Monday if possible.</p>
              <p className="text-[10px] text-slate-400 mt-2 text-right font-bold">10:26 AM</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[70%] bg-[#008080] p-4 rounded-3xl rounded-tr-none shadow-lg shadow-teal-900/10 text-white">
              <p className="text-sm leading-relaxed">Sure Rahul, let me check the availability for Monday.</p>
              <p className="text-[10px] text-teal-100 mt-2 text-right font-bold">10:30 AM</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 flex gap-4 items-center bg-white">
          <button className="p-3 text-slate-400 hover:text-teal-500 transition-all"><span className="material-symbols-outlined">add_circle</span></button>
          <input type="text" className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 text-sm" placeholder="Type a message..." />
          <button className="w-14 h-14 bg-[#008080] text-white rounded-2xl shadow-xl shadow-teal-900/20 flex items-center justify-center hover:scale-105 transition-all">
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};


const Sidebar = ({ currentPage, setPage, user, onLogout }: { currentPage: Page, setPage: (p: Page) => void, user: User, onLogout: () => void }) => {
  const allNavItems: { id: Page; icon: string; label: string; roles: Role[] }[] = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'leads', icon: 'person_add', label: 'Lead Capture', roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
    { id: 'assignment', icon: 'hub', label: 'Clinic Assignment', roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
    { id: 'appointments', icon: 'calendar_today', label: 'Appointments', roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'queue', icon: 'reorder', label: 'Queue', roles: ['SUPER_ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'emr', icon: 'medical_services', label: 'EMR', roles: ['SUPER_ADMIN', 'DOCTOR'] },
    { id: 'prescription', icon: 'description', label: 'Prescription', roles: ['SUPER_ADMIN', 'DOCTOR'] },
    { id: 'billing', icon: 'payments', label: 'Billing', roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
    { id: 'whatsapp', icon: 'chat', label: 'WhatsApp', roles: ['SUPER_ADMIN', 'RECEPTIONIST'] },
    { id: 'inventory', icon: 'inventory_2', label: 'Inventory', roles: ['SUPER_ADMIN'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="fixed left-0 top-0 h-screen z-40 flex flex-col w-64 bg-white border-r border-slate-100 shadow-sm">
      <div className="px-6 py-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#008080] rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-900/20">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dentistry</span>
          </div>
          <h1 className="text-xl font-bold text-[#008080]">Sanctuary</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto min-h-0 custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              currentPage === item.id
                ? 'text-[#008080] bg-teal-50 font-bold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-50 shrink-0">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="User" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">logout</span> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};
