import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, Alert, RefreshControl, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSubmission, getComments, createComment, likeSubmission, deleteComment } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import AppFooter from '../components/AppFooter';
import { C, borderRadius } from '../theme';

const BASE = 'https://photoai.betaplanets.com';
const fullUrl = (u?: string) => u ? (u.startsWith('http') ? u : BASE + u) : null;

function initials(name: string) {
  return (name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function SubmissionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { submissionId } = route.params || {};
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
    if (!user) { navigation.navigate('Login' as never); return; }
    try {
      await likeSubmission(submissionId);
      const delta = liked ? -1 : 1;
      setLiked(v => !v);
      setLikeCount(n => n + delta);
    } catch {}
  };

  const handleComment = async () => {
    if (!user) { navigation.navigate('Login' as never); return; }
    const text = commentText.trim();
    if (!text) return;
    setPosting(true);
    try {
      await createComment({ submission_id: submissionId, content: text });
      setCommentText('');
      // Reload comments
      const cData = await getComments(submissionId);
      setComments(cData?.comments || cData || []);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not post comment.');
    }
    setPosting(false);
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('Delete Comment', 'Remove this comment?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            setComments(cs => cs.filter(c => c.id !== commentId));
          } catch {}
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !submission) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ color: C.TEXT_MUTED, fontSize: 16, marginBottom: 16 }}>{error || 'Submission not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: C.ORANGE }}>← Go Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const imgUrl = fullUrl(submission.photo1_url || submission.image_url || submission.photo_url);
  const dateStr = submission.created_at
    ? new Date(submission.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
        {/* Photo */}
        <View style={[styles.imageSection, isDesktop && styles.imageSectionDesktop]}>
          {imgUrl ? (
            <Image source={{ uri: imgUrl }} style={styles.image} resizeMode="cover" />
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

          {/* Challenge tag */}
          {submission.challenge_title ? (
            <View style={styles.challengeTag}>
              <Text style={styles.challengeTagText}>{'\uD83C\uDFC6'} {submission.challenge_title}</Text>
            </View>
          ) : null}

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
                  <Text style={styles.commentText}>{c.content}</Text>
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
  screen: { backgroundColor: C.BG },

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

  challengeTag: {
    alignSelf: 'flex-start',
    backgroundColor: C.ORANGE + '22',
    borderWidth: 1, borderColor: C.ORANGE + '55',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 14,
  },
  challengeTagText: { color: C.ORANGE, fontSize: 12, fontWeight: '600' },

  actions: {
    flexDirection: 'row', gap: 20, paddingVertical: 12,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 22 },
  actionCount: { color: C.TEXT_SECONDARY, fontSize: 15, fontWeight: '600' },

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
