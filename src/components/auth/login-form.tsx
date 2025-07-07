"use client"

import type React from "react"
import { SignIn, AuthenticateWithRedirectCallback } from '@clerk/tanstack-react-start'

import logo from '~/assets/piggybanx-bolt.png'

export default function LoginForm() {
  return (
    <div className="flex flex-col items-center text-center">
      <img src={logo} alt="PiggyBanx Logo" width={48} height={48} className="mb-4" />
      <h1 className="text-2xl font-bold tracking-tight">Sign in to PIGGY COMMAND</h1>
      <p className="text-muted-foreground mt-2">Sign in to continue to your dashboard.</p>
      
      <div className="w-full mt-6">
        <SignIn 
          routing="virtual"
          fallbackRedirectUrl="/"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-none border-0",
            }
          }}
        />
      </div>
    </div>
  )
}