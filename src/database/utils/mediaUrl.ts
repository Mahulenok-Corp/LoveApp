const BASE_MEDIA_URL = "https://media.tonprison.xyz";
import "dotenv/config";

export const getMediaUrl = (path: string): string => {
  if (process.env.NODE_ENV === "production") {
    return `${BASE_MEDIA_URL}/${path}`;
  }

  return `${BASE_MEDIA_URL}/test455/${path}`;
};
