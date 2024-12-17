import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000/api";

export const fetchTemplates = async (gender) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/images?folder=${gender}`);
    const filenames = response.data;

    return filenames.map((filename) => ({
      filename,
      imageUrl: `${API_BASE_URL}/image?filepath=${gender}/${encodeURIComponent(
        filename
      )}`,
    }));
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

// Get a specific template by filename
// export const getTemplate = async (filename) => {
//   const response = await axios.get(
//     `${API_BASE_URL}/template/${encodeURIComponent(filename)}`,
//     {
//       responseType: "blob",
//     }
//   );

//   return URL.createObjectURL(response.data);
// };

export const swapFace = async (template, sourceImage, template_path) => {
  // Fetch the template image as a Blob
  const templateBlob = await fetch(template)
    .then((response) => response.blob())
    .catch((error) => {
      console.error("Error fetching template image:", error);
      return null;
    });

  if (!templateBlob) {
    console.error("Template image could not be fetched");
    return null;
  }

  // Create a FormData object to send both template (as file) and source image
  const formData = new FormData();

  // Append the template image as a file
  formData.append("template", templateBlob, "template.jpg");

  // Append the source image file (the captured photo)
  formData.append("source", sourceImage, "source.jpg");

  formData.append("template_path", template_path)

  try {
    const response = await axios.post(
      "http://127.0.0.1:5000/api/swap", // Flask server URL
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // If the response contains the swapped image as base64
    if (response.data.image) {
      const swappedImageUrl = `data:image/jpeg;base64,${response.data.image}`;
      return swappedImageUrl;
    } else {
      console.error("Error: No image returned");
      return null;
    }
  } catch (error) {
    console.error("Error swapping face:", error);
    return null;
  }
};
