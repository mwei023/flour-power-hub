/**
 * Onboarding Guide Component
 * 
 * First-time user guide that walks through the app's features
 * and helps users get started with Flour Power Hub.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  Users, 
  TrendingUp, 
  Receipt, 
  Smartphone,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { OnboardingStep } from './OnboardingStep';
import { X } from 'lucide-react';

interface OnboardingGuideProps {
  onComplete?: () => void;
}

const steps = [
  {
    number: 1,
    total: 6,
    title: 'Welcome to Flour Power Hub',
    description: 'Your complete mill management solution. Track transactions, manage customers, and monitor your business performance all in one place.',
    tip: 'You can install this app on your phone for the best experience!',
    illustration: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
            <Home className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-accent rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-accent-foreground" />
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 2,
    total: 6,
    title: 'Quick Transaction Recording',
    description: 'Record milling jobs in seconds. Enter customer details, grain type, weight, and payment method - all from the dashboard.',
    tip: 'The "New" button on the home screen is your shortcut to creating transactions.',
    illustration: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-primary/10 rounded-2xl flex items-center justify-center transform rotate-3">
            <Plus className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute -top-2 -left-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">+</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 3,
    total: 6,
    title: 'Customer Management',
    description: 'Keep track of all your customers, their contact info, and credit balances. Easily view who owes money and manage payments.',
    tip: 'Credit balances are automatically calculated when you record transactions.',
    illustration: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute bottom-0 left-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 4,
    total: 6,
    title: 'Track Expenses',
    description: 'Record and categorize all your business expenses. Track daily costs to understand your profit margins better.',
    tip: 'Common categories include flour purchase, transport, labor, and maintenance.',
    illustration: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 5,
    total: 6,
    title: 'Real-Time Analytics',
    description: 'View daily summaries, income breakdowns, and profit calculations. Make informed decisions with up-to-date business metrics.',
    tip: 'The dashboard shows today\'s performance at a glance - income, profit, and total kilos.',
    illustration: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-primary/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 6,
    total: 6,
    title: 'Install on Your Phone',
    description: 'Get the full app experience! Install Flour Power Hub on your phone for offline access, push notifications, and quick access from your home screen.',
    tip: 'On iPhone: Tap the Share button → Add to Home Screen. On Android: Tap menu → Install App.',
    illustration: (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
            <Smartphone className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute top-0 right-8 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    ),
  },
];

export function OnboardingGuide({ onComplete }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem('onboarding-completed');
    if (completed) {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding-completed', 'true');
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full max-w-lg mx-auto p-6 flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Close onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Content */}
        <div className="flex-1 flex flex-col justify-center py-8">
          <OnboardingStep
            step={steps[currentStep]}
            currentStep={currentStep}
            totalSteps={steps.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onComplete={handleComplete}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : index < currentStep
                  ? 'bg-primary/50'
                  : 'bg-muted'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OnboardingGuide;

