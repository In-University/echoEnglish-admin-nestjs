import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('user-stats')
    public async getUserStats(@Req() req: Request, @Res() res: Response) {
        const { from, to, by } = req.query;
        const data = await this.dashboardService.getUserStats(
            from as string,
            to as string,
            (by as string) || 'month'
        );
        return res.status(200).json({ message: 'Success', data });
    }

    @Get('test-stats')
    public async getTestStats(@Req() req: Request, @Res() res: Response) {
        const { from, to, by } = req.query;
        const data = await this.dashboardService.getTestStats(
            from as string,
            to as string,
            (by as string) || 'month'
        );

        return res.status(200).json({ message: 'Success', data });
    }

    @Get('payment-stats')
    public async getPaymentStats(@Req() req: Request, @Res() res: Response) {
        const { from, to, by } = req.query;
        const data = await this.dashboardService.getPaymentStats(
            from as string,
            to as string,
            (by as string) || 'month'
        );

        return res.status(200).json({ message: 'Success', data });
    }

    @Get('resource-stats')
    public async getResourceStats(@Req() req: Request, @Res() res: Response) {
        const data = await this.dashboardService.getResourceStats();
        return res.status(200).json({ message: 'Success', data });
    }
}