import { createFileRoute } from '@tanstack/react-router'

import LoginForm from '~/components/auth/login-form'
import { Button } from '~/components/ui/button'
import logo from '~/assets/piggybanx-bolt.png'

export const Route = createFileRoute('/')({
  component: Login,
})

function CommandCenter() {
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <LoginForm />
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