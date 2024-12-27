import React from "react";

// Images
import men from "../../assets/men/Expo_0001.jpg";
import hijab from "../../assets/women/hijab/sulawesi.png";
import non_hijab from "../../assets/women/non-hijab/ai_00323_.png";

const Gender = () => {
  // Save gender selection to state and localStorage
  const saveGender = (selectedGender) => {
    localStorage.setItem("gender", selectedGender);
  };

  return (
    <div className="w-full grid mt-[22rem] text-center">
      <h1 className="text-white text-[5em] font-bold">Choose Your Gender</h1>
      <div className="flex mt-24 mx-auto space-x-10">
        <img
          className="gender_img"
          src={men}
          onClick={() => saveGender("men")}
        />
        <img
          className="gender_img"
          src={hijab}
          onClick={() => saveGender("women/hijab")}
        />
        <img
          className="gender_img"
          src={non_hijab}
          onClick={() => saveGender("women/non-hijab")}
        />
      </div>
    </div>
  );
};

export default Gender;
