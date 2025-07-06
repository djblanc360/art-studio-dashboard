"use client"

import type React from "react"
import { GoogleLogo, GitHubLogo } from "~/components/icons"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

import { Link, useNavigate } from "@tanstack/react-router"

import logo from '~/assets/piggybanx-bolt.png'

export default function LoginForm() {
    const navigate = useNavigate()

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        console.log("Login form submitted")
        navigate({ to: "/" })
    }

  return (
    <div className="flex flex-col items-center text-center">
      <img src={logo} alt="PiggyBanx Logo" width={48} height={48} className="mb-4" />
      <h1 className="text-2xl font-bold tracking-tight">Sign in to PIGGY COMMAND</h1>
      <p className="text-muted-foreground mt-2">Sign in to continue to your dashboard.</p>
      <form onSubmit={handleLogin} className="w-full mt-6 space-y-4">
        <div className="grid w-full items-center gap-1.5 text-left">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="Email Address" />
        </div>
        <Button type="submit" className="w-full">
          Continue with Email
        </Button>
      </form>
      <div className="relative my-6 w-full">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>
      <div className="space-y-3 w-full">
        <Button variant="outline" className="w-full bg-transparent">
          <GoogleLogo className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
        <Button variant="outline" className="w-full bg-transparent">
          <GitHubLogo className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>
      </div>
      <div className="mt-6">
        <button className="text-sm text-muted-foreground hover:text-foreground">Show other options</button>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link to="/" className="font-semibold text-primary hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  )
}