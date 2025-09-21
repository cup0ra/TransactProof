import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'
import { FeedbackService } from './feedback.service'
import { SendFeedbackDto } from './dto/send-feedback.dto'

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendFeedback(@Body() sendFeedbackDto: SendFeedbackDto): Promise<{ message: string }> {
    await this.feedbackService.sendFeedback(sendFeedbackDto)
    return { message: 'Feedback sent successfully' }
  }
}