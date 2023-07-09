import { IsNumber, IsString } from 'class-validator';
export class PostStockDto {
  @IsNumber()
  id: number;
}

export class PostIntradayDataDto {
  @IsString()
  securityId: string;
  @IsString()
  exchangeSegment: string;
  @IsString()
  instrument: string;
}
