export interface ApiResponse<T> {
  status: number;
  statusText: string;
  data: T;
}
