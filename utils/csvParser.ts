/**
 * Utility to parse CSV files for the local audit engine
 */

export interface Guideline {
  Category: string;
  Issue: string;
  Description: string;
  Do: string;
  "Don't": string;
  Severity: string;
}

export const parseCSV = (csvText: string): Guideline[] => {
  if (!csvText || typeof csvText !== 'string') return [];
  
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1)
    .filter(line => line.trim() && line.includes(','))
    .map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, i) => {
        obj[header] = values[i]?.trim() || "";
      });
      return obj as Guideline;
    });
};

/**
 * Loads guidelines from the skills folder
 * Note: In a real web app, these would be served as static assets
 */
export const loadGuidelines = async (domain: string): Promise<Guideline[]> => {
  // Mapping domain to file names in .claude/skills/ui-ux-pro-max/data/
  const fileMap: Record<string, string> = {
    'ux': 'ux-guidelines.csv',
    'web': 'web-interface.csv',
    'reasoning': 'ui-reasoning.csv',
    'style': 'styles.csv'
  };

  const fileName = fileMap[domain];
  if (!fileName) return [];

  try {
    // In local development, we can try to fetch them if the server serves them
    // Or we can pre-embed them if needed. 
    // For this task, we'll assume they are accessible at /skills-data/ path
    const response = await fetch(`/skills-data/${fileName}`);
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error(`Failed to load guidelines for ${domain}`, error);
    return [];
  }
};
