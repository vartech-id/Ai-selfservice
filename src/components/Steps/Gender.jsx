import React, { useEffect, useState } from "react";
import { getTemplateByGender, getTemplate } from "../../server/api";

const Gender = () => {
  const [gender, setGender] = useState(localStorage.getItem("gender") | null);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await getTemplateByGender(gender);
        setTemplates(data);
      } catch (error) {
        console.error("Error: ", error);
      }
    };

    fetchTemplates();
  }, [gender]);

  // Save gender selection to state and localStorage
  const saveGender = (selectedGender) => {
    setGender(selectedGender);
    localStorage.setItem("gender", selectedGender);
  };

  return (
    <div>
      <h3>Select a Gender</h3>
      <button onClick={() => saveGender("men")}>Men</button>
      <button onClick={() => saveGender("women")}>Women</button>

      {gender === "women" && (
        <div>
          <h4>Do you wear hijab?</h4>
          <button onClick={() => saveGender("women/hijab")}>Hijab</button>
          <button onClick={() => saveGender("women/non-hijab")}>
            Non Hijab
          </button>
        </div>
      )}

      {templates && templates.length > 0 ? (
        <div>
          <h4>Templates:</h4>
          {templates.map((imageUrl, index) => (
            <img
              key={index}
              src={`http://127.0.0.1:5000/api/template/${gender}/${imageUrl}`}
              alt="templates"
            />
          ))}
        </div>
      ) : (
        <p>No templates available.</p>
      )}
    </div>
  );
};

export default Gender;
