import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class PromptManagerService {
  private promptCache = new Map<string, string>();
  private readonly promptsPath = path.join(
    __dirname,
    '../../prompts/templates',
  );

  async getTemplate(templateName: string): Promise<string> {
    if (this.promptCache.has(templateName)) {
      return this.promptCache.get(templateName)!;
    }

    // Try to find template in root templates folder first
    let promptPath = path.join(this.promptsPath, `${templateName}.txt`);

    try {
      const template = await fs.readFile(promptPath, 'utf-8');
      this.promptCache.set(templateName, template);
      return template;
    } catch {
      // Try to find template in speaking folder
      promptPath = path.join(
        this.promptsPath,
        'speaking',
        `${templateName}.txt`,
      );

      try {
        const template = await fs.readFile(promptPath, 'utf-8');
        this.promptCache.set(templateName, template);
        return template;
      } catch {
        // Try writing templates
        promptPath = path.join(
          this.promptsPath,
          'writing',
          `${templateName}.txt`,
        );

        try {
          const template = await fs.readFile(promptPath, 'utf-8');
          this.promptCache.set(templateName, template);
          return template;
        } catch (error) {
          console.error(
            `Error reading prompt template: ${templateName}`,
            error,
          );
          throw new Error(`Prompt template ${templateName} not found.`);
        }
      }
    }
  }
}
