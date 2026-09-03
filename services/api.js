import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

// API Base URL - prioritize environment variables, then use defaults based on environment
const getApiBaseUrl = () => {
  // For production
  if (!__DEV__) {
    return (
      process.env.EXPO_PUBLIC_PROD_API_URL ||
      "https://your-production-api.com/api"
    );
  }

  // For development - try environment variable first
  const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  if (devUrl) {
    return devUrl;
  }

  // Fallback for local development
  // Use 10.0.2.2 for Android emulator (refers to host machine)
  // Use localhost for web
  // For physical devices, set EXPO_PUBLIC_DEV_API_URL to your machine IP
  return "http://localhost:5000/api";
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      AsyncStorage.setItem("authToken", token);
    } else {
      AsyncStorage.removeItem("authToken");
    }
  }

  // Get stored token
  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("authToken");
    }
    return this.token;
  }

  // Make API request with proper headers
  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Request: ${options.method || "GET"} ${url}`);
      const response = await fetch(url, config);
      const data = await response.json();
      console.log(`API Response (${response.status}):`, data);

      if (!response.ok) {
        if (response.status === 401) {
          // Only clear token for authenticated endpoints, not login/register
          if (
            token &&
            !endpoint.includes("/auth/login") &&
            !endpoint.includes("/auth/register")
          ) {
            this.setToken(null);
            throw new Error("Session expired. Please login again.");
          }
          // For login/register, return the error message from the API
          throw new Error(
            data.error || data.message || "Authentication failed",
          );
        }
        console.error(`API Error (${response.status}):`, data);
        const detail = data.details ? `: ${data.details}` : "";
        const error = new Error(
          `${data.error || data.message || "Request failed"}${detail}`,
        );
        error.status = response.status;
        error.provider = data.provider || null;
        error.hint = data.hint || null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error("API Fetch Error:", error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Handle file uploads. Content-Type is deliberately NOT set manually:
  // fetch/XMLHttpRequest auto-generates the correct
  // "multipart/form-data; boundary=..." header (with the boundary the
  // server's multipart parser needs) only when you don't override
  // Content-Type yourself. Setting it manually without a boundary - as
  // this method previously did - silently breaks multer's parsing on
  // every request that uses this method.
  async upload(endpoint, formData) {
    const token = await this.getToken();
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(
          `${data.error || data.message || "Upload failed"}${data.details ? `: ${data.details}` : ""}`,
        );
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      throw error;
    }
  }
}

// Create API client instance
const apiClient = new ApiClient();

// Authentication API
export const authAPI = {
  register: (userData) => apiClient.post("/auth/register", userData),
  login: (credentials) => apiClient.post("/auth/login", credentials),
  getProfile: () => apiClient.get("/auth/profile"),
};

// Health Monitoring API
export const healthAPI = {
  recordHealth: (healthData) => apiClient.post("/health/record", healthData),
  addHealthRecord: (healthData) => apiClient.post("/health/record", healthData),
  getHealthHistory: (params = {}) => apiClient.get("/health/history", params),
  getLatestHealth: () => apiClient.get("/health/latest"),
};

// AI Prediction API
export const predictionAPI = {
  predictRisk: (healthData) => apiClient.post("/predict/risk", healthData),
  getPredictionHistory: (params = {}) =>
    apiClient.get("/predict/history", params),
};

// AI Conversation API (English path — Tavus video avatar)
export const aiAPI = {
  createConversation: (data = {}) =>
    apiClient.post("/ai/create-conversation", data),
  startSession: (data = {}) => apiClient.post("/ai/start-session", data),
  endSession: (sessionId) =>
    apiClient.post("/ai/end-session", { session_id: sessionId }),
  analyzeSymptom: (symptomData) =>
    apiClient.post("/ai/analyze-symptom", symptomData),
  getSessions: (params = {}) => apiClient.get("/ai/sessions", params),
  getTavusStatus: () => apiClient.get("/ai/tavus-status"),
};

// Twi Assistant API (Twi path — free knowledge base (TF-IDF + Groq) + TalkingHead avatar)
export const twiAPI = {
  sendMessage: (data = {}) => apiClient.post("/twi/message", data),
  // Synthesizes speech for text that's already Twi (no detection/KB/
  // translation) - used for the avatar's spoken welcome greeting.
  speak: (text, extra = {}) => apiClient.post("/twi/speak", { text, ...extra }),
  // audioSource is a web Blob, or on native a { uri, name, type } file
  // descriptor as produced by expo-audio (see TwiAIComponent.stopRecording).
  sendVoice: async (audioSource, extra = {}) => {
    const token = await apiClient.getToken();
    const formData = new FormData();

    if (audioSource && typeof audioSource === "object" && "uri" in audioSource) {
      formData.append("audio", {
        uri: audioSource.uri,
        name: audioSource.name || "voice.m4a",
        type: audioSource.type || "audio/m4a",
      });
    } else {
      formData.append("audio", audioSource, "voice.webm");
    }

    Object.entries(extra).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await fetch(`${apiClient.baseURL}/twi/voice`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.details
        ? `${data.error || data.message || "Voice message failed"}: ${data.details}`
        : (data.error || data.message || "Voice message failed");
      throw new Error(message);
    }

    return data;
  },
};

// Speech API
export const speechAPI = {
  getSpeakers: () => apiClient.get("/speech/speakers"),
  transcribe: async (audioBlob, language = "tw") => {
    const token = await apiClient.getToken();
    const formData = new FormData();
    formData.append("audio", audioBlob, "voice.webm");

    const response = await fetch(
      `${apiClient.baseURL}/speech/transcribe?language=${language}`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Transcription failed");
    }

    return data;
  },
  synthesize: async (text, language = "tw", speakerId = "female") => {
    const token = await apiClient.getToken();

    const response = await fetch(`${apiClient.baseURL}/speech/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ text, language, speaker: speakerId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || "Speech synthesis failed");
    }

    return response.blob();
  },
};

