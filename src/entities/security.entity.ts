import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('intraday')
export class Intraday {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'string', nullable: false })
  exchange: number;

  @Column({ type: 'string', nullable: false })
  segment: number;

  @Column({ type: 'int', nullable: false })
  securityID: number;

  @Column({ type: 'string', nullable: false })
  instrument: number;

  @Column({ nullable: false })
  expiryCode: boolean;

  @Column({ nullable: false })
  symbol: string;

  @Column({ type: 'int', nullable: false })
  lotSize: number;

  @Column({ nullable: true })
  customSymbol: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  strikePrie: number;

  @Column({ nullable: true })
  optionType: string;

  @Column({ nullable: false })
  tickSize: number;

  @Column({ nullable: true })
  expiryType: string;
}
