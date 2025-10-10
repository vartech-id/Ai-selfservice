const UserForm = ({ name, setName, phone, setPhone, email, setEmail, company, setCompany }) => {
  const onNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    localStorage.setItem("name", value);
  };

  const onPhoneChange = (e) => {
    let value = e.target.value;

    // format jadi 62xxxx
    if (value.startsWith("0")) {
      value = "62" + value.slice(1);
    }
    setPhone(value);
    localStorage.setItem("userPhone", value); // disimpan konsisten
  };

  const onEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    localStorage.setItem("email", value);
  };

  const onCompanyChange = (e) => {
    const value = e.target.value;
    setCompany(value);
    localStorage.setItem("company", value);
  };


  return (
    <div className="w-full flex flex-col items-center justify-center">
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
      <div className="text-center">
        <h1 className="text-white text-[5em] font-bold">Email</h1>
        <input
          className="border w-4/5 h-32 text-[5em]"
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={onEmailChange}
        />
      </div>
      <div className="text-center">
        <h1 className="text-white text-[5em] font-bold">Company</h1>
        <input
          className="border w-4/5 h-32 text-[5em]"
          type="text"
          id="company"
          name="company"
          value={company}
          onChange={onCompanyChange}
        />
      </div>
    </div>
  );
};

export default UserForm;
