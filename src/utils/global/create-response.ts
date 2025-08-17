class SuccessDto<T> {
  status: boolean;
  message: string;
  data: T;

  constructor(message: string, data: T) {
    this.status = true;
    this.message = message;
    this.data = data;
  }
}

export function createResponse<T>(message: string, data: T): SuccessDto<T> {
  return new SuccessDto<T>(message, data);
}
