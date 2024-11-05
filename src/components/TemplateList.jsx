import React, { useEffect, useState } from "react";
import { getTemplates, getTemplate, swapFace } from "../server/api";

function TemplateList() {
  const [templates, setTemplates] = useState([]); // URLs of the images.
  const [selectedTemplate, setSelectedTemplate] = useState(null); // Selected from templates.
  const [sourceImage, setSourceImage] = useState(null); // Input image.
  const [swappedImage, setSwappedImage] = useState(null); // Swap API

  useEffect(() => {
    async function fetchTemplates() {
      const templateFilenames = await getTemplates(); // templates filename (['template1.jpg', 'template2.jpg'])
      const templateImages = await Promise.all(
        templateFilenames.map(async (filename) => {
          const templateImageUrl = await getTemplate(filename); // Fetch each template's image using getTemplate
          return { filename, imageUrl: templateImageUrl }; // Store both filename and image URL
        })
      );
      setTemplates(templateImages); // Store the fetched templates as objects with filename and image URL
    }
    fetchTemplates();
  }, []);

  const handleTemplateClick = async (templateImageUrl) => {
    setSelectedTemplate(templateImageUrl);
  };

  const handleImageUpload = (e) => {
    setSourceImage(e.target.files[0]);
  };

  const handleSwap = async () => {
    // if (selectedTemplate && sourceImage) {
    //   const result = await swapFace(selectedTemplate, sourceImage);
    //   setSwappedImage(`data:image/jpeg;base64,${result}`);
    // }

    console.log("clicked!");
  };

  return (
    <div>
      <h1>Templates</h1>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {templates.map((template) => (
          <div
            key={template.filename}
            onClick={() => handleTemplateClick(template.imageUrl)}
            style={{ margin: 10 }}
          >
            <img
              src={template.imageUrl}
              alt={template.filename}
              width={150}
              height={150}
              style={{ cursor: "pointer" }}
            />
          </div>
        ))}
      </div>

      <div>
        <h2>Selected Template</h2>
        {selectedTemplate && (
          <img src={selectedTemplate} alt="Selected Template" width="200" />
        )}

        <h2>Upload Source Image</h2>
        <input type="file" onChange={handleImageUpload} />

        <button type="button" onClick={handleSwap}>
          Swap Face
        </button>
      </div>

      {swappedImage && (
        <div>
          <h2>Swapped Image</h2>
          <img src={swappedImage} alt="Swapped Face" />
        </div>
      )}
    </div>
  );
}

export default TemplateList;
