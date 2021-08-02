import { RealRenderer } from '../RealRenderer/RealRenderer';
import { IRealDrawBoardEvents, RealDrawBoardEventList } from '../../constants/events/RealDrawBoardEvents';

import { RealDrawBoardOptions, RealDrawBoardSettings } from '../../types/RealDrawBoardTypes';
import { RealDrawBoardDefaults } from '../../constants/defaults/RealDrawBoardDefaults';

export * as RealRendererTypes from '../../types/RealRendererTypes';
export * as RealDrawBoardTypes from '../../types/RealDrawBoardTypes';
export * from '../../constants/defaults/RealDrawBoardDefaults';

import {
  changeTool,
  changeToolSetting,
  clear,
  clearPreview,
  _resetBoard
} from './boardManip';
import {
  _addDOMEvents,
  _removeDOMEvents
} from './_DOMEvents';
import {
  _getMouseCoords,
  _getTouchCoords
} from './_coords';

import { tools, Tool, ToolSettings, ToolDefaults } from './tools/tools';
import { Coordinate, Stroke } from '../../types/RealRendererTypes';

/**
 * Drawing board.
 */
export class RealDrawBoard extends RealRenderer<IRealDrawBoardEvents> {
  settings: RealDrawBoardSettings;
  tool: Tool = RealDrawBoardDefaults.tool;
  toolSettings: ToolSettings;
  /** key -> identifier, value -> coordinate
   *  For mouse, the key is 'mouse', for touches, stringified identifier -> https://developer.mozilla.org/en-US/docs/Web/API/Touch/identifier
   * @internal
   */
  _lastCoords: Map<string, Coordinate> = new Map();
  /** @internal */
  _doPreview: boolean = true; // If a preview should be drawn
  /**
   * The preview for the current stroke
   */
  /** @internal */
  _previewStroke: Map<string, Stroke> = new Map();
  /**
   * Map of ongoing strokes to their identifiers
   * key -> identifier, value -> strokeIndex
   * @internal
   */
  _strokeIdentifierMap: Map<string, number> = new Map();

  protected _resetBoard = _resetBoard;
  protected _addDOMEvents = _addDOMEvents;
  protected _removeDOMEvents = _removeDOMEvents;
  protected _onToolLoad = tools[RealDrawBoardDefaults.tool]._onToolLoad;
  protected _startStroke = tools[RealDrawBoardDefaults.tool]._startStroke;
  protected _endStroke = tools[RealDrawBoardDefaults.tool]._endStroke;
  protected _doStroke = tools[RealDrawBoardDefaults.tool]._doStroke;
  protected _toolPreview = tools[RealDrawBoardDefaults.tool]._toolPreview;
  protected _onScroll = tools[RealDrawBoardDefaults.tool]._onScroll;
  protected _onKey = tools[RealDrawBoardDefaults.tool]._onKey;
  protected _getMouseCoords = _getMouseCoords;
  protected _getTouchCoords = _getTouchCoords;

  public changeToolSetting = changeToolSetting;
  public changeTool = changeTool;
  public clearPreview = clearPreview;
  public clear = clear;

  constructor(options: RealDrawBoardOptions) {
    // *****DEFAULTS*****
    super(options, RealDrawBoardEventList);

    this.settings = {
      ...RealDrawBoardDefaults,
      ...options,
      toolSettings: {
        ...RealDrawBoardDefaults.toolSettings,
        ...('toolSettings' in options ? options.toolSettings : {})
      }
    }

    this.toolSettings = {
      ...ToolDefaults,
      ...this.settings.toolSettings
    }

    this.changeTool(this.settings.tool);
    // *****DEFAULTS*****

    this._onToolLoad();
  }
  // --- DOM Event Listeners ---

  // --- Mouse Events ---
  protected _mouseDownEventListener = (e: MouseEvent) => {
    if (e.button === 0 /* Left Click */) {
      if (e.ctrlKey) {
        this.svg.addEventListener('mousemove', this._panEventListener);
      }
      else {
        this.svg.addEventListener('mousemove', this._mouseMoveEventListener);

        const coords = this._getMouseCoords(e);

        this._startStroke(
          coords,
          'mouse',
          e.target
        )
        this._lastCoords.set('mouse', coords);
      }
    }
  }

