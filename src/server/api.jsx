import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000/api";

export const getTemplates = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

export const getTemplate = async (filename) => {
  const response = await axios.get(`${API_BASE_URL}/template/${filename}`, {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data);
};

export const swapFace = async (template, sourceImage) => {
  const formData = new FormData();
  formData.append("template", template); // The filename of the template
  formData.append("source", sourceImage); // The actual source image file

  try {
    const response = await axios.post(`${API_BASE_URL}/swap`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.data.image) {
      return response.data.image; // Ensure that image data is returned from the server
    } else {
      throw new Error("No image returned from the server.");
    }
  } catch (error) {
    console.error("Error swapping face:", error);
    throw error; // Re-throw for better error handling in the component
  }
};
