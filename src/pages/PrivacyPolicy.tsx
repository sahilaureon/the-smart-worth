import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import BrutalistButton from '../components/BrutalistButton';
import { motion } from 'motion/react';
import { Shield, Lock, Eye } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO 
        title="Privacy & Success Protocol | The Smart Worth"
        description="Our commitment to your data privacy and security. Learn how The Smart Worth protects your journey to success."
      />
      <Navbar />
      <PageHeader title="Privacy & Success Protocol" />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#F8FAFF] rounded-[2rem] p-8 md:p-12 border border-gray-100 mb-12"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-[#0061FF]">
              <Shield size={20} />
            </div>
            <h2 className="text-xl font-black text-[#0A0E27]">Your Data is Your Fuel 🚀</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            At The Smart Worth, we don't just "collect" data. We leverage it to refine your success trajectory. We understand that in the digital age, your information is a valuable asset. That's why we've established the Privacy & Success Protocol—a rigorous framework designed to safeguard your journey while ensuring your success strategies remain your secret advantage.
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
              <Eye size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">1. Data for Hyper-Personalization</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                We collect information to understand your current skill level, your financial goals, and your preferred learning style. This allow us to provide you with "The Smart Worth" experience—personalized recommendations, specific strategies for your niche, and a roadmap tailored to your specific path to freedom.
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
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">2. The Success Algorithm</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Your interactions with our courses are used to optimize our teaching methodology. Analysis of content effectiveness helps us eliminate the fluff and keep you focused only on what generates results.
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
              <Lock size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">3. Secure Ecosystem</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                We use advanced security protocols to protect your personal and financial information. Your data is never sold to third parties; it is used exclusively within The Smart Worth ecosystem to provide with exclusive earning opportunities and VIP access to new launches.
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
            Start Your Success Journey
          </BrutalistButton>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
