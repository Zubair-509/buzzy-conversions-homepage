import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ToolsShowcase from "@/components/ToolsShowcase";
import HowItWorks from "@/components/HowItWorks";
import BenefitsPricingSection from "@/components/BenefitsPricingSection";
import SocialProofFAQ from "@/components/SocialProofFAQ";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 lg:pt-20">
        <div className="space-y-0">
          <Hero />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-24 lg:space-y-32">
              <ToolsShowcase />
              <HowItWorks />
              <BenefitsPricingSection />
              <SocialProofFAQ />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}