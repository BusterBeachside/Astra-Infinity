
export * from './draw/obstacleRenderer';
export * from './draw/effectRenderer';

export const clearCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Always clear the entire canvas to prevent smearing if resolution changed
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};


