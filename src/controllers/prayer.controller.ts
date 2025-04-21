import { Request, Response } from 'express';
import prayerService from '../services/prayer.service';
import responseUtil from '../utils/response.util';

class PrayerController {
  getTodayPrayerTimes = async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, method } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json(responseUtil.error(
          'Latitude and longitude are required'
        ));
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json(responseUtil.error(
          'Invalid coordinates'
        ));
      }
      
      const methodNumber = method ? parseInt(method as string) : undefined;
      
      const { data, cached } = await prayerService.getTodayPrayerTimes(lat, lng, methodNumber);
      const location = await prayerService.getLocation(lat, lng);
      
      return res.json(responseUtil.success(
        { 
          prayerTimes: data,
          location 
        },
        'Successfully retrieved today\'s prayer times',
        cached
      ));
    } catch (error: any) {
      console.error('Error in getTodayPrayerTimes controller:', error);
      return res.status(500).json(responseUtil.error(
        'Failed to retrieve prayer times'
      ));
    }
  }
  
  getPrayerTimesByDate = async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const { latitude, longitude, method } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json(responseUtil.error(
          'Latitude and longitude are required'
        ));
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json(responseUtil.error(
          'Invalid coordinates'
        ));
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json(responseUtil.error(
          'Invalid date format. Use YYYY-MM-DD'
        ));
      }
      
      const methodNumber = method ? parseInt(method as string) : undefined;
      
      const { data, cached } = await prayerService.getPrayerTimesByDate(date, lat, lng, methodNumber);
      
      return res.json(responseUtil.success(
        data,
        `Successfully retrieved prayer times for ${date}`,
        cached
      ));
    } catch (error: any) {
      console.error('Error in getPrayerTimesByDate controller:', error);
      return res.status(500).json(responseUtil.error(
        `Failed to retrieve prayer times for ${req.params.date}`
      ));
    }
  }
  
  getMonthlyCalendar = async (req: Request, res: Response) => {
    try {
      const { year, month } = req.params;
      const { latitude, longitude, method } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json(responseUtil.error(
          'Latitude and longitude are required'
        ));
      }
      
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      
      if (isNaN(lat) || isNaN(lng) || isNaN(yearNum) || isNaN(monthNum)) {
        return res.status(400).json(responseUtil.error(
          'Invalid parameters'
        ));
      }
      
      const methodNumber = method ? parseInt(method as string) : undefined;
      
      const { data, cached } = await prayerService.getMonthlyCalendar(yearNum, monthNum, lat, lng, methodNumber);
      
      return res.json(responseUtil.success(
        data,
        `Successfully retrieved prayer calendar for ${year}-${month}`,
        cached
      ));
    } catch (error: any) {
      console.error('Error in getMonthlyCalendar controller:', error);
      
      if (error.message?.includes('Invalid month')) {
        return res.status(400).json(responseUtil.error(error.message));
      }
      
      return res.status(500).json(responseUtil.error(
        `Failed to retrieve prayer calendar for ${req.params.year}-${req.params.month}`
      ));
    }
  }
}

export default new PrayerController();