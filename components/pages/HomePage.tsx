import React from 'react';
import { motion } from 'framer-motion';
import { Hero } from '../Hero';
import { FeatureScroll } from '../FeatureScroll';
import { ProductShowcase } from '../ProductShowcase';
import { UseCases } from '../UseCases';
import { Features } from '../Features';
import { AnalyticsPreview } from '../AnalyticsPreview';
import { Timeline } from '../Timeline';
import { Testimonials } from '../Testimonials';
import { Pricing } from '../Pricing';
import { Button } from '../Button';

const CTASection = () => (
  <section className="py-32 relative overflow-hidden bg-white">
    <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[3rem] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-indigo-900/20"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15rem] font-black text-white opacity-[0.03] select-none pointer-events-none font-display">
          AWARDX
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight font-display">
            Ready to launch your <br />awards program?
          </h2>
          <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Join 2,000+ organizations using AwardX to celebrate excellence, manage entries, and grow their community.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button variant="white" size="lg" className="px-10 py-4 text-lg font-bold rounded-full">
              Get Started Free
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-10 py-4 text-lg border-slate-600 text-slate-300 hover:text-white hover:border-white rounded-full"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
      <FeatureScroll />
      <ProductShowcase />
      <UseCases />
      <Features />
      <AnalyticsPreview />
      <Timeline />
      <Testimonials />
      <Pricing />
      <CTASection />
    </>
  );
};
