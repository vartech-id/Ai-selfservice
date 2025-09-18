import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:5001/api";

export const fetchTemplates = async (gender) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/templates?folder=${gender}`
    );
    const filenames = response.data;

    return filenames.map((filename) => ({
      filename,
      imageUrl: `${API_BASE_URL}/template?filepath=${gender}/${encodeURIComponent(
        filename
      )}`,
    }));
  } catch (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }
};

export const swapFace = async (templateUrl, sourceImage) => {
  const formData = new FormData();

  try {
    // Fetch the template file from the URL
    const response = await fetch(templateUrl);
    const templateBlob = await response.blob();
    const templateFile = new File([templateBlob], "template.jpg", {
      type: templateBlob.type,
    });

    // Append the template file
    formData.append("template", templateFile);

    // Append the source image file
    formData.append("source", sourceImage, "source.jpg");

    // Send the POST request
    const result = await axios.post(`${API_BASE_URL}/swap`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (result.data.image) {
      const swappedImageUrl = `data:image/jpeg;base64,${result.data.image}`;
      return swappedImageUrl;
    } else {
      console.error("Error: No image returned");
      return null;
    }
  } catch (error) {
    console.error("Error in swapFace:", error);
    return null;
  }
};

export const saveUserData = async (userData) => {
  console.log("api triggered ", userData);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/save-user-data`,
      userData
    );

    if (response.status === 200) {
      console.log("User data saved sucessfully!");
      return response.data;
    } else {
      console.error("Error saving user data");
      return null;
    }
  } catch (error) {
    console.error("Error in saveUserData:", error);
    return null;
  }
};

export const exportTableToCSV = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/export`, {
      responseType: "blob", // To handle file download
    });

    // Create a downloadable link for the file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "user_table.csv");
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);

    return { success: true };
  } catch (error) {
    console.error("Error exporting table:", error);
    return { success: false, error };
  }
};

export const fetchPrinters = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/printer/config`);
    return response.data;
  } catch (error) {
    console.error("Error fetching printers:", error);
    throw error;
  }
};

export const updatePrinterConfig = async (config) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/printer/config`, config);
    return response.data;
  } catch (error) {
    console.error("Error updating printer config:", error);
    throw error;
  }
};

export const printImage = async (imageBlob) => {
  const formData = new FormData();
  formData.append("image", imageBlob, "image.jpg");

  try {
    const response = await axios.post(`${API_BASE_URL}/printer/print`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error printing image:", error);
    throw error;
  }
};