import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success('Login berhasil')
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/assessor/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-md shadow-sm p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-bold text-text-primary">NCS Analyzer</h1>
           <p className="text-sm text-text-secondary mt-1">Penilaian Keamanan</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
           <Input
             label="Email"
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
           />
           <Input
             label="Kata Sandi"
             type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading}>
             Masuk
          </Button>
        </form>
      </div>
    </div>
  )
}