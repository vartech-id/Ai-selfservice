import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5000/api";

export const getTemplateByGender = async (gender) => {
  try {
    const response = await axios.get(
      // path = men, hijab, non-hijab
      `${API_BASE_URL}/templates?path=${gender}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

export const getTemplate = async (imageUrl) => {
  const response = await axios.get(`${API_BASE_URL}/template/${imageUrl}`);
  return response.data;
};

// export const performFaceSwap = async (template, templatePath, imageBlob) => {
//   const formData = new FormData();
//   formData.append("template", template);
//   formData.append("template_path", templatePath);
//   formData.append("source", imageBlob, "capture.jpg");

//   try {
//     const response = await axios.post("/api/swap", formData);
//     return response.data;
//   } catch (error) {
//     console.error("Error performing face swap:", error);
//   }
// };

export const swapFace = async (template, sourceImage) => {
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
  formData.append("template", templateBlob, "template.jpg"); // Use appropriate file extension for template

  // Append the source image file
  formData.append("source", sourceImage); // Assuming sourceImage is a File object from the file input

  // Log the formData entries with more details about the files
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(
        `${key}: [File] name=${value.name}, size=${value.size}, type=${value.type}`
      );
    } else {
      console.log(`${key}: ${value}`);
    }
  }

  try {
    // Send the POST request to the Flask server
    const response = await axios.post(
      "http://127.0.0.1:5000/api/swap",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data", // Indicate that we are sending files
        },
      }
    );

    // Check if the response contains the swapped image
    if (response.data.image) {
      // Convert the base64 image to an image URL
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
