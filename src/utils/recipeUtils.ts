import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Recipe } from '../types/recipe';

const renderFormattedList = (items: string[], isOrdered: boolean = false) => {
  const tag = isOrdered ? 'ol' : 'ul';
  const htmlItems = items.map((item) => {
    const trimmed = item.trim();
    if (trimmed.endsWith(':')) {
      return `<li style="list-style: none; font-weight: 700; font-size: 16px; margin-top: 14px; margin-left: -20px; color: #0f172a;">${trimmed}</li>`;
    }
    return `<li>${trimmed}</li>`;
  }).join('');

  return `<${tag}>${htmlItems}</${tag}>`;
};

// Export recipe to PDF with subheading support
export const exportRecipePDF = async (recipe: Recipe) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { font-family: -apple-system, sans-serif; padding: 24px; color: #0f172a; }
          h1 { margin-bottom: 4px; color: #0f172a; }
          .meta { font-size: 14px; color: #64748b; margin-bottom: 20px; }
          img { width: 100%; max-height: 280px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; }
          h2 { border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; color: #007aff; margin-top: 24px; }
          ul, ol { padding-left: 20px; line-height: 1.6; }
          li { margin-bottom: 6px; }
        </style>
      </head>
      <body>
        <h1>${recipe.title}</h1>
        <div class="meta">
          ⏱️ ${recipe.time} | 🍳 ${recipe.difficulty}
        </div>
        ${recipe.image ? `<img src="${recipe.image}" />` : ''}
        <h2>Ingredients</h2>
        ${renderFormattedList(recipe.ingredients, false)}
        <h2>Instructions</h2>
        ${renderFormattedList(recipe.instructions, true)}
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html: htmlContent });
  await Sharing.shareAsync(uri);
};