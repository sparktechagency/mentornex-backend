import { IUser } from './../app/modules/user/user.interface';
import { ReviewMentor } from "../app/modules/menteeReviews/review.model";
import { Subscription } from "../app/modules/subscription/subscription.model";

export const getMentorsWithReviewsAndPrices = async (mentors: IUser[], sortBy?: string) => {
    const mentorIds = mentors.map((mentor) => mentor._id);

    // Fetch all reviews for the mentors in a single query
    const reviews = await ReviewMentor.aggregate([
        {
            $match: { mentor_id: { $in: mentorIds } }, // Filter reviews for the given mentors
        },
        {
            $group: {
                _id: "$mentor_id", // Group by mentor_id
                ratingCount: { $sum: 1 }, // Count of reviews
                totalRating: { $sum: "$rate" }, // Sum of ratings
            },
        },
    ]);

    // Create a map of mentor_id to their review data
    const reviewMap = new Map();
    reviews.forEach((review) => {
        const mentorId = review._id.toString();
        const rating = review.totalRating / review.ratingCount;
        const topRated = rating > 4.5 && review.ratingCount >= 20;
        reviewMap.set(mentorId, { rating, topRated });
    });

    // Fetch all subscriptions for the mentors in a single query
    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                mentor_id: { $in: mentorIds },
                plan_type: 'Subscription',
            },
        },
        {
            $sort: { amount: 1 }, // Sort by amount ascending
        },
        {
            $group: {
                _id: "$mentor_id", // Group by mentor_id
                startingPrice: { $first: "$amount" }, // Get the lowest amount
            },
        },
    ]);

    // Create a map of mentor_id to their starting price
    const subscriptionMap = new Map();
    subscriptions.forEach((subscription) => {
        const mentorId = subscription._id.toString();
        subscriptionMap.set(mentorId, subscription.startingPrice);
    });

    // Map mentors with their reviews and starting prices
    const mentorsWithDetails = mentors.map((mentor) => {
        const mentorId = mentor._id.toString();
        const reviewData = reviewMap.get(mentorId) || { rating: 0, topRated: false };
        const startingPrice = subscriptionMap.get(mentorId) || null;

        return {
            ...mentor,
            rating: reviewData.rating,
            topRated: reviewData.topRated,
            startingPrice,
        };
    });

    // Sort by amount if required
    if (sortBy?.toLocaleLowerCase() === 'amount') {
        mentorsWithDetails.sort((a, b) => {
            const priceA = a.startingPrice || Infinity; // Handle null values
            const priceB = b.startingPrice || Infinity; // Handle null values
            return priceA - priceB;
        });
    }

    return mentorsWithDetails;
};