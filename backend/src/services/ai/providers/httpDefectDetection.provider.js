const env = require("../../../config/env");
const ApiError = require("../../../utils/ApiError");

const SERVICE_UNAVAILABLE_MESSAGE = "AI detection service is currently unavailable.";
const SERVICE_TIMEOUT_MESSAGE = "AI detection service timed out.";
const INVALID_RESPONSE_MESSAGE = "AI detection service returned an invalid response.";

const buildDetectUrl = () => `${env.AI_SERVICE_URL.replace(/\/+$/, "")}/detect`;

const buildServiceImageUrl = (imageUrl) => {
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return new URL(imageUrl, `http://localhost:${env.PORT}`).toString();
};

const isAbortError = (error) => error?.name === "AbortError";

const detectDefectsWithHttp = async ({ imageUrl, inspectionId, roomId, imageIndex }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_DETECTION_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(buildDetectUrl(), {
      body: JSON.stringify({
        imageUrl: buildServiceImageUrl(imageUrl),
        inspectionId,
        roomId,
        imageIndex
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST",
      signal: controller.signal
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(504, SERVICE_TIMEOUT_MESSAGE);
    }

    throw new ApiError(502, SERVICE_UNAVAILABLE_MESSAGE);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new ApiError(502, SERVICE_UNAVAILABLE_MESSAGE);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(502, INVALID_RESPONSE_MESSAGE);
  }
};

module.exports = {
  INVALID_RESPONSE_MESSAGE,
  SERVICE_TIMEOUT_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  detectDefectsWithHttp
};
