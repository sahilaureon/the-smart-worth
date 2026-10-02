import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import BrutalistButton from '../components/BrutalistButton';
import { motion } from 'motion/react';
import { Scale, ShieldAlert, Zap } from 'lucide-react';

const TermsConditions = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO 
        title="Terms of Success | The Smart Worth"
        description="The governing principles of our partnership. Read the Terms of Success for using The Smart Worth platform."
      />
      <Navbar />
      <PageHeader title="Terms of Success" />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#F8FAFF] rounded-[2rem] p-8 md:p-12 border border-gray-100 mb-12"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-[#615DFA]/10 rounded-xl flex items-center justify-center text-[#615DFA]">
              <Zap size={20} />
            </div>
            <h2 className="text-xl font-black text-[#0A0E27]">The Millionaire Mindset Agreement 🤝</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed font-semibold">
            By entering The Smart Worth, you are not just "using a website." You are agreeing to a high-performance standard. This platform is designed for the elite—for those who are ready to take radical responsibility for their financial future. Our terms are simple because we focus on results, not bureaucracy. Only serious action-takers benefit from our secrets.
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* Section 1 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-6"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">1. Acceptance of Excellence</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                By accessing The Smart Worth, you agree to be bound by these Terms and Conditions. If you are not ready to put in the work, follow the strategies, and execute with discipline, this platform is not for you. Your presence here signifies you are ready for a higher level of living.
              </p>
            </div>
          </motion.div>

          {/* Section 2 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-6"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0061FF] shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">2. Intellectual Property & Secrets</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                All content, strategies, and "hacks" provided within our VIP packages are the exclusive intellectual property of The Smart Worth. Sharing, leaking, or reselling any material without explicit written permission will result in immediate legal action and permanent blacklisting from our community.
              </p>
            </div>
          </motion.div>

          {/* Section 3 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row gap-6"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">3. The Commitment Clause</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Enrollment in our packages signifies a commitment to your own growth. The Smart Worth does not guarantee specific earnings—wealth is a result of your execution of our strategies. We provide the tools; you provide the effort. Your success is in your hands.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="mt-20 text-center flex justify-center">
          <BrutalistButton
            to="/register"
            size="lg"
            className="w-auto"
          >
            I Accept the Challenge
          </BrutalistButton>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsConditions;
