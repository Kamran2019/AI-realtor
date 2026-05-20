import apiClient from "./apiClient";

export const runImageDetection = ({ imageIndex, inspectionId, roomId }) =>
  apiClient.post(`/ai/inspections/${inspectionId}/rooms/${roomId}/images/${imageIndex}/detect`);
