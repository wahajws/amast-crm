import { useState } from 'react';
import CompanyAnalysisStep from './steps/CompanyAnalysisStep';
import ConfigurationStep from './steps/ConfigurationStep';
import GenerationProgressStep from './steps/GenerationProgressStep';
import ReviewLeadsStep from './steps/ReviewLeadsStep';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';

const STEPS = [
  { id: 1, name: 'Company Analysis', component: CompanyAnalysisStep },
  { id: 2, name: 'Configuration', component: ConfigurationStep },
  { id: 3, name: 'Generation', component: GenerationProgressStep },
  { id: 4, name: 'Review & Import', component: ReviewLeadsStep },
];

export default function LeadGeneration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [generationOptions, setGenerationOptions] = useState({
    numLeads: 100,
    industries: [],
    locations: [],
  });
  const [generatedLeads, setGeneratedLeads] = useState([]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepChange = (stepData) => {
    if (stepData.profile) {
      setCompanyProfile(stepData.profile);
    }
    if (stepData.options) {
      setGenerationOptions(stepData.options);
    }
    if (stepData.leads) {
      setGeneratedLeads(stepData.leads);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Generation</h1>
        <p className="text-gray-600 mt-1">Generate potential leads using AI-powered analysis</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    currentStep >= step.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">{step.name}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <CurrentStepComponent
          companyProfile={companyProfile}
          generationOptions={generationOptions}
          generatedLeads={generatedLeads}
          onStepChange={handleStepChange}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            currentStep === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <FiArrowLeft className="inline mr-2" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep === STEPS.length}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            currentStep === STEPS.length
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          Next
          <FiArrowRight className="inline ml-2" />
        </button>
      </div>
    </div>
  );
}

