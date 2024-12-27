import React, { useState } from "react";
import UserForm from "./components/Steps/UserForm";
import Gender from "./components/Steps/Gender";
import Capture from "./components/Steps/Capture";
import Result from "./components/Steps/Result";
import Barcode from "./components/Steps/Barcode";
import Opening from "./components/Steps/Opening";
import Logo from "./components/Logo";
import Template from "./components/Steps/Template";

const App = () => {
  const [step, setStep] = useState(1);
  const [started, setStarted] = useState(false);

  console.log(started);

  const start = () => {
    setStarted(true);
    // setStep(1)
  };

  const nextStep = () => {
    setStep((prevStep) => (prevStep < steps.length ? prevStep + 1 : prevStep));
  };

  const backStep = () => {
    setStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  const steps = [
    <UserForm onNext={nextStep} />,
    <Gender onNext={nextStep} onBack={backStep} />,
    <Template onNext={nextStep} onBack={backStep} />,
    <Capture onNext={nextStep} onBack={backStep} />,
    <Result onNext={nextStep} onBack={backStep} />,
    <Barcode onNext={nextStep} onBack={backStep} />,
  ];

  return (
    <div className="background h-screen m-0 p-0">
      <div className={`${started ? "hidden" : "inline"} h-full grid`}>
        <div className="m-auto">
          <Opening onStart={start} />
          <Logo />
        </div>
      </div>

      {started ? (
        <>
          <h1>Step by step</h1>
          <div>{steps[step - 1]}</div>{" "}
          {/* Render current step based on step index */}
          <div className="text-[4em]">
            <button onClick={backStep} disabled={step === 1}>
              Back
            </button>
            <button onClick={nextStep} disabled={step === steps.length}>
              Next
            </button>
          </div>
          <div>
            <Logo />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default App;
