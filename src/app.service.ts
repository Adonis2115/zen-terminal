import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, map } from 'rxjs';
import { Repository } from 'typeorm';
import { Intraday } from './entities/intraday.entity';
import { Stock } from './entities/stocks.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Intraday)
    private readonly intradayRepo: Repository<Intraday>,
    private readonly httpService: HttpService,
  ) {}
  getHello(): string {
    return 'Pong';
  }
  async getAllStock() {
    return await this.stockRepo.find();
  }
  async getStock(id: number) {
    return await this.stockRepo.findOne({ where: { id: id } });
  }
  async saveIntradayOhlc(
    securityId: string,
    exchangeSegment: string,
    instrument: string,
  ): Promise<Observable<DhanIntradayDataResponse>> {
    const headers = {
      'Content-Type': 'application/json',
      'access-token': process.env.DHAN_TOKEN,
    };
    const data = {
      securityId: securityId,
      exchangeSegment: exchangeSegment,
      instrument: instrument,
    };
    const response = this.httpService
      .post('https://api.dhan.co/charts/intraday', data, { headers })
      .pipe(map((resp) => resp.data));
    return response;
  }
}

type DhanIntradayDataResponse = {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  start_Time: number;
};
