import React, { useEffect, useState } from "react";

const UserForm = () => {
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [phone, setPhone] = useState(localStorage.getItem("phone") || "");

  useEffect(() => {
    const savedName = localStorage.getItem("name");
    const savedPhone = localStorage.getItem("phone");
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  const onNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    localStorage.setItem("name", value);
  };

  const onPhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    localStorage.setItem("phone", value);
  };

  localStorage.setItem("name", name);
  localStorage.setItem("phone", phone);

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-[6rem]">
      <div className="text-center">
        <h1 className="text-white text-[5em] font-bold">Name</h1>
        <input
          className="border w-4/5 h-32 text-[5em]"
          type="text"
          id="name"
          name="name"
          value={name}
          onChange={onNameChange}
        />
      </div>
      <div className="text-center">
        <h1 className="text-white text-[5em] font-bold">Phone Number</h1>
        <input
          className="border w-4/5 h-32 text-[5em]"
          type="number"
          id="phone"
          name="phone"
          value={phone}
          onChange={onPhoneChange}
        />
      </div>
    </div>
  );
};

export default UserForm;
