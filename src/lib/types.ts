export type DataPoint = [number, number];

export interface DataSet {
  data: DataPoint[];
  target: number[];
}

export type {
  Data as PlotlyData,
  Layout,
  Config,
  PlotlyHTMLElement,
  BeforePlotEvent,
  ClickAnnotationEvent,
  FrameAnimationEvent,
  LegendClickEvent,
  PlotMouseEvent,
  PlotHoverEvent,
  PlotRelayoutEvent,
  PlotRestyleEvent,
  PlotSelectionEvent,
  SliderChangeEvent,
  SliderStartEvent,
  SunburstClickEvent
} from 'plotly.js';
