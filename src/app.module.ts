import { Module } from '@nestjs/common';
import { BlogModule } from './blog/blog.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        return {
          dialect: 'postgres',
          host: process.env.POSTGRES_HOST,
          port: +process.env.POSTGRES_PORT,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          autoLoadModels: true,
          synchronize: false,
          logging: false
        };
      }
    }),
    RedisModule.forRootAsync(
      {
        imports: [ConfigModule],
        useFactory: () => {
          return {
            config: {
              host: process.env.REDIS_HOST,
              port: +process.env.REDIS_PORT
            }
          };
        }
      },
      true
    ),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => {
        return {
          redis: {
            host: process.env.REDIS_HOST,
            port: +process.env.REDIS_PORT
          }
        };
      }
    }),
    BlogModule
  ],
  controllers: [],
  providers: []
})
export class AppModule {}
