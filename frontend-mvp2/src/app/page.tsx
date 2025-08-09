import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🎹 Developing My Piano Style
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            A community-driven Web3 platform connecting pianists and musicians through local venues and jam sessions. 
            Discover venues with pianos, earn TCoin rewards, and build musical connections in your city.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/submit" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors"
            >
              Submit a Venue
            </Link>
            <Link 
              href="/venues" 
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Browse Venues
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Discover Venues */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Discover Piano Venues</h3>
            <p className="text-gray-600">
              Find cafes, restaurants, and venues with pianos available for playing. 
              Each venue is manually verified by our community curator.
            </p>
          </div>

          {/* Earn Rewards */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">🪙</div>
            <h3 className="text-xl font-semibold mb-3">Earn TCoin Rewards</h3>
            <p className="text-gray-600">
              Submit new venue discoveries and earn 1 TCoin for each verified submission. 
              Use TCoin to pay for drinks and support the community.
            </p>
          </div>

          {/* Join Sessions */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-3">Join Jam Sessions</h3>
            <p className="text-gray-600">
              Connect with other musicians, join curated jam sessions, 
              and develop your piano style in welcoming community spaces.
            </p>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
              Growing Piano Community
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">12+</div>
                <div className="text-gray-600">Venues Discovered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5+</div>
                <div className="text-gray-600">Active Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">3</div>
                <div className="text-gray-600">Cities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">24/7</div>
                <div className="text-gray-600">Community Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            The Art and Science of Piano Development
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Like "Zen and the Art of Motorcycle Maintenance," there's an art and science to developing your piano style. 
            This platform bridges digital community with physical musical spaces, creating opportunities for 
            authentic musical growth and connection.
          </p>
          <blockquote className="text-xl italic text-gray-800 border-l-4 border-blue-500 pl-6">
            "I'd rather play the acoustic piano. I like the idea of developing my style as I go about my day. 
            I find appealing any space where there already is an acoustic piano - no need to drag equipment around."
          </blockquote>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Join Our Community?</h2>
          <p className="text-blue-100 mb-6">
            Start by discovering venues or submitting your own piano findings
          </p>
          <Link 
            href="/submit" 
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
          >
            Submit Your First Venue
          </Link>
        </div>
      </div>
    </div>
  )
}
