import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import * as csvParser from 'csv-parser';
import { createReadStream, createWriteStream } from 'fs';
import { Observable, map } from 'rxjs';
import { Repository } from 'typeorm';
import { Intraday } from './entities/intraday.entity';
import { Security } from './entities/security.entity';
import { Stock } from './entities/stocks.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Stock) private readonly stockRepo: Repository<Stock>,
    @InjectRepository(Intraday)
    private readonly intradayRepo: Repository<Intraday>,
    @InjectRepository(Security)
    private readonly securityRepo: Repository<Security>,
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
  async saveSecurityListDB() {
    const filePath = './tmp/script-master.csv';
    const batchSize = 1000; // ! Number of Record to process at 1 time
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
        .on('data', (data: any) => {
          // ! define type of CSV File
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
              expiryDate: data.SEM_EXPIRY_DATE
                ? new Date(data.SEM_EXPIRY_DATE)
                : null,
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
}

type DhanIntradayDataResponse = {
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
  start_Time: number;
};