// Messaging API
export const messageAPI = {
  sendMessage: (messageData) => apiClient.post("/messages/send", messageData),
  // Sends a voice note or video clip. mediaSource is a web Blob, or on
  // native a { uri, name, type } file descriptor (same shape used by
  // twiAPI.sendVoice). Uses a manual fetch, not apiClient.post (which
  // always JSON-encodes) or apiClient.upload (see the boundary note on
  // that method) - built the same safe way as twiAPI.sendVoice.
  sendMediaMessage: async (recipientId, mediaSource, extra = {}) => {
    const token = await apiClient.getToken();
    const formData = new FormData();
    formData.append("recipient_id", recipientId);

    if (mediaSource && typeof mediaSource === "object" && "uri" in mediaSource) {
      formData.append("media", {
        uri: mediaSource.uri,
        name: mediaSource.name || "media",
        type: mediaSource.type || "application/octet-stream",
      });
    } else {
      formData.append("media", mediaSource, extra.filename || "media");
    }

    Object.entries(extra).forEach(([key, value]) => {
      if (key === "filename") return;
      formData.append(key, String(value));
    });

    const response = await fetch(`${apiClient.baseURL}/messages/send`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to send media message");
    }

    return data;
  },
  getConversation: (userId, params = {}) =>
    apiClient.get(`/messages/conversation/${userId}`, params),
  getConversations: (params = {}) =>
    apiClient.get("/messages/conversations", params),
  getUnreadCount: () => apiClient.get("/messages/unread-count"),
  markAsRead: (messageId) => apiClient.post(`/messages/mark-read/${messageId}`),
  getPatients: () => apiClient.get("/messages/doctor/patients"),
};

