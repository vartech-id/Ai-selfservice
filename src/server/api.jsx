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
  formData.append("template", template);
  formData.append("source", sourceImage);

  const response = await axios.get(`${API_BASE_URL}/swap`, formData);
  return response.data.image;
};
