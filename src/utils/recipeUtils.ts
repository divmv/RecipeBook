import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Recipe } from '../context/RecipeContext';

export const exportRecipePDF = async (recipe: Recipe) => {
  // Format ingredients (support trailing colon subheadings)
  const ingredientsHtml = recipe.ingredients
    .map((item) =>
      item.trim().endsWith(':')
        ? `<h4 style="margin-top: 14px; margin-bottom: 4px; color: #0F172A; list-style-type: none; font-size: 16px;">${item}</h4>`
        : `<li style="margin-bottom: 6px; font-size: 14px; color: #334155;">${item}</li>`
    )
    .join('');

  // Format instructions (support trailing colon subheadings)
  const instructionsHtml = recipe.instructions
    .map((step) =>
      step.trim().endsWith(':')
        ? `<h4 style="margin-top: 14px; margin-bottom: 4px; color: #0F172A; list-style-type: none; font-size: 16px;">${step}</h4>`
        : `<li style="margin-bottom: 8px; font-size: 14px; color: #334155;">${step}</li>`
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${recipe.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            padding: 30px;
            color: #0F172A;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { font-size: 28px; margin-bottom: 6px; color: #0F172A; }
          .meta { font-size: 14px; color: #64748B; margin-bottom: 20px; font-weight: 600; }
          .hero-img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px; margin-bottom: 20px; }
          h2 { font-size: 20px; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px; margin-top: 24px; color: #0F172A; }
          ul, ol { padding-left: 20px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <h1>${recipe.title}</h1>
        <div class="meta">⏱️ Time: ${recipe.time} | 🍳 Difficulty: ${recipe.difficulty}</div>
        
        ${recipe.image ? `<img src="${recipe.image}" class="hero-img" />` : ''}

        <h2>Ingredients</h2>
        <ul>${ingredientsHtml}</ul>

        <h2>Instructions</h2>
        <ol>${instructionsHtml}</ol>
      </body>
    </html>
  `;

  try {
    if (Platform.OS === 'web') {
      // Direct browser print preview on Vercel
      await Print.printAsync({ html: htmlContent });
    } else {
      // Native iOS / Android file generation & share dialog
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        await Print.printAsync({ uri });
      }
    }
  } catch (error) {
    console.error('Failed to export PDF:', error);
    alert('Could not generate PDF. Please check browser print permissions.');
  }
};