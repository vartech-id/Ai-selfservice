import React from "react";
import tap from "../../assets/ui/tap.png";

const Opening = ({ onStart }) => {
  return <img src={tap} alt="image/png" onClick={onStart} />;
};

export default Opening;
