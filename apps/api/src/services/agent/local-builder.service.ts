/**
 * Local Builder Service
 * Local LLM (Llama-4-Scout) integration for code generation
 * Generates React/HTML/CSS code from design specifications
 */

interface BuildRequest {
  designSpecId: string;
  designSpec: {
    tenantId: string;
    templateId: string;
    componentTree: any;
    themeConfig: any;
    businessContext: any;
  };
}

interface BuildResult {
  success: boolean;
  componentId?: string;
  code?: string;
  error?: string;
  processingTimeMs?: number;
}

const LOCAL_LLM_BASE_URL = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434';
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || 'llama-4-scout:17b-q4';
const LOCAL_LLM_TIMEOUT = parseInt(process.env.LOCAL_LLM_TIMEOUT || '120000');

export class LocalBuilderService {
  private buildQueue: Map<string, boolean> = new Map();

  /**
   * Trigger async build for a design spec
   * Called when a design spec is saved to database
   */
  async triggerBuild(designSpecId: string, designSpec: any): Promise<void> {
    if (this.buildQueue.has(designSpecId)) {
      console.log(`[LocalBuilder] Build already queued for ${designSpecId}`);
      return;
    }

    this.buildQueue.set(designSpecId, true);

    // Process in background
    this.processBuild(designSpecId, designSpec).catch((error) => {
      console.error(`[LocalBuilder] Build failed for ${designSpecId}:`, error);
      this.buildQueue.delete(designSpecId);
    });
  }

  /**
   * Process a build request
   * Generates code for each component in the tree
   */
  private async processBuild(designSpecId: string, designSpec: any): Promise<void> {
    console.log(`[LocalBuilder] Starting build for ${designSpecId}`);

    const startTime = Date.now();
    const generatedComponents: Map<string, string> = new Map();

    try {
      // Generate code for each component in the tree
      const componentTree = designSpec.componentTree;

      if (componentTree.zones) {
        for (const zone of componentTree.zones) {
          if (zone.components) {
            for (const component of zone.components) {
              const code = await this.generateComponentCode(component, designSpec.themeConfig);
              generatedComponents.set(component.componentId || component.id, code);
            }
          }
        }
      }

      // Store generated code
      // (In production, this would write to a file system or database table)

      const processingTimeMs = Date.now() - startTime;

      console.log(`[LocalBuilder] Build complete for ${designSpecId} in ${processingTimeMs}ms`);
    } catch (error: any) {
      console.error(`[LocalBuilder] Build error for ${designSpecId}:`, error.message);
      throw error;
    } finally {
      this.buildQueue.delete(designSpecId);
    }
  }

  /**
   * Generate React component code
   * Calls local LLM to generate code from component specification
   */
  async generateComponentCode(
    component: any,
    themeConfig: any
  ): Promise<string> {
    const startTime = Date.now();

    const prompt = this.buildPrompt(component, themeConfig);

    try {
      const response = await fetch(`${LOCAL_LLM_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LOCAL_LLM_MODEL,
          prompt,
          system: this.getSystemPrompt(),
          format: 'json',
          options: {
            temperature: 0.3,
            num_predict: 2000,
          },
        }),
        signal: AbortSignal.timeout(LOCAL_LLM_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Local LLM error: ${response.status}`);
      }

      const data = await response.json();
      const code = data.response || data.code || data.text;

      console.log(`[LocalBuilder] Generated code for ${component.componentId} in ${Date.now() - startTime}ms`);
      return code;
    } catch (error: any) {
      console.error(`[LocalBuilder] Code generation failed for ${component.componentId}:`, error.message);

      // Return fallback code
      return this.getFallbackCode(component);
    }
  }

  /**
   * Build prompt for code generation
   */
  private buildPrompt(component: any, themeConfig: any): string {
    const componentName = this.toPascalCase(component.componentId || component.id);
    const props = component.props || {};

    return `Generate a React component for: ${componentName}

Props: ${JSON.stringify(props, null, 2)}

Theme colors: ${JSON.stringify(themeConfig.colors || {}, null, 2)}

Return ONLY valid TypeScript React code with:
- Proper TypeScript types
- Tailwind CSS classes for styling
- Framer Motion for animations (if applicable)
- Export as default function component

Do not include any explanations outside the code.`;
  }

  /**
   * System prompt for code generation
   */
  private getSystemPrompt(): string {
    return `You are a React code generator for the znapsite.com platform.

Generate production-ready React components following these guidelines:

1. Use TypeScript with proper types
2. Use Tailwind CSS for styling
3. Use Framer Motion for animations
4. Follow atomic design principles
5. Ensure accessibility (WCAG 2.1 Level AA)
6. Optimize for performance (sub-100ms render times)
7. Use forwardRef for components that might receive refs
8. Include proper prop types interfaces

Component conventions:
- Use PascalCase for component names
- Use camelCase for prop names
- Export as default function
- Include displayName for debugging
- Add JSDoc comments for complex components`;
  }

  /**
   * Get fallback code for when LLM generation fails
   */
  private getFallbackCode(component: any): string {
    const componentName = this.toPascalCase(component.componentId || component.id);
    const props = component.props || {};

    return `import React from 'react';
import { motion } from 'framer-motion';

interface ${componentName}Props {
  // TODO: Add proper prop types
  [key: string]: any;
}

/**
 * ${componentName} - Generated component
 * TODO: This is fallback code - regenerate with Local Builder
 */
export default function ${componentName}(props: ${componentName}Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4"
    >
      {/* TODO: Implement ${componentName} */}
      <div className="text-gray-500">
        ${componentName} - Component under construction
      </div>
    </motion.div>
  );
}

${componentName}.displayName = '${componentName}';`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/\s/g, '');
  }

  /**
   * Check build status
   */
  isBuildPending(designSpecId: string): boolean {
    return this.buildQueue.has(designSpecId);
  }

  /**
   * Get build queue status
   */
  getQueueStatus(): { queued: number; processing: string[] } {
    return {
      queued: this.buildQueue.size,
      processing: Array.from(this.buildQueue.keys()),
    };
  }
}
