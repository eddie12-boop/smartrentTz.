import { Suspense, lazy, useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'

// ============================================
// PERFORMANCE — Route-Based Code Splitting
// Each page loads ONLY when the user visits it.
// Dramatically reduces initial bundle size.
// ============================================
const LandingPage        = lazy(() => import('./pages/LandingPage'))
const PropertySearchPage = lazy(() => import('./pages/PropertySearchPage'))
const PropertyDetailsPage= lazy(() => import('./pages/PropertyDetailsPage'))
const LoginPage          = lazy(() => import('./pages/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/RegisterPage'))
const TenantDashboard    = lazy(() => import('./pages/TenantDashboard'))
const LandlordDashboard  = lazy(() => import('./pages/LandlordDashboard'))
const AgentDashboard     = lazy(() => import('./pages/AgentDashboard'))
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'))
const AboutPage          = lazy(() => import('./pages/AboutPage'))
const ContactPage        = lazy(() => import('./pages/ContactPage'))
const TermsPage          = lazy(() => import('./pages/TermsPage'))

// ROBUST — Accessible page loading fallback with aria-live
function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
    >
      <div
        className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-accent animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">Loading page content, please wait…</span>
      <span className="text-sm text-muted" aria-hidden="true">Loading…</span>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
        <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
        <Route path="search" element={<Suspense fallback={<PageLoader />}><PropertySearchPage /></Suspense>} />
        <Route path="properties" element={<Suspense fallback={<PageLoader />}><PropertySearchPage /></Suspense>} />
        <Route path="properties/:id" element={<Suspense fallback={<PageLoader />}><PropertyDetailsPage /></Suspense>} />
        <Route path="login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
        <Route path="register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
        <Route path="tenant/dashboard" element={<Suspense fallback={<PageLoader />}><TenantDashboard /></Suspense>} />
        <Route path="landlord/dashboard" element={<Suspense fallback={<PageLoader />}><LandlordDashboard /></Suspense>} />
        <Route path="agent/dashboard" element={<Suspense fallback={<PageLoader />}><AgentDashboard /></Suspense>} />
        <Route path="admin/dashboard" element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
      </Route>
    </Routes>
  )
}

export default App
