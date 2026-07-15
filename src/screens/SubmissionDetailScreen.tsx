import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, Alert, RefreshControl, useWindowDimensions,
  Modal, Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  getSubmission, getComments, createComment, likeSubmission, deleteComment, createReport,
  updateSubmission, deleteSubmission, uploadPhoto,
} from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import WatermarkedImage from '../components/WatermarkedImage';
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

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or misleading content',
  'Harassment or abuse',
  'Privacy concern',
  'Other community guideline violation',
];

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
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 768;
  const mainPhotoHeight = isDesktop
    ? Math.min(620, Math.max(440, width * 0.36))
    : Math.min(420, Math.max(280, width - 32));

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
  const [viewerPhotoSize, setViewerPhotoSize] = useState<{ width: number; height: number } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportSuccessMessage, setReportSuccessMessage] = useState('');
  const [photoActionLoading, setPhotoActionLoading] = useState<string | null>(null);
  const [photoActionError, setPhotoActionError] = useState('');
  const [photoActionMessage, setPhotoActionMessage] = useState('');
  const [replacementPhotoIndex, setReplacementPhotoIndex] = useState(0);
  const replacementInputRef = React.useRef<any>(null);

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

  const submissionPhotoUrls = submission ? [
    submission.photo1_url || submission.image_url || submission.photo_url,
    submission.photo2_url,
    submission.photo3_url,
    submission.photo4_url,
  ].filter(Boolean) as string[] : [];
  const allPhotos = submissionPhotoUrls.map(u => fullUrl(u as string)).filter(Boolean) as string[];
  const activePhoto = allPhotos[Math.min(activePhotoIndex, Math.max(allPhotos.length - 1, 0))];
  const selectedPhotoIndex = Math.min(activePhotoIndex, Math.max(allPhotos.length - 1, 0));
  const canManageSubmission = !!user && !!submission && (
    String(user.id) === String(submission.user_id) || user.role === 'admin' || !!user.is_admin
  );
  const maxViewerWidth = Math.max(280, width - 48);
  const maxViewerHeight = Math.max(280, height - 48);
  const viewerPhotoScale = viewerPhotoSize?.width && viewerPhotoSize?.height
    ? Math.min(
        maxViewerWidth / viewerPhotoSize.width,
        maxViewerHeight / viewerPhotoSize.height,
        Math.max(1, 240 / Math.max(viewerPhotoSize.width, viewerPhotoSize.height))
      )
    : 1;
  const viewerFrameSize = viewerPhotoSize?.width && viewerPhotoSize?.height
    ? {
        width: viewerPhotoSize.width * viewerPhotoScale,
        height: viewerPhotoSize.height * viewerPhotoScale,
      }
    : { width: maxViewerWidth, height: maxViewerHeight };

  useEffect(() => {
    if (!photoViewerOpen || !activePhoto) {
      setViewerPhotoSize(null);
      return;
    }
    let active = true;
    Image.getSize(
      activePhoto,
      (photoWidth, photoHeight) => {
        if (active) setViewerPhotoSize({ width: photoWidth, height: photoHeight });
      },
      () => {
        if (active) setViewerPhotoSize(null);
      }
    );
    return () => { active = false; };
  }, [photoViewerOpen, activePhoto]);

  const handleBack = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    if (submission?.challenge_id) {
      navigation.navigate('ChallengeDetail' as never, {
        challengeId: submission.challenge_id,
        id: submission.challenge_id,
      } as never);
      return;
    }
    navigation.navigate('Main' as never, { screen: 'CommunityTab' } as never);
  };

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
    setReportError('');
    setReportReason('');
    setReportDetails('');
    setReportSuccessMessage(reportSubmitted ? 'This photo has already been sent to the moderation team for review.' : '');
    setReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!user || !submissionId || !reportReason || reporting) return;
    setReporting(true);
    setReportError('');
    try {
      const details = reportDetails.trim();
      const result = await createReport({
        type: 'submission',
        target_id: submissionId,
        reason: details ? `${reportReason}: ${details}` : reportReason,
      });
      setReportSubmitted(true);
      setReportSuccessMessage(result?.duplicate
        ? 'This photo is already in the moderation queue. Thank you for checking.'
        : 'Thank you. This photo was sent to the moderation team for review.');
    } catch (e: any) {
      setReportError(e.message || 'Could not submit this report. Please try again.');
    }
    setReporting(false);
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

  const savePhotoUrls = async (urls: string[], successMessage: string, nextIndex = 0) => {
    const payload = {
      photo1_url: urls[0] || null,
      photo2_url: urls[1] || null,
      photo3_url: urls[2] || null,
      photo4_url: urls[3] || null,
    };
    await updateSubmission(Number(submissionId), payload);
    setSubmission((current: any) => ({ ...current, ...payload, image_url: payload.photo1_url }));
    setActivePhotoIndex(Math.max(0, Math.min(nextIndex, urls.length - 1)));
    setPhotoActionMessage(successMessage);
    setPhotoActionError('');
  };

  const requestPhotoReplacement = (index: number) => {
    setReplacementPhotoIndex(index);
    setPhotoActionError('');
    setPhotoActionMessage('');
    if (Platform.OS === 'web' && replacementInputRef.current) {
      replacementInputRef.current.value = '';
      replacementInputRef.current.click();
    }
  };

  const handleReplacementSelected = async (event: any) => {
    const file = event?.target?.files?.[0] as File | undefined;
    if (!file || photoActionLoading) return;
    setPhotoActionLoading('replace');
    setPhotoActionError('');
    setPhotoActionMessage('');
    try {
      const result = await uploadPhoto(file, { watermark: true });
      const uploadedUrl = result?.url || (result as any)?.photo_url || (result as any)?.image_url;
      if (!uploadedUrl) throw new Error('The replacement photo did not finish uploading.');
      const nextUrls = [...submissionPhotoUrls];
      nextUrls[replacementPhotoIndex] = uploadedUrl;
      await savePhotoUrls(nextUrls, `Photo ${replacementPhotoIndex + 1} replaced.`, replacementPhotoIndex);
    } catch (e: any) {
      setPhotoActionError(e.message || 'Could not replace this photo.');
    }
    setPhotoActionLoading(null);
  };

  const makeSelectedPhotoCover = async () => {
    if (selectedPhotoIndex <= 0 || photoActionLoading) return;
    setPhotoActionLoading('cover');
    setPhotoActionError('');
    setPhotoActionMessage('');
    try {
      const selected = submissionPhotoUrls[selectedPhotoIndex];
      const nextUrls = [selected, ...submissionPhotoUrls.filter((_, index) => index !== selectedPhotoIndex)];
      await savePhotoUrls(nextUrls, 'Home photo updated. This photo will now appear first.', 0);
    } catch (e: any) {
      setPhotoActionError(e.message || 'Could not update the home photo.');
    }
    setPhotoActionLoading(null);
  };

  const removeSelectedPhoto = async () => {
    if (submissionPhotoUrls.length <= 1 || photoActionLoading) return;
    const confirmed = typeof window === 'undefined' || !window.confirm
      ? true
      : window.confirm(`Remove photo ${selectedPhotoIndex + 1} from this submission?`);
    if (!confirmed) return;
    setPhotoActionLoading('remove');
    setPhotoActionError('');
    setPhotoActionMessage('');
    try {
      const nextUrls = submissionPhotoUrls.filter((_, index) => index !== selectedPhotoIndex);
      await savePhotoUrls(nextUrls, 'Photo removed.', Math.min(selectedPhotoIndex, nextUrls.length - 1));
    } catch (e: any) {
      setPhotoActionError(e.message || 'Could not remove this photo.');
    }
    setPhotoActionLoading(null);
  };

  const removeEntireSubmission = async () => {
    if (photoActionLoading) return;
    const confirmed = typeof window === 'undefined' || !window.confirm
      ? true
      : window.confirm('Delete this entire submission and all of its photos? This cannot be undone.');
    if (!confirmed) return;
    setPhotoActionLoading('delete');
    setPhotoActionError('');
    try {
      await deleteSubmission(Number(submissionId));
      if (submission?.challenge_id) {
        navigation.replace('ChallengeDetail' as never, {
          challengeId: submission.challenge_id,
          id: submission.challenge_id,
        } as never);
      } else {
        navigation.navigate('Main' as never, { screen: 'CommunityTab' } as never);
      }
    } catch (e: any) {
      setPhotoActionError(e.message || 'Could not delete this submission.');
      setPhotoActionLoading(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !submission) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 16, marginBottom: 16 }}>{error || 'Submission not found'}</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text style={{ color: C.ORANGE }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

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
        returnToSubmissionId: submissionId,
      } as never);
    } else {
      navigation.navigate('Main' as never, {
        screen: 'CommunityTab',
        params: { communityFilterType: tag.type, communityFilterValue: tag.value, sourceSubmissionId: submissionId },
      } as never);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      {canManageSubmission && Platform.OS === 'web' && (
        <input
          ref={replacementInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' } as any}
          onChange={handleReplacementSelected}
        />
      )}
      {/* Back button */}
      <TouchableOpacity onPress={handleBack} style={styles.back}>
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
                  <WatermarkedImage
                    source={{ uri: activePhoto }}
                    style={styles.image}
                    resizeMode="contain"
                    watermarkSize={isDesktop ? 'large' : 'medium'}
                  />
                </TouchableOpacity>
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
              {canManageSubmission && (
                <View style={styles.ownerPhotoTools}>
                  <Text style={styles.ownerPhotoToolsTitle}>Manage your photos</Text>
                  <Text style={styles.ownerPhotoToolsBody}>
                    Select a thumbnail above, then replace it, remove it, or choose it as the photo shown first on Home.
                  </Text>
                  <View style={styles.ownerPhotoActions}>
                    <TouchableOpacity
                      style={styles.ownerPhotoAction}
                      onPress={() => requestPhotoReplacement(selectedPhotoIndex)}
                      disabled={!!photoActionLoading}
                    >
                      <Text style={styles.ownerPhotoActionText}>
                        {photoActionLoading === 'replace' ? 'Uploading…' : `Replace photo ${selectedPhotoIndex + 1}`}
                      </Text>
                    </TouchableOpacity>
                    {selectedPhotoIndex > 0 && (
                      <TouchableOpacity
                        style={styles.ownerPhotoAction}
                        onPress={makeSelectedPhotoCover}
                        disabled={!!photoActionLoading}
                      >
                        <Text style={styles.ownerPhotoActionText}>
                          {photoActionLoading === 'cover' ? 'Updating…' : 'Make Home photo'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {allPhotos.length > 1 && (
                      <TouchableOpacity
                        style={[styles.ownerPhotoAction, styles.ownerPhotoDangerAction]}
                        onPress={removeSelectedPhoto}
                        disabled={!!photoActionLoading}
                      >
                        <Text style={styles.ownerPhotoDangerText}>
                          {photoActionLoading === 'remove' ? 'Removing…' : `Remove photo ${selectedPhotoIndex + 1}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteSubmissionButton}
                    onPress={removeEntireSubmission}
                    disabled={!!photoActionLoading}
                  >
                    <Text style={styles.deleteSubmissionText}>
                      {photoActionLoading === 'delete' ? 'Deleting submission…' : 'Delete entire submission'}
                    </Text>
                  </TouchableOpacity>
                  {!!photoActionMessage && <Text style={styles.photoActionSuccess}>{photoActionMessage}</Text>}
                  {!!photoActionError && <Text style={styles.photoActionError}>{photoActionError}</Text>}
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
            <TouchableOpacity style={[styles.reportBtn, reportSubmitted && styles.reportBtnSubmitted]} onPress={handleReport} activeOpacity={0.75}>
              <Text style={[styles.reportText, reportSubmitted && styles.reportTextSubmitted]}>{reportSubmitted ? 'Report sent' : 'Report photo'}</Text>
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
        visible={reportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !reporting && setReportModalOpen(false)}
      >
        <View style={styles.reportModalOverlay}>
          <TouchableOpacity
            style={styles.reportModalBackdrop}
            activeOpacity={1}
            onPress={() => !reporting && setReportModalOpen(false)}
            accessibilityLabel="Close report dialog"
          />
          <ScrollView
            style={styles.reportModalPanel}
            contentContainerStyle={styles.reportModalPanelContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.reportModalTitle}>{reportSuccessMessage ? 'Report received' : 'Report this photo'}</Text>
            {!user ? (
              <>
                <Text style={styles.reportModalBody}>Please sign in before submitting a report.</Text>
                <View style={styles.reportModalActions}>
                  <GradientButton label="Sign In" variant="primary" style={{ flex: 1 } as any} onPress={() => { setReportModalOpen(false); navigation.navigate('Login' as never); }} />
                  <GradientButton label="Cancel" variant="outline" style={{ flex: 1 } as any} onPress={() => setReportModalOpen(false)} />
                </View>
              </>
            ) : reportSuccessMessage ? (
              <>
                <Text style={styles.reportSuccessText}>{reportSuccessMessage}</Text>
                <GradientButton label="Close" variant="primary" onPress={() => setReportModalOpen(false)} />
              </>
            ) : (
              <>
                <Text style={styles.reportModalBody}>Choose the reason that best describes the problem. Reports are private and reviewed by the Photo Healthy moderation team.</Text>
                <View style={styles.reportReasonList}>
                  {REPORT_REASONS.map(reason => (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.reportReasonOption, reportReason === reason && styles.reportReasonOptionSelected]}
                      onPress={() => setReportReason(reason)}
                      activeOpacity={0.78}
                    >
                      <View style={[styles.reportRadio, reportReason === reason && styles.reportRadioSelected]} />
                      <Text style={[styles.reportReasonText, reportReason === reason && styles.reportReasonTextSelected]}>{reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.reportDetailsInput}
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  placeholder="Additional details (optional)"
                  placeholderTextColor={C.TEXT_MUTED}
                  multiline
                  maxLength={300}
                />
                {reportError ? <Text style={styles.reportErrorText}>{reportError}</Text> : null}
                <View style={styles.reportModalActions}>
                  <GradientButton label={reporting ? 'Submitting...' : 'Submit Report'} variant="danger" loading={reporting} disabled={!reportReason || reporting} style={{ flex: 1 } as any} onPress={submitReport} />
                  <GradientButton label="Cancel" variant="outline" disabled={reporting} style={{ flex: 1 } as any} onPress={() => setReportModalOpen(false)} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
            {activePhoto ? (
              <View style={[styles.viewerImageFrame, viewerFrameSize]}>
                <WatermarkedImage
                  source={{ uri: activePhoto }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                  watermarkSize="large"
                />
                <TouchableOpacity
                  style={styles.viewerClose}
                  onPress={() => setPhotoViewerOpen(false)}
                  activeOpacity={0.8}
                  accessibilityLabel="Close photo viewer"
                >
                  <Text style={styles.viewerCloseText}>X</Text>
                </TouchableOpacity>
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
  expandHint: {
    color: C.TEXT_MUTED,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
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
  ownerPhotoTools: {
    marginTop: 16,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: C.CARD_BG,
  },
  ownerPhotoToolsTitle: { color: C.TEXT, fontSize: 16, fontWeight: '800', marginBottom: 5 },
  ownerPhotoToolsBody: { color: C.TEXT_SECONDARY, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  ownerPhotoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ownerPhotoAction: {
    borderWidth: 1,
    borderColor: C.ORANGE + '99',
    backgroundColor: C.ORANGE + '14',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownerPhotoActionText: { color: C.ORANGE, fontSize: 12, fontWeight: '800' },
  ownerPhotoDangerAction: { borderColor: C.DANGER + '99', backgroundColor: C.DANGER + '14' },
  ownerPhotoDangerText: { color: C.DANGER, fontSize: 12, fontWeight: '800' },
  deleteSubmissionButton: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 5 },
  deleteSubmissionText: { color: C.DANGER, fontSize: 12, fontWeight: '800', textDecorationLine: 'underline' },
  photoActionSuccess: { color: C.TEAL, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 11 },
  photoActionError: { color: C.DANGER, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 11 },
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
  reportBtnSubmitted: { borderColor: C.TEAL, backgroundColor: 'rgba(84, 223, 182, 0.1)' },
  reportText: { color: '#FCA5A5', fontSize: 12, fontWeight: '800' },
  reportTextSubmitted: { color: C.TEAL },

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
  reportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,8,16,0.76)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  reportModalBackdrop: { ...StyleSheet.absoluteFillObject },
  reportModalPanel: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%' as any,
    backgroundColor: C.CARD_BG2,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
  },
  reportModalPanelContent: { padding: 22 },
  reportModalTitle: { color: C.TEXT, fontSize: 22, lineHeight: 29, fontWeight: '800', fontFamily: "'Lexend', sans-serif", marginBottom: 9 },
  reportModalBody: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  reportReasonList: { gap: 8, marginBottom: 14 },
  reportReasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    backgroundColor: C.CARD_BG,
  },
  reportReasonOptionSelected: { borderColor: C.ORANGE, backgroundColor: 'rgba(245,91,9,0.1)' },
  reportRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.TEXT_MUTED },
  reportRadioSelected: { borderColor: C.ORANGE, backgroundColor: C.ORANGE },
  reportReasonText: { flex: 1, color: C.TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  reportReasonTextSelected: { color: C.TEXT, fontWeight: '800' },
  reportDetailsInput: {
    minHeight: 82,
    maxHeight: 130,
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    color: C.TEXT,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  reportErrorText: { color: C.DANGER, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 10 },
  reportSuccessText: { color: C.TEAL, fontSize: 15, lineHeight: 23, fontWeight: '700', marginBottom: 18 },
  reportModalActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  viewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,8,16,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
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
    top: 10,
    right: 10,
    zIndex: 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: C.ORANGE + '88',
    backgroundColor: 'rgba(10,14,26,0.88)',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerCloseText: { color: C.TEXT, fontSize: 17, fontWeight: '900' },
  viewerImageFrame: {
    maxWidth: '100%' as any,
    maxHeight: '100%' as any,
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});
