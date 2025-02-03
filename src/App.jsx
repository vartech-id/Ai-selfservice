import React, { useState } from "react";
import UserForm from "./components/Steps/UserForm";
import Gender from "./components/Steps/Gender";
import Capture from "./components/Steps/Capture";
import Result from "./components/Steps/Result";
import Opening from "./components/Steps/Opening";
import Logo from "./components/Logo";
import Template from "./components/Steps/Template";
import { saveUserData } from "./server/api";

import CSV from "./pages/csv";
import Print from "./pages/print";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App = () => {
  const [step, setStep] = useState(1);
  const [started, setStarted] = useState(false);

  // Save user data to database
  const handleUserData = async () => {
    const name = localStorage.getItem("name");
    const phone = localStorage.getItem("phone");

    const userData = {
      name: name,
      phone: phone,
    };

    const result = await saveUserData(userData);

    if (result) {
      console.log("User data saved:", result);

      // Remove data from localStorage
      localStorage.clear()
    } else {
      console.error("Failed to save user data");
    }
  };

  const start = () => {
    setStarted(true);
  };

  const nextStep = () => {
    if (step === 1) {
      handleUserData();
    }

    setStep((prevStep) => (prevStep < steps.length ? prevStep + 1 : prevStep));
  };

  const backStep = () => {
    setStep((prevStep) => (prevStep > 1 ? prevStep - 1 : prevStep));
  };

  const steps = [
    <UserForm onNext={nextStep} onSaveUserData={handleUserData} />,
    <Gender onNext={nextStep} onBack={backStep} />,
    <Template onNext={nextStep} onBack={backStep} />,
    <Capture goTo={nextStep} goBack={backStep} />,
    <Result />,
  ];

  return (
    <Router>
      <div className="background h-screen m-0 p-0 flex flex-col justify-evenly relative">
        <Routes>
          {/* Main Step */}
          <Route path="/" element={
            <div>
              <div className={`${started ? "hidden" : "inline"} h-full grid`}>
                <div className="m-auto">
                  <Opening onStart={start} />
                </div>
              </div>

              {started ? (
                <>
                  {steps[step - 1]}

                  {/* Render current step based on step index */}
                  {step < 4 ? (
                    <div className="text-[2.8em] space-x-10 w-full flex justify-center items-center mb-40 mt-20">
                      <button
                        onClick={backStep}
                        disabled={step === 1}
                        className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white"
                      >
                        Back
                      </button>
                      <button
                        onClick={nextStep}
                        disabled={step === steps.length}
                        className="bg-[#BF9A30] px-14 rounded-full uppercase font-bold text-white"
                      >
                        Next
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          } />

          {/* Other Pages */}
          {/* Admin Page */}
          <Route path="/print" element={<Print />} />
          <Route path="/csv" element={<CSV />} />
        </Routes>

        <div onClick={() => { setStarted(false); setStep(1); localStorage.clear() }}>
          <Logo />
        </div>
      </div>
    </Router>
  );
};

export default App;
