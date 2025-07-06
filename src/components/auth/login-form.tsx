"use client"

import type React from "react"
import { SignIn, SignInButton, SignUpButton } from '@clerk/tanstack-react-start'
import { Button } from "~/components/ui/button"

import logo from '~/assets/piggybanx-bolt.png'

export default function LoginForm() {
  return (
    <div className="flex flex-col items-center text-center">
      <img src={logo} alt="PiggyBanx Logo" width={48} height={48} className="mb-4" />
      <h1 className="text-2xl font-bold tracking-tight">Sign in to PIGGY COMMAND</h1>
      <p className="text-muted-foreground mt-2">Sign in to continue to your dashboard.</p>
      
      {/* <div className="w-full mt-6">
        <SignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-none border-0",
            }
          }}
        />
      </div> */}
      
      <div className="mt-6 space-y-3 w-full">
        <SignInButton mode="modal">
          <Button variant="outline" className="w-full">
            Sign In
          </Button>
        </SignInButton>
        
        <SignUpButton mode="modal">
          <Button variant="default" className="w-full">
            Sign Up
          </Button>
        </SignUpButton>
      </div>
    </div>
  )
}