'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Smartphone, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginFormProps {
  onLogin: (userData: any) => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [isGoogleLogin, setIsGoogleLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
    passcode: ''
  })

  const handleGoogleLogin = async () => {
    setIsGoogleLogin(true)
    // Simulate Google login
    setTimeout(() => {
      onLogin({
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://lh3.googleusercontent.com/a/default-user'
      })
      toast.success('Successfully logged in with Google!')
    }, 2000)
  }

  const handlePhoneLogin = async () => {
    if (!formData.phone || !formData.passcode) {
      toast.error('Please fill in all fields')
      return
    }
    
    // Simulate phone login
    onLogin({
      name: 'Quick User',
      phone: formData.phone,
      type: 'phone'
    })
    toast.success('Quick access granted!')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-white/70">Sign in to access your dashboard</p>
        </div>

        {/* Google Login */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleLogin}
          disabled={isGoogleLogin}
          className="w-full bg-white text-gray-800 font-semibold py-3 px-6 rounded-lg mb-6 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
        >
          {isGoogleLogin ? (
            <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <div className="w-5 h-5 bg-red-500 rounded-full"></div>
              Continue with Google
            </>
          )}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="px-4 text-white/60 text-sm">or</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        {/* Quick Access Form */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Quick Access
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter your phone number"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Passcode
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.passcode}
                  onChange={(e) => setFormData({...formData, passcode: e.target.value})}
                  placeholder="Enter 6-digit passcode"
                  maxLength={6}
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePhoneLogin}
              className="btn-primary w-full"
            >
              Sign In
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 