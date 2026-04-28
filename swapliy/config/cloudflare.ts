export const cloudflareConfig = {
  accountId: process.env.EXPO_PUBLIC_CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.EXPO_PUBLIC_CLOUDFLARE_API_TOKEN || '',
};

export const getCloudflareImageUrl = (imageId: string): string => {
  return `https://imagedelivery.net/${cloudflareConfig.accountId}/${imageId}/public`;
};
