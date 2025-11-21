import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment
// Đảm bảo xử lý trường hợp key bị thiếu để tránh crash app ngay lập tức
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey: apiKey });

const cleanBase64 = (str: string) => str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

/**
 * Kiểm tra kết nối tới Gemini API
 */
export const checkAPIConnection = async (): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        // Gọi thử một lệnh nhẹ (lấy info model) để test key
        await ai.models.get({ model: 'gemini-2.5-flash' });
        return true;
    } catch (error) {
        console.error("API Key check failed:", error);
        return false;
    }
};

/**
 * General Generative Edit
 */
export const editImageWithAI = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    if (!apiKey) throw new Error("API Key chưa được cấu hình.");
    const model = 'gemini-2.5-flash-image';
    
    const systemPrompt = `
      Bạn là một chuyên gia chỉnh sửa ảnh kỹ thuật số (Photoshop Expert).
      Nhiệm vụ: Chỉnh sửa hình ảnh chính xác theo yêu cầu.
      Đầu ra: Chỉ trả về hình ảnh kết quả, không có văn bản.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64(base64Image) } },
          { text: `${systemPrompt}\n\nYêu cầu: ${prompt}` }
        ]
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * Object Removal / Inpainting
 * Sends an image with a Red Mask drawn on it.
 */
export const removeObjectWithAI = async (base64ImageWithMask: string): Promise<string> => {
    try {
        if (!apiKey) throw new Error("API Key chưa được cấu hình.");
        const model = 'gemini-2.5-flash-image';
        const prompt = "Look at the image. There are areas marked with RED color. Remove the object covered by the RED color and fill it in seamlessly with the background. High quality inpainting.";

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: cleanBase64(base64ImageWithMask) } },
                    { text: prompt }
                ]
            }
        });
        return extractImageFromResponse(response);
    } catch (error) {
        console.error("Gemini Eraser Error:", error);
        throw error;
    }
}

/**
 * Image Upscaling
 */
export const upscaleImageWithAI = async (base64Image: string, scale: '2x' | '4x'): Promise<string> => {
    try {
        if (!apiKey) throw new Error("API Key chưa được cấu hình.");
        // Using gemini-3-pro-image-preview for higher detail generation if simple editing isn't enough, 
        // but sticking to flash-image for consistency unless quality is poor.
        // For "Upscaling", we are essentially asking it to redraw the image at high fidelity.
        const model = 'gemini-2.5-flash-image'; 
        const prompt = `Upscale this image ${scale}. Enhance resolution, sharpen details, reduce noise, and make it look professional high-definition. Maintain the original composition exactly.`;

        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: cleanBase64(base64Image) } },
                    { text: prompt }
                ]
            }
        });
        return extractImageFromResponse(response);
    } catch (error) {
        console.error("Gemini Upscale Error:", error);
        throw error;
    }
}

// Helper to parse response
const extractImageFromResponse = (response: any): string => {
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("AI không trả về hình ảnh.");
}