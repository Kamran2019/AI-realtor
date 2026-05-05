import apiClient from "./apiClient";

export const getLegalPackRisks = (propertyId) =>
  apiClient.get(`/properties/${propertyId}/legal-pack/risks`);

export const uploadLegalPack = (propertyId, { file, url } = {}) => {
  if (file) {
    const formData = new FormData();

    formData.append("file", file);

    return apiClient.post(`/properties/${propertyId}/legal-pack`, formData);
  }

  return apiClient.post(`/properties/${propertyId}/legal-pack`, { url });
};
