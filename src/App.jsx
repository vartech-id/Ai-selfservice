import { useEffect, useState } from "react";
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

  // State for UserForm Component
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "");

  useEffect(() => {
    const savedName = localStorage.getItem("name");
    const savedPhone = localStorage.getItem("phone");
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  // Save user data to database
  // const handleUserData = async () => {
  //   const name = localStorage.getItem("name");
  //   const phone = localStorage.getItem("phone");

  //   const userData = {
  //     name: name,
  //     phone: phone,
  //   };

  //   const result = await saveUserData(userData);

  //   if (result) {
  //     console.log("User data saved:", result);

  //     // Remove data from localStorage
  //     localStorage.clear();
  //   } else {
  //     console.error("Failed to save user data");
  //   }
  // };

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

  // Disable Next button if any field in UserForm is empty
  const isNextDisabled = step === 1 && (!name.trim() || !phone.trim());

  const steps = [
    // <UserForm
    //   key={1}
    //   name={name}
    //   setName={setName}
    //   phone={phone}
    //   setPhone={setPhone}
    //   onNext={nextStep}
    //   onSaveUserData={handleUserData}
    // />,
    <Gender key={1} onNext={nextStep} onBack={backStep} />,
    <Template key={2} onNext={nextStep} onBack={backStep} />,
    <Capture key={3} goTo={nextStep} goBack={backStep} />,
    <Result key={4} />,
  ];

  return (
    <Router>
      <div className="background h-screen m-0 p-0 flex flex-col justify-evenly relative">
        <Routes>
          {/* Main Step */}
          <Route
            path="/"
            element={
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
                    {step < 3 ? (
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
                          className={`px-14 rounded-full uppercase font-bold text-white ${
                            step === steps.length
                              ? "bg-[#BF9A30]/50 cursor-not-allowed"
                              : "bg-[#BF9A30]"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            }
          />

          {/* Admin Page */}
          <Route path="/print" element={<Print />} />
          <Route path="/csv" element={<CSV />} />
        </Routes>

        <div
          onClick={() => {
            setName("")
            setPhone("")
            localStorage.clear();
            setStarted(false);
            setStep(1);
          }}
        >
          <Logo />
        </div>
      </div>
    </Router>
  );
};

export default App;
