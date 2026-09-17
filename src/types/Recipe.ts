export interface Recipe {
  id: string;
  title: string;
  image: string;
  time: string;
  difficulty: string;
  tags: string[];
  isFavorite: boolean;
  ingredients: string[];
  instructions: string[];
}