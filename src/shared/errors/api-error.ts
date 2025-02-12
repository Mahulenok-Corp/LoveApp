export default class ApiError extends Error {
  public message: string = "ApiError";

  public status: number = 500;

  constructor(status?: number, message?: string) {
    super();
    if (message != null) {
      this.message = message;
    }
    if (status != null) {
      this.status = status;
    }
  }
}
