import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';
import { Watchlist } from '../models/Watchlist.js';
import { Review } from '../models/Review.js';
import { Notification } from '../models/Notification.js';

export const toggleFollowUser = async (req, res, next) => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
    }

    const existing = await Follow.findOne({ followerId: currentUserId, followingId: targetUserId });
    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      return res.json({ success: true, isFollowing: false, message: 'Unfollowed successfully.' });
    }

    await Follow.create({ followerId: currentUserId, followingId: targetUserId });

    // Send notification to target user
    await Notification.create({
      userId: targetUserId,
      title: 'New Follower',
      message: `${req.user.name} started following your movie journey!`,
      type: 'social',
      link: `/profile/${currentUserId}`,
    });

    res.json({ success: true, isFollowing: true, message: 'Followed successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getPublicFeed = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isFlagged: false })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    const publicWatchlists = await Watchlist.find({ isPublic: true })
      .populate('userId', 'name avatar')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      reviews,
      publicWatchlists,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserPublicProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('name avatar bio createdAt role');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [followersCount, followingCount, publicLists, reviews] = await Promise.all([
      Follow.countDocuments({ followingId: id }),
      Follow.countDocuments({ followerId: id }),
      Watchlist.find({ userId: id, isPublic: true }),
      Review.find({ userId: id, isFlagged: false }).sort({ createdAt: -1 }).limit(10),
    ]);

    let isFollowing = false;
    if (req.user) {
      isFollowing = Boolean(await Follow.findOne({ followerId: req.user._id, followingId: id }));
    }

    res.json({
      user,
      followersCount,
      followingCount,
      isFollowing,
      publicLists,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};
