import React, { useState } from "react";
import UserForm from "./components/Steps/UserForm";
import Hobby from "./components/Steps/Hobby";
import Gender from "./components/Steps/Gender";
import Capture from "./components/Steps/Capture";
import Result from "./components/Steps/Result";
import Barcode from "./components/Steps/Barcode";

const App = () => {
  const [step, setStep] = useState(1); // Tracks the current step

  // Functions to move forward or backward
  const nextStep = () => {
    setStep((prevStep) => (prevStep < steps.length ? prevStep + 1 : prevStep));
  };

  const backStep = () => {
    setStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  // Array of all step components
  const steps = [
    <UserForm onNext={nextStep} />,
    <Gender onNext={nextStep} onBack={backStep} />,
    <Capture onNext={nextStep} onBack={backStep} />,
    <Result onNext={nextStep} onBack={backStep} />,
    <Barcode onNext={nextStep} onBack={backStep} />,
  ];

  return (
    <div>
      <h1>Step by step</h1>
      <div>{steps[step - 1]}</div> {/* Render current step based on step index */}
      <div>
        <button onClick={backStep} disabled={step === 1}>Back</button>
        <button onClick={nextStep} disabled={step === steps.length}>Next</button>
      </div>
    </div>
  );
};

export default App;
