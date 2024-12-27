import React, { useEffect, useState } from "react";
import { fetchTemplates } from "../../server/api";

const Template = () => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const gender = localStorage.getItem("gender");
    const loadTemplates = async () => {
      try {
        const fetchedTemplates = await fetchTemplates(gender);
        setTemplates(fetchedTemplates);
      } catch (error) {
        setTemplates([]);
        console.error("Fetching templates error: ", error);
      }
    };

    loadTemplates();
  }, []);

  return (
    <div className="mt-[24rem]">
      {templates != null ? (
        <div className="text-center">
          <h1 className="text-white text-[5em] font-bold">Choose Your AI</h1>
          <div className="flex items-center justify-center gap-x-10 overflow-x-scroll mt-[6rem] mb-[18rem]">
            {templates.map((template, index) => (
              <img
                key={index}
                src={template.imageUrl}
                alt="templates"
                className="gender_img"
              />
            ))}
          </div>
        </div>
      ) : (
        <h1>No template selected.</h1>
      )}
    </div>
  );
};

export default Template;
