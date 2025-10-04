class SuccessDto<T> {
  statusCode: number;
  status: boolean;
  message: string;
  data: T;

  constructor(statusCode: number, status: boolean, message: string, data: T) {
    this.statusCode = statusCode;
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

export function createResponse<T>(message: string, data: T): SuccessDto<T> {
  return new SuccessDto<T>(200, true, message, data);
}
