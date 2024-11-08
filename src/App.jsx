import React, { useState } from "react";
import TemplateList from "./components/TemplateList";
import StepForm from "./components/StepForm";
import UserForm from "./components/Steps/UserForm";
import Theme from "./components/Steps/Theme";
import Gender from "./components/Steps/Gender";
import Capture from "./components/Steps/Capture";
import Barcode from "./components/Steps/Barcode";

const App = () => {
  // User Form
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    theme: "",
  });

  // Reset form after submitting
  const resetFormData = () => {
    setFormData({
      name: "",
      phone: "",
      theme: "",
    });
  };

  const steps = [<UserForm />, <Theme />, <Gender />, <Capture />, <Barcode />];

  return (
    <div>
      <StepForm steps={steps} resetFormData={resetFormData} />
      {/* <TemplateList /> */}
    </div>
  );
};

export default App;
