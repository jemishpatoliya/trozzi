// AI Service for text improvement
class AIService {
  private apiKey: string | null = null;
  private baseUrl: string = 'https://api.openai.com/v1';

  constructor() {
    this.initializeApiKey();
  }

  // Initialize or generate API key
  private async initializeApiKey() {
    // Try to get existing API key from localStorage
    const storedKey = localStorage.getItem('ai_api_key');
    if (storedKey) {
      this.apiKey = storedKey;
      return;
    }

    // Generate new API key for free tier users
    const newKey = await this.generateFreeApiKey();
    if (newKey) {
      this.apiKey = newKey;
      localStorage.setItem('ai_api_key', newKey);
    }
  }

  // Generate free API key (simulated - in production, this would call your auth service)
  private async generateFreeApiKey(): Promise<string | null> {
    try {
      // For demo purposes, we'll use a mock key
      // In production, this would integrate with your authentication system
      const mockKey = `sk-free-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Store user registration for AI usage
      const userInfo = {
        userId: localStorage.getItem('userId') || 'anonymous',
        apiKey: mockKey,
        tier: 'free',
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      
      localStorage.setItem('ai_user_info', JSON.stringify(userInfo));
      return mockKey;
    } catch (error) {
      console.error('Failed to generate API key:', error);
      return null;
    }
  }

  // Improve product description using AI
  async improveDescription(originalDescription: string, productName: string, category: string): Promise<string> {
    if (!this.apiKey) {
      await this.initializeApiKey();
    }

    if (!this.apiKey) {
      throw new Error('Failed to initialize AI service');
    }

    try {
      const prompt = `Improve the following product description to make it more professional, engaging, and persuasive. 

Product Name: ${productName}
Category: ${category}
Original Description: ${originalDescription}

Please enhance the description by:
1. Making it more engaging and professional
2. Improving grammar and readability
3. Adding persuasive language that highlights benefits
4. Keeping it concise but comprehensive
5. Maintaining accuracy to the original product
6. Using marketing-friendly language

Return only the improved description without any additional text or explanations.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional copywriter specializing in e-commerce product descriptions. Your task is to improve product descriptions to make them more appealing and professional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        // Fallback to local improvement if API fails
        return this.fallbackImprovement(originalDescription, productName, category);
      }

      const data = await response.json();
      const improvedDescription = data.choices[0]?.message?.content?.trim();

      if (!improvedDescription) {
        return this.fallbackImprovement(originalDescription, productName, category);
      }

      // Update usage count
      this.updateUsageCount();

      return improvedDescription;
    } catch (error) {
      console.error('AI improvement failed:', error);
      return this.fallbackImprovement(originalDescription, productName, category);
    }
  }

  // Fallback improvement method (local processing)
  private fallbackImprovement(originalDescription: string, productName: string, category: string): string {
    let improved = originalDescription;

    // Basic improvements
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    
    // Add professional language patterns
    if (!improved.includes('high-quality') && !improved.includes('premium')) {
      improved = `Experience the ${productName}, a high-quality product designed for ${category} enthusiasts. ` + improved;
    }

    // Add benefits-focused language
    if (!improved.includes('perfect') && !improved.includes('ideal')) {
      improved += ` Perfect for everyday use, this product combines style and functionality.`;
    }

    // Ensure proper ending
    if (!improved.endsWith('.') && !improved.endsWith('!')) {
      improved += '.';
    }

    return improved;
  }

  // Update usage count for tracking
  private updateUsageCount() {
    try {
      const userInfo = JSON.parse(localStorage.getItem('ai_user_info') || '{}');
      userInfo.usageCount = (userInfo.usageCount || 0) + 1;
      userInfo.lastUsed = new Date().toISOString();
      localStorage.setItem('ai_user_info', JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to update usage count:', error);
    }
  }

  // Get usage statistics
  getUsageStats() {
    try {
      const userInfo = JSON.parse(localStorage.getItem('ai_user_info') || '{}');
      return {
        usageCount: userInfo.usageCount || 0,
        tier: userInfo.tier || 'free',
        createdAt: userInfo.createdAt,
        lastUsed: userInfo.lastUsed
      };
    } catch (error) {
      return {
        usageCount: 0,
        tier: 'free',
        createdAt: null,
        lastUsed: null
      };
    }
  }

  // Check if service is ready
  async isReady(): Promise<boolean> {
    if (!this.apiKey) {
      await this.initializeApiKey();
    }
    return !!this.apiKey;
  }
}

export const aiService = new AIService();
export default aiService;
