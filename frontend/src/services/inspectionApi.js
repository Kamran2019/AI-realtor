import apiClient from "./apiClient";

export const listInspections = (params = {}) => apiClient.get("/inspections", { params });
export const createInspection = (payload) => apiClient.post("/inspections", payload);
export const getInspection = (id) => apiClient.get(`/inspections/${id}`);
export const updateInspection = (id, payload) => apiClient.patch(`/inspections/${id}`, payload);
export const addInspectionRoom = (id, payload) => apiClient.post(`/inspections/${id}/rooms`, payload);
export const updateInspectionRoom = (id, roomId, payload) =>
  apiClient.patch(`/inspections/${id}/rooms/${roomId}`, payload);
export const uploadInspectionRoomImage = (id, roomId, file) => {
  const formData = new FormData();

  formData.append("image", file);

  return apiClient.post(`/inspections/${id}/rooms/${roomId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
};
export const addManualDefect = (id, roomId, payload) =>
  apiClient.post(`/inspections/${id}/rooms/${roomId}/defects`, payload);
export const updateManualDefect = (id, roomId, defectId, payload) =>
  apiClient.patch(`/inspections/${id}/rooms/${roomId}/defects/${defectId}`, payload);
export const deleteManualDefect = (id, roomId, defectId) =>
  apiClient.delete(`/inspections/${id}/rooms/${roomId}/defects/${defectId}`);
export const changeInspectionStatus = (id, payload) => apiClient.patch(`/inspections/${id}/status`, payload);
