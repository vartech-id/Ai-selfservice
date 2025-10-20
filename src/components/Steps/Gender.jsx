import React, { useState } from "react";

// Images
// 1. Upload di folder public
// 2. E.G: import men from "/nama_file.png";
import men from "/male.png";
import hijab from "/female_hijab.png";
import non_hijab from "/female.png";

const Gender = () => {
  const [selectedGender, setSelectedGender] = useState("");

  const genders = [
    { key: "men", src: men, alt: "Men" },
    { key: "women/hijab", src: hijab, alt: "Women with Hijab" },
    { key: "women/non-hijab", src: non_hijab, alt: "Women without Hijab" },
  ];

  // Save gender selection to state and localStorage
  const saveGender = (selectedGender) => {
    setSelectedGender(selectedGender);
    localStorage.setItem("gender", selectedGender);
  };

  return (
    <div className="w-full text-center">
      {/* <h1 className="text-white text-[5em] font-bold">Choose Your Gender</h1> */}
      <div className="flex mt-24 mx-auto space-x-10 justify-center items-center">
        {genders.map((gender) => (
          <img
            key={gender.key}
            className={`${
              selectedGender === gender.key
                ? "border-[1em] border-yellow-500 w-[340px]"
                : "w-[300px]"
            }`}
            src={gender.src}
            alt={gender.alt}
            onClick={() => saveGender(gender.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default Gender;
