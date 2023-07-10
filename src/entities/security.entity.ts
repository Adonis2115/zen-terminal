import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('security')
export class Security {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  exchange: string;

  @Column({ nullable: false })
  segment: string;

  @Column({ nullable: false })
  securityID: string;

  @Column({ nullable: false })
  instrument: string;

  @Column({ nullable: false })
  expiryCode: number;

  @Column({ nullable: false })
  symbol: string;

  @Column({ type: 'int', nullable: false })
  lotSize: number;

  @Column({ nullable: false })
  customSymbol: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ type: 'float', nullable: true })
  strikePrie: number;

  @Column({ nullable: true })
  optionType: string;

  @Column({ type: 'float', nullable: false })
  tickSize: number;

  @Column({ nullable: true })
  expiryType: string;
}
