export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-primary dark:text-white mb-8">Terms of Service</h1>
      
      <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6">
        <p>Last updated: August 2026</p>
        
        <h2 className="text-xl font-bold text-primary dark:text-white">1. Acceptance of Terms</h2>
        <p>
          By accessing and using SmartRent TZ, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
        </p>
        
        <h2 className="text-xl font-bold text-primary dark:text-white">2. User Accounts</h2>
        <p>
          You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
        </p>
        
        <h2 className="text-xl font-bold text-primary dark:text-white">3. Property Listings</h2>
        <p>
          Landlords and agents must ensure that all property listings are accurate, up-to-date, and legally compliant with Tanzanian housing laws. SmartRent TZ reserves the right to remove any fraudulent or misleading listings.
        </p>

        <h2 className="text-xl font-bold text-primary dark:text-white">4. Payments</h2>
        <p>
          All payments processed through the platform are subject to our payment provider's terms. SmartRent TZ is not responsible for disputes arising from external, offline transactions.
        </p>

        <h2 className="text-xl font-bold text-primary dark:text-white">5. Privacy</h2>
        <p>
          Your use of the platform is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information.
        </p>
      </div>
    </div>
  );
}
