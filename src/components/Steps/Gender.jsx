import React, { useEffect, useState } from "react";
import { fetchTemplates } from "../../server/api";

const Gender = () => {
  const [gender, setGender] = useState(localStorage.getItem("gender") || null);
  const [templates, setTemplates] = useState([]);

  // Save gender selection to state and localStorage
  const saveGender = (selectedGender) => {
    setGender(selectedGender);
    localStorage.setItem("gender", selectedGender);
  };

  // Fetch templates whenever the gender changes
  useEffect(() => {
    const loadTemplates = async () => {
      if (gender) {
        try {
          const fetchedTemplates = await fetchTemplates(gender);
          setTemplates(fetchedTemplates);
        } catch (error) {
          setTemplates([]);
        }
      }
    };

    loadTemplates();
  }, [gender]);

  const templateSelected = (filename) => {
    localStorage.setItem("selectedTemplate", filename);
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
          <div className="flex gap-4">
            {templates.map((template, index) => (
              <img
                key={index}
                src={template.imageUrl} // Use the imageUrl from the API
                alt="template"
                className="w-44 h-auto cursor-pointer"
                onClick={() => templateSelected(template.filename)}
              />
            ))}
          </div>
        </div>
      ) : (
        <p>No templates available.</p>
      )}
    </div>
  );
};

export default Gender;
