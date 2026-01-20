export interface ResponseDataProps<T> {
  data: T | T[];
  statusCode: number;
  message: string;
}
