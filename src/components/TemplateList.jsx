import React, { useEffect, useState } from "react";
import { getTemplates, getTemplate, swapFace } from "../server/api";

function TemplateList() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);
  const [swappedImage, setSwappedImage] = useState(null);

  useEffect(() => {
    async function fetchTemplates() {
      const templates = await getTemplates();
      setTemplates(templates);
    }
    fetchTemplates();
  }, []);

  const handleTemplateClick = async (filename) => {
    const template = await getTemplate(filename);
    setSelectedTemplate(template);
  };

  const handleImageUpload = (e) => {
    setSourceImage(e.target.files[0]);
  };

  const handleSwap = async () => {
    if (selectedTemplate && sourceImage) {
      const result = await swapFace(selectedTemplate, sourceImage);
      setSwappedImage(`data:image/jpeg;base64,${result}`);
    }
  };

  return (
    <div>
      <h1>Templates</h1>
      <ul>
        {templates.map((template) => (
          <li key={template} onClick={() => handleTemplateClick(template)}>
            {template}
          </li>
        ))}
      </ul>

      <div>
        <h2>Selected Template</h2>
        {selectedTemplate && (
          <img src={selectedTemplate} alt="Template" width="200" />
        )}

        <h2>Upload Source Image</h2>
        <input type="file" onChange={handleImageUpload} />

        <button onClick={handleSwap}>Swap Face</button>
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
