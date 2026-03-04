'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Building2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-transparent text-foreground overflow-hidden relative">
      {/* construction site background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/background.jpg" /* background2 image */
          alt="landing page background"
          className="w-full h-full object-cover opacity-25 dark:opacity-40 animate-bgZoom"
        />
      </div>
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-between px-8 sm:px-12 lg:px-16">
        
        {/* Left side - Logo and Brand */}
        <div className="flex-1 animate-fadeIn space-y-8">
          <div className="space-y-6">
            {/* Logo and Name */}
            <div className="flex items-center gap-4 group">
              <div className="bg-foreground p-4 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg shadow-md">
                <Building2 className="w-12 h-12 text-background" />
              </div>
              <div className="space-y-1">
                <h1 className="text-6xl sm:text-7xl font-bold text-foreground tracking-tight">
                  BuildPro
                </h1>
                <div className="h-1 w-20 bg-foreground/30 rounded-full group-hover:w-40 transition-all duration-500"></div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3 max-w-md">
              <p className="text-lg sm:text-xl text-foreground/80 font-medium">
                The complete platform to manage industry operations
              </p>
              
              <p className="text-sm sm:text-base text-foreground/60">
                Connect builders, vendors, and workers. Manage jobs, process payments, and communicate in real-time—all in one seamless platform.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-foreground/20">
              <div className="space-y-1 group cursor-default">
                <p className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">2000+</p>
                <p className="text-xs sm:text-sm text-foreground/60">Active Users</p>
              </div>
              <div className="space-y-1 group cursor-default">
                <p className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">10K+</p>
                <p className="text-xs sm:text-sm text-foreground/60">Jobs Done</p>
              </div>
              <div className="space-y-1 group cursor-default">
                <p className="text-3xl sm:text-4xl font-bold text-foreground group-hover:text-foreground/80 transition-colors">$5M+</p>
                <p className="text-xs sm:text-sm text-foreground/60">Processed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Buttons */}
        <div className="flex-1 flex items-center justify-end pl-2 animate-fadeInRight">
          <div className="flex flex-col gap-6 w-full max-w-xs">
            {/* Sign Up Button */}
            <Link href="/register" className="group">
              <Button 
                size="lg" 
                className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl shadow-lg font-semibold text-lg py-6"
              >
                Sign Up
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            {/* Log In Button */}
            <Link href="/login" className="group">
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-xl shadow-lg font-semibold text-lg py-6"
              >
                Log In
              </Button>
            </Link>

            {/* CTA Text */}
            <p className="text-center text-sm text-foreground/60 mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="fixed bottom-8 left-8 w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDuration: '5s' }}></div>
      <div className="fixed top-1/4 right-12 w-2 h-2 bg-foreground rounded-full animate-bounce" style={{ animationDuration: '6s' }}></div>
    </div>
  )
}
