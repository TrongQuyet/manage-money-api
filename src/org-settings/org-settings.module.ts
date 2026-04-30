import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgSetting } from '../entities/org-setting.entity';
import { OrgSettingsService } from './org-settings.service';
import { OrgSettingsController } from './org-settings.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([OrgSetting]), CommonModule],
  controllers: [OrgSettingsController],
  providers: [OrgSettingsService],
})
export class OrgSettingsModule {}
