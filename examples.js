/**
 * Examples of using Gemini for image generation
 * Based on official Google AI documentation
 */

require('dotenv').config();
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Example 1: Basic image generation with Gemini 2.0
async function generateImageBasic() {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-preview-image-generation" 
    });
    
    try {
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Create a picture of a cat wearing a space helmet on the moon" }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                topP: 0.8,
                topK: 32,
                maxOutputTokens: 2048,
            },
        });
        
        // Process and save the image
        const response = result.response;
        for (const candidate of response.candidates || []) {
            for (const part of candidate.content?.parts || []) {
                if (part.inlineData?.data) {
                    // Save the image to a file
                    const imageData = part.inlineData.data;
                    const buffer = Buffer.from(imageData, 'base64');
                    fs.writeFileSync('generated-image.png', buffer);
                    console.log("Image saved to generated-image.png");
                    return true;
                }
            }
        }
        console.log("No image data found in the response");
        return false;
    } catch (error) {
        console.error("Error generating image:", error.message);
        return false;
    }
}

// Run the example when executed directly
if (require.main === module) {
    generateImageBasic()
        .then(success => console.log(`Image generation ${success ? 'successful' : 'failed'}`))
        .catch(err => console.error("Error:", err));
}

module.exports = {
    generateImageBasic
};
