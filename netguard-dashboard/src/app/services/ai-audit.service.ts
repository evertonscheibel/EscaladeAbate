import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Device } from '../models';

@Injectable({
    providedIn: 'root'
})
export class AiAuditService {
    private genAI = new GoogleGenerativeAI('YOUR_API_KEY'); // Replace with actual key or environment variable
    private model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    async generateNetworkAudit(devices: Device[]): Promise<string> {
        const systemPrompt = `You are a Senior Network Operations Center (NOC) Engineer. 
    Analyze the current network state provided in JSON format and generate a professional executive report.
    Identify critical issues (offline devices, high CPU, high temperature), suggest immediate corrective actions, 
    and provide long-term optimization recommendations. Use Markdown formatting.`;

        const inventoryData = JSON.stringify(devices.map(d => ({
            name: d.name,
            type: d.type,
            status: d.status,
            ip: d.ip,
            metrics: d.metrics
        })));

        try {
            const result = await this.model.generateContent([systemPrompt, inventoryData]);
            return result.response.text();
        } catch (error) {
            console.error('AI Audit failed:', error);
            return "## AI Audit Error\nFailed to connect to Google Gemini API. Please check your network or API key.";
        }
    }
}
