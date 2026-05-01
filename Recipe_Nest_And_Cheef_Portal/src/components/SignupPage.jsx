import React from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import logoImage from '../assets/img.png'
import { handleError, handleSuccess } from './utils'

const SignupPage = () => {

  const [signInfo, setSignInfo] = React.useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "customer"
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    const copySignInfo = { ...signInfo }
    copySignInfo[name] = value
    setSignInfo(copySignInfo)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { name, email, password, phone, role , address } = signInfo
    if (!name || !email || !password || !phone || !address || !role) {
      return handleError("All fields are required")
    }
    if (signInfo.password.length < 6) {
      return handleError("Password must be at least 6 characters")
    }
    try {
      const url = "http://localhost:3000/api/users/register"
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signInfo)
      })
      const data = await res.json()
      const { success, message, error } = data
      if (success) {
        handleSuccess(message)
        setTimeout(() => {}, 2000)
        navigate("/login")
      } else if (!data.success) {
        handleError(data.errors?.[0])
      } else if (error) {
        handleError(error)
      }
    } catch (err) {
      handleError(err.message)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-left">
        <div className="auth-brand-card">
          <img src={logoImage} alt="Recipe Nest Logo" className="auth-brand-logo" />
          <h1 className="auth-brand-title">Recipe Nest</h1>
          <p className="auth-brand-subtitle">Nepali Khana ko Sansar</p>
          <p className="auth-brand-tagline">(Nepali Food World)</p>
        </div>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="auth-feature-icon">🔎</span>
            <div>
              <h3>Discover Recipes</h3>
              <p>Momo dekhi Dal Bhat samma sabai</p>
            </div>
          </div>

          <div className="auth-feature-item">
            <span className="auth-feature-icon">🔗</span>
            <div>
              <h3>Share Recipes</h3>
              <p>Aafno recipe share garnus</p>
            </div>
          </div>

          <div className="auth-feature-item">
            <span className="auth-feature-icon">👥</span>
            <div>
              <h3>Join Community</h3>
              <p>Nepali food lovers sanga judnu</p>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <h2 className="auth-form-title">Join Recipe Nest</h2>
          <p className="auth-form-subtitle">Create your account and start cooking</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label htmlFor='name'>Full Name</label>
            <input
              onChange={handleChange} type="text" name="name" id="name"
              autoFocus placeholder='Enter your name' value={signInfo.name}
            />

            <label htmlFor='email'>Email</label>
            <input
              onChange={handleChange} type="email" name="email" id="email"
              placeholder='your.email@example.com' value={signInfo.email}
            />

            <label htmlFor='password'>Password</label>
            <input
              onChange={handleChange} type="password" name="password" id="password"
              placeholder='Create a password' value={signInfo.password}
            />

            <div className="signup-row">
              <div>
                <label htmlFor='phone'>Phone</label>
                <input
                  onChange={handleChange} type="tel" name="phone" id="phone"
                  placeholder='+977...' value={signInfo.phone}
                />
              </div>
              <div>
                <label htmlFor='role'>Role</label>
                <select onChange={handleChange} name="role" id="role" value={signInfo.role}>
                  <option value="customer">Recipe Nest</option>
                  <option value="chief">Chif Portal</option>
                </select>
              </div>
            </div>

            <label htmlFor='address'>Address</label>
            <input
              onChange={handleChange} type="text" name="address" id="address"
              placeholder='Enter your address' value={signInfo.address}
            />

            <button type="submit" className="auth-primary-btn">Create Account</button>
          </form>

          <p className='auth-bottom-text'>
            Already have an account? <Link to="/login">Login</Link>
          </p>

          <Link to="/landing" className="auth-back-link">← Back to Home</Link>
        </div>
      </section>
    </div>
  )
}

export default SignupPage