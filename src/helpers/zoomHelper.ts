import axios from 'axios';
import base64 from 'base-64';
import config from '../config';
import { User } from '../app/modules/user/user.model';

interface ZoomTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface ZoomUserTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

const zoomAccountId = config.zoom.account_id;
const zoomClientId = config.zoom.client_id;
const zoomClientSecret = config.zoom.client_secret;

const getAuthHeaders = () => {
  return {
    Authorization: `Basic ${base64.encode(
      `${zoomClientId}:${zoomClientSecret}`
    )}`,
    'Content-Type': 'application/json',
  };
};

const generateZoomAccessToken = async () => {
  try {
    const response = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${zoomAccountId}`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.log('generateZoomAccessToken Error --> ', error);
    throw error;
  }
};

export const getZoomAuthUrl = (userId: string) => {
    const redirectUri = `http://10.0.70.50:5000/api/v1/session/zoom/callback`;
    return `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.zoom.client_id}&redirect_uri=${redirectUri}&state=${userId}`;
  };
  
  export const processZoomCallback = async (code: string, userId: string) => {
    try {
      const redirectUri = `http://10.0.70.50:5000/api/v1/session/zoom/callback`;
      const tokenResponse = await axios.post<ZoomTokenResponse>(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
          },
          auth: {
            username: config.zoom.client_id!,
            password: config.zoom.client_secret!,
          },
        }
      );
  
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.data.expires_in);
  
      // Save tokens to user record
      await User.findByIdAndUpdate(userId, {
        zoom_tokens: {
          access_token: tokenResponse.data.access_token,
          refresh_token: tokenResponse.data.refresh_token,
          expires_at: expiresAt,
        },
      });
  
      return true;
    } catch (error) {
      console.error('Error handling Zoom callback:', error);
      throw error;
    }
  };
  
  export const refreshZoomToken = async (userId: string, refreshToken: string): Promise<ZoomUserTokens> => {
    try {
      const response = await axios.post<ZoomTokenResponse>(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          },
          auth: {
            username: config.zoom.client_id!,
            password: config.zoom.client_secret!,
          },
        }
      );
  
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + response.data.expires_in);
  
      const tokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt,
      };
  
      // Update tokens in database
      await User.findByIdAndUpdate(userId, {
        zoom_tokens: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: tokens.expiresAt,
        },
      });
  
      return tokens;
    } catch (error) {
      console.error('Error refreshing Zoom token:', error);
      throw error;
    }
  };

  export const createZoomMeeting = async (topic: string, startTime: Date, duration: number, mentor_email: string | undefined, mentee_email: string | undefined) => {
    try {
        const zoomAccessToken = await generateZoomAccessToken();

        const response = await axios.post(
            'https://api.zoom.us/v2/users/me/meetings',
            {
                topic: topic,
                type: 2, // Scheduled meeting
                start_time: startTime.toISOString(),
                duration: duration,
                settings: {
                    host_video: true,
                    participant_video: true,
                    join_before_host: true,
                    mute_upon_entry: true,
                    waiting_room: false,
                    auto_recording: "none",
                    duration: duration, // Set duration in settings as well
                    meeting_invitees: [
                      { email: mentor_email },
                      { email: mentee_email }
                  ],
                  close_registration: true,
                  enable_auto_terminate: true,
                  auto_terminate_minutes: duration,
                  enforce_meeting_duration: true // End after specified duration
                    //meeting_authentication: true, // Enable meeting authentication
                    //authentication_option: 'signIn_D8cJuqWVQ623CI4Q8zQ60Q', // Use your custom authentication profile ID
                    //authentication_domains: [mentor_email?.split('@')[1], mentee_email?.split('@')[1]], // Restrict to mentor and mentee domains
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${zoomAccessToken}`,
                },
            }
        );

        return { ...response.data, hostKey: response.data.h323_password, meeting_id: response.data.id};
    } catch (error) {
        console.log("createZoomMeeting Error --> ", error);
        throw error;
    }
};

export const endZoomMeeting = async (meetingId: string) => {
  try {
      const zoomAccessToken = await generateZoomAccessToken();
      
      await axios.put(
          `https://api.zoom.us/v2/meetings/${meetingId}/status`,
          {
              action: 'end'
          },
          {
              headers: {
                  Authorization: `Bearer ${zoomAccessToken}`,
                  'Content-Type': 'application/json'
              }
          }
      );
      
      return true;
  } catch (error) {
      console.error('Error ending Zoom meeting:', error);
      throw error;
  }
};