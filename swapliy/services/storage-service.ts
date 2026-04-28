import { cloudflareConfig } from '@/config/cloudflare';
export const uploadProductImage = async (
  imageUri: string,
  productId: string,
  index: number
): Promise<string> => {
  try {
    const formData = new FormData();

    // 1. Detect the file extension and mime type
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    // 2. Format the body correctly for React Native's FormData
    formData.append("file", {
      uri: imageUri,
      name: `product_${productId}_${index}.${fileType}`,
      type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`, // Crucial for backend parsers
    } as any);

    // Cloudflare requires this for some account types
    formData.append("requireSignedURLs", "false");

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/images/v1`,
      {
        method: "POST",
        headers: {
          // Note: Content-Type header must NOT be set manually when using FormData
          Authorization: `Bearer ${cloudflareConfig.apiToken}`,
        },
        body: formData,
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.success) {
      console.error("Cloudflare Error Details:", uploadData.errors);
      throw new Error(uploadData?.errors?.[0]?.message || "Upload failed");
    }

    // 3. Find your Hash in the Cloudflare Images Dashboard 
    // It is usually found under 'Developer Tools' or in the URL of your images.
    const ACCOUNT_HASH = '7HdERiJuyJO7_MPvyiTmVw';
    const imageId = uploadData.result.id;

    return `https://imagedelivery.net/7HdERiJuyJO7_MPvyiTmVw/${imageId}/public`;

  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadProfileImage = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  try {
    const formData = new FormData();
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append("file", {
      uri: imageUri,
      name: `profile_${userId}.${fileType}`,
      type: `image/${fileType === 'png' ? 'png' : 'jpeg'}`,
    } as any);
    formData.append("requireSignedURLs", "false");

    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cloudflareConfig.apiToken}`,
        },
        body: formData,
      }
    );

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.success) {
      console.error("Cloudflare Error Details:", uploadData.errors);
      throw new Error(uploadData?.errors?.[0]?.message || "Upload failed");
    }

    const imageId = uploadData.result.id;
    return `https://imagedelivery.net/7HdERiJuyJO7_MPvyiTmVw/${imageId}/public`;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};

export const uploadMultipleImages = async (
  imageUris: string[],
  productId: string
): Promise<string[]> => {
  try {
    const uploadPromises = imageUris.map((uri, index) =>
      uploadProductImage(uri, productId, index)
    );
    
    const downloadUrls = await Promise.all(uploadPromises);
    return downloadUrls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};