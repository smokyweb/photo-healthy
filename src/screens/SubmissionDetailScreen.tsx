import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, Alert, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSubmission, getComments, createComment, likeSubmission, deleteComment, createReport } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE + u) : null;
type SubmissionTagType = 'name' | 'category' | 'feeling' | 'movement';
type SubmissionTag = {
  type: SubmissionTagType;
  label: string;
  value: string;
};

function initials(name: string) {
  return (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function SubmissionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { submissionId: _sid, id: _id, challengeTags } = route.params || {};
  // Guard against 'undefined' string from broken URL path params
  const submissionId = (_sid && _sid !== 'undefined' ? _sid : null) || (_id && _id !== 'undefined' ? _id : null);
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [submission, setSubmission] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const load = async () => {
    if (!submissionId) { setLoading(false); return; }
    try {
      const [sData, cData] = await Promise.allSettled([
        getSubmission(submissionId),
        getComments(submissionId),
      ]);
      if (sData.status === 'fulfilled') {
        const s = sData.value?.submission || sData.value;
        setSubmission(s);
        setLikeCount(s?.like_count || 0);
        setLiked(!!(s?.liked_by_me || s?.likedByMe || s?.liked));
      } else {
        setError('Could not load submission.');
      }
      if (cData.status === 'fulfilled') {
        setComments(cData.value?.comments || cData.value || []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [submissionId]);

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like submissions.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login' as never) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    try {
      const result = await likeSubmission(submissionId);
      // Use server response if available, otherwise optimistic update
      if (result && result.like_count !== undefined) {
        setLiked(result.liked);
        setLikeCount(result.like_count);
      } else {
        const delta = liked ? -1 : 1;
        setLiked(v => !v);
        setLikeCount(n => n + delta);
      }
    } catch (e: any) {
      console.error('Like failed:', e.message);
      Alert.alert('Error', e.message || 'Could not like this photo.');
    }
  };

  const handleComment = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    const text = commentText.trim();
    if (!text) return;
    setPosting(true);
    try {
      await createComment({ submission_id: submissionId, text: text });
      setCommentText('');
      // Reload comments
      const cData = await getComments(submissionId);
      setComments(cData?.comments || cData || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not post comment.');
    }
    setPosting(false);
  };

  const handleReport = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to report submissions.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login' as never) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    Alert.alert('Report Submission', 'Send this submission to the moderation team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await createReport({ type: 'submission', target_id: submissionId, reason: 'Reported by user' });
            Alert.alert('Report submitted', 'Thanks. Our team will review it.');
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Could not submit report.');
          }
        },
      },
    ]);
  };

  const handleDeleteComment = async (commentId: number) => {
    // Use window.confirm on web for reliable cross-browser support
    const confirmed = typeof window !== 'undefined' && window.confirm
      ? window.confirm('Delete this comment?')
      : true;
    if (!confirmed) return;
    try {
      await deleteComment(commentId);
      setComments(cs => cs.filter(c => c.id !== commentId));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not delete comment.');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !submission) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 16, marginBottom: 16 }}>{error || 'Submission not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: C.ORANGE }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Collect all photos
  const allPhotos = [
    submission.photo1_url || submission.image_url || submission.photo_url,
    submission.photo2_url,
    submission.photo3_url,
    submission.photo4_url,
  ].map(u => fullUrl(u as string)).filter(Boolean) as string[];
  const activePhoto = allPhotos[Math.min(activePhotoIndex, Math.max(allPhotos.length - 1, 0))];
  const dateStr = submission.created_at
    ? new Date(submission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const challengeName = submission.challenge_title || challengeTags?.name || challengeTags?.challenge || '';
  const rawCategory = submission.category || submission.challenge_category || submission.challengeCategory || challengeTags?.category || '';
  const rawFeeling = submission.feeling_category || submission.feeling_tag || submission.challenge_feeling_category || submission.challengeFeelingCategory || challengeTags?.feeling || '';
  const rawMovement = submission.movement_category || submission.movement_tag || submission.challenge_movement_category || submission.challengeMovementCategory || challengeTags?.movement || '';
  const cleanTagValue = (normalized: string, fallback: string) => {
    const value = normalized && normalized !== '-' ? normalized : fallback;
    return String(value || '').trim();
  };
  const submissionTags: SubmissionTag[] = [
    {
      type: 'name',
      label: 'Name',
      value: String(challengeName || '').trim(),
    },
    {
      type: 'category',
      label: 'Category',
      value: cleanTagValue(normalizeChallengeCategory(rawCategory), rawCategory),
    },
    {
      type: 'feeling',
      label: 'Feeling',
      value: cleanTagValue(normalizeFeelingCategory(rawFeeling), rawFeeling),
    },
    {
      type: 'movement',
      label: 'Movement',
      value: cleanTagValue(normalizeMovementCategory(rawMovement), rawMovement),
    },
  ].filter(tag => tag.value && tag.value !== '-');

  const openTag = (tag: SubmissionTag) => {
    if (tag.type === 'name') {
      if (!submission.challenge_id) return;
      navigation.navigate('ChallengeDetail' as never, {
        challengeId: submission.challenge_id,
        id: submission.challenge_id,
      } as never);
    } else {
      navigation.navigate('Main' as never, {
        screen: 'CommunityTab',
        params: { communityFilter: { type: tag.type, value: tag.value } },
      } as never);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
        {/* Photo */}
        <View style={[styles.imageSection, isDesktop && styles.imageSectionDesktop]}>
          {allPhotos.length > 0 ? (
            <>
              <Image source={{ uri: activePhoto }} style={styles.image} resizeMode="contain" />
              {allPhotos.length > 1 && (
                <View style={styles.photoStrip}>
                  {allPhotos.map((photo, index) => (
                    <TouchableOpacity
                      key={`${photo}-${index}`}
                      style={[
                        styles.photoThumb,
                        index === Math.min(activePhotoIndex, allPhotos.length - 1) && styles.photoThumbActive,
                      ]}
                      onPress={() => setActivePhotoIndex(index)}
                      activeOpacity={0.82}
                      accessibilityLabel={`View photo ${index + 1}`}
                    >
                      <Image source={{ uri: photo }} style={styles.photoThumbImage} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ fontSize: 60 }}>{'\uD83D\uDCF7'}</Text>
              <Text style={{ color: C.TEXT_MUTED, marginTop: 8 }}>No photo</Text>
            </View>
          )}
        </View>

        {/* Info + Comments */}
        <View style={[styles.infoSection, isDesktop && styles.infoSectionDesktop]}>
          {/* User row */}
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(submission.user_name || 'U')}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{submission.user_name || 'Anonymous'}</Text>
              {dateStr ? <Text style={styles.date}>{dateStr}</Text> : null}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{submission.title || 'Untitled'}</Text>

          {/* Description */}
          {submission.description ? (
            <Text style={styles.description}>{submission.description}</Text>
          ) : null}

          {submissionTags.length > 0 && (
            <View style={styles.tagRow}>
              {submissionTags.map(tag => (
                <TouchableOpacity
                  key={tag.type}
                  style={styles.tagChip}
                  onPress={() => openTag(tag)}
                  activeOpacity={0.75}
                  accessibilityLabel={tag.type === 'name' ? `Back to ${tag.value}` : `View submissions with ${tag.label} ${tag.value}`}
                >
                  <Text style={styles.tagLabel}>{tag.label}</Text>
                  <Text style={styles.tagValue}>{tag.value}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
              <Text style={styles.actionIcon}>{liked ? '\u2764\uFE0F' : '\uD83E\uDD0D'}</Text>
              <Text style={[styles.actionCount, liked && { color: '#ef4444' }]}>{likeCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionBtn}>
              <Text style={styles.actionIcon}>{'\uD83D\uDCAC'}</Text>
              <Text style={styles.actionCount}>{comments.length}</Text>
            </View>
            <TouchableOpacity style={styles.reportBtn} onPress={handleReport} activeOpacity={0.75}>
              <Text style={styles.reportText}>Report</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Comments section */}
          <Text style={styles.commentsHeading}>
            Comments {comments.length > 0 ? `(${comments.length})` : ''}
          </Text>

          {comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            comments.map(c => (
              <View key={c.id} style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{initials(c.user_name || 'U')}</Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>{c.user_name || 'User'}</Text>
                    {c.created_at ? (
                      <Text style={styles.commentDate}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.commentText}>{c.text || c.content}</Text>
                </View>
                {user && (user.id === c.user_id || user.role === 'admin' || user.is_admin) && (
                  <TouchableOpacity onPress={() => handleDeleteComment(c.id)} style={styles.deleteBtn}>
                    <Text style={{ color: C.DANGER, fontSize: 13 }}>{'\uD83D\uDDD1\uFE0F'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}

          {/* Add comment */}
          <View style={styles.commentInputWrap}>
            {user ? (
              <>
                <View style={styles.commentInputRow}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{initials(user.name || 'U')}</Text>
                  </View>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={C.TEXT_MUTED}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={500}
                  />
                </View>
                <GradientButton
                  label={posting ? 'Posting...' : 'Post Comment'}
                  onPress={handleComment}
                  disabled={!commentText.trim() || posting}
                  style={{ marginTop: 10 } as any}
                  size="sm"
                />
              </>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('Login' as never)}
                style={styles.signInPrompt}
              >
                <Text style={styles.signInPromptText}>{'\uD83D\uDCAC'} Sign in to leave a comment</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <AppFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: 'transparent' },

  back: { padding: 16, paddingBottom: 8 },
  backText: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },

  layout: { paddingBottom: 16 },
  layoutDesktop: {
    flexDirection: 'row',
    gap: 40,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'flex-start',
  },

  imageSection: { marginBottom: 0 },
  imageSectionDesktop: { flex: 1, maxWidth: 520 },

  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.xl,
  },
  photoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: C.CARD_BORDER,
    overflow: 'hidden',
    backgroundColor: C.CARD_BG,
  },
  photoThumbActive: {
    borderColor: C.ORANGE,
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoSection: { padding: 16, paddingTop: 4 },
  infoSectionDesktop: { flex: 1, padding: 0, paddingTop: 0 },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.ORANGE, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  userName: { color: C.TEXT, fontSize: 15, fontWeight: '700' },
  date: { color: C.TEXT_MUTED, fontSize: 12, marginTop: 1 },

  title: {
    color: C.TEXT, fontSize: 22, fontWeight: '800',
    fontFamily: "'Lexend', sans-serif", marginBottom: 10,
  },
  description: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 23, marginBottom: 12 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: C.CARD_BG,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  tagLabel: {
    color: C.TEXT_MUTED,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tagValue: { color: C.TEAL, fontSize: 13, fontWeight: '800' },

  actions: {
    flexDirection: 'row', gap: 20, paddingVertical: 12, alignItems: 'center',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 22 },
  actionCount: { color: C.TEXT_SECONDARY, fontSize: 15, fontWeight: '600' },
  reportBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(153, 27, 27, 0.14)',
  },
  reportText: { color: '#FCA5A5', fontSize: 12, fontWeight: '800' },

  divider: { height: 1, backgroundColor: C.CARD_BORDER, marginVertical: 16 },

  commentsHeading: {
    color: C.TEXT, fontSize: 17, fontWeight: '700',
    fontFamily: "'Lexend', sans-serif", marginBottom: 14,
  },
  noComments: { color: C.TEXT_MUTED, fontSize: 14, fontStyle: 'italic', marginBottom: 16 },

  commentItem: {
    flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: C.CARD_BG2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.CARD_BORDER,
    flexShrink: 0,
  },
  commentAvatarText: { color: C.TEXT_MUTED, fontSize: 12, fontWeight: '700' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  commentUser: { color: C.TEXT, fontSize: 13, fontWeight: '700' },
  commentDate: { color: C.TEXT_MUTED, fontSize: 11 },
  commentText: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 },
  deleteBtn: { padding: 4, alignSelf: 'center' },

  commentInputWrap: { marginTop: 8 },
  commentInputRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentInput: {
    flex: 1,
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: C.CARD_BORDER,
    color: C.TEXT, padding: 12, fontSize: 14,
    minHeight: 44, maxHeight: 120,
  },

  signInPrompt: {
    backgroundColor: C.CARD_BG,
    borderRadius: borderRadius.xl,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: C.CARD_BORDER,
    marginTop: 8,
  },
  signInPromptText: { color: C.ORANGE, fontSize: 14, fontWeight: '600' },
});
