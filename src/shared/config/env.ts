export const env = {
  get greenApiUrl(): string {
    const value = process.env.NEXT_PUBLIC_GREEN_API_URL;
    if (!value) throw new Error('GREEN_API_URL_MISSING');

    const url = new URL(value);
    if (url.protocol !== 'https:') {
      throw new Error('GREEN_API_URL_HTTPS_REQUIRED');
    }

    return value;
  },
};
