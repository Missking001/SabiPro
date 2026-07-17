export class CreateNotificationDto {
  userId: string;
  type: string;
  message: string;
  channel?: string;
  relatedId?: string;
  relatedType?: string;
}
