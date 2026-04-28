import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, ScrollView,
  TouchableOpacity, TextInput, FlatList, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSubmission, getComments, createComment, likeSubmission, deleteComment, createReport } from '../services/api';
import GradientButton from '../components/GradientButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { C, borderRadius } from '../theme';
import AppFooter from '../components/AppFooter';

export default function SubmissionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { submissionId } = route.params || {};
  const { user } = useAuth();

  const [submission, setSubmission] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sData, cData] = await Promise.all([
        getSubmission(submissionId),
        getComments(submissionId),
      ]);
      setSubmission(sData?.submission || sData);
      setComments(cData?.comments || cData || []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { if (submissionId) load(); }, [submissionId]);

  const handleLike = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    try {
      await likeSubmission(submissionId);
      setLiked(v => !v);
      setSubmission((s: any) => s ? { ...s, like_count: (s.like_count || 0) + (liked ? -1 : 1) } : s);
    } catch {}
  };

  const handleComment = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await createComment({ submission_id: submissionId, content: comment.trim() });
      setComment('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setPosting(false);
  };

  const handleDeleteComment = async (commentId: number) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteComment(commentId);
          setComments(cs => cs.filter(c => c.id !== commentId));
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!submission) return (
    <View style={styles.center}><Text style={{ color: C.TEXT_MUTED }}>Submission not found</Text></View>
  );

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.ORANGE} />}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Image */}
      {submission.image_url ? (
        <Image source={{ uri: submission.image_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}><Text style={{ fontSize: 60 }}>📷</Text></View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{submission.title}</Text>

        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={{ color: C.WHITE, fontWeight: '700' }}>
              {(submission.user_name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>{submission.user_name || 'Anonymous'}</Text>
            <Text style={styles.date}>
              {submission.created_at ? new Date(submission.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
        </View>

        {submission.description && (
          <Text style={styles.description}>{submission.description}</Text>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Text style={styles.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
            <Text style={styles.actionCount}>{submission.like_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => createReport({ type: 'submission', target_id: submissionId, reason: 'inappropriate' }).then(() => Alert.alert('Reported', 'Thanks for keeping our community safe.'))}
          >
            <Text style={styles.actionIcon}>🚩</Text>
            <Text style={styles.actionLabel}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>

        {comments.map(c => (
          <View key={c.id} style={styles.commentItem}>
            <View style={styles.commentAvatar}>
              <Text style={{ color: C.WHITE, fontSize: 11, fontWeight: '700' }}>
                {(c.user_name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.commentBody}>
              <Text style={styles.commentUser}>{c.user_name || 'User'}</Text>
              <Text style={styles.commentText}>{c.content}</Text>
            </View>
            {user && (user.id === c.user_id || user.role === 'admin') && (
              <TouchableOpacity onPress={() => handleDeleteComment(c.id)} style={styles.commentDelete}>
                <Text style={{ color: C.DANGER, fontSize: 12 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Add Comment */}
        {user ? (
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentField}
              placeholder="Add a comment..."
              placeholderTextColor={C.TEXT_MUTED}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <GradientButton
              label="Post"
              onPress={handleComment}
              loading={posting}
              disabled={!comment.trim()}
              style={{ height: 38, paddingHorizontal: 16, marginLeft: 8, width: 70 }}
            />
          </View>
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginToComment}>
            <Text style={{ color: C.ORANGE, fontSize: 14 }}>Sign in to comment</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 32 }} />
          <AppFooter />
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: C.BG },
  center: { flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center' },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 99,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: C.WHITE, fontSize: 20 },
  image: { width: '100%', height: 360 },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    backgroundColor: C.CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16 },
  title: { color: C.TEXT, fontSize: 22, fontWeight: '800', marginBottom: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { color: C.TEXT, fontSize: 14, fontWeight: '600' },
  date: { color: C.TEXT_MUTED, fontSize: 12 },
  description: { color: C.TEXT_SECONDARY, fontSize: 15, lineHeight: 22, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.DIVIDER },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 20 },
  actionCount: { color: C.TEXT_SECONDARY, fontSize: 14 },
  actionLabel: { color: C.TEXT_MUTED, fontSize: 14 },
  commentsTitle: { color: C.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.MED_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: { flex: 1 },
  commentUser: { color: C.TEXT, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  commentText: { color: C.TEXT_SECONDARY, fontSize: 14, lineHeight: 20 },
  commentDelete: { padding: 4 },
  commentInput: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16, gap: 8 },
  commentField: {
    flex: 1,
    backgroundColor: C.INPUT_BG,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: C.CARD_BORDER,
    color: C.TEXT,
    padding: 10,
    fontSize: 14,
    minHeight: 40,
  },
  loginToComment: { marginTop: 16, alignItems: 'center' },
});
