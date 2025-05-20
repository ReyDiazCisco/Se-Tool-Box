import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000'; // Replace with your actual backend URL

const ApiClient = {
  uploadFile: async (file, uploadUrl) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post(`${API_BASE_URL}${uploadUrl}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error; // Re-throw to be handled by the calling component
    }
  },

  getColumns: async (sessionId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pipeline-identifier/columns/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting columns:', error);
      throw error;
    }
  },

  identifyOpportunities: async (sessionId, criteria) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/identify`, {
        session_id: sessionId,
        criteria: criteria,
      });
      return response.data;
    } catch (error) {
      console.error('Error identifying opportunities:', error);
      throw error;
    }
  },

  exportOpportunities: async (sessionId, criteria) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/export`, {
        session_id: sessionId,
        criteria: criteria,
      }, {
        responseType: 'blob', // Important for binary data like files
      });
      return response.data; // This will be a Blob object
    } catch (error) {
      console.error('Error exporting opportunities:', error);
      throw error;
    }
  },
};

export default ApiClient;