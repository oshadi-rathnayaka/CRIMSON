// Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImage from '../../assets/Logo.png';
import '../../styles/Citizen/Login.css';

function Login() {
  const navigate = useNavigate();
  const { login, loading, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    clearError();
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    if (!formData.terms) newErrors.terms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrors((prev) => ({ ...prev, submit: result.error }));
    }
  };

  const busy = isSubmitting || loading;

  return (
    <div className="login-page">
      {/* Navbar — matches Register page */}
      <nav className="login-nav">
        <div className="login-nav__brand">
          <img src={logoImage} alt="CRIMSON logo" className="login-nav__logo-icon" />
          <span className="login-nav__brand-name">CRIMSON</span>
        </div>
        <Link to="/register" className="login-nav__signup-btn">Sign up</Link>
      </nav>

      <div className="login-main">
        {/* Left Panel */}
        <div className="login-left">
          <div className="login-form-wrapper">
            <h1 className="login-title">Welcome to CRIMSON</h1>
            <p className="login-subtitle">
              Secure Crime Reporting &amp; Victim Support Portal. Your identity is protected.
            </p>

            {(authError || errors.submit) && (
              <div className="login-alert login-alert--error">
                {authError || errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="login-field">
                <label className="login-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`login-input${errors.email ? ' login-input--error' : ''}`}
                  placeholder="Enter Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={busy}
                  autoComplete="email"
                />
                {errors.email && <span className="login-error">{errors.email}</span>}
              </div>

              <div className="login-field">
                <label className="login-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className={`login-input${errors.password ? ' login-input--error' : ''}`}
                  placeholder="Enter Your Password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={busy}
                  autoComplete="current-password"
                />
                {errors.password && <span className="login-error">{errors.password}</span>}
              </div>

              <label className="login-check-row">
                <input
                  type="checkbox"
                  name="terms"
                  className="login-checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  disabled={busy}
                />
                <span className="login-check-label">
                  I agree to the{' '}
                  <a href="#" className="login-link">Privacy Policy &amp; Terms of Use</a>.
                </span>
              </label>
              {errors.terms && <span className="login-error login-error--check">{errors.terms}</span>}

              <button type="submit" className="login-btn" disabled={busy}>
                {busy ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="login-extra-links">
              <a href="#">Help Center</a>
              <span> • </span>
              <a href="#">Victim Support</a>
              <span> • </span>
              <Link to="/officer/login">Officer Login</Link>
            </div>
          </div>
        </div>

        {/* Right Panel — identical to Register page */}
        <section className="login-right">
          <div className="emergency-section">
            <div className="emergency-box">
              <p className="emergency-title">⚠️ Emergency?</p>
              <p className="emergency-text">
                If you are in immediate danger, do not use this portal. Call emergency services immediately.
              </p>
              <a href="tel:119" className="call-button">
                Call 119 <span className="phone-icon">📞</span>
              </a>
            </div>
          </div>

          <div className="slogan-area">
            <div className="slogan-divider"></div>
            <h2 className="slogan-main">Safer Communities</h2>
            <h3 className="slogan-sub">Through Technology &amp; Transparency</h3>
            <p className="slogan-desc">
              CRIMSON uses advanced AI and analytics to prioritize citizen safety, offering secure reporting and seamless victim support across Sri Lanka.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;