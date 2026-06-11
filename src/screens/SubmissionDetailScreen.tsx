import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, Alert, RefreshControl, useWindowDimensions,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSubmission, getComments, createComment, likeSubmission, deleteComment, createReport, downloadSubmissionPhoto, getSubscriptionStatus } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';
import { normalizeChallengeCategory, normalizeFeelingCategory, normalizeMovementCategory } from '../constants/taxonomy';
import { fullUrl as resolveUrl } from '../config/api';

const fullUrl = (u?: string) => resolveUrl(u) || null;
type SubmissionTagType = 'name' | 'category' | 'feeling' | 'movement';
type SubmissionTag = {
  type: SubmissionTagType;
  label: string;
  value: string;
};

function initials(name: string) {
  return (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}
const safeFileName = (value: string) =>
  String(value || 'photo-healthy-photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo-healthy-photo';

export default function SubmissionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { submissionId: _sid, id: _id, challengeTags } = route.params || {};
  // Guard against 'undefined' string from broken URL path params
  const submissionId = (_sid && _sid !== 'undefined' ? _sid : null) || (_id && _id !== 'undefined' ? _id : null);
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const mainPhotoHeight = isDesktop
    ? Math.min(620, Math.max(440, width * 0.36))
    : Math.min(420, Math.max(280, width - 32));
  const viewerWidth = Math.max(280, width - 48);
  const viewerHeight = Math.max(280, height - 120);

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
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [downloadingPhoto, setDownloadingPhoto] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

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

  useEffect(() => {
    let active = true;
    if (!user) {
      setSubscriptionStatus(null);
      return;
    }
    getSubscriptionStatus()
      .then((data: any) => {
        if (active) setSubscriptionStatus(data);
      })
      .catch(() => {
        if (active) setSubscriptionStatus(null);
      });
    return () => { active = false; };
  }, [user?.id, user?.subscription_status, user?.is_pro]);

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

  const handleDownloadPhoto = async () => {
    if (!activePhoto || downloadingPhoto) return;
    if (!user) {
      Alert.alert('Pro Members Only', 'Please sign in with a Pro account to download photos.');
      return;
    }
    setDownloadingPhoto(true);
    try {
      const blob = await downloadSubmissionPhoto(submissionId, activePhotoIndex + 1);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${safeFileName(submission.title || submission.challenge_title)}-${activePhotoIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e: any) {
      Alert.alert('Download failed', e.message || 'Could not download this photo.');
    } finally {
      setDownloadingPhoto(false);
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
  const canDownloadPhoto = !!user && (
    user.subscription_status === 'active' ||
    !!user.is_pro ||
    subscriptionStatus?.status === 'active' ||
    !!subscriptionStatus?.is_pro ||
    !!subscriptionStatus?.isPro ||
    user.role === 'pro' ||
    user.role === 'admin' ||
    !!user.is_admin
  );
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
        params: { communityFilterType: tag.type, communityFilterValue: tag.value },
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
              <View style={[styles.imageFrame, { height: mainPhotoHeight }]}>
                <TouchableOpacity
                  onPress={() => setPhotoViewerOpen(true)}
                  activeOpacity={0.9}
                  accessibilityLabel="View photo larger"
                  style={styles.imagePressArea}
                >
                  <Image
                    source={{ uri: activePhoto }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <Text style={styles.displayWatermark}>Photo Healthy</Text>
                </TouchableOpacity>
                {canDownloadPhoto && (
                  <TouchableOpacity
                    onPress={handleDownloadPhoto}
                    style={styles.downloadOverlayBtn}
                    activeOpacity={0.86}
                    disabled={downloadingPhoto}
                  >
                    <View style={styles.downloadIcon}>
                      <View style={styles.downloadStem} />
                      <View style={styles.downloadArrow} />
                      <View style={styles.downloadBase} />
                    </View>
                    <Text style={styles.downloadOverlayText}>{downloadingPhoto ? 'Preparing...' : 'Download Original'}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => setPhotoViewerOpen(true)} activeOpacity={0.8}>
                <Text style={styles.expandHint}>Click photo to enlarge</Text>
              </TouchableOpacity>
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
      <Modal
        visible={photoViewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoViewerOpen(false)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerBackdrop}
            activeOpacity={1}
            onPress={() => setPhotoViewerOpen(false)}
          />
          <View style={styles.viewerContent}>
            <TouchableOpacity
              style={styles.viewerClose}
              onPress={() => setPhotoViewerOpen(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewerCloseText}>Close</Text>
            </TouchableOpacity>
            {activePhoto ? (
              <View style={[styles.viewerImageFrame, { width: viewerWidth, height: viewerHeight }]}>
                <Image
                  source={{ uri: activePhoto }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
                <Text style={styles.viewerWatermark}>Photo Healthy</Text>
                {canDownloadPhoto && (
                  <TouchableOpacity
                    onPress={handleDownloadPhoto}
                    style={styles.viewerDownloadBtn}
                    activeOpacity={0.82}
                    disabled={downloadingPhoto}
                  >
                    <Text style={styles.viewerDownloadText}>{downloadingPhoto ? 'Preparing...' : 'Download Original'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
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
    gap: 48,
    maxWidth: 1480,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'flex-start',
  },

  imageSection: { marginBottom: 0 },
  imageSectionDesktop: { flex: 1.15, maxWidth: 760 },

  imageFrame: {
    width: '100%',
    position: 'relative',
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(10,14,26,0.32)',
    overflow: 'hidden',
  },
  imagePressArea: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  displayWatermark: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    color: 'rgba(255,255,255,0.52)',
    backgroundColor: 'rgba(8,12,24,0.28)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  expandHint: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  downloadIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadStem: {
    position: 'absolute',
    top: 2,
    width: 2,
    height: 8,
    borderRadius: 2,
    backgroundColor: C.TEAL,
  },
  downloadArrow: {
    position: 'absolute',
    top: 7,
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.TEAL,
    transform: [{ rotate: '45deg' }],
  },
  downloadBase: {
    position: 'absolute',
    bottom: 1,
    width: 14,
    height: 2,
    borderRadius: 2,
    backgroundColor: C.TEAL,
  },
  downloadOverlayBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.TEAL,
    backgroundColor: 'rgba(8,12,24,0.86)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  downloadOverlayText: {
    color: C.TEAL,
    fontSize: 13,
    fontWeight: '900',
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
  infoSectionDesktop: { flex: 1, padding: 0, paddingTop: 0, maxWidth: 660 },

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
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,8,16,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  viewerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  viewerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  viewerClose: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.ORANGE + '88',
    backgroundColor: 'rgba(10,14,26,0.88)',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  viewerCloseText: { color: C.ORANGE, fontSize: 14, fontWeight: '900' },
  viewerImageFrame: {
    maxWidth: '100%' as any,
    maxHeight: '100%' as any,
    position: 'relative',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerWatermark: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(8,12,24,0.26)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '800',
  },
  viewerDownloadBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.TEAL + '88',
    backgroundColor: 'rgba(10,14,26,0.78)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewerDownloadText: { color: C.TEAL, fontSize: 13, fontWeight: '900' },
});
