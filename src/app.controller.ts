import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { PostIntradayDataDto, PostStockDto } from './dto/appDto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/ping')
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('/allstocks')
  findAll() {
    return this.appService.getAllStock();
  }
  @Get('/savelist')
  saveSecurityListDB() {
    return this.appService.saveSecurityListDB();
  }
  @Post('/stock')
  find(@Body() postStockDto: PostStockDto) {
    return this.appService.getStock(postStockDto.id);
  }
  @Post('/intradaydata')
  saveIntradayOhlc(@Body() postIntradayDataDto: PostIntradayDataDto) {
    return this.appService.saveIntradayOhlc(
      postIntradayDataDto.securityId,
      postIntradayDataDto.exchangeSegment,
      postIntradayDataDto.instrument,
    );
  }
}
