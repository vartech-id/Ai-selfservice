import React, { useEffect, useState } from "react";
import { fetchTemplates } from "../../server/api";

const Template = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null); // Track the selected image

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

  // Handle image click to update selectedIndex
  const handleImageClick = (index) => {
    setSelectedIndex(index);
  };

  return (
    <div className="px-4">
      {templates != null ? (
        <div className="text-center">
          <h1 className="text-white text-[5em] font-bold">Choose Your AI</h1>
          <div className="flex items-center justify-start gap-x-10 overflow-x-auto mt-[6rem] scrollbar-hide">
            {templates.map((template, index) => (
              <img
                key={index}
                src={template.imageUrl}
                alt="templates"
                className={`${selectedIndex === index
                    ? "border-[1em] border-yellow-500 w-[320px]"
                    : "w-[300px]"
                  } object-contain`}
                onClick={() => { handleImageClick(index); localStorage.setItem("selectedTemplate", template.imageUrl) }}
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
