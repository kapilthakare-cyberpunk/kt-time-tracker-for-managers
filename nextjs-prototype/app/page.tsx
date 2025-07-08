'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Activity, LogIn, LogOut, Coffee, Utensils } from 'lucide-react'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData: any) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700">
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 flex items-center justify-center gap-4">
            <Clock className="w-12 h-12" />
            P&Z Time Tracker
          </h1>
          <p className="text-xl text-white/80">Next.js Version - Modern & Responsive</p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {!isAuthenticated ? (
            <LoginForm onLogin={handleLogin} />
          ) : (
            <Dashboard user={user} onLogout={handleLogout} />
          )}
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="glass-card p-6 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-primary-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
            <p className="text-white/70">Track your entire team's time and activities in real-time</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Activity Logging</h3>
            <p className="text-white/70">Automatic activity tracking with detailed logs and reports</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-primary-400" />
            <h3 className="text-xl font-semibold text-white mb-2">Break Management</h3>
            <p className="text-white/70">Efficient lunch and break time management for your team</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 