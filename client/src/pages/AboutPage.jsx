export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-primary dark:text-white mb-8">About SmartRent TZ</h1>
      
      <div className="prose dark:prose-invert max-w-none text-lg text-gray-600 dark:text-gray-300">
        <p className="mb-6">
          SmartRent TZ was founded with a single mission: to revolutionize the property rental experience in Tanzania. 
          For too long, renting a home or managing properties has been plagued by inefficiencies, lack of transparency, and friction.
        </p>
        
        <p className="mb-6">
          We provide a comprehensive, modern PropTech platform that bridges the gap between landlords, tenants, and real estate agents. 
          Whether you're looking for your next apartment in Dar es Salaam, or you're a property owner wanting to streamline your lease agreements and payments, SmartRent TZ is built for you.
        </p>

        <h2 className="text-2xl font-bold text-primary dark:text-white mt-12 mb-4">Our Vision</h2>
        <p className="mb-6">
          To build trust in the Tanzanian real estate market by verifying all listings and users, ensuring that every transaction is secure and every home is exactly as described.
        </p>

        <h2 className="text-2xl font-bold text-primary dark:text-white mt-12 mb-4">Why Choose Us?</h2>
        <ul className="list-disc pl-6 space-y-2 mb-8">
          <li><strong>Verified Properties:</strong> No more fake photos or scams. Our team ensures every listing is genuine.</li>
          <li><strong>Seamless Payments:</strong> Track your rent and manage digital receipts easily.</li>
          <li><strong>Maintenance Tracking:</strong> Submit requests directly through the app and track progress.</li>
          <li><strong>Transparent Leases:</strong> Digital lease agreements that protect both landlords and tenants.</li>
        </ul>
      </div>
    </div>
  );
}
