import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as csvParser from 'csv-parser';
import { createReadStream, createWriteStream } from 'fs';
import { Observable, map } from 'rxjs';
import { Equal, Repository } from 'typeorm';
import { Intraday } from './entities/intraday.entity';
import { Order } from './entities/order.entity';
import { Security } from './entities/security.entity';
import { Stock } from './entities/stocks.entity';
import { TradeService } from './trade/trade.service';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Intraday)
    private readonly intradayRepo: Repository<Intraday>,
    @InjectRepository(Security)
    private readonly securityRepo: Repository<Security>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly httpService: HttpService,
    private readonly tradeService: TradeService,
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
  async getSecurityListDhan() {
    const url = 'https://images.dhan.co/api-data/api-scrip-master.csv';
    const filePath = './tmp/script-master.csv';
    try {
      const response = await axios.get(url, { responseType: 'stream' });
      const writer = createWriteStream(filePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(error);
      return error;
    }
  }
  @Cron('0 55 8 * *  1-5')
  async saveSecurityListDB() {
    console.log('Daily');
    //! Call This Everyday 9 AM
    const filePath = './tmp/script-master.csv';
    const batchSize = 1000;
    await this.securityRepo.clear();
    await this.intradayRepo.clear();
    await this.orderRepo.clear();
    await this.getSecurityListDhan();
    let recordsToStore: Partial<Security>[] = [];
    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath)
        .pipe(
          csvParser({
            mapHeaders: ({ header }) => header.trim(),
            mapValues: ({ value }) => value.trim(),
          }),
        )
        .on('data', (data: MasterSecurityListCsv) => {
          if (data) {
            const record: Partial<Security> = {
              exchange: data.SEM_EXM_EXCH_ID,
              segment: data.SEM_SEGMENT,
              securityID: data.SEM_SMST_SECURITY_ID,
              instrument: data.SEM_INSTRUMENT_NAME,
              expiryCode: Number(data.SEM_EXPIRY_CODE),
              symbol: data.SEM_TRADING_SYMBOL,
              lotSize: Number(data.SEM_LOT_UNITS),
              customSymbol: data.SEM_CUSTOM_SYMBOL,
              expiryDate: data.SEM_EXPIRY_DATE ? data.SEM_EXPIRY_DATE : null,
              strikePrie: Number(data.SEM_STRIKE_PRICE),
              optionType:
                data.SEM_OPTION_TYPE == 'XX' ? null : data.SEM_OPTION_TYPE,
              tickSize: Number(data.SEM_TICK_SIZE),
              expiryType:
                data.SEM_EXPIRY_FLAG === 'NA' ? null : data.SEM_EXPIRY_FLAG,
            };
            recordsToStore.push(record);
            if (recordsToStore.length >= batchSize) {
              stream.pause(); // Pause the stream to process the current batch

              this.storeBatch(recordsToStore)
                .then(() => {
                  recordsToStore = []; // Clear the processed records
                  stream.resume(); // Resume the stream for the next batch
                })
                .catch((error) => {
                  console.error('Error storing records:', error);
                  stream.destroy(error); // Abort the stream in case of an error
                });
            }
          }
        })
        .on('end', async () => {
          if (recordsToStore.length > 0) {
            try {
              await this.storeBatch(recordsToStore); // Process the remaining records
              resolve(
                'CSV processing and data storage completed successfully.',
              );
            } catch (error) {
              console.error('Error storing records:', error);
              reject('Failed to store data from CSV.');
            }
          } else {
            resolve('CSV processing and data storage completed successfully.');
          }
        })
        .on('error', (error: any) => {
          console.error('Error processing CSV:', error);
          reject('Failed to process CSV file.');
        });
    });
  }
  async storeBatch(records: Partial<Security>[]): Promise<void> {
    // Perform batch insert or any other suitable storage operation here
    await this.securityRepo.save(records);
  }
  async saveIntradayOhlcDb() {
    const indexSymbol = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'];
    const stockId = [1, 2, 3];
    for (let i = 0; i < indexSymbol.length; i++) {
      const symbolDetails = await this.securityRepo.findOne({
        where: { symbol: indexSymbol[i], segment: 'I' },
      });
      const intradayData = await this.saveIntradayOhlc(
        //! Make it dynamic
        symbolDetails.securityID,
        'IDX_I',
        'INDEX',
      );
      intradayData.subscribe((data) => {
        if (data.open) {
          const record = new Intraday();
          record.open = data.open[data.open.length - 1];
          record.high = data.high[data.high.length - 1];
          record.low = data.low[data.low.length - 1];
          record.close = data.close[data.close.length - 1];
          record.volume = data.volume[data.volume.length - 1];
          record.time = timeStamp_convertor(
            data.start_Time[data.start_Time.length - 1],
          );
          record.stockId = stockId[i];
          this.intradayRepo.save(record);
        }
      });
    }
    return 'Save Intraday Data to DB';
  }
  @Cron('0 */1 9-16 * * 1-5')
  async check() {
    await this.saveIntradayOhlcDb();
    this.processOrder();
  }
  async processOrder() {
    const pendingOrders = await this.tradeService.getOrders('pending');
    for (let i = 0; i < pendingOrders.length; i++) {
      const candle = await this.intradayRepo.findOne({
        where: { stockId: Equal(2) },
        order: { id: 'DESC' },
      });
      //! Cases on touch, crossup and crossdown
      console.log(candle);
    }
  }
}

function timeStamp_convertor(n: number) {
  let offset1 = new Date().getTimezoneOffset();
  let istOffset = 330;
  n = n - (istOffset + offset1) * 60;
  let a = ['1980', '01', '01', '05', '30', '00'];
  let time = new Date(
    Number(a[0]),
    Number(a[1]) - 1,
    Number(a[2]),
    Number(a[3]),
    Number(a[4]),
    Number(a[5]),
  );
  time.setSeconds(n);
  let year = time.getFullYear();
  let month = ('0' + (time.getMonth() + 1)).slice(-2);
  let day = ('0' + time.getDate()).slice(-2);
  let hours = ('0' + time.getHours()).slice(-2);
  let min = ('0' + time.getMinutes()).slice(-2);
  let sec = ('0' + time.getSeconds()).slice(-2);
  let strTime =
    year + '-' + month + '-' + day + '-' + hours + '-' + min + '-' + sec;
  let strArry = strTime.split('-');
  return new Date(
    Number(strArry[0]),
    Number(strArry[1]) - 1,
    Number(strArry[2]),
    Number(strArry[3]),
    Number(strArry[4]),
    Number(strArry[5]),
  );
}

type DhanIntradayDataResponse = {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  start_Time: number[];
};

type MasterSecurityListCsv = {
  SEM_EXM_EXCH_ID: string;
  SEM_SEGMENT: string;
  SEM_SMST_SECURITY_ID: string;
  SEM_INSTRUMENT_NAME: string;
  SEM_EXPIRY_CODE: string;
  SEM_TRADING_SYMBOL: string;
  SEM_LOT_UNITS: string;
  SEM_CUSTOM_SYMBOL: string;
  SEM_EXPIRY_DATE: Date;
  SEM_STRIKE_PRICE: string;
  SEM_OPTION_TYPE: string;
  SEM_TICK_SIZE: string;
  SEM_EXPIRY_FLAG: string;
};
