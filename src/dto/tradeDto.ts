import { IsDate, IsNumber, IsString } from 'class-validator';

export class PostNewOrderDto {
  @IsString()
  indexSymbol: string;
  @IsNumber()
  triggerLevel: number;
  @IsString()
  candleAction: string;
  @IsString()
  optionType: string;
  @IsString()
  tradeType: string;
  @IsNumber()
  strikePrie: number;
  @IsDate()
  expiryDate: Date;
  @IsNumber()
  lot: number;
}
