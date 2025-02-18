import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config';

interface CreateZoomSessionResponse {
  sessionId: string;
  hostToken: string;
  participantToken: string;
  sessionKey: string;
  password?: string;
  userId?: string;
}

const generateVideoSDKToken = (sessionName: string, role: 0 | 1, userId: string) => {
  try {
    if (!config.videoSdk.sdkKey || !config.videoSdk.sdkSecret) {
      throw new Error('Zoom Video SDK credentials are missing');
    }

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 24; // 24 hours expiration

    const oPayload = {
      app_key: config.videoSdk.sdkKey,
      role_type: role, // 0 for host, 1 for participant
      session_key: sessionName,
      user_identity: userId,
      version: 1,
      iat: iat,
      exp: exp
    };

    // Create the JWT token
    const token = jwt.sign(oPayload, config.videoSdk.sdkSecret, { algorithm: 'HS256' });

    return token;
  } catch (error) {
    console.error('Error generating Zoom Video SDK token:', error);
    throw new Error('Failed to generate Zoom Video SDK token');
  }
};

const generateJWTToken = () => {
  try {
    if (!config.videoSdk.apiKey || !config.videoSdk.apiSecret) {
      throw new Error('Zoom API credentials are missing');
    }

    const payload = {
      iss: config.videoSdk.apiKey,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry
    };

    const token = jwt.sign(payload, config.videoSdk.apiSecret, {
      algorithm: 'HS256'
    });

    return token;
  } catch (error) {
    console.error('Error generating Zoom JWT token:', error);
    throw new Error('Failed to generate Zoom JWT token');
  }
};

const createZoomSession = async (
  sessionTopic: string,
  hostEmail: string
): Promise<CreateZoomSessionResponse> => {
  try {
    // Generate JWT token for API authorization
    const jwtToken = generateJWTToken();
    
    // Create session using Zoom's Video SDK API
    const response = await axios.post(
      'https://api.zoom.us/v2/videosdk/sessions',
      {
        session_name: sessionTopic,
        settings: {
          waiting_room: false,
          join_before_host: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data || !response.data.session_id) {
      throw new Error('Invalid response from Zoom Video SDK API');
    }

    // Generate tokens for host and participants
    const sessionKey = response.data.session_id;
    const hostToken = generateVideoSDKToken(sessionKey, 0, hostEmail);
    
    return {
      sessionId: response.data.session_id,
      sessionKey: sessionKey,
      password: response.data.passcode,
      userId: hostEmail,
      hostToken: hostToken,
      participantToken: '', // This will be generated when needed with participant info
    };
  } catch (error) {
    console.error('createZoomSession Error -->', error);
    throw error;
  }
};

export const setupZoomVideoMeeting = async (
  mentorEmail: string,
  menteeEmail: string,
  sessionTopic: string
): Promise<{ sessionId: string; hostToken: string; participantToken: string }> => {
  try {
    // Create Zoom session with host (mentor) info
    const session = await createZoomSession(sessionTopic, mentorEmail);
    
    if (!session || !session.sessionId) {
      throw new Error('Failed to create Zoom session');
    }
    
    // Generate participant token for mentee
    const participantToken = generateVideoSDKToken(session.sessionKey, 1, menteeEmail);
    
    return {
      sessionId: session.sessionId,
      hostToken: session.hostToken,
      participantToken: participantToken,
    };
  } catch (error) {
    console.error('setupZoomVideoMeeting Error -->', error);
    throw error;
  }
};