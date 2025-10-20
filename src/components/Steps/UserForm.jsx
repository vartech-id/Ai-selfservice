const UserForm = ({ name, setName, phone, setPhone, email, setEmail }) => {
  const onNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    localStorage.setItem("name", value);
  };

  const onPhoneChange = (e) => {
      const value = e.target.value.trim();
      setPhone(value);
      localStorage.setItem("userPhone", value);
  };

  const onEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    localStorage.setItem("email", value);
  };

  return (
    <div className="div-form w-full flex flex-col items-center justify-center space-y-20">
      <div className="text-center">
        {/* <h1 className="text-white text-[5em] font-bold">Name</h1> */}
        <input
          className="rounded-[30px] border w-4/5 h-32 text-[5em]"
          type="text"
          id="name"
          name="name"
          placeholder="NAMA"
          value={name}
          onChange={onNameChange}
        />
      </div>
      <div className="text-center">
        {/* <h1 className="text-white text-[5em] font-bold">Phone Number</h1> */}
        <input
          className="rounded-[30px] border w-4/5 h-32 text-[5em]"
          type="tel"
          id="phone"
          name="phone"
          placeholder="NO. HP"
          value={phone}
          onChange={onPhoneChange}
        />
      </div>
      <div className="text-center">
         {/* <h1 className="text-white text-[5em] font-bold">Email</h1>  */}
         <input 
           className="rounded-[30px] border w-4/5 h-32 text-[5em]" 
           type="email" 
           id="email" 
           name="email"
           placeholder="ALAMAT EMAIL" 
           value={email} 
           onChange={onEmailChange} 
         /> 
       </div> 
       <p className="isi-data-dirimu">ISI DATA DIRIMU!</p>
    </div>
  );
};

export default UserForm;
