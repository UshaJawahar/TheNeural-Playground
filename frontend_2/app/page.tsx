import Link from 'next/link'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="page-wrapper">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className="main-content">
        
        {/* Hero Section */}
        <section className="section section-hero">
          <div className="container">
            <div className="content-wrapper">
              <div className="text-center max-w-5xl mx-auto">
                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight text-center">
                  Teach a computer to{' '}
                  <span className="bg-gradient-to-r from-[#b90abd] to-[#5332ff] bg-clip-text text-transparent">
                    play a game
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-lg sm:text-xl lg:text-2xl text-[#d6d9d8] mb-12 leading-relaxed max-w-4xl mx-auto text-center">
                  Discover the fascinating world of machine learning through interactive game development. 
                  Learn, create, and train AI models in an engaging Scratch environment.
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <Link 
                    href="/get-started" 
                    className="w-full sm:w-auto px-12 py-6 bg-gradient-to-r from-[#b90abd] to-[#5332ff] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-center"
                  >
                    Get Started
                  </Link>
                  
                  <Link 
                    href="/learn-more" 
                    className="w-full sm:w-auto px-12 py-6 bg-transparent text-white font-bold text-lg rounded-xl border-2 border-[#d6d9d8] hover:bg-[#d6d9d8] hover:text-[#010101] transition-all duration-300 text-center"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="section section-content bg-gradient-to-b from-[#010101] to-[#0a0a0a]">
          <div className="container">
            <div className="content-wrapper">
              <div className="w-full text-center">
                {/* Section Header */}
                <div className="mb-20">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 text-center">
                    How It Works
                  </h2>
                  <p className="text-lg sm:text-xl text-[#d6d9d8] max-w-3xl mx-auto text-center">
                    Follow these three simple steps to create your own AI-powered game
                  </p>
                </div>

                {/* Steps Grid */}
                <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
                  {/* Step 1 */}
                  <div className="group text-center">
                    <div className="bg-gradient-to-br from-[#5332ff]/10 to-[#b90abd]/10 border border-[#5332ff]/20 rounded-2xl p-8 h-full hover:border-[#b90abd]/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-[#b90abd] to-[#5332ff] rounded-full mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl font-bold text-white">1</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-6 text-center">Collect Examples</h3>
                      <p className="text-[#d6d9d8] leading-relaxed text-center text-lg">
                        Gather training data by collecting examples of objects, actions, or patterns you want your AI to recognize.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="group text-center">
                    <div className="bg-gradient-to-br from-[#b90abd]/10 to-[#5332ff]/10 border border-[#b90abd]/20 rounded-2xl p-8 h-full hover:border-[#5332ff]/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-[#5332ff] to-[#b90abd] rounded-full mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl font-bold text-white">2</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-6 text-center">Train Your Model</h3>
                      <p className="text-[#d6d9d8] leading-relaxed text-center text-lg">
                        Use our intuitive training interface to teach your computer to recognize the patterns in your examples.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="group text-center">
                    <div className="bg-gradient-to-br from-[#5332ff]/10 to-[#b90abd]/10 border border-[#5332ff]/20 rounded-2xl p-8 h-full hover:border-[#b90abd]/40 transition-all duration-300 hover:transform hover:scale-105">
                      <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-[#b90abd] to-[#5332ff] rounded-full mx-auto mb-8 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl font-bold text-white">3</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-6 text-center">Create & Play</h3>
                      <p className="text-[#d6d9d8] leading-relaxed text-center text-lg">
                        Build exciting games in Scratch that leverage your trained AI model for interactive gameplay experiences.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section section-cta">
          <div className="container">
            <div className="content-wrapper">
              <div className="max-w-5xl mx-auto text-center">
                <div className="bg-gradient-to-r from-[#b90abd]/10 to-[#5332ff]/10 border border-[#b90abd]/20 rounded-3xl p-12 lg:p-16">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 text-center">
                    Ready to Start Your AI Journey?
                  </h2>
                  <p className="text-lg sm:text-xl text-[#d6d9d8] mb-10 max-w-3xl mx-auto text-center">
                    Join thousands of students and educators who are already creating amazing AI-powered projects.
                  </p>
                  <div className="text-center">
                    <Link 
                      href="/get-started" 
                      className="inline-block px-16 py-6 bg-gradient-to-r from-[#b90abd] to-[#5332ff] text-white font-bold text-xl rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-center"
                    >
                      Start Creating Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="section section-footer bg-[#d6d9d8]">
        <div className="container">
          <div className="content-wrapper">
            <div className="text-center">
              <p className="text-[#010101] text-lg font-medium text-center">
                © 2024 TheNeural Playground. Empowering the next generation of AI creators.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
