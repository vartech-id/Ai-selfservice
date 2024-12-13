import React, { useEffect, useState } from "react";
import Gender from "./Gender";

const Hobby = () => {
  const [hobby, setHobby] = useState("");

  useEffect(() => {
    const savedHobby = localStorage.getItem("hobby");
    if (savedHobby) setHobby(savedHobby);
  }, []);

  const saveHobby = (selectedHobby) => {
    setHobby(selectedHobby);
    localStorage.setItem("hobby", selectedHobby);
  };

  return (
    <div className="w-full h-screen bg-red-500">
      <h2>Select a Hobby</h2>
      <button
        onClick={() => saveHobby("baking")}
      >
        Baking
      </button>
      <button
        onClick={() => saveHobby("cooking")}
      >
        Cooking
      </button>
      <button
        onClick={() => saveHobby("snacking")}
      >
        Snacking
      </button>

      {hobby && <h3>Selected Hobby: {hobby}</h3>}

      {/* Render the Gender component when a hobby is selected */}
      {hobby && <Gender hobby={hobby} />}
    </div>
  );
};

export default Hobby;