  protected _mouseUpEventListener = (e: MouseEvent) => {
    if (e.button === 0 /* Left Click */) {
      const endCoords = this._getMouseCoords(e);
      this.svg.removeEventListener('mousemove', this._mouseMoveEventListener);
      this.svg.removeEventListener('mousemove', this._panEventListener);

      if(this._lastCoords.has('mouse')) {
        this._endStroke(endCoords, 'mouse');
        this._lastCoords.delete('mouse');
      }

      this._display(this.strokes[this._strokeIndex]);
    }
  }

  protected _mouseLeaveEventListener = (e: MouseEvent) => {
    this.svg.removeEventListener('mousemove', this._mouseMoveEventListener);

    if(this._lastCoords.has('mouse')) {
      this._endStroke(this._getMouseCoords(e), 'mouse');
      this._lastCoords.delete('mouse');
      this._display(this.strokes[this._strokeIndex]);
    }

    this.clearPreview();
  }

  protected _mouseMoveEventListener = (e: MouseEvent) => {
    const coords = this._getMouseCoords(e);
    this._doStroke(coords, 'mouse');
    this._lastCoords.set('mouse', coords);
  }

  protected _previewMouseMoveEventListener = (e: MouseEvent) => {
    const coords = this._getMouseCoords(e);

    if (this._doPreview) {
      if (!this._previewStroke.has('mouse')) this._previewStroke.set('mouse', []);

      this._toolPreview(coords, 'mouse');
      this._display(this._previewStroke.get('mouse'));
    }

    this._display(this.strokes[this._strokeIndex]);
  }

  protected _wheelEventListener = (e: WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey) {
      this.scale(Math.max(this.scaleFactor - e.deltaY * 0.001, 1));
    }
    else this._onScroll(e.deltaY * 0.05, this._getMouseCoords(e), 'mouse');
  }

  protected _panEventListener = (e: MouseEvent) => {
    if (e.ctrlKey) {
      this.changeOffsets(this._offsetX - e.movementX, this._offsetY - e.movementY);
    }
  }
  // --- Mouse Events ---

  // --- Keyboard Events ---
  protected _keyPressEventListener = (e: KeyboardEvent) => {
    this._onKey(e);
  }
  // --- /Keyboard Events ---

  // --- Touch Events ---
  protected _touchStartEventListener = (e: TouchEvent) => {
    e.preventDefault();

    for (let i = 0; i < e.touches.length; i++) {
      const coords = this._getTouchCoords(e.touches.item(i));
      const identifier = e.touches.item(i).identifier.toString();

      this._startStroke(
        coords,
        identifier,
        e.target
      )
      this._lastCoords.set(
        identifier,
        coords
      )
    }
  }

  protected _touchEndEventListener = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const coords = this._getTouchCoords(e.changedTouches.item(i));
      const identifier = e.changedTouches.item(i).identifier.toString();

      this._endStroke(
        coords,
        identifier
      )
      this._lastCoords.delete(
        identifier
      )
    }

    this.clearPreview();
  }

  protected _touchMoveEventListener = (e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const coords = this._getTouchCoords(e.touches.item(i));
      this._doStroke(
        coords,
        e.touches.item(i).identifier.toString()
      )
      this._lastCoords.set(e.touches.item(i).identifier.toString(), coords);
    }
  }

  protected _previewTouchMoveEventListener = (e: TouchEvent) => {
    for (let i = 0; i < e.touches.length; i++) {
      const coords = this._getTouchCoords(e.touches.item(i));
      const identifier = e.touches.item(i).identifier.toString();

      if (this._doPreview) {
        if (!this._previewStroke.has(identifier)) this._previewStroke.set(identifier, []);
        this._toolPreview(coords, identifier);
        this._display(this._previewStroke.get(identifier));
      }

      this._display(this.strokes[this._strokeIndex]);
    }
  }
  // --- Touch Events ---

  // --- DOM Event Listeners ---
  startRender = function startRender() {
    this._addDOMEvents();

    return this;
  }

  stopRender = function stopRender() {
    this._removeDOMEvents();

    return this;
  }

  reset() {
    this._resetBoard();
    super.reset();

    return this;
  }
}
