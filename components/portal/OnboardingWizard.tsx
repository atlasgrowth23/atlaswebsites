'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingWizard({ companySlug }: { companySlug: string }) {
  const [step, setStep] = useState(1);
  const [brandColor, setBrandColor] = useState('#0077b6');
  const [accentColor, setAccentColor] = useState('#00b4d8');
  const [techCount, setTechCount] = useState('just-me');
  const [scheduleOrigin, setScheduleOrigin] = useState('paper');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  
  const router = useRouter();
  
  useEffect(() => {
    // Check if onboarding is completed in localStorage
    const onboardingCompleted = localStorage.getItem(`onboarding_${companySlug}`);
    
    if (!onboardingCompleted) {
      setShowWizard(true);
    }
  }, [companySlug]);
  
  const handleNext = () => {
    setStep(step + 1);
  };
  
  const handleBack = () => {
    setStep(step - 1);
  };
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Determine multi_tech boolean based on techCount
      const multiTech = techCount !== 'just-me';
      
      // Save to the database
      const response = await fetch('/api/company/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companySlug,
          brandColor,
          accentColor,
          multiTech,
          techCount: techCount === 'just-me' ? 1 : techCount === '2-5' ? 3 : 6,
          scheduleOrigin,
        }),
      });
      
      if (response.ok) {
        // Mark as completed in localStorage
        localStorage.setItem(`onboarding_${companySlug}`, 'true');
        
        // Hide the wizard
        setShowWizard(false);
        
        // Refresh the page to apply new settings
        router.refresh();
      } else {
        console.error('Failed to save onboarding settings');
      }
    } catch (error) {
      console.error('Error during onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!showWizard) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Setup Your HVAC Portal
          </h2>
          
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Choose Your Brand Colors
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Accent Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                How many field technicians do you have?
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="techCount"
                    value="just-me"
                    checked={techCount === 'just-me'}
                    onChange={() => setTechCount('just-me')}
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Just me</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="techCount"
                    value="2-5"
                    checked={techCount === '2-5'}
                    onChange={() => setTechCount('2-5')}
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">2-5 technicians</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="techCount"
                    value="6+"
                    checked={techCount === '6+'}
                    onChange={() => setTechCount('6+')}
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">6+ technicians</span>
                </label>
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Where is your schedule today?
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="scheduleOrigin"
                    value="google"
                    checked={scheduleOrigin === 'google'}
                    onChange={() => setScheduleOrigin('google')}
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Google Calendar</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="scheduleOrigin"
                    value="outlook"
                    checked={scheduleOrigin === 'outlook'}
                    onChange={() => setScheduleOrigin('outlook')}
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Outlook Calendar</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="scheduleOrigin"
                    value="paper"
                    checked={scheduleOrigin === 'paper'}
                    onChange={() => setScheduleOrigin('paper')}
                    className="h-5 w-5 text-primary"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Paper/Other</span>
                </label>
              </div>
              <div className="mt-8 flex justify-between">
                <button
                  onClick={handleBack}
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Finish Setup'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}