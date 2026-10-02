import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import SEO from '../components/SEO';
import BrutalistButton from '../components/BrutalistButton';
import { motion } from 'motion/react';
import { CreditCard, RefreshCcw, TrendingUp } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO 
        title="Value & Refund Policy | The Smart Worth"
        description="Our commitment to transparency and value. Read the Value & Refund Policy of The Smart Worth."
      />
      <Navbar />
      <PageHeader title="Value & Refund Policy" />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#F8FAFF] rounded-[2rem] p-8 md:p-12 border border-gray-100 mb-12"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-black text-[#0A0E27]">100% Value Guarantee 💎</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed font-semibold">
            Our courses are crafted by industry titans who have generated crores in revenue. We don't just teach theory; we provide field-tested blueprints. The value provided in the first 5 minutes of our courses often outweighs the entire enrollment fee. We don't have time for "window shoppers"—they are too busy looking; our students are too busy making money.
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
              <RefreshCcw size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">1. Digital Asset Protection</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                The Smart Worth provides immediate, full access to high-value digital assets, exclusive frameworks, and proprietary strategies upon enrollment. Because this knowledge cannot be "unlearned" and digital assets cannot be "returned," we maintain a strict policy to protect our intellectual property.
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
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">2. The "No Turning Back" Protocol</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                Once a user enrolls and gains access to the dashboard, the service is considered "fully rendered" under digital commerce laws. Therefore, all sales are final. We do not offer refunds, credits, or exchanges for any reason, including but not limited to: change of mind, lack of time, or technical inability to execute the strategies.
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
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#0A0E27] mb-3">3. Why This is Good for You</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                By removing the "safety net" of a refund, we ensure that every member of our community is 100% committed to their success. This creates a high-vibration environment where everyone is focused on winning, not on finding excuses to quit. When you're all-in, you win.
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

export default RefundPolicy;
