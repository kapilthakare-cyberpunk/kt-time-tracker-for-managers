'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Clock, 
  LogOut, 
  Coffee, 
  Utensils, 
  Play, 
  Square, 
  Activity, 
  Users,
  RefreshCw,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardProps {
  user: any
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [sessionStatus, setSessionStatus] = useState('active')
  const [activities, setActivities] = useState([
    { id: 1, type: 'login', time: '09:00 AM', status: 'completed' },
    { id: 2, type: 'lunch_start', time: '12:00 PM', status: 'completed' },
    { id: 3, type: 'lunch_end', time: '01:00 PM', status: 'completed' },
    { id: 4, type: 'break_start', time: '03:30 PM', status: 'in-progress' },
  ])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleAction = (action: string) => {
    const newActivity = {
      id: activities.length + 1,
      type: action,
      time: currentTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      status: 'completed'
    }
    
    setActivities([newActivity, ...activities])
    toast.success(`${action.replace('_', ' ')} recorded successfully!`)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'User'}!
            </h2>
            <p className="text-white/70">Your time tracking dashboard</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/70 text-sm">Active Session</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Management */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Session Management
          </h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('session_start')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              Start Session
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('session_end')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              <Square className="w-4 h-4" />
              End Session
            </motion.button>
          </div>
        </motion.div>

        {/* Break Management */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Coffee className="w-5 h-5" />
            Break Management
          </h3>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('lunch_start')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
            >
              <Utensils className="w-4 h-4" />
              Start Lunch
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAction('break_start')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
            >
              <Coffee className="w-4 h-4" />
              Start Break
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Today's Activity Log
          </h3>
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="text-white/70 hover:text-white"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-white/10 rounded-lg border-l-4 border-green-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-white font-medium">
                  {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <span className="text-white/70 text-sm">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Team Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Status
          </h3>
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">Live</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'John Doe', status: 'Active', lastActivity: '2 min ago', timeSummary: '8h 30m' },
            { name: 'Jane Smith', status: 'Lunch', lastActivity: '15 min ago', timeSummary: '4h 15m' },
            { name: 'Mike Johnson', status: 'Break', lastActivity: '5 min ago', timeSummary: '6h 45m' },
            { name: 'Sarah Wilson', status: 'Active', lastActivity: '1 min ago', timeSummary: '7h 20m' },
          ].map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="p-4 bg-white/10 rounded-lg border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{member.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  member.status === 'Active' ? 'bg-green-500 text-white' :
                  member.status === 'Lunch' ? 'bg-orange-500 text-white' :
                  'bg-purple-500 text-white'
                }`}>
                  {member.status}
                </span>
              </div>
              <div className="text-white/70 text-sm">
                <div>Last: {member.lastActivity}</div>
                <div>Total: {member.timeSummary}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Logout Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLogout}
          className="bg-white/20 text-white font-semibold py-3 px-8 rounded-lg flex items-center gap-2 mx-auto hover:bg-white/30 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </motion.button>
      </motion.div>
    </div>
  )
} 