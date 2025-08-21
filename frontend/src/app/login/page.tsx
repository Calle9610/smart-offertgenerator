import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/serverSession'
import LoginForm from '@/components/LoginForm'

/*
 * Login Page - Server Component
 * 
 * Denna sida kontrollerar om användaren redan är inloggad:
 * - Om inloggad → redirect till /quotes
 * - Om inte inloggad → visa LoginForm
 * 
 * Använder getServerSession() för att läsa cookies och kontrollera session
 * på servern innan sidan renderas.
 */

export default async function LoginPage() {
  // Kontrollera om användaren redan är inloggad
  const user = await getServerSession()
  
  if (user) {
    // Användaren är redan inloggad, redirecta till quotes
    console.log('LoginPage: User already authenticated, redirecting to /quotes')
    redirect('/quotes')
  }
  
  // Användaren är inte inloggad, visa login-formuläret
  console.log('LoginPage: User not authenticated, showing login form')
  
  return (
    <div className="min-h-screen bg-gray-50">
      <LoginForm />
    </div>
  )
}
