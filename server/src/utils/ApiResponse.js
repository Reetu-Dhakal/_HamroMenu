export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', metadata = undefined) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    if (metadata !== undefined) this.metadata = metadata;
  }

  static send(res, statusCode, data, message, metadata) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message, metadata));
  }
}

export default ApiResponse;