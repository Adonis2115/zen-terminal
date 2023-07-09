import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Intraday } from './intraday.entity';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  symbol: string;

  @Column({ nullable: false })
  lotSize: number;

  @OneToMany(() => Intraday, (intraday) => intraday.stockId)
  data: Intraday[];
}
