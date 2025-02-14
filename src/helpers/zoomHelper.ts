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
    const redirectUri = `${process.env.BACKEND_URL}/api/v1/zoom/callback`;
    return `https://zoom.us/oauth/authorize?response_type=code&client_id=${config.zoom.client_id}&redirect_uri=${redirectUri}&state=${userId}`;
  };
  
  export const processZoomCallback = async (code: string, userId: string) => {
    try {
      const redirectUri = `${process.env.BACKEND_URL}/api/v1/zoom/callback`;
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

  export const createZoomMeeting = async (
    userId: string,
    topic: string,
    startTime: Date,
    duration: number,
  ) => {
    try {
      const user = await User.findById(userId);
      if (!user?.zoom_tokens) {
        throw new Error('User has not authorized Zoom access');
      }
  
      let accessToken = user.zoom_tokens.access_token;
      
      // Check if token is expired and refresh if needed
      if (new Date() >= user.zoom_tokens.expires_at) {
        const newTokens = await refreshZoomToken(userId, user.zoom_tokens.refresh_token);
        accessToken = newTokens.accessToken;
      }
  
      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          topic,
          type: 2, // Scheduled meeting
          start_time: startTime.toISOString(),
          duration,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: true,
            waiting_room: false,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      return {
        join_url: response.data.join_url,
        start_url: response.data.start_url,
      };
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw error;
    }
  };