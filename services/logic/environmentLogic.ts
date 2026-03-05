import { Star } from '../../types';
import { VisualRNG } from '../rng';

export const initStars = (width: number, height: number): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: VisualRNG.random() * width,
      y: VisualRNG.random() * height,
      size: VisualRNG.random() * 2,
      // Scale speed for pixels per second (previously pixels per frame ~1-4)
      speed: (1 + VisualRNG.random() * 3) * 60 
    });
  }
  return stars;
};
