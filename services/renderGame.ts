
export * from './draw/obstacleRenderer';
export * from './draw/effectRenderer';

export const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  ctx.clearRect(0, 0, width, height);
};


