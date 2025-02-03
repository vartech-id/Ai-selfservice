import React, { useState } from "react";

const StepForm = ({ steps, resetFormData }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1);
  };

  const handlePreviousStep = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  };

  const handleSubmit = () => {
    alert("Form submitted!");
    setStepIndex(0);
    resetFormData();
  };

  const dynamicButtonText = stepIndex === 0 ? "Start" : "Next";

  return (
    <div>
      {steps[stepIndex]}
      <div>
        {stepIndex > 0 && <button onClick={handlePreviousStep}>Back</button>}
        {stepIndex < steps.length - 1 ? (
          <button onClick={handleNextStep}>{dynamicButtonText}</button>
        ) : (
          <button onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  );
};

export default StepForm;