// User Profile API
export const userAPI = {
  getProfile: () => apiClient.get("/auth/profile"),
  updateProfile: (profileData) => apiClient.put("/auth/profile", profileData),
  getPregnancyProfile: () => apiClient.get("/auth/pregnancy-profile"),
  updatePregnancyProfile: (profileData) =>
    apiClient.put("/auth/pregnancy-profile", profileData),
  updatePassword: (passwordData) =>
    apiClient.post("/auth/change-password", passwordData),
};

// Appointments API
export const appointmentAPI = {
  getAppointments: (params = {}) => apiClient.get("/appointments", params),
  bookAppointment: (appointmentData) =>
    apiClient.post("/appointments", appointmentData),
  cancelAppointment: (appointmentId) =>
    apiClient.delete(`/appointments/${appointmentId}`),
  getDoctorAppointments: (params = {}) =>
    apiClient.get("/appointments/doctor", params),
};

// Medical Records API
export const medicalAPI = {
  getTestResults: (params = {}) =>
    apiClient.get("/medical/test-results", params),
  getVaccinations: () => apiClient.get("/medical/vaccinations"),
  recordVaccination: (vaccinationData) =>
    apiClient.post("/medical/vaccinations", vaccinationData),
};

// Doctor-Patient API
export const doctorAPI = {
  getPatients: (params = {}) => apiClient.get("/doctor/patients", params),
  getPatientDetails: (patientId) =>
    apiClient.get(`/doctor/patients/${patientId}`),
  getPatientHistory: (patientId, params = {}) =>
    apiClient.get(`/doctor/patients/${patientId}/history`, params),
  addNote: (patientId, noteData) =>
    apiClient.post(`/doctor/patients/${patientId}/notes`, noteData),
  browseDoctors: (params = {}) => apiClient.get("/doctor/browse", params),
  // Matches GET/PATCH /api/doctor/symptom-reviews - see
  // backend/src/routes/doctor.js
  getSymptomReviews: (params = {}) =>
    apiClient.get("/doctor/symptom-reviews", params),
  submitSymptomReview: (symptomId, feedback) =>
    apiClient.patch(`/doctor/symptom-reviews/${symptomId}`, { feedback }),
};

// Symptom report + clinician review API (patient side). Matches
// POST /api/ai/analyze-symptom and GET /api/ai/my-symptom-reviews - see
// backend/src/routes/ai.js. Kept separate from aiAPI since it's a distinct
// feature (Report Symptoms screen) with its own multipart submit shape.
export const symptomAPI = {
  // formData is built by the caller (app/symptom-checker.js) with
  // symptom_text/duration/severity_level fields and an optional "photo"
  // file part. Sent with a manual fetch (not apiClient.post, which always
  // JSON-encodes) and without a manual Content-Type, for the same boundary
  // reason documented on apiClient.upload() above.
  submit: async (formData) => {
    const token = await apiClient.getToken();
    const response = await fetch(`${apiClient.baseURL}/ai/analyze-symptom`, {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "Failed to submit symptom report");
    }

    return data;
  },
  getMyReviews: (params = {}) => apiClient.get("/ai/my-symptom-reviews", params),
};

// Video/Voice Call API
export const callAPI = {
  initiateCall: (callData) => apiClient.post("/calls/initiate", callData),
  getCallToken: (channelName, callType = "audio") =>
    apiClient.post("/calls/get-token", { channelName, callType }),
  endCall: (callId) => apiClient.post(`/calls/${callId}/end`, {}),
  getCallHistory: (params = {}) => apiClient.get("/calls/history", params),
  rejectCall: (callId) => apiClient.post(`/calls/${callId}/reject`, {}),
  acceptCall: (callId) => apiClient.post(`/calls/${callId}/accept`, {}),
  getActiveCall: () => apiClient.get("/calls/active"),
};

// Utility function for error handling
export const handleApiError = (error, showMessage = true) => {
  console.error("API Error:", error);

  if (showMessage) {
    const message = error.message || "An unexpected error occurred";
    Alert.alert("Error", message);
  }

  throw error;
};

// Health check
export const checkApiHealth = () => apiClient.get("/health");

export default apiClient;
