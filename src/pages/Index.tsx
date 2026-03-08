import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import DashboardPreview from "@/components/landing/DashboardPreview";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTASection from "@/components/landing/CTASection";
import BookDemo from "@/components/landing/BookDemo";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <DashboardPreview />
      <Features />
      <HowItWorks />
      <BookDemo />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
