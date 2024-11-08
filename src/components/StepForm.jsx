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

  console.log(stepIndex);
  

  return (
    <div>
      {steps[stepIndex]}
      <div>
        {stepIndex > 0 && <button onClick={handlePreviousStep}>Back</button>}
        {stepIndex < steps.length - 1 ? (
          <button onClick={handleNextStep}>Next</button>
        ) : (
          <button onClick={() => alert("Form submitted!")}>Submit</button>
        )}
      </div>
    </div>
  );
};

export default StepForm;
