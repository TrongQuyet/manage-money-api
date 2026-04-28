import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrgSetting } from '../entities/org-setting.entity';
import { OrgSettingsService } from './org-settings.service';
import { OrgSettingsController } from './org-settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrgSetting])],
  controllers: [OrgSettingsController],
  providers: [OrgSettingsService],
})
export class OrgSettingsModule {}
