import React, { useEffect, useState } from "react";

const UserForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

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
    console.log(value);
  };

  const onPhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    localStorage.setItem("phone", value);
    console.log(value);
  };

  return (
    <div>
      <h1>Name:</h1>
      <input
        className="border"
        type="text"
        id="name"
        name="name"
        value={name}
        onChange={onNameChange}
      />
      <h1>Phone</h1>
      <input
        className="border"
        type="number"
        id="phone"
        name="phone"
        value={phone}
        onChange={onPhoneChange}
      />
    </div>
  );
};

export default UserForm;
