export type DataPoint = [number, number];

export interface DataSet {
  data: DataPoint[];
  target: number[];
}
