import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Home, Menu, Moon, Sun, Globe, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../contexts/ThemeContext'
import AIAssistantModal from '../components/AIAssistantModal'

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem('token');

  // UNDERSTANDABLE — Update html lang attribute when language switches (WCAG 3.1.1)
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'sw' : 'en');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'LANDLORD') return '/landlord/dashboard';
    if (user.role === 'AGENT') return '/agent/dashboard';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    return '/tenant/dashboard';
  };

  return (
    <div className="min-h-screen flex flex-col font-sans dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* OPERABLE — Skip Navigation Link (WCAG 2.4.1) */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2" aria-label="SmartRent TZ — Home">
                <Home className="h-8 w-8 text-accent" aria-hidden="true" />
                <span className="font-bold text-xl text-primary dark:text-white tracking-tight">SmartRent TZ</span>
              </Link>
            </div>

            {/* OPERABLE — Labelled nav landmark (WCAG 2.4.6) */}
            <nav className="hidden md:flex space-x-8" aria-label="Main navigation">
              <Link to="/properties" className="text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium transition-colors">{t('nav.properties')}</Link>
              <Link to="/about" className="text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium transition-colors">{t('nav.about')}</Link>
              <Link to="/contact" className="text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium transition-colors">{t('nav.contact')}</Link>
            </nav>

            <div className="hidden md:flex items-center space-x-3">
              {/* ROBUST — aria-label on icon-only buttons (WCAG 4.1.2) */}
              <button
                onClick={toggleLanguage}
                aria-label={`Switch to ${i18n.language === 'sw' ? 'English' : 'Swahili'}`}
                className="flex items-center text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white font-medium px-2 py-1 rounded-lg transition-colors"
              >
                <Globe className="h-5 w-5 mr-1" aria-hidden="true" />
                <span>{i18n.language === 'sw' ? 'EN' : 'SW'}</span>
              </button>

              <button
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 text-muted dark:text-gray-400 hover:text-primary dark:hover:text-white rounded-full transition-colors"
              >
                {isDarkMode
                  ? <Sun className="h-5 w-5" aria-hidden="true" />
                  : <Moon className="h-5 w-5" aria-hidden="true" />}
              </button>

              <div className="border-l border-gray-300 dark:border-gray-700 h-6 mx-1" role="separator" aria-hidden="true" />

              {user && token ? (
                <Link
                  to={getDashboardLink()}
                  aria-label={`Go to dashboard — ${user.firstName} ${user.lastName}`}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm" aria-hidden="true">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <span className="font-medium text-primary dark:text-white mr-2">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-primary dark:text-white font-medium hover:text-accent transition-colors">{t('nav.login')}</Link>
                  <Link to="/register" className="bg-primary dark:bg-accent text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary dark:hover:bg-green-700 transition-colors">
                    {t('nav.signup')}
                  </Link>
                </>
              )}
            </div>

            {/* OPERABLE — Mobile menu with working toggle + aria-expanded (WCAG 4.1.2) */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 text-primary dark:text-white rounded-full"
              >
                {isDarkMode ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav"
                className="text-primary dark:text-white hover:text-accent p-2 rounded-lg transition-colors"
              >
                {isMobileMenuOpen
                  ? <X className="h-6 w-6" aria-hidden="true" />
                  : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-4 space-y-2"
          >
            <Link to="/properties" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors">{t('nav.properties')}</Link>
            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors">{t('nav.about')}</Link>
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors">{t('nav.contact')}</Link>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              {user && token ? (
                <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-accent font-semibold hover:bg-green-50 transition-colors">My Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 font-medium transition-colors">{t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="block mt-2 px-3 py-2 rounded-lg bg-primary text-white font-semibold text-center hover:bg-secondary transition-colors">{t('nav.signup')}</Link>
                </>
              )}
              <button
                onClick={toggleLanguage}
                aria-label={`Switch to ${i18n.language === 'sw' ? 'English' : 'Swahili'}`}
                className="mt-2 flex items-center px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 font-medium w-full"
              >
                <Globe className="h-4 w-4 mr-2" aria-hidden="true" />
                {i18n.language === 'sw' ? 'Switch to English' : 'Badilisha kwa Kiswahili'}
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* OPERABLE — id for skip-nav target (WCAG 2.4.1) */}
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="bg-primary dark:bg-black text-white py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-accent" aria-hidden="true" />
              <span className="font-bold text-lg">SmartRent TZ</span>
            </div>
            <p className="text-gray-400 text-sm">{t('footer.desc')}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('nav.properties')}</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/properties?type=APARTMENT" className="hover:text-white transition-colors">Apartments</Link></li>
              <li><Link to="/properties?type=HOUSE" className="hover:text-white transition-colors">Houses</Link></li>
              <li><Link to="/properties?type=COMMERCIAL" className="hover:text-white transition-colors">Commercial</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('footer.company')}</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">{t('nav.contact')}</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('nav.contact')}</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Dar es Salaam, Tanzania</li>
              <li><a href="mailto:hello@smartrent.co.tz" className="hover:text-white transition-colors">hello@smartrent.co.tz</a></li>
              <li><a href="tel:+255700000000" className="hover:text-white transition-colors">+255 700 000 000</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} SmartRent TZ. All rights reserved.
        </div>
      </footer>

      {/* Floating AI Real Estate Assistant */}
      <AIAssistantModal />
    </div>
  )
}
