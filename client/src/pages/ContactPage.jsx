export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 dark:text-gray-100">
      <h1 className="text-4xl font-bold text-primary dark:text-white mb-8">Contact Us</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Have questions about SmartRent TZ? Whether you're a tenant looking for a home, or a landlord wanting to list your properties, our team is here to help.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-white">Email</h3>
              <p className="text-gray-600 dark:text-gray-400">support@smartrent.co.tz</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-white">Phone</h3>
              <p className="text-gray-600 dark:text-gray-400">+255 700 000 000</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary dark:text-white">Office</h3>
              <p className="text-gray-600 dark:text-gray-400">
                123 Innovation Drive<br />
                Masaki, Dar es Salaam<br />
                Tanzania
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
              <textarea rows="4" className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent" placeholder="How can we help?"></textarea>
            </div>
            <button type="button" onClick={() => alert('Thanks for reaching out! We will get back to you soon.')} className="w-full bg-accent hover:bg-green-600 text-white font-bold py-3 rounded-lg transition-colors">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
