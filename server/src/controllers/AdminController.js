import restaurantRepository from '../repositories/RestaurantRepository.js';
import adminService from '../services/AdminService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const restaurantRepo = restaurantRepository;

class AdminController {
  async overview(req, res, next) {
    asyncHandler(async () => {
      const data = await adminService.overview(req.params.restaurantId);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async reports(req, res, next) {
    asyncHandler(async () => {
      const data = await adminService.reports(req.params.restaurantId, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async revenue(req, res, next) {
    asyncHandler(async () => {
      const data = await adminService.revenue(req.params.restaurantId, req.query);
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async restaurants(req, res, next) {
    asyncHandler(async () => {
      const data = await adminService.allRestaurants();
      return ApiResponse.send(res, 200, data);
    })(req, res, next);
  }

  async createRestaurant(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepo.create(req.body);
      return ApiResponse.send(res, 201, restaurant, 'Restaurant created');
    })(req, res, next);
  }

  async updateRestaurant(req, res, next) {
    asyncHandler(async () => {
      const restaurant = await restaurantRepo.findByIdAndUpdate(req.params.id, req.body);
      return ApiResponse.send(res, 200, restaurant, 'Restaurant updated');
    })(req, res, next);
  }

  async addTable(req, res, next) {
    asyncHandler(async () => {
      const table = await restaurantRepo.createTable({ restaurant: req.params.restaurantId, ...req.body });
      return ApiResponse.send(res, 201, table, 'Table added');
    })(req, res, next);
  }

  async listTables(req, res, next) {
    asyncHandler(async () => {
      const tables = await restaurantRepo.tablesFor(req.params.restaurantId);
      return ApiResponse.send(res, 200, tables);
    })(req, res, next);
  }
}

export default new AdminController();