from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class VideoService:
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.api_key = settings.TWILIO_API_KEY
        self.api_secret = settings.TWILIO_API_SECRET

    def generate_token(self, identity, room_name):
        """
        Generate a Twilio access token for video calls
        
        Args:
            identity (str): Unique identifier for the participant
            room_name (str): Name of the video room to join
            
        Returns:
            str: Access token for Twilio Video
        """
        try:
            # Create access token with our account credentials
            token = AccessToken(
                self.account_sid,
                self.api_key,
                self.api_secret,
                identity=identity
            )

            # Create a Video grant and add to token
            video_grant = VideoGrant(room=room_name)
            token.add_grant(video_grant)

            return token.to_jwt().decode()

        except Exception as e:
            logger.error(f"Error generating video token: {str(e)}")
            raise

    def get_room_name(self, booking_id):
        """
        Generate a consistent room name for a booking
        
        Args:
            booking_id (str): UUID of the booking
            
        Returns:
            str: Room name for the video call
        """
        return f"safifarm-consultation-{booking_id}" 