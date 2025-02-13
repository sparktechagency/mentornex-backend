import axios from 'axios';
import base64 from 'base-64';
import config from '../config';

const zoomAccountId = config.zoom.account_id;
const zoomClientId = config.zoom.client_id;
const zoomClientSecret = config.zoom.client_secret;

const getAuthHeaders = () => {
    return {
        Authorization: `Basic ${base64.encode(`${zoomClientId}:${zoomClientSecret}`)}`,
        "Content-Type": "application/json",
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
        console.log("generateZoomAccessToken Error --> ", error);
        throw error;
    }
};

export const createZoomMeeting = async (topic: string, startTime: Date, duration: number, mentor_email: string | undefined , mentee_email: string | undefined) => {
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
                    join_before_host: false,
                    mute_upon_entry: true,
                    waiting_room: false,
                    alternative_hosts: mentor_email
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${zoomAccessToken}`,
                },
            }
        );

        return response.data.join_url;
    } catch (error) {
        console.log("createZoomMeeting Error --> ", error);
        throw error;
    }
};