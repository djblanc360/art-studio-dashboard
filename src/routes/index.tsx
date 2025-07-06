import { createFileRoute } from '@tanstack/react-router'
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/tanstack-react-start'

import LoginForm from '~/components/auth/login-form'
import { Button } from '~/components/ui/button'
import logo from '~/assets/piggybanx-bolt.png'
import { Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function CommandCenter() {
  const { user } = useUser()
  
  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-4">
        <h3>Welcome, Mr. {user?.firstName || user?.username}. Let us beign</h3>
        <UserButton />
      </div>
      <Outlet />
    </div>
  )
}

function Login() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <img src={logo} alt="PiggyBanx Logo" width={24} height={24} />
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            Sign Up
          </Button>
          <Button variant="default" size="sm">
            Contact
          </Button>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8">
          <LoginForm />
        </div>
      </main>
    </div>
  )
}

function Home() {
  return (
    <>
      <SignedIn>
        <CommandCenter />
      </SignedIn>
      <SignedOut>
        <Login />
      </SignedOut>
    </>
  )
}