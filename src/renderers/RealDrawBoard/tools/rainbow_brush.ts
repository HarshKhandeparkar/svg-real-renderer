import { RealDrawBoard } from '../RealDrawBoard';
import { convertHSLToRGB } from '../../../util/convertHSLToRGB';

let hue: number = 0;
let gradientColors: [number, number, number] = [1, 1, 1];

export const name = 'rainbow_brush';

export interface IRainbowBrushSettings {
  brushSize: number;
  changeRate: number;
}

export type RainbowBrushOptions = IRainbowBrushSettings | {};

export const RainbowBrushDefaults: IRainbowBrushSettings = {
  brushSize: 1,
  changeRate: 1
}

export function _startStroke(
  this: RealDrawBoard,
  coords: [number, number],
  identifier: string
) {
  // gradientColors = convertHSLToRGB(hue, 90, 40);
  // this._doPreview = false;
  // this._plot(coords[0], coords[1], this.toolSettings.brushSize, gradientColors);
}

export function _endStroke(
  this: RealDrawBoard,
  endCoords: [number, number],
  identifier: string
) {
  // gradientColors = convertHSLToRGB(hue, 90, 40);
  // this._plot(endCoords[0], endCoords[1], this.toolSettings.brushSize, gradientColors);
  this._doPreview = true;
}

export function _doStroke(
  this: RealDrawBoard,
  coords: [number, number],
  identifier: string
) {
  // hue = (hue + this.toolSettings.changeRate) % 360;
  // gradientColors = convertHSLToRGB(hue, 90, 40);
  // this._plot(coords[0], coords[1], this.toolSettings.brushSize, gradientColors);
  // this._stroke(coords[0], coords[1], this.toolSettings.brushSize, gradientColors, identifier);
}

export function _toolPreview(
  this: RealDrawBoard,
  coords: [number, number],
  identifier: string
) {
  // return <Texture>this._previewPlot(
  //   this.graphPixels,
  //   coords[0],
  //   coords[1],
  //   this.toolSettings.brushSize,
  //   gradientColors
  // )
}
